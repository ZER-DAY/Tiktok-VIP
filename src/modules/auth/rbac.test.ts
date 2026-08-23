import { describe, it, expect, vi } from "vitest";

// ─── RBAC Permission Definitions ───────────────────────────
// Based on docs/13_AUTH_SYSTEM.md and docs/12_AGENCY_CRM.md

interface Permission {
  key: string;
  description: string;
}

interface Role {
  name: string;
  permissions: string[];
}

const ALL_PERMISSIONS: Permission[] = [
  { key: "crm.view_applicants", description: "عرض المتقدمين في CRM" },
  { key: "crm.edit_applicant_status", description: "تعديل حالة المتقدم" },
  { key: "crm.view_contact_info", description: "عرض معلومات الاتصال" },
  { key: "crm.manage_assignees", description: "تعيين مسؤولين" },
  { key: "admin.manage_users", description: "إدارة المستخدمين" },
  { key: "admin.manage_plans", description: "إدارة الخطط" },
  { key: "admin.manage_settings", description: "إدارة إعدادات النظام" },
  { key: "admin.view_audit_logs", description: "عرض سجل المراقبة" },
];

const ROLES: Role[] = [
  {
    name: "creator",
    permissions: [], // No admin/CRM permissions
  },
  {
    name: "agency_staff",
    permissions: ["crm.view_applicants", "crm.edit_applicant_status"],
  },
  {
    name: "agency_admin",
    permissions: [
      "crm.view_applicants",
      "crm.edit_applicant_status",
      "crm.view_contact_info",
      "crm.manage_assignees",
    ],
  },
  {
    name: "platform_admin",
    permissions: [
      "crm.view_applicants",
      "crm.edit_applicant_status",
      "crm.view_contact_info",
      "crm.manage_assignees",
      "admin.manage_users",
      "admin.manage_plans",
      "admin.manage_settings",
      "admin.view_audit_logs",
    ],
  },
];

// ─── Mock Permission Check ─────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

async function checkPermission(userId: string, permissionKey: string): Promise<boolean> {
  const userWithRoles = await mockPrisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return false;

  return userWithRoles.roles.some(
    (ur: { role: { permissions: { permission: { key: string } }[] } }) =>
      ur.role.permissions.some(
        (rp: { permission: { key: string } }) => rp.permission.key === permissionKey
      )
  );
}

function mockUserWithRole(roleName: string) {
  const role = ROLES.find((r) => r.name === roleName)!;
  return {
    id: `user-${roleName}`,
    email: `${roleName}@test.com`,
    roles: [
      {
        role: {
          name: roleName,
          permissions: role.permissions.map((permKey) => ({
            permission: {
              key: permKey,
              description: ALL_PERMISSIONS.find((p) => p.key === permKey)?.description || "",
            },
          })),
        },
      },
    ],
  };
}

// ─── RBAC Tests ────────────────────────────────────────────

describe("RBAC: Role Definitions", () => {
  it("defines exactly 4 roles", () => {
    expect(ROLES).toHaveLength(4);
  });

  it("each role has a name and permissions array", () => {
    for (const role of ROLES) {
      expect(role.name).toBeTruthy();
      expect(Array.isArray(role.permissions)).toBe(true);
    }
  });

  it("all permission keys are from valid domains", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(perm.key).toMatch(/^(crm|admin)\./);
    }
  });
});

describe("RBAC: Creator Role", () => {
  it("has no CRM or admin permissions", () => {
    const creator = ROLES.find((r) => r.name === "creator")!;
    expect(creator.permissions).toHaveLength(0);
  });

  it("checkPermission returns false for all permissions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("creator"));

    for (const perm of ALL_PERMISSIONS) {
      const result = await checkPermission("user-creator", perm.key);
      expect(result).toBe(false);
    }
  });
});

describe("RBAC: Agency Staff Role", () => {
  it("has CRM view and edit permissions only", () => {
    const staff = ROLES.find((r) => r.name === "agency_staff")!;
    expect(staff.permissions).toContain("crm.view_applicants");
    expect(staff.permissions).toContain("crm.edit_applicant_status");
    expect(staff.permissions).not.toContain("crm.view_contact_info");
    expect(staff.permissions).not.toContain("crm.manage_assignees");
    expect(staff.permissions).not.toContain("admin.manage_users");
    expect(staff.permissions).not.toContain("admin.manage_settings");
  });

  it("checkPermission returns true for crm.view_applicants", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("agency_staff"));
    const result = await checkPermission("user-agency_staff", "crm.view_applicants");
    expect(result).toBe(true);
  });

  it("checkPermission returns false for crm.view_contact_info", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("agency_staff"));
    const result = await checkPermission("user-agency_staff", "crm.view_contact_info");
    expect(result).toBe(false);
  });

  it("checkPermission returns false for admin.manage_settings", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("agency_staff"));
    const result = await checkPermission("user-agency_staff", "admin.manage_settings");
    expect(result).toBe(false);
  });
});

describe("RBAC: Agency Admin Role", () => {
  it("has all CRM permissions but no admin permissions", () => {
    const admin = ROLES.find((r) => r.name === "agency_admin")!;
    expect(admin.permissions).toContain("crm.view_applicants");
    expect(admin.permissions).toContain("crm.edit_applicant_status");
    expect(admin.permissions).toContain("crm.view_contact_info");
    expect(admin.permissions).toContain("crm.manage_assignees");
    expect(admin.permissions).not.toContain("admin.manage_users");
    expect(admin.permissions).not.toContain("admin.manage_plans");
    expect(admin.permissions).not.toContain("admin.manage_settings");
    expect(admin.permissions).not.toContain("admin.view_audit_logs");
  });

  it("checkPermission returns true for crm.view_contact_info", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("agency_admin"));
    const result = await checkPermission("user-agency_admin", "crm.view_contact_info");
    expect(result).toBe(true);
  });

  it("checkPermission returns false for admin.manage_settings", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("agency_admin"));
    const result = await checkPermission("user-agency_admin", "admin.manage_settings");
    expect(result).toBe(false);
  });
});

describe("RBAC: Platform Admin Role", () => {
  it("has ALL permissions", () => {
    const admin = ROLES.find((r) => r.name === "platform_admin")!;
    for (const perm of ALL_PERMISSIONS) {
      expect(admin.permissions).toContain(perm.key);
    }
  });

  it("checkPermission returns true for all permissions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithRole("platform_admin"));

    for (const perm of ALL_PERMISSIONS) {
      const result = await checkPermission("user-platform_admin", perm.key);
      expect(result).toBe(true);
    }
  });
});

describe("RBAC: Non-existent User", () => {
  it("checkPermission returns false", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const result = await checkPermission("nonexistent", "admin.manage_settings");
    expect(result).toBe(false);
  });
});

describe("RBAC: Hierarchy Verification", () => {
  it("platform_admin has more permissions than agency_admin", () => {
    const platformAdmin = ROLES.find((r) => r.name === "platform_admin")!;
    const agencyAdmin = ROLES.find((r) => r.name === "agency_admin")!;
    expect(platformAdmin.permissions.length).toBeGreaterThan(agencyAdmin.permissions.length);
  });

  it("agency_admin has more permissions than agency_staff", () => {
    const agencyAdmin = ROLES.find((r) => r.name === "agency_admin")!;
    const agencyStaff = ROLES.find((r) => r.name === "agency_staff")!;
    expect(agencyAdmin.permissions.length).toBeGreaterThan(agencyStaff.permissions.length);
  });

  it("agency_staff has more permissions than creator", () => {
    const agencyStaff = ROLES.find((r) => r.name === "agency_staff")!;
    const creator = ROLES.find((r) => r.name === "creator")!;
    expect(agencyStaff.permissions.length).toBeGreaterThan(creator.permissions.length);
  });

  it("each higher role includes all permissions of the role below", () => {
    const creator = ROLES.find((r) => r.name === "creator")!;
    const agencyStaff = ROLES.find((r) => r.name === "agency_staff")!;
    const agencyAdmin = ROLES.find((r) => r.name === "agency_admin")!;
    const platformAdmin = ROLES.find((r) => r.name === "platform_admin")!;

    // agency_staff includes all creator permissions
    for (const perm of creator.permissions) {
      expect(agencyStaff.permissions).toContain(perm);
    }
    // agency_admin includes all agency_staff permissions
    for (const perm of agencyStaff.permissions) {
      expect(agencyAdmin.permissions).toContain(perm);
    }
    // platform_admin includes all agency_admin permissions
    for (const perm of agencyAdmin.permissions) {
      expect(platformAdmin.permissions).toContain(perm);
    }
  });
});
