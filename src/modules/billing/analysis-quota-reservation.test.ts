import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAnalysisQuota, reserveAnalysisQuota } from "./analysis-quota";

vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    analysisUsageCounter: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const tx = {
  analysisUsage: { findUnique: vi.fn(), create: vi.fn() },
  analysisUsageCounter: { findUnique: vi.fn() },
  $queryRaw: vi.fn(),
};
const request = new NextRequest("https://example.com/api/analyze", {
  headers: { cookie: "ti_guest_analysis=already-used-trial" },
});
function reserve() {
  return reserveAnalysisQuota({
    request,
    requestId: "request",
    provider: "tiktok",
    username: "creator",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
    (fn as unknown as (client: typeof tx) => Promise<unknown>)(tx)
  );
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    plan: { name: "free", reportsPerMonth: 5, isActive: true },
    subscriptions: [],
    analysisBonus: 0,
  } as never);
  vi.mocked(getSessionUser).mockResolvedValue({ id: "user-1" } as never);
  tx.analysisUsage.findUnique.mockResolvedValue(null);
  tx.$queryRaw.mockResolvedValue([{ used: 1 }]);
});

describe("separate guest and registered allowances", () => {
  it("gives a guest one lifetime analysis", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect(await reserve()).toMatchObject({
      allowed: true,
      limit: 1,
      remaining: 0,
      isTrial: true,
      periodKey: "lifetime",
    });
    expect(tx.$queryRaw.mock.calls[0].slice(1)).toContain(1);
  });
  it("gives a registered user five analyses even after using a guest trial", async () => {
    vi.mocked(prisma.analysisUsageCounter.findUnique).mockResolvedValue({ used: 1 } as never);
    expect(await reserve()).toMatchObject({
      allowed: true,
      limit: 5,
      remaining: 4,
      isTrial: false,
      subjectKey: "user:user-1",
    });
    expect(tx.$queryRaw.mock.calls[0].slice(1)).toContain(5);
    expect(prisma.analysisUsageCounter.findUnique).not.toHaveBeenCalled();
  });
  it("rejects another request after the allowance is exhausted", async () => {
    tx.$queryRaw.mockResolvedValue([]);
    tx.analysisUsageCounter.findUnique.mockResolvedValue({ used: 5 });
    expect(await reserve()).toMatchObject({
      allowed: false,
      limit: 5,
      remaining: 0,
      reason: "LIMIT_REACHED",
    });
    expect(tx.analysisUsage.create).not.toHaveBeenCalled();
  });
  it("uses the admin bonus in both the displayed and enforced allowance", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: { name: "free", reportsPerMonth: 5, isActive: true },
      subscriptions: [],
      analysisBonus: 7,
    } as never);
    vi.mocked(prisma.analysisUsageCounter.findUnique).mockResolvedValue({ used: 5 } as never);
    expect(await getUserAnalysisQuota("user-1")).toMatchObject({ limit: 12, remaining: 7 });
    tx.$queryRaw.mockResolvedValue([{ used: 6 }]);
    expect(await reserve()).toMatchObject({ allowed: true, limit: 12, remaining: 6 });
    expect(tx.$queryRaw.mock.calls[0].slice(1)).toContain(12);
  });
  it("keeps an unlimited subscription unlimited", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: { name: "free", reportsPerMonth: 5, isActive: true },
      subscriptions: [{ plan: { name: "agency", reportsPerMonth: null, isActive: true } }],
      analysisBonus: 7,
    } as never);
    expect(await getUserAnalysisQuota("user-1")).toMatchObject({ limit: null, isUnlimited: true });
  });
});
