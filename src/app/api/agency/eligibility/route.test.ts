import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { getSessionUser } from "@/lib/auth";
import { connectRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
const { redis, queue } = vi.hoisted(() => ({
  redis: { get: vi.fn(), exists: vi.fn(), eval: vi.fn() },
  queue: { getWaitingCount: vi.fn(), add: vi.fn(), getJob: vi.fn() },
}));
vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { analysisReport: { findUnique: vi.fn() } } }));
vi.mock("@/lib/redis", () => ({ connectRedis: vi.fn().mockResolvedValue(redis) }));
vi.mock("@/modules/backstage/queue", () => ({
  BACKSTAGE_HEARTBEAT: "heartbeat",
  cacheKey: (u: string) => u,
  getBackstageQueue: () => queue,
}));
const id = "00000000-0000-4000-8000-000000000001";
const req = () =>
  new Request("https://example.com/api/agency/eligibility", {
    method: "POST",
    body: JSON.stringify({ reportId: id }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(connectRedis).mockResolvedValue(redis as never);
  vi.mocked(getSessionUser).mockResolvedValue({ id: "user" } as never);
  vi.mocked(prisma.analysisReport.findUnique).mockResolvedValue({
    snapshot: { account: { externalUsername: "primelive", provider: { key: "tiktok" } } },
  } as never);
  redis.exists.mockResolvedValue(1);
  redis.eval.mockResolvedValue(1);
  queue.getWaitingCount.mockResolvedValue(0);
  queue.add.mockResolvedValue({ id });
});
it("requires authentication", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  expect((await POST(req())).status).toBe(401);
  expect(queue.add).not.toHaveBeenCalled();
});
it("requires an existing report", async () => {
  vi.mocked(prisma.analysisReport.findUnique).mockResolvedValue(null);
  expect((await POST(req())).status).toBe(404);
});
it("only queues the server's report username", async () => {
  expect((await POST(req())).status).toBe(202);
  expect(queue.add).toHaveBeenCalledWith(
    "check",
    expect.objectContaining({ username: "primelive", userId: "user" }),
    expect.anything()
  );
});
it("denies jobs belonging to another user", async () => {
  queue.getJob.mockResolvedValue({ data: { userId: "other" } });
  expect(
    (await GET(new Request(`https://example.com/api/agency/eligibility?jobId=${id}`))).status
  ).toBe(404);
});
it("returns a cached result without a new browser check", async () => {
  redis.get.mockResolvedValue(
    JSON.stringify({
      status: "ineligible",
      reason: "unsupported_region",
      checkedAt: new Date().toISOString(),
    })
  );
  expect((await POST(req())).status).toBe(200);
  expect(queue.add).not.toHaveBeenCalled();
});
it("rejects requests while the worker is offline", async () => {
  redis.exists.mockResolvedValue(0);
  expect((await POST(req())).status).toBe(503);
});
it("limits expensive checks per user", async () => {
  redis.eval.mockResolvedValue(31);
  expect((await POST(req())).status).toBe(429);
  expect(queue.add).not.toHaveBeenCalled();
});
