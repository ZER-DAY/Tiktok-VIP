import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

// ─── Application Submission ─────────────────────────────

export interface SubmitApplicationInput {
  accountId: string;
  fullName: string;
  phone: string;
  telegram: string;
  email: string;
  applicantUserId?: string;
}

export async function submitApplication(input: SubmitApplicationInput) {
  // Check if application already exists for this account
  const existing = await prisma.agencyApplication.findFirst({
    where: { accountId: input.accountId },
  });

  if (existing) {
    throw new Error("ALREADY_APPLIED");
  }

  const application = await prisma.agencyApplication.create({
    data: {
      accountId: input.accountId,
      fullName: input.fullName,
      phone: input.phone,
      telegram: input.telegram,
      email: input.email,
      applicantUserId: input.applicantUserId || null,
      status: "new",
    },
    include: {
      account: {
        include: {
          snapshots: {
            include: { analysisReport: true },
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Create initial status history
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      fromStatus: "new",
      toStatus: "new",
      changedByUserId: input.applicantUserId || "system",
    },
  });

  // Notify agency staff about new application
  await notifyAgencyStaffNewApplication(application);

  return application;
}

// ─── Status Workflow ─────────────────────────────────────

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ["reviewed", "rejected"],
  reviewed: ["contacted", "rejected"],
  contacted: ["joined", "rejected"],
  joined: [],
  rejected: [],
};

export async function changeApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  changedByUserId: string,
  note?: string
) {
  const application = await prisma.agencyApplication.findUnique({
    where: { id: applicationId },
    include: {
      account: {
        include: {
          snapshots: {
            include: { analysisReport: true },
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!application) {
    throw new Error("APPLICATION_NOT_FOUND");
  }

  const currentStatus = application.status;
  const validNext = VALID_TRANSITIONS[currentStatus];

  if (!validNext.includes(newStatus)) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  // Update status
  await prisma.agencyApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
  });

  // Record status history
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedByUserId,
    },
  });

  // Add note if provided
  if (note) {
    await prisma.applicationNote.create({
      data: {
        applicationId,
        authorUserId: changedByUserId,
        body: note,
      },
    });
  }

  // Notify applicant about status change
  await notifyApplicantStatusChange(application, newStatus);

  return application;
}

// ─── Notes ───────────────────────────────────────────────

export async function addApplicationNote(
  applicationId: string,
  authorUserId: string,
  body: string
) {
  return prisma.applicationNote.create({
    data: {
      applicationId,
      authorUserId,
      body,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

// ─── Assignee ────────────────────────────────────────────

export async function assignApplication(applicationId: string, assigneeUserId: string | null) {
  return prisma.agencyApplication.update({
    where: { id: applicationId },
    data: { assigneeUserId },
    include: {
      assigneeUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

// ─── Query Applications ──────────────────────────────────

export interface ApplicationFilters {
  status?: ApplicationStatus;
  minScore?: number;
  maxScore?: number;
  minFollowers?: number;
  maxFollowers?: number;
  country?: string;
  language?: string;
  assigneeUserId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "score";
  sortOrder?: "asc" | "desc";
}

export async function listApplications(filters: ApplicationFilters) {
  const {
    status,
    minScore,
    maxScore,
    minFollowers,
    maxFollowers,
    country,
    language,
    assigneeUserId,
    search,
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (assigneeUserId) where.assigneeUserId = assigneeUserId;

  // Search in applicant name, email, or account username
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { account: { externalUsername: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filter by score range (needs join through account -> snapshot -> report)
  const accountFilter: Record<string, unknown> = {};
  if (minScore || maxScore) {
    const reportFilter: Record<string, number> = {};
    if (minScore) reportFilter.gte = minScore;
    if (maxScore) reportFilter.lte = maxScore;
    accountFilter.snapshots = {
      some: {
        analysisReport: {
          accountStrengthScore: reportFilter,
        },
      },
    };
  }

  if (minFollowers || maxFollowers) {
    const followerFilter: Record<string, number> = {};
    if (minFollowers) followerFilter.gte = minFollowers;
    if (maxFollowers) followerFilter.lte = maxFollowers;
    accountFilter.snapshots = {
      ...((accountFilter.snapshots as Record<string, unknown>) || {}),
      some: {
        ...(typeof accountFilter.snapshots === "object" &&
        accountFilter.snapshots !== null &&
        "some" in accountFilter.snapshots
          ? (accountFilter.snapshots as { some: Record<string, unknown> }).some
          : {}),
        followers: followerFilter,
      },
    };
  }

  if (country) {
    accountFilter.snapshots = {
      ...((accountFilter.snapshots as Record<string, unknown>) || {}),
      some: {
        ...(typeof accountFilter.snapshots === "object" &&
        accountFilter.snapshots !== null &&
        "some" in accountFilter.snapshots
          ? (accountFilter.snapshots as { some: Record<string, unknown> }).some
          : {}),
        countryGuess: country,
      },
    };
  }

  if (language) {
    accountFilter.snapshots = {
      ...((accountFilter.snapshots as Record<string, unknown>) || {}),
      some: {
        ...(typeof accountFilter.snapshots === "object" &&
        accountFilter.snapshots !== null &&
        "some" in accountFilter.snapshots
          ? (accountFilter.snapshots as { some: Record<string, unknown> }).some
          : {}),
        bioLanguageGuess: language,
      },
    };
  }

  if (Object.keys(accountFilter).length > 0) {
    where.account = accountFilter;
  }

  const [applications, total] = await Promise.all([
    prisma.agencyApplication.findMany({
      where,
      include: {
        account: {
          include: {
            provider: true,
            snapshots: {
              include: { analysisReport: true },
              orderBy: { capturedAt: "desc" },
              take: 1,
            },
          },
        },
        assigneeUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy:
        sortBy === "score"
          ? { createdAt: sortOrder } // Score sorting done in-memory after fetch
          : { createdAt: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.agencyApplication.count({ where }),
  ]);

  return {
    applications,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Get Single Application ──────────────────────────────

export async function getApplicationById(applicationId: string) {
  return prisma.agencyApplication.findUnique({
    where: { id: applicationId },
    include: {
      account: {
        include: {
          provider: true,
          snapshots: {
            include: {
              analysisReport: {
                include: { insights: true },
              },
            },
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
        },
      },
      applicantUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      assigneeUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      notes: {
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        include: {
          changedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { changedAt: "desc" },
      },
    },
  });
}

// ─── Notifications ───────────────────────────────────────

async function notifyAgencyStaffNewApplication(application: { id: string; fullName: string }) {
  // Find all users with agency_staff or agency_admin roles
  const agencyUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: { in: ["agency_staff", "agency_admin"] },
          },
        },
      },
    },
    select: { id: true },
  });

  // Create notifications for each agency user
  if (agencyUsers.length > 0) {
    await prisma.notification.createMany({
      data: agencyUsers.map((user) => ({
        userId: user.id,
        type: "new_application",
        title: "طلب جديد للوكالة",
        body: `تقدم ${application.fullName} بطلب انضمام للوكالة`,
      })),
    });
  }
}

async function notifyApplicantStatusChange(
  application: { id: string; applicantUserId: string | null },
  newStatus: ApplicationStatus
) {
  if (!application.applicantUserId) return;

  const statusMessages: Record<ApplicationStatus, string> = {
    new: "تم استلام طلبك",
    reviewed: "تمت مراجعة طلبك",
    contacted: "تم التواصل معك",
    joined: "مرحباً بك في الوكالة!",
    rejected: "لم يتم قبول طلبك حالياً",
  };

  await prisma.notification.create({
    data: {
      userId: application.applicantUserId,
      type: "application_status_change",
      title: "تحديث حالة طلبك",
      body: statusMessages[newStatus],
    },
  });
}

// ─── Audit Log for Contact Info Views ────────────────────

export async function logContactInfoView(userId: string, applicationId: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "view_contact_info",
      entityType: "AgencyApplication",
      entityId: applicationId,
    },
  });
}
