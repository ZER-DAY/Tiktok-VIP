// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
const mockRouter = { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() };

vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & Record<string, any>) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/ar",
  useRouter: () => mockRouter,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
  useTranslations: () => (key: string) => key.split(".").pop() ?? key,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      ...rest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => <div {...rest}>{children}</div>,
  },
}));

import { Navbar } from "./navbar";

function sessionLike(user: { name: string; email: string } | null) {
  return { data: user ? { user } : null, isPending: false };
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReset();
    mockSignOut.mockReset();
  });

  it("shows separate login and create-account buttons for guests", () => {
    mockUseSession.mockReturnValue(sessionLike(null));
    render(<Navbar />);

    const loginLink = screen.getByRole("link", { name: "login" });
    const registerLink = screen.getByRole("link", { name: "register" });

    expect(loginLink).toBeTruthy();
    expect(registerLink).toBeTruthy();
    expect(loginLink.getAttribute("href")).toBe("/login");
    expect(registerLink.getAttribute("href")).toBe("/register");
    expect(screen.queryByRole("button", { name: "logout" })).toBeNull();
  });

  it("shows the user name, email, dashboard link, and logout for authenticated users", () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    render(<Navbar />);

    const dashboardLink = screen.getByRole("link", { name: "dashboard" });
    const logoutButton = screen.getByRole("button", { name: "logout" });

    expect(dashboardLink.getAttribute("href")).toBe("/dashboard");
    expect(screen.getAllByText("أحمد").length).toBeGreaterThan(0);
    expect(screen.getByText("ahmed@example.com")).toBeTruthy();
    expect(logoutButton).toBeTruthy();

    expect(screen.queryByRole("link", { name: "login" })).toBeNull();
    expect(screen.queryByRole("link", { name: "register" })).toBeNull();
  });

  it("shows a skeleton while the session is loading", () => {
    mockUseSession.mockReturnValue({ data: undefined, isPending: true });
    render(<Navbar />);

    expect(screen.getByTestId("navbar-auth-skeleton")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "logout" })).toBeNull();
    expect(screen.queryByRole("link", { name: "login" })).toBeNull();
  });

  it("signs out, refreshes, and returns home after logout", async () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    mockSignOut.mockResolvedValue({ error: null });

    render(<Navbar />);
    await waitFor(() => expect(screen.getByRole("button", { name: "logout" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRouter.refresh).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/"));
  });

  it("keeps the user logged in when sign-out fails", async () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    mockSignOut.mockResolvedValue({ error: { message: "boom" } });

    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
