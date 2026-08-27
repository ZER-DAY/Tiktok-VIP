import { describe, it, expect } from "vitest";
import ar from "@/../messages/ar.json";
import en from "@/../messages/en.json";

describe("i18n: Translation Files", () => {
  it("Arabic translation file has all top-level keys", () => {
    expect(ar).toHaveProperty("siteName");
    expect(ar).toHaveProperty("hero");
    expect(ar).toHaveProperty("features");
    expect(ar).toHaveProperty("howItWorks");
    expect(ar).toHaveProperty("socialProof");
    expect(ar).toHaveProperty("pricing");
    expect(ar).toHaveProperty("agencyTeaser");
    expect(ar).toHaveProperty("nav");
    expect(ar).toHaveProperty("footer");
    expect(ar).toHaveProperty("auth");
    expect(ar).toHaveProperty("dashboard");
    expect(ar).toHaveProperty("report");
  });

  it("English translation file has all top-level keys", () => {
    expect(en).toHaveProperty("siteName");
    expect(en).toHaveProperty("hero");
    expect(en).toHaveProperty("features");
    expect(en).toHaveProperty("howItWorks");
    expect(en).toHaveProperty("socialProof");
    expect(en).toHaveProperty("pricing");
    expect(en).toHaveProperty("agencyTeaser");
    expect(en).toHaveProperty("nav");
    expect(en).toHaveProperty("footer");
    expect(en).toHaveProperty("auth");
    expect(en).toHaveProperty("dashboard");
    expect(en).toHaveProperty("report");
  });

  it("Arabic and English have matching top-level keys", () => {
    const arKeys = Object.keys(ar).sort();
    const enKeys = Object.keys(en).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("hero section has matching sub-keys", () => {
    const arHeroKeys = Object.keys(ar.hero).sort();
    const enHeroKeys = Object.keys(en.hero).sort();
    expect(arHeroKeys).toEqual(enHeroKeys);
  });

  it("features section has matching sub-keys", () => {
    const arFeatureKeys = Object.keys(ar.features).sort();
    const enFeatureKeys = Object.keys(en.features).sort();
    expect(arFeatureKeys).toEqual(enFeatureKeys);
  });

  it("auth section has matching keys", () => {
    const arAuthKeys = Object.keys(ar.auth).sort();
    const enAuthKeys = Object.keys(en.auth).sort();
    expect(arAuthKeys).toEqual(enAuthKeys);
  });

  it("dashboard section has matching sub-keys", () => {
    const arDashKeys = Object.keys(ar.dashboard).sort();
    const enDashKeys = Object.keys(en.dashboard).sort();
    expect(arDashKeys).toEqual(enDashKeys);
  });

  it("report section has matching sub-keys", () => {
    const arReportKeys = Object.keys(ar.report).sort();
    const enReportKeys = Object.keys(en.report).sort();
    expect(arReportKeys).toEqual(enReportKeys);
  });
});

describe("i18n: Arabic Content", () => {
  it("siteName is correct", () => {
    expect(ar.siteName).toBe("TikTok Intelligence");
  });

  it("hero title contains Arabic text", () => {
    expect(ar.hero.title).toMatch(/[\u0600-\u06FF]/);
  });

  it("hero CTA is in Arabic", () => {
    expect(ar.hero.cta).toMatch(/[\u0600-\u06FF]/);
  });

  it("pricing has correct structure", () => {
    expect(ar.pricing.free).toBeTruthy();
    expect(ar.pricing.pro).toBeTruthy();
    expect(ar.pricing.agency).toBeTruthy();
  });

  it("auth login has Arabic translations", () => {
    expect(ar.auth.loginTitle).toBeTruthy();
    expect(ar.auth.email).toBeTruthy();
    expect(ar.auth.password).toBeTruthy();
    expect(ar.auth.loginButton).toBeTruthy();
  });

  it("auth register has Arabic translations", () => {
    expect(ar.auth.registerTitle).toBeTruthy();
    expect(ar.auth.name).toBeTruthy();
    expect(ar.auth.registerButton).toBeTruthy();
  });

  it("dashboard has Arabic translations", () => {
    expect(ar.dashboard.welcome).toBeTruthy();
    expect(ar.dashboard.accounts).toBeTruthy();
    expect(ar.dashboard.sidebar.dashboard).toBeTruthy();
  });

  it("dashboard settings has Arabic translations", () => {
    expect(ar.dashboard.settings.title).toBeTruthy();
    expect(ar.dashboard.settings.profile).toBeTruthy();
    expect(ar.dashboard.settings.subscription).toBeTruthy();
    expect(ar.dashboard.settings.save).toBeTruthy();
  });

  it("report has Arabic translations", () => {
    expect(ar.report.title).toBeTruthy();
    expect(ar.report.loading).toBeTruthy();
    expect(ar.report.followers).toBeTruthy();
  });
});

describe("i18n: English Content", () => {
  it("siteName is correct", () => {
    expect(en.siteName).toBe("TikTok Intelligence");
  });

  it("hero title is in English", () => {
    expect(en.hero.title).toMatch(/^[A-Za-z\s]/);
  });

  it("hero CTA is in English", () => {
    expect(en.hero.cta).toMatch(/^[A-Za-z\s]/);
  });

  it("auth login has English translations", () => {
    expect(en.auth.loginTitle).toBeTruthy();
    expect(en.auth.email).toBeTruthy();
    expect(en.auth.password).toBeTruthy();
    expect(en.auth.loginButton).toBeTruthy();
  });
});

describe("i18n: Key Completeness", () => {
  it("Arabic has all required auth keys", () => {
    expect(ar.auth).toHaveProperty("loginTitle");
    expect(ar.auth).toHaveProperty("email");
    expect(ar.auth).toHaveProperty("password");
    expect(ar.auth).toHaveProperty("loginButton");
    expect(ar.auth).toHaveProperty("registerTitle");
    expect(ar.auth).toHaveProperty("name");
    expect(ar.auth).toHaveProperty("registerButton");
  });

  it("English has all required auth keys", () => {
    expect(en.auth).toHaveProperty("loginTitle");
    expect(en.auth).toHaveProperty("email");
    expect(en.auth).toHaveProperty("password");
    expect(en.auth).toHaveProperty("loginButton");
    expect(en.auth).toHaveProperty("registerTitle");
    expect(en.auth).toHaveProperty("name");
    expect(en.auth).toHaveProperty("registerButton");
  });

  it("Arabic has all required dashboard keys", () => {
    expect(ar.dashboard).toHaveProperty("welcome");
    expect(ar.dashboard).toHaveProperty("sidebar");
    expect(ar.dashboard).toHaveProperty("accounts");
    expect(ar.dashboard).toHaveProperty("compare");
    expect(ar.dashboard).toHaveProperty("settings");
  });

  it("Arabic has all required report keys", () => {
    expect(ar.report).toHaveProperty("title");
    expect(ar.report).toHaveProperty("loading");
    expect(ar.report).toHaveProperty("error");
    expect(ar.report).toHaveProperty("notFound");
    expect(ar.report).toHaveProperty("followers");
    expect(ar.report).toHaveProperty("accountAvatar");
    expect(ar.report).toHaveProperty("countryRegistered");
    expect(ar.report).toHaveProperty("accountCreatedAt");
    expect(ar.report).toHaveProperty("liveCreatorLeague");
    expect(ar.report).toHaveProperty("liveAccountLevel");
  });

  it("English has all required report keys", () => {
    expect(en.report).toHaveProperty("accountAvatar");
    expect(en.report).toHaveProperty("countryRegistered");
    expect(en.report).toHaveProperty("accountCreatedAt");
    expect(en.report).toHaveProperty("liveCreatorLeague");
    expect(en.report).toHaveProperty("liveAccountLevel");
  });
});

describe("i18n: RTL Detection", () => {
  it("Arabic text contains RTL characters", () => {
    const arabicText = ar.hero.title + ar.hero.subtitle + ar.hero.cta;
    const arabicChars = arabicText.match(/[\u0600-\u06FF]/g);
    expect(arabicChars).not.toBeNull();
    expect(arabicChars!.length).toBeGreaterThan(10);
  });

  it("English text does not contain Arabic characters", () => {
    const englishText = en.hero.title + en.hero.subtitle + en.hero.cta;
    const arabicChars = englishText.match(/[\u0600-\u06FF]/g);
    expect(arabicChars).toBeNull();
  });
});
