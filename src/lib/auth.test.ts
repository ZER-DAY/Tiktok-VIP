import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({ mockFindUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findUnique: mockFindUnique },
  },
}));

import { assignFreePlanOnCreate, USER_ADDITIONAL_FIELDS } from "./auth";

describe("auth: paid plan self-assignment is blocked", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockReset();
  });

  it("marks planId and sensitive account fields server-only (input:false)", () => {
    expect(USER_ADDITIONAL_FIELDS.planId).toMatchObject({ input: false, required: false });
    expect(USER_ADDITIONAL_FIELDS.passwordHash).toMatchObject({ input: false });
    // passwordHash must also never be returned to clients.
    expect(USER_ADDITIONAL_FIELDS.passwordHash.returned).toBe(false);
    expect(USER_ADDITIONAL_FIELDS.emailVerifiedAt).toMatchObject({ input: false });
    // preferredLocale stays a benign client-settable field.
    expect(USER_ADDITIONAL_FIELDS.preferredLocale).not.toHaveProperty("input", false);
    expect(USER_ADDITIONAL_FIELDS.preferredLocale).toMatchObject({ required: false });
  });

  it("always assigns the free plan even when a paid planId is smuggled into the create input", async () => {
    mockFindUnique.mockResolvedValue({ id: "free-plan-1" });

    const result = await assignFreePlanOnCreate({
      id: "u1",
      email: "attacker@example.com",
      planId: "paid-plan-id",
    } as { id: string; email: string; planId: string });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { name: "free" },
      select: { id: true },
    });
    expect(result.data.planId).toBe("free-plan-1");
  });

  it("assigns the free plan for a normal user with no planId", async () => {
    mockFindUnique.mockResolvedValue({ id: "free-plan-1" });

    const result = await assignFreePlanOnCreate({
      id: "u2",
      email: "user@example.com",
    });

    expect(result.data.planId).toBe("free-plan-1");
  });

  it("fails closed when the free plan is not configured", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(assignFreePlanOnCreate({ id: "u3", email: "user@example.com" })).rejects.toThrow(
      "FREE_PLAN_NOT_CONFIGURED"
    );
  });
});
