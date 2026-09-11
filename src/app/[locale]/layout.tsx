import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "@fontsource/inter/latin.css";
import "@fontsource/tajawal/arabic.css";
import "@fontsource/tajawal/latin.css";
import { routing } from "@/i18n/routing";
import "../globals.css";

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
      ? "LiveStream Tech — تحليل حسابات TikTok بالذكاء الاصطناعي"
      : "LiveStream Tech — AI-powered TikTok analytics",
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
        className="antialiased"
        style={{
          fontFamily:
            locale === "ar" ? '"Tajawal", "Inter", sans-serif' : '"Inter", "Tajawal", sans-serif',
        }}
      >
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
