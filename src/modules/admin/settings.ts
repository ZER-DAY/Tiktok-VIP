import { prisma } from "@/lib/prisma";

// Default system settings
const DEFAULT_SETTINGS: Record<string, string> = {
  "agency.eligibility.minScore": "60",
  "agency.eligibility.highPriorityScore": "80",
  "cache.snapshot.ttlHours": "24",
  "rateLimit.freePlan.reportsPerDay": "1",
  "rateLimit.guest.reportsPerDay": "1",
  "rateLimit.agency.applicationsPerDay": "5",
  "benchmarks.engagement.micro": JSON.stringify({ excellent: 8, good: 5, average: 3, poor: 1.5 }),
  "benchmarks.engagement.mid": JSON.stringify({ excellent: 5, good: 3.5, average: 2, poor: 1 }),
  "benchmarks.engagement.macro": JSON.stringify({
    excellent: 3.5,
    good: 2.5,
    average: 1.5,
    poor: 0.7,
  }),
  "benchmarks.engagement.mega": JSON.stringify({
    excellent: 2.5,
    good: 1.8,
    average: 1,
    poor: 0.4,
  }),
};

export interface SystemSetting {
  key: string;
  value: string;
}

export async function getSetting(key: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setting = await (prisma as any).$queryRawUnsafe(
    `SELECT key, value FROM "SystemSetting" WHERE key = $1`,
    key
  );
  return setting[0]?.value ?? DEFAULT_SETTINGS[key] ?? null;
}

export async function getSettings(): Promise<SystemSetting[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbSettings: Array<{ key: string; value: string }> = await (prisma as any).$queryRawUnsafe(
    `SELECT key, value FROM "SystemSetting"`
  );

  const settingsMap = new Map<string, string>(dbSettings.map((s) => [s.key, s.value]));

  const allKeys = new Set([...Object.keys(DEFAULT_SETTINGS), ...settingsMap.keys()]);
  const result: SystemSetting[] = [];

  for (const key of allKeys) {
    result.push({
      key,
      value: settingsMap.get(key) ?? DEFAULT_SETTINGS[key] ?? "",
    });
  }

  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).$executeRawUnsafe(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") 
     VALUES ($1, $2, NOW(), NOW()) 
     ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()`,
    key,
    value
  );
}

export async function setSettings(settings: SystemSetting[]): Promise<void> {
  for (const { key, value } of settings) {
    await setSetting(key, value);
  }
}

export async function getAgencyEligibilityThreshold(): Promise<number> {
  const val = await getSetting("agency.eligibility.minScore");
  return parseInt(val || "60", 10);
}

export async function getHighPriorityThreshold(): Promise<number> {
  const val = await getSetting("agency.eligibility.highPriorityScore");
  return parseInt(val || "80", 10);
}

export async function getCacheTtlHours(): Promise<number> {
  const val = await getSetting("cache.snapshot.ttlHours");
  return parseInt(val || "24", 10);
}

export async function getFreePlanReportsPerDay(): Promise<number> {
  const val = await getSetting("rateLimit.freePlan.reportsPerDay");
  return parseInt(val || "1", 10);
}
