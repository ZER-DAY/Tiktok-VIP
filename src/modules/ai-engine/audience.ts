import type { SnapshotInput } from "./scores";

export interface AudienceResult {
  countryGuess: string | null;
  countryConfidence: number;
  countryEvidenceCount: number;
  analyzedVideos: number;
  languageGuess: string | null;
  languageConfidence: number;
  bestPostingTimes: { day: string; hour: number; score: number }[];
}

const GEOGRAPHIC_SIGNALS: Record<string, string[]> = {
  "Saudi Arabia": [
    "السعوديه",
    "سعودي",
    "saudi",
    "ksa",
    "الرياض",
    "riyadh",
    "جده",
    "jeddah",
    "مكه",
    "mecca",
    "الدمام",
  ],
  Egypt: ["مصر", "مصري", "egypt", "القاهره", "cairo", "الاسكندريه", "alexandria"],
  UAE: ["الامارات", "اماراتي", "uae", "دبي", "dubai", "ابوظبي", "abudhabi"],
  Kuwait: ["الكويت", "كويتي", "kuwait"],
  Qatar: ["قطر", "قطري", "qatar", "الدوحه", "doha"],
  Bahrain: ["البحرين", "بحريني", "bahrain", "المنامه", "manama"],
  Oman: ["عمان", "عماني", "oman", "مسقط", "muscat"],
  Jordan: ["الاردن", "اردني", "jordan", "عمان الاردن", "amman"],
  Iraq: ["العراق", "عراقي", "iraq", "بغداد", "baghdad", "اربيل", "erbil"],
  Morocco: ["المغرب", "مغربي", "morocco", "كازابلانكا", "casablanca", "الرباط", "rabat"],
  Algeria: ["الجزائر", "جزائري", "algeria"],
  Tunisia: ["تونس", "تونسي", "tunisia"],
  Lebanon: ["لبنان", "لبناني", "lebanon", "بيروت", "beirut"],
  Palestine: ["فلسطين", "فلسطيني", "palestine", "غزه", "gaza", "القدس", "jerusalem"],
  Syria: ["سوريا", "سوري", "syria", "دمشق", "damascus"],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeAudience(
  snapshot: SnapshotInput,
  videos: { description: string; hashtags: string[]; createdAt: string }[]
): AudienceResult {
  const profile = snapshot.rawPayload?.profile as Record<string, unknown> | undefined;
  const allText = [
    typeof profile?.bio === "string" ? profile.bio : "",
    ...videos.map((v) => v.description),
  ].join(" ");
  const scores: Array<{ country: string; score: number; evidence: number; videos: number }> = [];

  for (const [country, signals] of Object.entries(GEOGRAPHIC_SIGNALS)) {
    let score = 0;
    let evidence = 0;
    let matchedVideos = 0;

    for (const video of videos) {
      const description = normalizeText(video.description);
      const hashtags = video.hashtags.map(normalizeText);
      let matchedThisVideo = false;

      for (const rawSignal of signals) {
        const signal = normalizeText(rawSignal);
        if (hashtags.some((tag) => tag === signal || tag.includes(signal))) {
          score += 3;
          evidence++;
          matchedThisVideo = true;
        } else if (description.includes(signal)) {
          score += 2;
          evidence++;
          matchedThisVideo = true;
        }
      }

      if (matchedThisVideo) matchedVideos++;
    }

    const normalizedBio = normalizeText(typeof profile?.bio === "string" ? profile.bio : "");
    if (signals.some((signal) => normalizedBio.includes(normalizeText(signal)))) {
      score += 1;
      evidence++;
    }

    if (matchedVideos >= 2) score += Math.min(4, matchedVideos);
    scores.push({ country, score, evidence, videos: matchedVideos });
  }

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const runnerUp = scores[1];
  const margin = Math.max(0, (best?.score ?? 0) - (runnerUp?.score ?? 0));
  const coverage = videos.length > 0 ? (best?.videos ?? 0) / videos.length : 0;
  const countryConfidence = best?.score
    ? Math.min(0.95, 0.3 + best.score * 0.055 + coverage * 0.2 + Math.min(0.15, margin * 0.03))
    : 0;
  const bestCountry = best && best.score >= 2 && countryConfidence >= 0.4 ? best.country : null;

  const hasArabic = /[\u0600-\u06FF]/.test(allText);
  const arabicRatio =
    (allText.match(/[\u0600-\u06FF]/g) || []).length / Math.max(1, allText.length);
  const languageGuess = hasArabic ? "ar" : "en";
  const languageConfidence = arabicRatio > 0.3 ? 0.9 : arabicRatio > 0.1 ? 0.7 : 0.5;

  const hourCounts: Record<number, { total: number; engagement: number }> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = { total: 0, engagement: 0 };

  for (const video of videos) {
    const date = new Date(video.createdAt);
    const hour = date.getHours();
    hourCounts[hour].total++;
    hourCounts[hour].engagement += video.description.length > 0 ? 1 : 0;
  }

  const bestTimes = Object.entries(hourCounts)
    .filter(([, data]) => data.total > 0)
    .map(([hour, data]) => ({
      day: "any",
      hour: Number(hour),
      score: Math.round((data.total / videos.length) * 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    countryGuess: countryConfidence >= 0.4 ? bestCountry : null,
    countryConfidence,
    countryEvidenceCount: best?.evidence ?? 0,
    analyzedVideos: videos.length,
    languageGuess,
    languageConfidence,
    bestPostingTimes: bestTimes,
  };
}
