import { chromium } from "playwright-core";
import { mkdir, chmod } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  const profile =
    process.env.BACKSTAGE_PROFILE_DIR ??
    join(process.env.HOME!, ".local/share/tiktok-vip/backstage-browser");
  const executablePath = process.env.BACKSTAGE_CHROMIUM_EXECUTABLE;
  if (!executablePath) throw new Error("BACKSTAGE_CHROMIUM_EXECUTABLE is required");
  await mkdir(profile, { recursive: true, mode: 0o700 });
  await chmod(profile, 0o700);
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    executablePath,
    viewport: { width: 1440, height: 1000 },
    proxy: process.env.BACKSTAGE_BROWSER_PROXY
      ? { server: process.env.BACKSTAGE_BROWSER_PROXY }
      : undefined,
    args: ["--remote-debugging-address=127.0.0.1", "--remote-debugging-port=9224"],
  });
  process.once("SIGTERM", () => void context.close());
  process.once("SIGINT", () => void context.close());
  const page = context.pages()[0] ?? (await context.newPage());
  await page
    .goto("https://live-backstage.tiktok.com/portal/anchor/relation", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    })
    .catch(() => undefined);
  console.log(
    "Backstage browser ready; sign in or complete verification directly in the window when required"
  );
  await new Promise<void>((resolve) => context.once("close", () => resolve()));
}
main().catch(() => {
  console.error("Backstage browser could not start");
  process.exitCode = 1;
});
