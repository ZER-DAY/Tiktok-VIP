import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;

export function redirectToLogin(pathName?: string) {
  const current = pathName ?? `${window.location.pathname}${window.location.search}`;
  const locale = current.startsWith("/en/") ? "en" : "ar";
  window.location.replace(`/${locale}/login?callbackUrl=${encodeURIComponent(current)}`);
}
