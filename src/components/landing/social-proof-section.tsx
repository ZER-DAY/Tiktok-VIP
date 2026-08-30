"use client";

import { useTranslations } from "next-intl";

const avatarTones = [
  "from-[#395d84] to-[#e0b48e]",
  "from-[#3b2b28] to-[#d99870]",
  "from-[#706252] to-[#f0c0a0]",
  "from-[#236e66] to-[#dfaa7e]",
  "from-[#ca6065] to-[#f0bd96]",
] as const;

function CreatorFaces() {
  return (
    <div className="flex items-center" dir="ltr" aria-hidden="true">
      {avatarTones.map((tone, index) => (
        <span
          key={tone}
          className={`relative -ms-1.5 grid size-7 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-b ${tone} first:ms-0`}
        >
          <span className="mt-1 size-3 rounded-full bg-[#7c4f38]" />
          <span className="absolute -bottom-2 size-6 rounded-full bg-white/65" />
          <span className="sr-only">{index + 1}</span>
        </span>
      ))}
      <span className="ms-2 rounded-full bg-[#f1f1f2] px-2.5 py-1 text-[10px] font-bold text-[#686e79]">
        +10K
      </span>
    </div>
  );
}

export function SocialProofSection() {
  const t = useTranslations("socialProof");

  return (
    <section className="px-4 pt-[25px] sm:px-6">
      <div
        data-testid="social-proof"
        dir="ltr"
        className="mx-auto grid min-h-[80px] w-full max-w-[1275px] items-center gap-5 rounded-[14px] border border-black/[0.07] bg-white px-5 py-4 shadow-[0_9px_24px_rgba(20,28,45,.055)] sm:px-7 lg:grid-cols-[1.1fr_3fr] xl:h-[81px] xl:min-h-0 xl:w-[83.0078125vw] xl:-translate-x-[4.5px] xl:py-0"
      >
        <div
          className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:text-start lg:flex-col xl:translate-x-6"
          dir="rtl"
        >
          <p className="text-[13px] font-semibold text-[#656b77]">{t("creatorTrust")}</p>
          <CreatorFaces />
        </div>

        <div className="grid grid-cols-2 items-center gap-x-5 gap-y-4 text-center text-[#777c84] sm:grid-cols-5 xl:pl-[70px]">
          <span className="text-[16px] font-light tracking-tight">ARAGEEK</span>
          <span className="text-[18px] font-black">المبدعون</span>
          <span className="text-[20px] font-black tracking-tight">أرقام</span>
          <span className="text-[16px] font-black">تقني ✦</span>
          <span className="col-span-2 text-[15px] font-medium sm:col-span-1">عالم التقنية</span>
        </div>
      </div>
    </section>
  );
}
