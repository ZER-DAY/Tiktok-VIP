/**
 * End-to-end purchase flow against a REAL PostgreSQL database.
 *
 * Only authentication is mocked (there is no HTTP request context in a test
 * runner). Everything else is the real thing: the real Prisma client, the real
 * checkout route handler, the real admin review handler, and the real
 * subscription-activation logic.
 *
 * Buyer submits a manual transfer -> order lands for review -> admin sees it in
 * the list and in the pending counter -> admin approves -> subscription is
 * active for one month and the counter drops back to zero.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

let buyerId = "";
let adminId = "";
let currentUserId = "";
let currentUserIsAdmin = false;

// Auth is the only seam we fake: return the real DB row for whoever is "logged in".
vi.mock("@/modules/auth", () => ({
  getCurrentUser: async () => {
    if (!currentUserId) return null;
    const { PrismaClient: PC } = await import("@prisma/client");
    const { PrismaPg: PP } = await import("@prisma/adapter-pg");
    const c = new PC({ adapter: new PP({ connectionString: process.env.DATABASE_URL }) });
    const u = await c.user.findUnique({
      where: { id: currentUserId },
      include: { plan: true, roles: { include: { role: true } } },
    });
    await c.$disconnect();
    return u;
  },
}));

vi.mock("@/lib/auth", () => ({
  hasPermission: async () => currentUserIsAdmin,
  auth: () => ({ api: { getSession: async () => null } }),
}));

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

// Needs a real database. Run with:
//   E2E_DB=1 DATABASE_URL="postgresql://..." pnpm exec vitest run src/test/purchase-flow.e2e.test.ts
const describeE2E = process.env.E2E_DB ? describe : describe.skip;

describeE2E("purchase flow: buyer transfer -> admin review -> subscription active", () => {
  beforeAll(async () => {
    const stamp = Date.now();
    const freePlan = await db.plan.findFirstOrThrow({ where: { name: "free" } });
    const buyer = await db.user.create({
      data: {
        email: `buyer-${stamp}@example.com`,
        name: "مشتري تجريبي",
        preferredLocale: "ar",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        plan: { connect: { id: freePlan.id } },
      },
    });
    buyerId = buyer.id;

    const admin = await db.user.findUnique({ where: { email: "admin@tiktok-intelligence.test" } });
    if (!admin) throw new Error("seed admin missing - run prisma/seed.ts first");
    adminId = admin.id;
  });

  afterAll(async () => {
    if (!buyerId) {
      await db.$disconnect();
      return;
    }
    await db.paymentOrder.deleteMany({ where: { userId: buyerId } });
    await db.subscription.deleteMany({ where: { userId: buyerId } });
    await db.user.deleteMany({ where: { id: buyerId } });
    await db.$disconnect();
  });

  it("1. buyer submits a manual transfer and the order is queued for review", async () => {
    currentUserId = buyerId;
    currentUserIsAdmin = false;

    const { POST } = await import("@/app/api/billing/checkout/route");
    const res = await POST(
      json({
        plan: "individual",
        method: "manual_transfer",
        locale: "ar",
        phone: "+201002003000",
        transferReference: `E2E-${Date.now()}`,
      })
    );
    const body = await res.json();

    // 201 Created is the correct status for a newly queued order
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    const order = await db.paymentOrder.findFirst({
      where: { userId: buyerId },
      include: { plan: true },
    });
    expect(order).toBeTruthy();
    expect(order!.status).toBe("manual_review");
    expect(order!.method).toBe("manual_transfer");
    expect(order!.customerPhone).toBe("+201002003000");
    // 20 USD at the configured 48 EGP rate
    expect(order!.paymentAmountCents).toBe(96000);
    expect(order!.plan.name).toBe("individual");
  });

  it("2. buyer has no active subscription yet", async () => {
    const active = await db.subscription.findFirst({
      where: { userId: buyerId, status: "active" },
    });
    expect(active).toBeNull();
  });

  it("3. the admin sees the transfer in the pending counter", async () => {
    currentUserId = adminId;
    currentUserIsAdmin = true;

    const { GET } = await import("@/app/api/admin/payments/pending-count/route");
    const body = await (await GET()).json();

    expect(body.success).toBe(true);
    expect(body.data.pending).toBeGreaterThanOrEqual(1);
  });

  it("4. the admin sees the transfer in the payments list with the phone and reference", async () => {
    const { GET } = await import("@/app/api/admin/payments/route");
    const body = await (await GET()).json();

    expect(body.success).toBe(true);
    const mine = body.data.find(
      (o: { customerPhone: string | null }) => o.customerPhone === "+201002003000"
    );
    expect(mine).toBeTruthy();
    expect(mine.status).toBe("manual_review");
    expect(mine.transferReference).toMatch(/^E2E-/);
    expect(mine.user.email).toContain("buyer-");
  });

  it("5. the admin approves it and the subscription goes active for one month", async () => {
    const order = await db.paymentOrder.findFirstOrThrow({ where: { userId: buyerId } });

    const { PATCH } = await import("@/app/api/admin/payments/route");
    const res = await PATCH(json({ orderId: order.id, decision: "approve" }, "PATCH"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    const paid = await db.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).toBeTruthy();
    expect(paid.reviewedAt).toBeTruthy();

    const sub = await db.subscription.findFirst({
      where: { userId: buyerId, status: "active" },
      include: { plan: true },
    });
    expect(sub).toBeTruthy();
    expect(sub!.plan.name).toBe("individual");

    // one month of access, within a day's tolerance
    const days = (sub!.currentPeriodEnd.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);

    const buyer = await db.user.findUniqueOrThrow({
      where: { id: buyerId },
      include: { plan: true },
    });
    expect(buyer.plan?.name).toBe("individual");
  });

  it("6. the pending counter drops back after approval", async () => {
    const { GET } = await import("@/app/api/admin/payments/pending-count/route");
    const body = await (await GET()).json();
    const stillMine = await db.paymentOrder.count({
      where: { userId: buyerId, status: "manual_review" },
    });
    expect(stillMine).toBe(0);
    expect(body.success).toBe(true);
  });

  it("7. a non-admin cannot approve orders", async () => {
    currentUserId = buyerId;
    currentUserIsAdmin = false;

    const { PATCH } = await import("@/app/api/admin/payments/route");
    const res = await PATCH(json({ orderId: crypto.randomUUID(), decision: "approve" }, "PATCH"));
    expect(res.status).toBe(403);
  });
});
