import type { SnapshotInput } from "./scores";
import { getEngagementBenchmark } from "./benchmarks";

export interface InsightData {
  type: "strength" | "weakness" | "recommendation" | "audience" | "competitor";
  title: string;
  description: string;
  evidenceRef: Record<string, unknown>;
  order: number;
}

interface RuleContext {
  snapshot: SnapshotInput;
  engagementRate: number;
  viewsToFollowers: number;
  followRatio: number;
  accountSize: string;
}

const rules: Array<{
  name: string;
  type: "strength" | "weakness" | "recommendation";
  check: (ctx: RuleContext) => boolean;
  title: string;
  description: string;
  evidence: (ctx: RuleContext) => Record<string, unknown>;
  order: number;
}> = [
  // ─── Strengths ─────────────────────────────────────────
  {
    name: "high_engagement",
    type: "strength",
    check: (ctx) => {
      const benchmark = getEngagementBenchmark(ctx.snapshot.followers);
      return ctx.engagementRate > benchmark.good;
    },
    title: "معدل تفاعل مرتفع",
    description: "معدل التفاعل يتجاوز المعدل المرجعي لحسابات بنفس الحجم",
    evidence: (ctx) => ({
      engagementRate: ctx.engagementRate.toFixed(2) + "%",
      benchmark: ctx.accountSize,
    }),
    order: 1,
  },
  {
    name: "verified_account",
    type: "strength",
    check: (ctx) => ctx.snapshot.isVerified,
    title: "حساب موثّق",
    description: "الحساب يحمل علامة التوثيق الرسمية مما يزيد المصداقية",
    evidence: () => ({ isVerified: true }),
    order: 2,
  },
  {
    name: "business_account",
    type: "strength",
    check: (ctx) => ctx.snapshot.accountType === "business",
    title: "حساب أعمال",
    description: "حساب أعمال يعكس جدية إدارة الحساب والتواصل مع الجمهور",
    evidence: (ctx) => ({ accountType: ctx.snapshot.accountType }),
    order: 3,
  },
  {
    name: "high_views_ratio",
    type: "strength",
    check: (ctx) => ctx.viewsToFollowers > 50,
    title: "نسبة مشاهدات مرتفعة",
    description: "المحتوى يصل لأبعد من الجمهور الحالي بكثير",
    evidence: (ctx) => ({ viewsToFollowers: ctx.viewsToFollowers.toFixed(1) + "%" }),
    order: 4,
  },
  {
    name: "large_audience",
    type: "strength",
    check: (ctx) => ctx.snapshot.followers >= 100000,
    title: "جمهور واسع",
    description: "الحساب يملك قاعدة جمهور كبيرة تدعم الوصول والتفاعل",
    evidence: (ctx) => ({ followers: ctx.snapshot.followers }),
    order: 5,
  },

  // ─── Weaknesses ────────────────────────────────────────
  {
    name: "high_following_ratio",
    type: "weakness",
    check: (ctx) => ctx.followRatio > 0.8 && ctx.snapshot.followers < 50000,
    title: "نسبة المتابعة مرتفعة مقارنة بالمتابعين",
    description: "عدد المتابَعين قريب أو يفوق عدد المتابعين مما يضعف المصداقية",
    evidence: (ctx) => ({
      following: ctx.snapshot.following,
      followers: ctx.snapshot.followers,
      ratio: ctx.followRatio.toFixed(2),
    }),
    order: 10,
  },
  {
    name: "low_engagement",
    type: "weakness",
    check: (ctx) => {
      const benchmark = getEngagementBenchmark(ctx.snapshot.followers);
      return ctx.engagementRate < benchmark.poor;
    },
    title: "معدل تفاعل منخفض",
    description: "معدل التفاعل أقل من المعدل المرجعي الأدنى لحسابات بنفس الحجم",
    evidence: (ctx) => ({ engagementRate: ctx.engagementRate.toFixed(2) + "%" }),
    order: 11,
  },
  {
    name: "no_captions",
    type: "weakness",
    check: (ctx) => {
      const raw = ctx.snapshot.rawPayload as Record<string, unknown>;
      const content = raw?.content as Array<Record<string, unknown>> | undefined;
      if (!content || content.length === 0) return false;
      const withoutCaptions = content.filter(
        (v) => !v.description || String(v.description).length < 10
      ).length;
      return withoutCaptions / content.length > 0.7;
    },
    title: "نقص في الأوصاف والهاشتاقات",
    description: "معظم الفيديوهات بدون أوصاف أو هاشتاقات كافية",
    evidence: () => ({ issue: "Missing captions/hashtags" }),
    order: 12,
  },
  {
    name: "inconsistent_posting",
    type: "weakness",
    check: (ctx) => {
      const raw = ctx.snapshot.rawPayload as Record<string, unknown>;
      const content = raw?.content as Array<Record<string, unknown>> | undefined;
      if (!content || content.length < 3) return false;
      const timestamps = content
        .map((v) => new Date(String(v.createdAt)).getTime())
        .sort((a, b) => b - a);
      if (timestamps.length < 2) return false;
      const gaps: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        gaps.push((timestamps[i - 1] - timestamps[i]) / (1000 * 60 * 60 * 24));
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return avgGap > 14;
    },
    title: "النشر غير منتظم",
    description: "الفواصل الزمنية بين المنشورات غير منتظمة أو طويلة جداً",
    evidence: () => ({ issue: "Inconsistent posting schedule" }),
    order: 13,
  },

  // ─── Recommendations ───────────────────────────────────
  {
    name: "start_live",
    type: "recommendation",
    check: (ctx) => ctx.snapshot.followers >= 10000,
    title: "ابدأ البث المباشر",
    description: "لديك جمهور كافٍ لدعم البث المباشر مما يزيد التفاعل والظهور",
    evidence: (ctx) => ({ followers: ctx.snapshot.followers }),
    order: 20,
  },
  {
    name: "improve_captions",
    type: "recommendation",
    check: (ctx) => ctx.engagementRate < 3,
    title: "حسّن الأوصاف والهاشتاقات",
    description: "إضافة أوصاف جذابة وهاشتاقات مناسبة تزيد الوصول والتفاعل",
    evidence: (ctx) => ({ engagementRate: ctx.engagementRate.toFixed(2) + "%" }),
    order: 21,
  },
];

export function generateInsights(
  snapshot: SnapshotInput,
  engagementRate: number,
  viewsToFollowers: number
): InsightData[] {
  const followRatio = snapshot.followers > 0 ? snapshot.following / snapshot.followers : 1;

  const benchmark = getEngagementBenchmark(snapshot.followers);

  const ctx: RuleContext = {
    snapshot,
    engagementRate,
    viewsToFollowers,
    followRatio,
    accountSize: benchmark.tier,
  };

  const insights: InsightData[] = [];
  let order = 0;

  for (const rule of rules) {
    if (rule.check(ctx)) {
      insights.push({
        type: rule.type,
        title: rule.title,
        description: rule.description,
        evidenceRef: rule.evidence(ctx),
        order: order++,
      });
    }
  }

  return insights;
}
