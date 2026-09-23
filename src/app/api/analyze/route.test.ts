import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { reserveAnalysisQuota } from "@/modules/billing/analysis-quota";

vi.mock("@/modules/billing/analysis-quota", () => ({
  reserveAnalysisQuota: vi.fn(),
  releaseAnalysisQuota: vi.fn(),
  attachGuestAnalysisCookie: vi.fn(),
}));
vi.mock("@/workers/queue", () => ({ getAnalyzeQueue: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

afterEach(() => vi.restoreAllMocks());

describe("analysis startup failures", () => {
  it.each([
    new Prisma.PrismaClientInitializationError("Database quota exceeded", "6.19.3"),
    new Prisma.PrismaClientKnownRequestError("Connection pool exhausted", {
      code: "P2024",
      clientVersion: "6.19.3",
    }),
  ])("returns a service outage without exposing database details", async (error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(reserveAnalysisQuota).mockRejectedValueOnce(error);

    const response = await POST(
      new NextRequest("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({ username: "tiktok" }),
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Analysis is temporarily unavailable. Please try again later.",
      },
    });
  });

  it("keeps unexpected application errors distinct from service outages", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(reserveAnalysisQuota).mockRejectedValueOnce(new Error("private details"));
    const response = await POST(
      new NextRequest("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({ username: "tiktok" }),
      })
    );
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("INTERNAL_ERROR");
  });
});
