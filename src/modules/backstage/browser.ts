import { chromium, type Page } from "playwright-core";
import { parseEligibility, unavailable, type EligibilityResult } from "./result";
const origin = "https://live-backstage.tiktok.com";
const path = "/creators/live/union_platform_api/agency/union_invite/batch_check_anchor/";

async function hasChallenge(page: Page) {
  const text = (await page.getByRole("dialog").allTextContents()).join(" ");
  return (
    /Select 2 objects|same shape|Audio|captcha|تحقق.*بشري/i.test(text) ||
    (await page.locator('iframe[src*="captcha"]').count()) > 0
  );
}

export async function checkInBrowser(username: string): Promise<EligibilityResult> {
  if (!/^[a-zA-Z0-9_.]{1,24}$/.test(username)) return unavailable();
  const endpoint = process.env.BACKSTAGE_CDP_URL ?? "http://127.0.0.1:9224";
  if (new URL(endpoint).hostname !== "127.0.0.1")
    throw new Error("Backstage browser must be local");
  const browser = await chromium.connectOverCDP(endpoint, { timeout: 5000 });
  try {
    const context = browser.contexts()[0];
    const page = context.pages().find((p) => p.url().startsWith(origin));
    if (!page) return unavailable("login_required");
    page.setDefaultTimeout(8000);
    if (await hasChallenge(page)) return unavailable("verification_required");
    if (!new URL(page.url()).pathname.startsWith("/portal/")) return unavailable("login_required");
    if (new URL(page.url()).pathname !== "/portal/anchor/relation") {
      await page.goto(origin + "/portal/anchor/relation", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    }
    if (!new URL(page.url()).pathname.startsWith("/portal/")) return unavailable("login_required");
    if (await hasChallenge(page)) return unavailable("verification_required");
    const dialog = page.getByRole("dialog");
    if (await dialog.count()) {
      const back = dialog.getByRole("button", { name: /^(Back|الرجوع)$/ });
      if (await back.count()) await back.click();
    } else {
      await page.getByRole("button", { name: /^(Invite creators|دعوة المبدعين)$/ }).click();
    }
    if (await hasChallenge(page)) return unavailable("verification_required");
    const input = dialog.locator("textarea").filter({ visible: true }).first();
    await input.fill(username);
    const responsePromise = page.waitForResponse((r) => new URL(r.url()).pathname === path, {
      timeout: 15000,
    });
    // Only the first wizard step is permitted. No final invitation/confirmation
    // controls are clicked, and challenge widgets are never interacted with.
    const [response] = await Promise.all([
      responsePromise,
      dialog.locator('button[data-id="invite-host-next"]').click(),
    ]);
    if (!response.ok()) return unavailable();
    return parseEligibility(await response.json(), username);
  } catch {
    return unavailable();
  } finally {
    // Disconnect CDP; leave the user's persistent browser/session open.
    await browser.close();
  }
}
