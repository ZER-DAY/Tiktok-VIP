"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X, ChevronLeft, ChevronRight, Globe, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  key: string;
  icon: LucideIcon;
  href: string;
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

  const isRtl = locale === "ar";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
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
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-card border-border transition-all duration-300 ease-in-out relative",
          sidebarWidth,
          isRtl ? "border-l" : "border-r"
        )}
      >
        {/* Logo */}
        <div className={cn("p-4 border-b border-border", isCollapsed && "px-3")}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-lg">{isRtl ? "ذ" : "T"}</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-foreground truncate">{t("siteName")}</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth relative group",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={switchLanguage}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth w-full"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            {!isCollapsed && <span className="truncate">{t("logout")}</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth z-10",
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
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{isRtl ? "ذ" : "T"}</span>
          </div>
          <span className="text-lg font-bold text-foreground">{t("siteName")}</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={switchLanguage}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-smooth"
            aria-label={tCommon("switchLanguage")}
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-smooth"
            aria-label={isMobileMenuOpen ? tCommon("closeMenu") : tCommon("openMenu")}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

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
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth relative",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth w-full"
                  >
                    <LogOut className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{t("logout")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14 min-h-screen">{children}</main>
    </div>
  );
}
