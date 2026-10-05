import { beforeEach, expect, it, vi } from "vitest";
import { PATCH } from "./route";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
vi.mock("@/modules/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth", () => ({ hasPermission: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: vi.fn() } }));
vi.mock("@/modules/billing/analysis-quota", () => ({
  getUserAnalysisQuota: vi.fn().mockResolvedValue({ limit: 15 }),
}));
const tx = { user: { findFirst: vi.fn(), update: vi.fn() }, auditLog: { create: vi.fn() } };
const userId = "00000000-0000-4000-8000-000000000001";
const request = (analysisBonus: unknown = 10) =>
  new Request("https://example.com/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, analysisBonus }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "admin" } as never);
  vi.mocked(hasPermission).mockResolvedValue(true);
  tx.user.findFirst.mockResolvedValue({ analysisBonus: 0 });
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
    (fn as unknown as (client: typeof tx) => Promise<unknown>)(tx)
  );
});
it("requires login", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  expect((await PATCH(request())).status).toBe(401);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it("rejects regular users", async () => {
  vi.mocked(hasPermission).mockResolvedValue(false);
  expect((await PATCH(request())).status).toBe(403);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it.each([-1, 1.5, 100001, "10", null])("rejects invalid allowance %s", async (value) => {
  expect((await PATCH(request(value))).status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it("sets a bonus and records the change atomically", async () => {
  expect((await PATCH(request())).status).toBe(200);
  expect(tx.user.update).toHaveBeenCalledWith({
    where: { id: userId },
    data: { analysisBonus: 10 },
  });
  expect(tx.auditLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      actorUserId: "admin",
      entityId: userId,
      metadata: { previousBonus: 0, analysisBonus: 10 },
    }),
  });
});
it("allows removing the bonus", async () => {
  expect((await PATCH(request(0))).status).toBe(200);
  expect(tx.user.update).toHaveBeenCalledWith({
    where: { id: userId },
    data: { analysisBonus: 0 },
  });
});
it("does not update deleted or missing users", async () => {
  tx.user.findFirst.mockResolvedValue(null);
  expect((await PATCH(request())).status).toBe(404);
  expect(tx.user.update).not.toHaveBeenCalled();
});
