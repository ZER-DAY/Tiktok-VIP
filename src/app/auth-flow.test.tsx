// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSession = vi.fn();
const mockRouterNextNav = { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() };
const searchParams = new URLSearchParams();

vi.mock("@/lib/auth-client", () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouterNextNav,
  useSearchParams: () => searchParams,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
  useTranslations: () => (key: string) => key.split(".").pop() ?? key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...rest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => <div {...rest}>{children}</div>,
  },
}));

import LoginPage from "./[locale]/login/page";
import RegisterPage from "./[locale]/register/page";

function installLocationSpy() {
  const replace = vi.fn();
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...original, replace },
  });
  return replace;
}

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReset();
  mockRouterNextNav.replace.mockReset();
  mockRouterNextNav.refresh.mockReset();
  searchParams.delete("callbackUrl");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

function emailResponse(status = 200, body: Record<string, unknown> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("login page", () => {
  it("does not auto-redirect a logged-out user, allowing them to sign in again", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    installLocationSpy();

    render(<LoginPage />);

    expect(mockRouterNextNav.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "loginButton" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "registerLink" })).toBeTruthy();
  });

  it("redirects an already-logged-in user straight to the dashboard", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: "x@x.com" } },
      isPending: false,
    });
    installLocationSpy();

    render(<LoginPage />);

    await waitFor(() => expect(mockRouterNextNav.replace).toHaveBeenCalledWith("/ar/dashboard"));
    await waitFor(() => expect(mockRouterNextNav.refresh).toHaveBeenCalled());
  });

  it("goes to the internal callbackUrl after sign-in, never an external one", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    searchParams.set("callbackUrl", "/en/billing");
    const replace = installLocationSpy();
    fetchMock.mockResolvedValue(emailResponse(200, { success: true }));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "ahmed@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "loginButton" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/sign-in/email");
    expect(JSON.parse(init.body)).toEqual({
      email: "ahmed@example.com",
      password: "password123",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ar/billing"));
  });

  it("rejects an open-redirect callback by falling back to the dashboard", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    searchParams.set("callbackUrl", "//evil.example/phish");
    const replace = installLocationSpy();
    fetchMock.mockResolvedValue(emailResponse(200, { success: true }));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "ahmed@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "loginButton" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ar/dashboard"));
  });
});

describe("register page", () => {
  it("lands on the dashboard directly after register, without forcing a re-login", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    const replace = installLocationSpy();
    fetchMock.mockResolvedValue(emailResponse(200, { success: true }));

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("namePlaceholder"), {
      target: { value: "أحمد" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "ahmed@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "registerButton" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/sign-up/email");
    expect(JSON.parse(init.body)).toEqual({
      email: "ahmed@example.com",
      password: "password123",
      name: "أحمد",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ar/dashboard"));
    expect(screen.queryByText(/loginError/)).toBeNull();
  });

  it("does not redirect to an external callbackUrl after register", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    searchParams.set("callbackUrl", "https://evil.example/phish");
    const replace = installLocationSpy();
    fetchMock.mockResolvedValue(emailResponse(200, { success: true }));

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("namePlaceholder"), {
      target: { value: "أحمد" },
    });
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "ahmed@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "registerButton" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ar/dashboard"));
  });
});
