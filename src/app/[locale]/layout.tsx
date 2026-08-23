import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Tajawal } from "next/font/google";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import "../globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic
      ? "منصة TikTok الذكية — تحليل حسابات TikTok بالذكاء الاصطناعي"
      : "TikTok Intelligence Platform — AI-powered TikTok analytics",
    description: isArabic
      ? "حلّل أي حساب TikTok واحصل على تقرير احترافي شامل عن قوة الحساب والأداء والجمهور"
      : "Analyze any TikTok account and get a comprehensive professional report on account strength, performance, and audience",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
