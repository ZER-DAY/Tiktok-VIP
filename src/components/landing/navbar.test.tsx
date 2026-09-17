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

    // Identity and the account actions live in a menu now: showing them all in
    // the bar at once is what made it overflow. The name is on the trigger; the
    // rest appears once it is opened.
    expect(screen.getAllByText("أحمد").length).toBeGreaterThan(0);
    expect(screen.queryByText("ahmed@example.com")).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("ahmed@example.com")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "dashboard" }).getAttribute("href")).toBe(
      "/dashboard"
    );
    expect(screen.getByRole("menuitem", { name: /logout/ })).toBeTruthy();

    expect(screen.queryByRole("link", { name: "login" })).toBeNull();
    expect(screen.queryByRole("link", { name: "register" })).toBeNull();
  });

  it("closes the account menu on Escape", () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: "accountMenu" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
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
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "logout" }).length).toBeGreaterThan(0)
    );

    fireEvent.click(screen.getAllByRole("button", { name: "logout" })[0]);

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRouter.refresh).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/"));
  });

  it("keeps the user logged in when sign-out fails with an error result", async () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    mockSignOut.mockResolvedValue({ error: { message: "boom" } });

    render(<Navbar />);
    fireEvent.click(screen.getAllByRole("button", { name: "logout" })[0]);

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
  });

  it("shows a localized retry message and never navigates when sign-out throws", async () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));
    mockSignOut.mockRejectedValue(new Error("network down"));

    render(<Navbar />);
    fireEvent.click(screen.getAllByRole("button", { name: "logout" })[0]);

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
  });

  it("renders an explicitly labeled logout control on mobile (not icon-only)", async () => {
    mockUseSession.mockReturnValue(sessionLike({ name: "أحمد", email: "ahmed@example.com" }));

    render(<Navbar />);

    // The phone bar carries its own logout with a visible label beside the icon
    // rather than being icon-only. It uses a shorter word ("خروج") because the
    // full label did not fit a 360px bar - it was clamped to 60px and cut
    // mid-word - so assert that a label is rendered, not which string it is.
    const logoutButtons = screen.getAllByRole("button", { name: "logout" });
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
    for (const button of logoutButtons) {
      expect(button.textContent?.trim()).not.toBe("");
    }
  });
});
