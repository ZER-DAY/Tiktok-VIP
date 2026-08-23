# UI Audit — Arabic UI Redesign Baseline

**Date:** 2026-08-21
**Auditor:** Opencode AI
**Scope:** All routes in `src/app/[locale]/` — Landing, Auth, Dashboard, Agency, Admin

---

## Baseline Quality Metrics

| Check            | Result                                              |
| ---------------- | --------------------------------------------------- |
| `pnpm typecheck` | ✅ PASS                                             |
| `pnpm lint`      | ✅ PASS                                             |
| `pnpm test`      | ✅ PASS (114 tests)                                 |
| `pnpm build`     | ⚠️ PASS with MISSING_MESSAGE errors (admin.sidebar) |

---

## Issues Found

### P0 — Build-Breaking / Critical

| #   | File                                                 | Issue                                                                          | RTL | Mobile | A11y |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | --- | ------ | ---- |
| 1   | `messages/ar.json`, `messages/en.json`               | Missing `admin.sidebar` namespace — causes build errors with `MISSING_MESSAGE` | —   | —      | —    |
| 2   | `src/app/[locale]/admin/layout.tsx:67`               | Hardcoded `"Admin"` string (should be translated)                              | —   | —      | —    |
| 3   | `src/app/[locale]/admin/layout.tsx:120`              | Hardcoded `"Admin Panel"` string                                               | —   | —      | —    |
| 4   | `src/app/[locale]/agency/layout.tsx:53`              | Hardcoded `"TikTok Analyzer"` string                                           | —   | —      | —    |
| 5   | `src/app/[locale]/agency/layout.tsx:99`              | Hardcoded `"Agency CRM"` string                                                | —   | —      | —    |
| 6   | `src/components/landing/hero-section.tsx:98-99`      | Hardcoded Arabic `"المتابعون"` and `"الإعجابات"` — should use translation keys | ✗   | —      | —    |
| 7   | `src/components/landing/hero-section.tsx:107`        | Hardcoded English `"Growth"` — inconsistent with Arabic context                | ✗   | —      | —    |
| 8   | `src/components/landing/hero-section.tsx:129`        | Hardcoded `"Account Strength: 87/100"`                                         | ✗   | —      | —    |
| 9   | `src/components/landing/hero-section.tsx:140`        | Hardcoded `"+2.4M this month"`                                                 | ✗   | —      | —    |
| 10  | `src/app/[locale]/login/page.tsx:137,188`            | Hardcoded `/ar/` prefix — should use locale from params                        | ✗   | —      | —    |
| 11  | `src/app/[locale]/register/page.tsx:221`             | Hardcoded `/ar/` prefix                                                        | ✗   | —      | —    |
| 12  | `src/app/[locale]/forgot-password/page.tsx:69,116`   | Hardcoded `/ar/` prefix                                                        | ✗   | —      | —    |
| 13  | `src/app/[locale]/dashboard/layout.tsx:82,149`       | Hardcoded `/ar` prefix in sidebar links                                        | ✗   | —      | —    |
| 14  | `src/app/[locale]/dashboard/page.tsx:86,158,172,188` | Hardcoded `/ar` prefix                                                         | ✗   | —      | —    |
| 15  | `src/app/[locale]/admin/layout.tsx:80,140`           | Hardcoded `/ar` prefix                                                         | ✗   | —      | —    |

### P1 — High Priority (RTL / Design System)

| #   | File                                         | Issue                                                                                                              | RTL | Mobile | A11y |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --- | ------ | ---- |
| 16  | Dashboard/Agency/Admin layout sidebar        | Collapse toggle uses `ChevronLeft`/`ChevronRight` — should flip for RTL (`-scale-x-100`)                           | ✗   | —      | —    |
| 17  | `src/app/[locale]/privacy/page.tsx:27,38,63` | Uses `mr-4` for list indentation — should use `me-4` (logical) or `ml-4` for RTL                                   | ✗   | —      | —    |
| 18  | All layouts                                  | Background hardcoded `bg-[#0B0B14]` and `bg-[#0D0D17]` — should use design tokens                                  | —   | —      | —    |
| 19  | Multiple components                          | Only `Button` from shadcn/ui installed — missing Card, Input, Badge, Skeleton, Alert, Dialog, Table, Tabs, Tooltip | —   | —      | —    |
| 20  | `src/app/globals.css`                        | No semantic color tokens for success/warning/info — only destructive defined                                       | —   | —      | —    |
| 21  | All sidebar layouts                          | No shared AppShell component — sidebar duplicated across dashboard/agency/admin                                    | —   | —      | —    |
| 22  | No language switcher                         | No visible language toggle in Navbar or anywhere in the UI                                                         | ✗   | —      | —    |

### P1 — High Priority (Missing States)

| #   | File                                           | Issue                                             | RTL | Mobile | A11y |
| --- | ---------------------------------------------- | ------------------------------------------------- | --- | ------ | ---- |
| 23  | `src/app/[locale]/privacy/page.tsx`            | No loading/error states                           | —   | —      | —    |
| 24  | `src/app/[locale]/terms/page.tsx`              | No loading/error states                           | —   | —      | —    |
| 25  | `src/app/[locale]/dashboard/accounts/page.tsx` | Needs verification for empty/loading/error states | —   | —      | —    |
| 26  | `src/app/[locale]/dashboard/compare/page.tsx`  | Needs verification for empty/loading/error states | —   | —      | —    |

### P2 — Medium Priority (Accessibility / Consistency)

| #   | File                                                 | Issue                                                                          | RTL | Mobile | A11y |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | --- | ------ | ---- |
| 27  | Agency layout mobile menu                            | Missing `AnimatePresence` for animation (dashboard has it, agency doesn't)     | —   | ✗      | —    |
| 28  | Icon-only buttons (sidebar collapse, mobile menu)    | Missing `aria-label` attributes                                                | —   | —      | ✗    |
| 29  | `src/components/landing/navbar.tsx:44`               | Mobile menu button missing `aria-label`                                        | —   | ✗      | ✗    |
| 30  | Multiple files                                       | Card styling inconsistent — some use `bg-white/5 border-white/10`, others vary | —   | —      | —    |
| 31  | `src/components/landing/how-it-works-section.tsx:32` | Connection line uses `left-1/6 right-1/6` — may break in RTL                   | ✗   | —      | —    |

---

## Pages Inventory

| Page                     | Route(s)                                     | Exists | Arabic | English | Loading | Empty | Error | Notes                   |
| ------------------------ | -------------------------------------------- | ------ | ------ | ------- | ------- | ----- | ----- | ----------------------- |
| Landing                  | `/ar`, `/en`                                 | ✅     | ✅     | ✅      | N/A     | N/A   | N/A   | Sections complete       |
| Login                    | `/ar/login`, `/en/login`                     | ✅     | ✅     | ✅      | ✅      | N/A   | ✅    | Hardcoded `/ar/` links  |
| Register                 | `/ar/register`, `/en/register`               | ✅     | ✅     | ✅      | ✅      | N/A   | ✅    | Hardcoded `/ar/` links  |
| Forgot Password          | `/ar/forgot-password`, `/en/forgot-password` | ✅     | ✅     | ✅      | ✅      | N/A   | ✅    | Hardcoded `/ar/` links  |
| Privacy                  | `/ar/privacy`, `/en/privacy`                 | ✅     | ✅     | ✅      | ❌      | N/A   | ❌    | No loading/error states |
| Terms                    | `/ar/terms`, `/en/terms`                     | ✅     | ✅     | ✅      | ❌      | N/A   | ❌    | No loading/error states |
| Dashboard                | `/ar/dashboard`, `/en/dashboard`             | ✅     | ✅     | ✅      | ✅      | ✅    | ⚠️    | Minimal error handling  |
| Dashboard Accounts       | `/ar/dashboard/accounts`                     | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Dashboard Account Detail | `/ar/dashboard/accounts/:id`                 | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Dynamic route           |
| Dashboard Compare        | `/ar/dashboard/compare`                      | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Dashboard Settings       | `/ar/dashboard/settings`                     | ✅     | ✅     | ✅      | ⚠️      | N/A   | ⚠️    | Needs verification      |
| Agency Applicants        | `/ar/agency/applicants`                      | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Agency Applicant Detail  | `/ar/agency/applicants/:id`                  | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Dynamic route           |
| Admin Stats              | `/ar/admin/stats`                            | ✅     | ✅     | ✅      | ⚠️      | N/A   | ⚠️    | Needs verification      |
| Admin Users              | `/ar/admin/users`                            | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Admin Plans              | `/ar/admin/plans`                            | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Admin Settings           | `/ar/admin/settings`                         | ✅     | ✅     | ✅      | ⚠️      | N/A   | ⚠️    | Needs verification      |
| Admin Audit Logs         | `/ar/admin/audit-logs`                       | ✅     | ✅     | ✅      | ⚠️      | ⚠️    | ⚠️    | Needs verification      |
| Analyze                  | `/ar/analyze/:username`                      | ✅     | ✅     | ✅      | ⚠️      | N/A   | ⚠️    | Dynamic route           |
| Report                   | `/ar/report/:reportId`                       | ✅     | ✅     | ✅      | ⚠️      | N/A   | ⚠️    | Dynamic route           |

---

## Component Inventory

| Component           | Location                                       | Translations            | RTL                                 | Notes                           |
| ------------------- | ---------------------------------------------- | ----------------------- | ----------------------------------- | ------------------------------- |
| Navbar              | `components/landing/navbar.tsx`                | ✅ via `next-intl`      | ⚠️ No language switcher             |
| HeroSection         | `components/landing/hero-section.tsx`          | ⚠️ 5 hardcoded strings  | ⚠️ Hardcoded LTR in mockup          |
| FeaturesSection     | `components/landing/features-section.tsx`      | ✅                      | ✅                                  |
| HowItWorksSection   | `components/landing/how-it-works-section.tsx`  | ✅                      | ⚠️ Connection line may break RTL    |
| SocialProofSection  | `components/landing/social-proof-section.tsx`  | ✅                      | ✅                                  |
| PricingSection      | `components/landing/pricing-section.tsx`       | ✅                      | ✅                                  |
| AgencyTeaserSection | `components/landing/agency-teaser-section.tsx` | ✅                      | ✅                                  |
| Footer              | `components/landing/footer.tsx`                | ✅                      | ✅                                  |
| Button              | `components/ui/button.tsx`                     | N/A                     | ✅                                  | Only shadcn component installed |
| Dashboard Sidebar   | `dashboard/layout.tsx`                         | ✅                      | ⚠️ Hardcoded `/ar`, collapse icon   |
| Agency Sidebar      | `agency/layout.tsx`                            | ✅                      | ⚠️ Hardcoded `/ar`, hardcoded brand |
| Admin Sidebar       | `admin/layout.tsx`                             | ❌ Missing translations | ⚠️ Hardcoded `/ar`, hardcoded brand |

---

## Hardcoded Strings Summary

| Location                      | String                     | Type              | Should Be                |
| ----------------------------- | -------------------------- | ----------------- | ------------------------ |
| `hero-section.tsx:98`         | `المتابعون`                | Arabic hardcoded  | `t("report.followers")`  |
| `hero-section.tsx:99`         | `الإعجابات`                | Arabic hardcoded  | `t("report.totalLikes")` |
| `hero-section.tsx:107`        | `Growth`                   | English hardcoded | translation key          |
| `hero-section.tsx:129`        | `Account Strength: 87/100` | English hardcoded | translation key          |
| `hero-section.tsx:140`        | `+2.4M this month`         | English hardcoded | translation key          |
| `dashboard/layout.tsx:69`     | `TikTok Analyzer`          | English hardcoded | `t("siteName")`          |
| `agency/layout.tsx:53`        | `TikTok Analyzer`          | English hardcoded | `t("siteName")`          |
| `agency/layout.tsx:99`        | `Agency CRM`               | English hardcoded | translation key          |
| `admin/layout.tsx:67`         | `Admin`                    | English hardcoded | translation key          |
| `admin/layout.tsx:120`        | `Admin Panel`              | English hardcoded | translation key          |
| `login/page.tsx:80`           | `TikTok Analyzer`          | English hardcoded | `t("siteName")`          |
| `register/page.tsx:86`        | `TikTok Analyzer`          | English hardcoded | `t("siteName")`          |
| `forgot-password/page.tsx:55` | `TikTok Analyzer`          | English hardcoded | `t("siteName")`          |

---

## Design Token Issues

| Current           | Should Be                | Location     |
| ----------------- | ------------------------ | ------------ |
| `bg-[#0B0B14]`    | `bg-background` or token | All layouts  |
| `bg-[#0D0D17]`    | `bg-card` or token       | All sidebars |
| `border-white/10` | `border-border` or token | Multiple     |
| `text-gray-400`   | `text-muted-foreground`  | Multiple     |
| `text-gray-500`   | `text-muted-foreground`  | Multiple     |
| No success color  | Add `--color-success`    | globals.css  |
| No warning color  | Add `--color-warning`    | globals.css  |
| No info color     | Add `--color-info`       | globals.css  |

---

## Priority Action Plan for UI-01

1. **Fix P0 #1**: Add `admin.sidebar` translations to ar.json and en.json
2. **Fix P0 #2-15**: Replace all hardcoded strings with translation keys
3. **Fix P0 #10-15**: Replace hardcoded `/ar/` with locale-aware links
4. **Add language switcher** to Navbar
5. **Define semantic tokens** in globals.css (success, warning, info)
6. **Install missing shadcn/ui components**: Card, Input, Badge, Skeleton, Dialog, Table, Tabs, Tooltip
7. **Build shared AppShell** for Dashboard/Agency/Admin
8. **Fix RTL issues**: collapse icons, logical properties, connection line
9. **Add missing states**: Loading/Empty/Error for all data pages
10. **Add aria-labels** to icon-only buttons
