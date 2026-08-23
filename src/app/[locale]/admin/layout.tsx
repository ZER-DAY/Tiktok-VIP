"use client";

import { Users, CreditCard, Settings, FileText, BarChart3, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const sidebarItems = [
  { key: "stats", icon: BarChart3, href: "/admin/stats" },
  { key: "users", icon: Users, href: "/admin/users" },
  { key: "plans", icon: CreditCard, href: "/admin/plans" },
  { key: "settings", icon: Settings, href: "/admin/settings" },
  { key: "auditLogs", icon: FileText, href: "/admin/audit-logs" },
  { key: "roles", icon: Shield, href: "/admin/roles" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebarItems={sidebarItems} namespace="admin">
      {children}
    </AppShell>
  );
}
