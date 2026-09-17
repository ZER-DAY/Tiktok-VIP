import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-sm font-bold tracking-[0.2em] text-brand-ink">404</p>
        <h1 className="mt-4 text-2xl font-black text-foreground">{t("title")}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("description")}</p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 font-bold text-brand-foreground transition hover:bg-brand/90"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
