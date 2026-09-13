"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, Settings, FileText, BarChart3 } from "lucide-react";
import { AppShell, type SidebarItem } from "@/components/layout/app-shell";

const BASE_ITEMS: SidebarItem[] = [
  { key: "stats", icon: BarChart3, href: "/admin/stats" },
  { key: "users", icon: Users, href: "/admin/users" },
  { key: "plans", icon: CreditCard, href: "/admin/plans" },
  { key: "payments", icon: CreditCard, href: "/admin/payments" },
  { key: "settings", icon: Settings, href: "/admin/settings" },
  { key: "auditLogs", icon: FileText, href: "/admin/audit-logs" },
];

const POLL_MS = 60_000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);

  // Surfaces "a transfer is waiting for you" without the admin opening the page.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/payments/pending-count");
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body?.success) setPending(Number(body.data?.pending) || 0);
      } catch {
        // A failed count must never break the shell; the badge just stays as-is.
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const sidebarItems = BASE_ITEMS.map((item) =>
    item.key === "payments" ? { ...item, badge: pending } : item
  );

  return (
    <AppShell sidebarItems={sidebarItems} namespace="admin">
      {children}
    </AppShell>
  );
}
