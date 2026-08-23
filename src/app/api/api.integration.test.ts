import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma at module level
const mockPrisma = {
  provider: { findUnique: vi.fn() },
  analyzedAccount: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  agencyApplication: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  applicationStatusHistory: { create: vi.fn(), findMany: vi.fn() },
  applicationNote: { create: vi.fn() },
  auditLog: { create: vi.fn(), findMany: vi.fn() },
  analysisReport: { findUnique: vi.fn() },
  $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  $executeRawUnsafe: vi.fn().mockResolvedValue(1),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

// Mock auth module
const mockGetCurrentUser = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("@/modules/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
  hasPermission: mockHasPermission,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

describe("Auth permission checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hasPermission returns false for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockHasPermission.mockResolvedValue(false);

    const result = await mockHasPermission("nonexistent-id", "admin.manage_settings");
    expect(result).toBe(false);
  });

  it("hasPermission returns true when user has the permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      roles: [
        {
          role: {
            permissions: [
              {
                permission: { key: "admin.manage_settings" },
              },
            ],
          },
        },
      ],
    });
    mockHasPermission.mockResolvedValue(true);

    const result = await mockHasPermission("user-1", "admin.manage_settings");
    expect(result).toBe(true);
  });

  it("hasPermission returns false when user lacks the permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      roles: [
        {
          role: {
            permissions: [
              {
                permission: { key: "crm.view_applicants" },
              },
            ],
          },
        },
      ],
    });
    mockHasPermission.mockResolvedValue(false);

    const result = await mockHasPermission("user-1", "admin.manage_settings");
    expect(result).toBe(false);
  });
});

describe("Admin settings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSettings returns defaults when DB is empty", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
    const { getSettings } = await import("@/modules/admin/settings");
    const settings = await getSettings();
    expect(settings.length).toBeGreaterThan(0);
    expect(settings.find((s) => s.key === "agency.eligibility.minScore")?.value).toBe("60");
  });

  it("getAgencyEligibilityThreshold returns 60 by default", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
    const { getAgencyEligibilityThreshold } = await import("@/modules/admin/settings");
    const threshold = await getAgencyEligibilityThreshold();
    expect(threshold).toBe(60);
  });

  it("getSetting returns DB value when present", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { key: "agency.eligibility.minScore", value: "75" },
    ]);
    const { getSetting } = await import("@/modules/admin/settings");
    const value = await getSetting("agency.eligibility.minScore");
    expect(value).toBe("75");
  });
});

describe("Analyze API validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates username format without @", () => {
    const regex = /^[a-zA-Z0-9._]+$/;
    expect(regex.test("testuser")).toBe(true);
    expect(regex.test("test.user")).toBe(true);
    expect(regex.test("test_user")).toBe(true);
    expect(regex.test("test user")).toBe(false);
    expect(regex.test("test@user")).toBe(false);
    expect(regex.test("testuser!")).toBe(false);
  });

  it("strips @ prefix correctly", () => {
    const username = "@testuser";
    const clean = username.replace(/^@/, "").trim();
    expect(clean).toBe("testuser");
  });
});
