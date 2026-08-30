import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Play,
  ScanSearch,
  Share2,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const menuItems = [
  { key: "overview", icon: Home, active: true },
  { key: "content", icon: MessageSquareText },
  { key: "audience", icon: Users },
  { key: "growth", icon: BarChart3 },
  { key: "engagement", icon: Heart },
  { key: "comparisons", icon: ScanSearch },
  { key: "reports", icon: FileText },
] as const;

const videos = [
  { views: "128.6K", growth: "12.4%", tone: "from-[#5f432f] via-[#a87951] to-[#2a1c17]" },
  { views: "97.3K", growth: "9.1%", tone: "from-[#3c4933] via-[#bf895b] to-[#1c251b]" },
  { views: "76.8K", growth: "7.3%", tone: "from-[#7f432f] via-[#36211b] to-[#c88b65]" },
] as const;

function CreatorAvatar() {
  return (
    <svg
      viewBox="0 0 72 72"
      className="size-[66px] shrink-0 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="creator-avatar-bg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6546df" />
          <stop offset="1" stopColor="#9c7af6" />
        </linearGradient>
        <linearGradient id="creator-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f1b481" />
          <stop offset="1" stopColor="#de8e5a" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#creator-avatar-bg)" />
      <path d="M9 72c1-13 10-21 27-21s26 8 27 21H9Z" fill="url(#creator-shirt)" />
      <path d="M30 47h12v12H30z" fill="#b96c43" />
      <ellipse cx="36" cy="30" rx="16" ry="20" fill="#c98152" />
      <ellipse cx="20" cy="32" rx="3" ry="5" fill="#c98152" />
      <ellipse cx="52" cy="32" rx="3" ry="5" fill="#c98152" />
      <path
        d="M19 27c0-14 7-22 18-22 12 0 18 8 18 21-4-3-8-4-13-4-9 1-16-1-23-5v10Z"
        fill="#28201b"
      />
      <path d="M23 35c2 9 6 14 13 14 8 0 12-5 14-14-4 4-8 6-14 6-5 0-9-2-13-6Z" fill="#3d2820" />
      <path d="M27 32h5M40 32h5" stroke="#281c18" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M33 38c2 1 4 1 6 0M31 43c3 2 7 2 10 0"
        stroke="#f0ad82"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M23 23c2-7 7-11 14-11 8 0 13 4 16 11"
        stroke="#28201b"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VideoThumbnail({ tone, index }: { tone: string; index: number }) {
  return (
    <div
      className={`relative h-[43px] w-[72px] shrink-0 overflow-hidden rounded-[7px] bg-gradient-to-br ${tone}`}
    >
      <span
        className={`absolute -bottom-3 rounded-t-full bg-black/25 ${
          index === 0 ? "left-2 h-11 w-5" : index === 1 ? "right-2 h-12 w-6" : "left-5 h-10 w-8"
        }`}
      />
      <span className="absolute inset-x-0 top-2 h-px rotate-[-11deg] bg-white/20" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,.3),transparent_32%)]" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-6 place-items-center rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm">
          <Play className="ms-0.5 size-3 fill-current" />
        </span>
      </span>
    </div>
  );
}

function ScoreRing() {
  return (
    <div className="relative grid size-[102px] place-items-center">
      <svg viewBox="0 0 108 108" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="54" cy="54" r="42" fill="none" stroke="#ececf1" strokeWidth="8" />
        <circle
          cx="54"
          cy="54"
          r="42"
          fill="none"
          stroke="#7359ea"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="230 264"
        />
      </svg>
      <div className="text-center leading-none">
        <strong className="block text-[29px] font-black tracking-tight text-[#151925]">87</strong>
        <span className="mt-1 block text-[10px] text-[#737986]">/100</span>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const t = useTranslations("hero.dashboard");
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir="ltr"
      className="relative overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_22px_50px_rgba(24,31,47,0.13)] xl:h-[448px]"
    >
      <div className="grid min-h-[445px] sm:grid-cols-[114px_minmax(0,1fr)] xl:h-full xl:min-h-0">
        <aside className="hidden border-r border-black/[0.07] px-2 py-7 sm:block" dir="rtl">
          <div className="space-y-1.5">
            {menuItems.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className={`flex h-[39px] items-center gap-3 rounded-[8px] px-3 text-[11px] font-medium ${
                  key === "overview" ? "bg-[#fff2f2] text-brand" : "text-[#666d79]"
                }`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={1.8} />
                <span>{t(`menu.${key}`)}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 px-3 py-4 sm:px-5" dir="rtl">
          <div className="flex items-center justify-between gap-3" dir="ltr">
            <div className="flex min-w-0 items-center gap-4 xl:translate-x-[6px]" dir="ltr">
              <CreatorAvatar />
              <div className="min-w-0" dir="ltr">
                <div className="flex items-center gap-1.5">
                  <strong className="truncate text-[15px] font-black tracking-[-0.03em] text-[#141927] sm:text-[17px]">
                    @ahmed.creator
                  </strong>
                  <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[#7258e8] text-[8px] font-black text-white">
                    ✓
                  </span>
                </div>
                <span className="mt-1 block text-[11px] text-[#727783]" dir="rtl">
                  {t("creator")}
                </span>
              </div>
            </div>
            <button
              dir={direction}
              className="hidden h-9 shrink-0 items-center gap-2 rounded-[9px] border border-black/[0.08] bg-white px-3 text-[11px] font-medium text-[#363c48] sm:inline-flex"
            >
              <CalendarDays className="size-4 text-[#666d77]" />
              {t("last28Days")}
            </button>
          </div>

          <div
            className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(150px,.84fr)] xl:mt-[14px]"
            dir="ltr"
          >
            <div className="grid min-h-[136px] grid-cols-3 overflow-hidden rounded-[11px] border border-black/[0.07] bg-white sm:grid-cols-[122px_1fr_1fr]">
              <div className="grid place-items-center border-r border-black/[0.06] px-1 py-3 sm:px-2">
                <div className="scale-[.78] sm:scale-100">
                  <ScoreRing />
                </div>
                <p className="-mt-4 text-center text-[8px] text-[#777d87] sm:-mt-2 sm:text-[9px]">
                  {t("overallScore")}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center border-r border-black/[0.06] px-1 text-center sm:px-3">
                <span className="text-[9px] text-[#6c727d] sm:text-[10px]">{t("followers")}</span>
                <strong className="mt-2 text-[17px] font-black tracking-tight text-[#161b28] sm:text-[21px]">
                  128.4K
                </strong>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#11ad69] sm:text-[10px]">
                  <ArrowUp className="size-3" /> 12.5%
                </span>
              </div>
              <div className="flex flex-col items-center justify-center px-1 text-center sm:px-3">
                <span className="text-[9px] text-[#6c727d] sm:text-[10px]">{t("likes")}</span>
                <strong className="mt-2 text-[17px] font-black tracking-tight text-[#161b28] sm:text-[21px]">
                  2.7M
                </strong>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#11ad69] sm:text-[10px]">
                  <ArrowUp className="size-3" /> 18.3%
                </span>
              </div>
            </div>

            <div className="rounded-[11px] border border-black/[0.07] p-3.5" dir={direction}>
              <h3 className="text-[11px] font-black text-[#222735]">{t("contentSignals")}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                {[
                  [Clock3, t("averageWatch"), "1.9s"],
                  [LayoutDashboard, t("completionRate"), "34%"],
                  [Share2, t("shareRate"), "6.8%"],
                ].map(([Icon, label, value]) => {
                  const SignalIcon = Icon as typeof Clock3;
                  return (
                    <div key={String(label)} className="flex items-center gap-2 text-[9px]">
                      <SignalIcon className="size-3.5 shrink-0 text-[#68707d]" />
                      <span className="min-w-0 flex-1 truncate text-[#505663]">
                        {String(label)}
                      </span>
                      <strong className="text-[#232936]">{String(value)}</strong>
                      <ArrowUp className="size-3 text-[#13b66d]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.65fr)_minmax(150px,.84fr)] xl:mt-[10px]"
            dir="ltr"
          >
            <div
              className="rounded-[11px] border border-black/[0.07] px-3.5 pb-2.5 pt-3"
              dir={direction}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-[#222735]">{t("followerGrowth")}</h3>
                <span className="rounded-[6px] bg-[#7558e9] px-2 py-1 text-[9px] font-bold text-white">
                  128.4K
                </span>
              </div>
              <div className="relative mt-2 h-[113px]" dir="ltr">
                <div className="absolute inset-0 flex flex-col justify-between text-[8px] text-[#7a808b]">
                  <span>150K</span>
                  <span>100K</span>
                  <span>50K</span>
                  <span>0</span>
                </div>
                <svg
                  viewBox="0 0 420 125"
                  preserveAspectRatio="none"
                  className="absolute inset-y-0 left-8 right-0 h-full w-[calc(100%-2rem)]"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7659ea" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#7659ea" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[18, 48, 78, 108].map((y) => (
                    <line key={y} x1="0" x2="420" y1={y} y2={y} stroke="#ececf1" strokeWidth="1" />
                  ))}
                  <path
                    d="M0 106 C22 100,31 88,50 91 S78 74,97 79 S130 58,151 63 S184 49,203 52 S226 32,246 37 S269 19,292 25 S318 20,339 33 S366 20,388 18 S406 8,420 7 L420 120 L0 120 Z"
                    fill="url(#landing-chart-fill)"
                  />
                  <path
                    d="M0 106 C22 100,31 88,50 91 S78 74,97 79 S130 58,151 63 S184 49,203 52 S226 32,246 37 S269 19,292 25 S318 20,339 33 S366 20,388 18 S406 8,420 7"
                    fill="none"
                    stroke="#7659ea"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="420" cy="7" r="6" fill="#7659ea" />
                </svg>
                <div className="absolute inset-x-8 bottom-0 flex justify-between text-[7px] text-[#7b818b]">
                  <span>{t("dates.apr20")}</span>
                  <span>{t("dates.apr27")}</span>
                  <span>{t("dates.may4")}</span>
                  <span>{t("dates.may11")}</span>
                  <span>{t("dates.may18")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[11px] border border-black/[0.07] p-3" dir={direction}>
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-[#222735]">{t("topVideos")}</h3>
                <span className="text-[9px] font-bold text-[#7359ea]">{t("viewAll")}</span>
              </div>
              <div className="mt-2 space-y-2">
                {videos.map((video, index) => (
                  <div key={video.views} className="flex items-center gap-2" dir="ltr">
                    <VideoThumbnail tone={video.tone} index={index} />
                    <div className="min-w-0 flex-1" dir="rtl">
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#343a46]">
                        <Heart className="size-3" />
                        <span>{video.views}</span>
                      </div>
                      <span className="mt-1 flex items-center justify-end gap-1 text-[9px] font-bold text-[#11ad69]">
                        <ArrowUp className="size-3" /> {video.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
