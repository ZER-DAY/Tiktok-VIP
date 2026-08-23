"use client";

import { LayoutDashboard, BarChart3, GitCompareArrows, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const sidebarItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "accounts", icon: BarChart3, href: "/dashboard/accounts" },
  { key: "compare", icon: GitCompareArrows, href: "/dashboard/compare" },
  { key: "settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebarItems={sidebarItems} namespace="dashboard">
      {children}
    </AppShell>
  );
}
