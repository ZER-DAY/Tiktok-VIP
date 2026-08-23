"use client";

import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const sidebarItems = [{ key: "applicants", icon: Users, href: "/agency/applicants" }];

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebarItems={sidebarItems} namespace="agency">
      {children}
    </AppShell>
  );
}
