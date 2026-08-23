export interface EngagementBenchmark {
  tier: string;
  minFollowers: number;
  maxFollowers: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

export const ENGAGEMENT_BENCHMARKS: EngagementBenchmark[] = [
  {
    tier: "micro",
    minFollowers: 0,
    maxFollowers: 10000,
    excellent: 8,
    good: 5,
    average: 3,
    poor: 1.5,
  },
  {
    tier: "mid",
    minFollowers: 10000,
    maxFollowers: 100000,
    excellent: 5,
    good: 3.5,
    average: 2,
    poor: 1,
  },
  {
    tier: "macro",
    minFollowers: 100000,
    maxFollowers: 1000000,
    excellent: 3.5,
    good: 2.5,
    average: 1.5,
    poor: 0.7,
  },
  {
    tier: "mega",
    minFollowers: 1000000,
    maxFollowers: Infinity,
    excellent: 2.5,
    good: 1.8,
    average: 1,
    poor: 0.4,
  },
];

export function getAccountTier(followers: number): EngagementBenchmark {
  return (
    ENGAGEMENT_BENCHMARKS.find((b) => followers >= b.minFollowers && followers < b.maxFollowers) ??
    ENGAGEMENT_BENCHMARKS[ENGAGEMENT_BENCHMARKS.length - 1]
  );
}

export function getEngagementBenchmark(followers: number): EngagementBenchmark {
  return getAccountTier(followers);
}
