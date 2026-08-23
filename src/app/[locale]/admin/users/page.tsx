"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  preferredLocale: string;
  createdAt: string;
  plan: { name: string } | null;
  roles: Array<{ role: { name: string } }>;
  _count: { ownedAccounts: number };
}

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const result = await res.json();
        setUsers(result.data.users);
        setTotalPages(result.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      await fetchUsers();
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  if (isLoading && users.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-muted/50 border border-border rounded-xl py-3 pe-10 ps-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                  {t("name")}
                </th>
                <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                  {t("email")}
                </th>
                <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                  {t("plan")}
                </th>
                <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                  {t("roles")}
                </th>
                <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                  {t("accounts")}
                </th>
                <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                  {t("joined")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-sm font-bold">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">{user.email}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-3 py-1 rounded-full text-xs bg-muted text-foreground">
                      {user.plan?.name || tCommon("free")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {user.roles.map((ur, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs bg-brand-pink/20 text-brand-pink"
                        >
                          {ur.role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-muted-foreground">
                    {user._count.ownedAccounts}
                  </td>
                  <td className="py-4 px-6 text-center text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  page === p
                    ? "bg-brand-pink text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
