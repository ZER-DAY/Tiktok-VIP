"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || t("resetError"));
      }
    } catch {
      setError(t("resetError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -end-28 top-16 size-72 rounded-full border-[34px] border-brand/10" />
      <div className="pointer-events-none absolute -start-24 bottom-8 size-64 rounded-full border-[28px] border-brand-secondary/10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandMark />
            <span className="text-2xl font-black tracking-tight text-foreground">
              {t("siteName")}
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_28px_80px_-48px_rgba(17,24,39,.65)] sm:p-8">
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t("resetSuccessTitle")}</h1>
              <p className="text-muted-foreground text-sm mb-6">{t("resetSuccessMessage")}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-brand-foreground font-semibold hover:opacity-90 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t("resetTitle")}
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-6">{t("resetSubtitle")}</p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                  <p className="text-destructive text-sm text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-foreground placeholder:text-muted-foreground transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                      placeholder="example@email.com"
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-brand font-bold text-brand-foreground transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? t("sending") : t("resetButton")}
                </button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-6">
                <Link href="/login" className="text-brand hover:text-brand/80 transition-colors">
                  {t("backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
