"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-brand-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{t("siteName")}</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
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
                      className="w-full bg-background border border-border rounded-xl py-3 ps-10 pe-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-colors"
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
                  className="w-full py-3 rounded-xl bg-brand text-brand-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
