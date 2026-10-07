// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuotaExhaustedDialog, ReportQuotaNotice } from "./quota-notice";
vi.mock("next-intl", () => ({
  useLocale: () => "ar",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("opens a dismissible renewal dialog with a direct billing link", async () => {
  render(<QuotaExhaustedDialog isTrial={false} />);
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("link", { name: "renew" }).getAttribute("href")).toBe(
    "/dashboard/billing"
  );
  fireEvent.click(screen.getByRole("button", { name: "later" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("offers guests registration for their separate free allowance", () => {
  render(<QuotaExhaustedDialog isTrial />);
  expect(screen.getByRole("link", { name: "register" }).getAttribute("href")).toBe("/register");
});
it("shows the notice after a completed report when the server says zero remains", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { remaining: 0, isTrial: false } }),
      })
  );
  render(<ReportQuotaNotice />);
  expect(await screen.findByRole("dialog")).toBeTruthy();
});
it.each([null, 1, 5])("does not prompt when remaining allowance is %s", async (remaining) => {
  const fetch = vi
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { remaining, isTrial: false } }),
    });
  vi.stubGlobal("fetch", fetch);
  render(<ReportQuotaNotice />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.queryByRole("dialog")).toBeNull();
});
