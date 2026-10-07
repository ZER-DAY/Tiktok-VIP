import { beforeEach, expect, it, vi } from "vitest";
const { page, browser, connect } = vi.hoisted(() => {
  const page = {
    url: vi.fn(),
    getByRole: vi.fn(),
    locator: vi.fn(),
    goto: vi.fn(),
    setDefaultTimeout: vi.fn(),
  };
  const browser = { contexts: () => [{ pages: () => [page] }], close: vi.fn() };
  return { page, browser, connect: vi.fn() };
});
vi.mock("playwright-core", () => ({ chromium: { connectOverCDP: connect } }));
import { checkInBrowser } from "./browser";
beforeEach(() => {
  vi.resetAllMocks();
  connect.mockResolvedValue(browser);
  page.url.mockReturnValue("https://live-backstage.tiktok.com/portal/anchor/relation");
  page.getByRole.mockReturnValue({ allTextContents: vi.fn().mockResolvedValue([]) });
  page.locator.mockReturnValue({ count: vi.fn().mockResolvedValue(0) });
});
it("stops at a challenge without clicking or navigating", async () => {
  page.getByRole.mockReturnValue({
    allTextContents: vi
      .fn()
      .mockResolvedValue(["Select 2 objects that are the same shape Confirm Audio"]),
  });
  expect((await checkInBrowser("primelive")).status).toBe("verification_required");
  expect(page.goto).not.toHaveBeenCalled();
  expect(page.locator).not.toHaveBeenCalled();
  expect(browser.close).toHaveBeenCalled();
});
it("reports an expired session without submitting credentials", async () => {
  page.url.mockReturnValue("https://live-backstage.tiktok.com/login/");
  expect((await checkInBrowser("primelive")).status).toBe("login_required");
  expect(page.goto).not.toHaveBeenCalled();
});
it("rejects arbitrary input before connecting to the agency browser", async () => {
  expect((await checkInBrowser("https://example.com/")).status).toBe("unavailable");
  expect(connect).not.toHaveBeenCalled();
});
