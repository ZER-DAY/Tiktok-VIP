"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-mark";
import { useSession } from "@/lib/auth-client";
import { resolveAuthenticatedDestination } from "@/lib/auth-utils";

function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallback = searchParams.get("callbackUrl");
  const callbackUrl = resolveAuthenticatedDestination(requestedCallback, locale as "ar" | "en");
  const { data: session, isPending } = useSession();
  const justSubmitted = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending || justSubmitted.current) return;
    if (session?.user) {
      router.replace(`/${locale}/dashboard`);
      router.refresh();
    }
  }, [isPending, session, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        justSubmitted.current = true;
        window.location.replace(callbackUrl);
      } else {
        setError(data.message || t("loginError"));
      }
    } catch {
      setError(t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError(t("loginError"));
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
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-[#0b0b0d] px-5 py-3.5 shadow-[0_18px_44px_-28px_rgba(0,0,0,.7)]"
            aria-label={t("siteName")}
          >
            <BrandLogo className="h-10 w-auto sm:h-11" />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_28px_80px_-48px_rgba(17,24,39,.65)] sm:p-8">
          <h1 className="mb-2 text-center text-2xl font-black text-foreground">
            {t("loginTitle")}
          </h1>
          <p className="mb-7 text-center text-sm leading-6 text-muted-foreground">
            {t("loginSubtitle")}
          </p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
              <p className="text-destructive text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{t("email")}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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

            <div>
              <label className="block text-sm text-muted-foreground mb-2">{t("password")}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background py-3 ps-10 pe-12 text-foreground placeholder:text-muted-foreground transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-end">
              <Link
                href="/forgot-password"
                className="text-sm text-brand-ink hover:text-brand-ink/80 transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-brand font-bold text-brand-foreground transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? t("loggingIn") : t("loginButton")}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">{t("or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border font-bold text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("loginWithGoogle")}
          </button>

          <p className="text-center text-muted-foreground text-sm mt-6">
            {t("noAccount")}{" "}
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-brand-ink hover:text-brand-ink/80 transition-colors"
            >
              {t("registerLink")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
