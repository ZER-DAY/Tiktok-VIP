import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { connectRedis } from "@/lib/redis";
import { BACKSTAGE_HEARTBEAT, cacheKey, getBackstageQueue } from "@/modules/backstage/queue";
import { resultSchema } from "@/modules/backstage/result";
const inputSchema = z.object({ reportId: z.string().uuid() }).strict();
const error = (code: string, status: number) =>
  NextResponse.json({ success: false, error: { code } }, { status });
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return error("UNAUTHORIZED", 401);
    const input = inputSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return error("INVALID_INPUT", 400);
    const report = await prisma.analysisReport.findUnique({
      where: { id: input.data.reportId },
      select: {
        snapshot: {
          select: {
            account: { select: { externalUsername: true, provider: { select: { key: true } } } },
          },
        },
      },
    });
    if (!report || report.snapshot.account.provider.key !== "tiktok")
      return error("NOT_FOUND", 404);
    const username = report.snapshot.account.externalUsername;
    if (!/^[a-zA-Z0-9_.]{1,24}$/.test(username)) return error("INVALID_INPUT", 400);
    const redis = await connectRedis();
    const cached = await redis.get(cacheKey(username));
    if (cached) {
      const parsed = resultSchema.safeParse(JSON.parse(cached));
      if (parsed.success)
        return NextResponse.json({
          success: true,
          data: { state: "completed", result: parsed.data },
        });
    }
    if (!(await redis.exists(BACKSTAGE_HEARTBEAT))) return error("UNAVAILABLE", 503);
    const allowed = await redis.eval(
      `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],3600) end; return n`,
      1,
      `backstage:rate:${user.id}`
    );
    if (Number(allowed) > 30) return error("RATE_LIMITED", 429);
    const queue = getBackstageQueue();
    if ((await queue.getWaitingCount()) >= 5) return error("BUSY", 429);
    const job = await queue.add(
      "check",
      { username, userId: user.id, requestedAt: Date.now() },
      { jobId: randomUUID() }
    );
    return NextResponse.json(
      { success: true, data: { state: "queued", jobId: job.id } },
      { status: 202 }
    );
  } catch {
    return error("UNAVAILABLE", 503);
  }
}
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return error("UNAUTHORIZED", 401);
    const id = z.string().uuid().safeParse(new URL(request.url).searchParams.get("jobId"));
    if (!id.success) return error("INVALID_INPUT", 400);
    const job = await getBackstageQueue().getJob(id.data);
    if (!job || job.data.userId !== user.id) return error("NOT_FOUND", 404);
    const state = await job.getState();
    if (state === "failed") return error("UNAVAILABLE", 503);
    return NextResponse.json(
      {
        success: true,
        data: {
          state,
          result: state === "completed" ? resultSchema.parse(job.returnvalue) : undefined,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return error("UNAVAILABLE", 503);
  }
}
