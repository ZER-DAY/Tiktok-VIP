"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { BrandMark } from "@/components/brand/brand-mark";

export interface SidebarItem {
  key: string;
  icon: LucideIcon;
  href: string;
  /** Pending-work counter (e.g. transfers awaiting review). Hidden when 0. */
  badge?: number;
}

interface AppShellProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  namespace: string;
}

export function AppShell({ children, sidebarItems, namespace }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations(`${namespace}.sidebar`);
  const tCommon = useTranslations("common");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  const isRtl = locale === "ar";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutFailed(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setLogoutFailed(true);
        return;
      }
      setIsMobileMenuOpen(false);
      router.refresh();
      router.push("/");
    } catch {
      // A thrown network error must never leave the user stuck; surface a
      // localized retry message instead of navigating.
      setLogoutFailed(true);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: newLocale });
  };

  const isActive = (href: string) => {
    if (href === `/${namespace}`) {
      return (
        pathname === `/${namespace}` ||
        pathname === `/${locale}/${namespace}` ||
        pathname.endsWith(`/${namespace}`)
      );
    }
    return pathname.includes(href);
  };

  const sidebarWidth = isCollapsed ? "w-[72px]" : "w-64";

  return (
    <div className="flex min-h-screen w-full min-w-0 overflow-x-clip bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "relative hidden flex-col border-border bg-card/80 transition-all duration-300 ease-in-out lg:flex",
          sidebarWidth,
          isRtl ? "border-l" : "border-r"
        )}
      >
        {/* Logo */}
        <div className={cn("border-b border-border p-4", isCollapsed && "px-3")}>
          <Link href="/" className="flex items-center gap-3" aria-label={t("siteName")}>
            <BrandMark className="size-10 rounded-xl" />
            {!isCollapsed && (
              <span className="truncate text-lg font-black tracking-tight text-foreground">
                {t("siteName")}
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-smooth",
                  active
                    ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active && (
                  <div
                    className={cn(
                      "absolute top-1 bottom-1 w-[3px] rounded-full bg-primary",
                      isRtl ? "right-0" : "left-0"
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                {!!item.badge && item.badge > 0 && (
                  <span
                    className={cn(
                      "grid shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground tabular-nums",
                      isCollapsed
                        ? "absolute top-1.5 h-2.5 w-2.5 " + (isRtl ? "left-1.5" : "right-1.5")
                        : "ms-auto h-5 min-w-5 px-1.5 text-[11px]"
                    )}
                    aria-label={tCommon("pendingCount", { count: item.badge })}
                  >
                    {!isCollapsed && item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="space-y-1 border-t border-border p-3">
          <button
            onClick={switchLanguage}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <Globe className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            {!isCollapsed && (
              <span className="truncate">
                {locale === "ar" ? tCommon("english") : tCommon("arabic")}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground transition-smooth hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <LogOut className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            )}
            {!isCollapsed && <span className="truncate">{t("logout")}</span>}
          </button>
          {logoutFailed && (
            <p role="alert" className="px-3 text-xs font-medium text-destructive">
              {tCommon("logoutFailed")}
            </p>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-20 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground",
            isRtl ? "-right-3" : "-left-3"
          )}
          aria-label={isCollapsed ? tCommon("expandSidebar") : tCommon("collapseSidebar")}
        >
          {isRtl ? (
            isCollapsed ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label={t("siteName")}>
          <BrandMark className="size-8 rounded-lg" iconClassName="size-4" />
          <span className="truncate text-base font-black text-foreground">{t("siteName")}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={t("logout")}
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap text-xs font-semibold">
              {tCommon("logoutShort")}
            </span>
          </button>
          <button
            onClick={switchLanguage}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            aria-label={tCommon("switchLanguage")}
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            aria-label={isMobileMenuOpen ? tCommon("closeMenu") : tCommon("openMenu")}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {logoutFailed && !isMobileMenuOpen && (
        <p
          role="alert"
          className="fixed inset-x-0 top-16 z-50 bg-background px-4 py-2 text-sm text-destructive lg:hidden"
        >
          {tCommon("logoutFailed")}
        </p>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "lg:hidden fixed top-0 bottom-0 z-40 w-72 bg-card border-border shadow-xl",
                isRtl ? "right-0 border-l" : "left-0 border-r"
              )}
            >
              <div className="pt-16 p-4">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.key}
                        href={`/${locale}${item.href}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-3 transition-smooth",
                          active
                            ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {active && (
                          <div
                            className={cn(
                              "absolute top-1 bottom-1 w-[3px] rounded-full bg-primary",
                              isRtl ? "right-0" : "left-0"
                            )}
                          />
                        )}
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="font-medium">{t(item.key)}</span>
                        {!!item.badge && item.badge > 0 && (
                          <span
                            className="ms-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground"
                            aria-label={tCommon("pendingCount", { count: item.badge })}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-4 pt-4 border-t border-border space-y-1">
                  <button
                    onClick={() => {
                      switchLanguage();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth w-full"
                  >
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">
                      {locale === "ar" ? tCommon("english") : tCommon("arabic")}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <LogOut className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{t("logout")}</span>
                  </button>
                  {logoutFailed && (
                    <p role="alert" className="px-3 text-xs font-medium text-destructive">
                      {tCommon("logoutFailed")}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-w-0 flex-1 pt-14 min-h-screen lg:pt-0">{children}</main>
    </div>
  );
}
