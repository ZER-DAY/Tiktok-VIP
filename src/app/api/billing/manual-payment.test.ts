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
  plan: { findFirst: vi.fn() },
  paymentOrder: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  user: { update: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockGetCurrentUser = vi.fn();
vi.mock("@/modules/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

const mockHasPermission = vi.fn();
vi.mock("@/lib/auth", () => ({
  hasPermission: mockHasPermission,
}));

vi.mock("@/modules/billing/payment-config", () => ({
  getManualPaymentConfig: vi.fn().mockReturnValue({ conversionRate: 30, accountNumber: "TES" }),
  getPaymobServerConfig: vi.fn().mockReturnValue(null),
  convertUsdCentsToEgp: (cents: number, rate: number) => Math.round(cents * rate),
}));

vi.mock("@/modules/billing/paymob", () => ({
  createPaymobIntention: vi.fn(),
}));

const mockActivatePaidOrder = vi.fn();
const mockRejectManualOrder = vi.fn();
vi.mock("@/modules/billing/subscription-activation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/billing/subscription-activation")>();
  return {
    ...actual,
    activatePaidOrder: mockActivatePaidOrder,
    rejectManualOrder: mockRejectManualOrder,
  };
});

const createdAt = new Date("2026-09-01T10:00:00.000Z");
const validOrder = {
  id: "a1b2c3d4-0000-4000-8000-000000000001",
  method: "manual_transfer",
  status: "manual_review",
  provider: "manual",
  planPriceCents: 10000,
  paymentAmountCents: 300000,
  paymentCurrency: "EGP",
  customerPhone: "+201000000000",
  transferReference: "INSTAPAY-REF-1234",
  createdAt,
  plan: { name: "individual", priceCents: 10000, isActive: true },
  user: { name: "Tester", email: "tester@test.com" },
};

describe("manual payment flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockReset();
    mockHasPermission.mockReset();
    tx.paymentOrder.updateMany.mockReset();
    tx.subscription.create.mockReset();
    tx.subscription.updateMany.mockReset();
    tx.user.update.mockReset();
    tx.auditLog.create.mockReset();
  });

  describe("checkout: manual transfer", () => {
    it("creates a manual_review order with the right fields", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user-1",
        name: "Tester",
        email: "tester@test.com",
      });
      mockPrisma.plan.findFirst.mockResolvedValue({
        id: "plan-individual",
        name: "individual",
        priceCents: 10000,
      });
      mockPrisma.paymentOrder.findFirst.mockResolvedValue(null);
      mockPrisma.paymentOrder.create.mockImplementation(async ({ data }) => ({
        id: "order-1",
        ...data,
      }));

      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST(
        new Request("http://localhost:3000/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "individual",
            method: "manual_transfer",
            locale: "ar",
            phone: "+201000000000",
            transferReference: "INSTAPAY-REF-1234",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.status).toBe("manual_review");

      const createCall = mockPrisma.paymentOrder.create.mock.calls[0][0];
      expect(createCall.data.status).toBe("manual_review");
      expect(createCall.data.provider).toBe("manual");
      expect(createCall.data.method).toBe("manual_transfer");
      expect(createCall.data.paymentCurrency).toBe("EGP");
      expect(createCall.data.planPriceCurrency).toBe("USD");
      expect(createCall.data.customerPhone).toBe("+201000000000");
      expect(createCall.data.transferReference).toBe("INSTAPAY-REF-1234");
      expect(createCall.data.userId).toBe("user-1");
      expect(createCall.data.planId).toBe("plan-individual");
    });

    it("returns a duplicate marker instead of a second order while a review is pending", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: "T", email: "t@t.com" });
      mockPrisma.plan.findFirst.mockResolvedValue({
        id: "plan-individual",
        name: "individual",
        priceCents: 10000,
      });
      mockPrisma.paymentOrder.findFirst.mockImplementation(async ({ where }) => ({
        id: "existing-order",
        status: where.status,
      }));

      const { POST } = await import("@/app/api/billing/checkout/route");
      const response = await POST(
        new Request("http://localhost:3000/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: "individual",
            method: "manual_transfer",
            locale: "en",
            phone: "+201111111111",
            transferReference: "INSTAPAY-REF-9999",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.duplicate).toBe(true);
      expect(body.data.orderId).toBe("existing-order");
      expect(mockPrisma.paymentOrder.create).not.toHaveBeenCalled();
    });
  });

  describe("admin review permission", () => {
    it("rejects a regular user with 403 on GET", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-creator" });
      mockHasPermission.mockResolvedValue(false);

      const { GET } = await import("@/app/api/admin/payments/route");
      const response = await GET();
      expect(response.status).toBe(403);
    });

    it("rejects an anonymous request with 401 on PATCH", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: validOrder.id, decision: "approve" }),
        })
      );
      expect(response.status).toBe(401);
      expect(mockActivatePaidOrder).not.toHaveBeenCalled();
    });

    it("rejects a regular user with 403 on PATCH", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-creator" });
      mockHasPermission.mockResolvedValue(false);

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: validOrder.id, decision: "approve" }),
        })
      );
      expect(response.status).toBe(403);
      expect(mockActivatePaidOrder).not.toHaveBeenCalled();
    });
  });

  describe("admin approval", () => {
    it("activates a valid manually-reviewed order", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "admin-1" });
      mockHasPermission.mockResolvedValue(true);
      mockPrisma.paymentOrder.findFirst.mockResolvedValue(validOrder);
      mockActivatePaidOrder.mockResolvedValue({ activated: true, status: "paid" });

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: validOrder.id, decision: "approve" }),
        })
      );

      expect(response.status).toBe(200);
      expect(mockActivatePaidOrder).toHaveBeenCalledWith(
        validOrder.id,
        `manual:${validOrder.id}`,
        expect.objectContaining({ actorUserId: "admin-1" })
      );
    });

    it("does not activate an order that is not under manual review", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "admin-1" });
      mockHasPermission.mockResolvedValue(true);
      mockPrisma.paymentOrder.findFirst.mockResolvedValue(null);

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: validOrder.id, decision: "approve" }),
        })
      );

      expect(response.status).toBe(409);
      expect(mockActivatePaidOrder).not.toHaveBeenCalled();
    });

    it("refuses to activate an order whose amount, currency, or plan does not match", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "admin-1" });
      mockHasPermission.mockResolvedValue(true);
      mockPrisma.paymentOrder.findFirst.mockResolvedValue({
        ...validOrder,
        paymentCurrency: "USD",
      });

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: validOrder.id, decision: "approve" }),
        })
      );

      expect(response.status).toBe(422);
      expect(mockActivatePaidOrder).not.toHaveBeenCalled();
    });
  });

  describe("admin rejection", () => {
    it("rejects a reviewable order without activating a subscription", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "admin-1" });
      mockHasPermission.mockResolvedValue(true);
      mockPrisma.paymentOrder.findFirst.mockResolvedValue(validOrder);
      mockRejectManualOrder.mockResolvedValue({ rejected: true, status: "failed" });

      const { PATCH } = await import("@/app/api/admin/payments/route");
      const response = await PATCH(
        new Request("http://localhost:3000/api/admin/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: validOrder.id,
            decision: "reject",
            reason: "Reference not found",
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(mockRejectManualOrder).toHaveBeenCalledWith(
        validOrder.id,
        "Reference not found",
        "admin-1"
      );
      expect(mockActivatePaidOrder).not.toHaveBeenCalled();
    });
  });
});
