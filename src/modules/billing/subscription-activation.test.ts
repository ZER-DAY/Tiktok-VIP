import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = {
  paymentOrder: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  subscription: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  user: { update: vi.fn() },
  auditLog: { create: vi.fn() },
};

const mockPrisma = {
  $transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("subscription activation internals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activates a subscription exactly once across repeated requests", async () => {
    const { activatePaidOrder } = await import("./subscription-activation");

    tx.paymentOrder.updateMany.mockResolvedValueOnce({ count: 1 });
    tx.paymentOrder.findUniqueOrThrow.mockResolvedValue({
      userId: "user-1",
      planId: "plan-individual",
    });
    tx.subscription.updateMany.mockResolvedValue({ count: 1 });
    tx.subscription.create.mockResolvedValue({ id: "sub-1" });
    tx.user.update.mockResolvedValue({ id: "user-1" });
    tx.auditLog.create.mockResolvedValue({});

    const first = await activatePaidOrder("order-1", "manual:order-1", {
      actorUserId: "admin-1",
      reviewedAt: new Date("2026-09-01T10:00:00.000Z"),
    });
    expect(first).toEqual({ activated: true, status: "paid" });
    expect(tx.subscription.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "payment_order_activated",
          actorUserId: "admin-1",
          entityId: "order-1",
        }),
      })
    );
    expect(tx.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          planId: "plan-individual",
          status: "active",
          paymentProviderRef: "manual:order-1",
        }),
      })
    );

    tx.paymentOrder.updateMany.mockResolvedValueOnce({ count: 0 });
    tx.paymentOrder.findUnique.mockResolvedValueOnce({ status: "paid" });

    const second = await activatePaidOrder("order-1", "manual:order-1", {
      actorUserId: "admin-1",
    });
    expect(second).toEqual({ activated: false, status: "paid" });
    expect(tx.subscription.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("cancels the previous active subscription before creating a new one", async () => {
    const { activatePaidOrder } = await import("./subscription-activation");

    tx.paymentOrder.updateMany.mockResolvedValueOnce({ count: 1 });
    tx.paymentOrder.findUniqueOrThrow.mockResolvedValue({
      userId: "user-1",
      planId: "plan-saver",
    });
    tx.subscription.updateMany.mockResolvedValue({ count: 1 });
    tx.subscription.create.mockResolvedValue({ id: "sub-2" });
    tx.user.update.mockResolvedValue({ id: "user-1" });
    tx.auditLog.create.mockResolvedValue({});

    await activatePaidOrder("order-2", "manual:order-2", { actorUserId: "admin-1" });

    const cancelCall = tx.subscription.updateMany.mock.calls[0][0];
    expect(cancelCall.where).toEqual({ userId: "user-1", status: "active" });
    expect(cancelCall.data.status).toBe("canceled");
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { planId: "plan-saver" },
    });
  });

  it("rejection marks the order failed and never creates a subscription", async () => {
    const { rejectManualOrder } = await import("./subscription-activation");

    tx.paymentOrder.updateMany.mockResolvedValueOnce({ count: 1 });
    tx.auditLog.create.mockResolvedValue({});

    const result = await rejectManualOrder("order-1", "No such reference", "admin-1");
    expect(result).toEqual({ rejected: true, status: "failed" });

    const updateCall = tx.paymentOrder.updateMany.mock.calls[0][0];
    expect(updateCall.where).toEqual({
      id: "order-1",
      provider: "manual",
      status: "manual_review",
    });
    expect(updateCall.data.status).toBe("failed");
    expect(updateCall.data.failureReason).toBe("No such reference");
    expect(updateCall.data.reviewedAt).toBeInstanceOf(Date);

    expect(tx.subscription.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "manual_payment_reject",
          actorUserId: "admin-1",
        }),
      })
    );
  });
});

describe("order payment validation", () => {
  it("accepts a matching, active, priced plan in EGP", async () => {
    const { isOrderPaymentValid } = await import("./subscription-activation");
    expect(
      isOrderPaymentValid({
        planPriceCents: 10000,
        paymentAmountCents: 300000,
        paymentCurrency: "EGP",
        plan: { name: "individual", priceCents: 10000, isActive: true },
      })
    ).toBe(true);
  });

  it("rejects tampered amounts, currencies, inactive plans, and price mismatches", async () => {
    const { isOrderPaymentValid } = await import("./subscription-activation");
    const base = {
      planPriceCents: 10000,
      paymentAmountCents: 300000,
      paymentCurrency: "EGP",
      plan: { name: "individual", priceCents: 10000, isActive: true },
    };
    expect(isOrderPaymentValid({ ...base, paymentAmountCents: 1 })).toBe(false);
    expect(isOrderPaymentValid({ ...base, paymentCurrency: "USD" })).toBe(false);
    expect(isOrderPaymentValid({ ...base, plan: { ...base.plan, isActive: false } })).toBe(false);
    expect(isOrderPaymentValid({ ...base, plan: { ...base.plan, priceCents: 500000 } })).toBe(
      false
    );
    expect(isOrderPaymentValid({ ...base, planPriceCents: 0 })).toBe(false);
  });
});
