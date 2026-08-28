import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectRedis } from "@/lib/redis";

interface ServiceStatus {
  status: string;
  latencyMs?: number;
  commandsProcessed?: number;
}

export async function GET() {
  const results: Record<string, ServiceStatus> = {};
  let allHealthy = true;

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.database = { status: "connected", latencyMs: Date.now() - dbStart };
  } catch {
    results.database = { status: "disconnected", latencyMs: Date.now() - dbStart };
    allHealthy = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    const redis = await connectRedis();
    await redis.ping();
    results.redis = { status: "connected", latencyMs: Date.now() - redisStart };
  } catch {
    results.redis = { status: "disconnected", latencyMs: Date.now() - redisStart };
    allHealthy = false;
  }

  // Queue check (optional - may not be available in all environments)
  try {
    const queueInfo = await (await connectRedis()).info("stats");
    const processedCommands = queueInfo.match(/total_commands_processed:(\d+)/);
    results.queue = {
      status: "connected",
      latencyMs: 0,
      commandsProcessed: processedCommands ? parseInt(processedCommands[1], 10) : undefined,
    };
  } catch {
    results.queue = { status: "unknown", latencyMs: 0 };
  }

  const status = allHealthy ? "healthy" : "degraded";
  const httpStatus = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      success: true,
      data: {
        status,
        services: results,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "unknown",
      },
    },
    { status: httpStatus }
  );
}
