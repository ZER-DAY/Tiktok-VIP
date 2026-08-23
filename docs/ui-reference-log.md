# UI Reference Log

Purpose: Track external design references used during the Arabic UI Redesign. **No direct copying allowed** — extract patterns and adapt for Arabic/RTL.

---

## How to Use

Before building each page group, log:

1. **Page/Component** being built
2. **Reference URL** (max 2 per pattern)
3. **What was extracted** (layout pattern, interaction, visual rhythm)
4. **How it was adapted** for Arabic RTL and the project's identity

---

## Reference Sources

| Source           | URL                          | Use Case                                       |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| shadcn/ui Blocks | https://ui.shadcn.com/blocks | Component patterns, form layouts, data tables  |
| Mobbin           | https://mobbin.com           | Auth flows, search patterns, dashboard layouts |
| SaaSFrame        | https://www.saasframe.io     | SaaS page structures, pricing, dashboards      |
| Land-book        | https://land-book.com        | Landing page hero, feature sections, CTAs      |
| Refero           | https://refero.design        | Product pages, settings, tables                |
| Godly            | https://godly.website        | Subtle animations, compositions                |

---

## Log Entries

### UI-01 — Design System & Shared Shell

- **shadcn/ui component library**: Used `npx shadcn@latest add card input badge skeleton alert dialog table tabs tooltip` to install base components. Adapted by using semantic CSS tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`) instead of hardcoded colors.
- **AppShell pattern**: Extracted from shadcn/ui sidebar patterns. Built a custom RTL-aware collapsible sidebar with mobile drawer (AnimatePresence). Uses logical CSS properties (`ps-*`, `pe-*`, `ms-*`) instead of `pl-*`/`pr-*` for RTL/LTR bi-directionality.

### UI-02 — Marketing & Auth

- **shadcn/ui form patterns**: Used card + input components for auth forms (login, register, forgot-password). Adapted for RTL with `end-3` (not `right-3`) for input icons and `ps-10`/`pe-4` for padding.
- **Framer Motion landing sections**: Used `whileInView` viewport animations for hero, features, social-proof, pricing. Adapted by using semantic tokens (`text-foreground`, `bg-card`, `border-border`) instead of `text-white`/`bg-white/5`/`border-white/10`.

### UI-03 — Analysis & Report

- **Extracted ScoreCard component**: Built reusable score visualization with animated progress bar, expandable breakdown, and score-level labels (excellent/good/average/needs work). Uses semantic tokens and works in both RTL/LTR. Replaces duplicated inline ScoreCard in report page and dashboard account page.
- **Extracted InsightSection component**: Reusable insight list with type-based filtering, staggered Framer Motion animations, and semantic tokens. Used across strengths/weaknesses/recommendations/audience/competitors sections.
- **Analyze page redesign**: Added progressive status display (queued/processing/ready/failed) with elapsed timer, locale-aware routing (`router.replace(\`/${locale}/report/...\`)`), retry mechanism, and semantic tokens. Replaced hardcoded `/ar/` prefixes.
- **Report page redesign**: Replaced all hardcoded Arabic strings with i18n keys (40+ keys added), added PDF export button, fixed RTL `mr-auto` → implicit end alignment, added estimated badges next to country/language values, added score level labels, and used semantic tokens throughout.
- **Application form redesign**: All labels/errors now via i18n, tokens for inputs/errors/success states, RTL-aware layout.
- **PDF export improvements**: Fixed `margin-right` → `margin-inline-end` for estimated badge, added score-level label CSS classes for print, fixed "potensial" typo to Arabic equivalent.

### UI-04 — Creator Dashboard

- **Tokenized all dashboard pages**: Replaced `bg-white/5`, `border-white/10`, `text-white`, `text-gray-400/500` with semantic tokens (`bg-card`, `bg-muted/50`, `text-foreground`, `text-muted-foreground`, `border-border`). Applied consistently across dashboard, accounts, account details, compare, and settings pages.
- **Locale-aware routing**: All hardcoded `/ar/` hrefs replaced with locale-relative paths via `Link` from `@/i18n/navigation`. Account detail back link, compare back link, settings back link all fixed.
- **Shared components reuse**: Account details page replaced inline score card with shared `ScoreCard` + `InsightSection` components, reducing duplication and ensuring consistency with report page.
- **Settings delete confirmation**: Added two-step confirmation dialog (`showDeleteConfirm` state) for destructive account deletion, following security best practice from master_ui.md.
- **Removed unused imports**: Cleaned `Users`, `router`, `ArrowRight`, `locale` to pass lint gate.

### UI-05 — Agency CRM

- **Applicants list tokenized**: Replaced `bg-white/5`, `border-white/10`, `text-white`, `text-gray-400/500` with semantic tokens. Score colors now use `text-success/warning/destructive` instead of `text-green-400/orange-400/red-400`. Search input uses `pe-10 ps-4` for RTL. Sort options and filter options now via i18n.
- **Detail page full i18n**: Replaced 15+ hardcoded Arabic strings ("معلومات التواصل", "الملاحظات", "ملخص التقرير", "سجل الحالات", "ملاحظة (اختياري)", "جاري الإضافة...", "غير متاح", "محمية", etc.) with i18n keys under `agency.detail.*`. Status labels now via `tStatus(statusKey(...))` pattern using `agency.applicants.status*` keys.
- **Locale-aware routing**: Fixed hardcoded `/ar/agency/applicants` links to relative `/agency/applicants` paths via `Link` from `@/i18n/navigation`. Fixed broken `Link` import that was at bottom of file (runtime bug).
- **Status dropdown i18n**: `STATUS_LABELS` map removed — status transition buttons now use i18n keys. `STATUS_MAP` simplified to only `color` (label removed, now via i18n). `TRANSITION_STATUSES` array used for mapping available transitions.
- **Skeleton tokens**: Loading skeletons use `bg-muted` and `bg-muted/50` instead of `bg-white/10` and `bg-white/5`.
- **Verified**: typecheck ✅, lint ✅, test ✅ (114)

### UI-06 — Admin & QA

- **Added 50+ missing admin i18n keys**: Stats, users, plans, settings, auditLogs sections added to both ar.json and en.json. Status funnel labels now via i18n. Audit log filter options i18n. All success/saving messages i18n.
- **All 5 admin pages tokenized**: Replaced `bg-white/5`, `border-white/10`, `text-white`, `text-gray-400/500` with semantic tokens (`bg-card`, `bg-muted/50`, `text-foreground`, `text-muted-foreground`, `border-border`). Search inputs use `pe-10 ps-4` for RTL. Success banners use `bg-success/10 border-success/20 text-success`. Score colors use `text-success/warning/destructive`. Icons use `text-brand-pink`, `text-info`, `text-brand-purple`, `text-warning`.
- **Stats page funnel**: Hardcoded Arabic labels ("جديد", "تمت المراجعة", etc.) replaced with `tStatus(statusKey(...))` pattern. Array-based rendering for funnel items.
- **Audit logs filter**: Hardcoded Arabic action filter options replaced with i18n keys (`filterAll`, `filterViewContact`, `filterChangeStatus`, `filterAssign`).
- **Table headers**: `text-right` → `text-start` for RTL-aware alignment across all tables.
- **Skeleton tokens**: Loading skeletons use `bg-muted` and `bg-muted/50`.
- **Fixed JSON syntax error**: Extra `},` removed from both ar.json and en.json after admin section expansion.
- **Verified**: typecheck ✅, lint ✅, test ✅ (114)
