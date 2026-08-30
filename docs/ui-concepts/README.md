# UI Concept Boards — Arabic RTL Redesign

These boards are the visual source of truth for the redesign. They define hierarchy,
density, palette, spacing, and component relationships. Text and sample data shown in
the PNGs are illustrative; production UI must use existing translations and real API
data.

## Visual direction

- Arabic-first RTL with an equally complete English LTR layout.
- Warm near-white canvas (`#FAF9F6`) and ink text (`#111827`).
- Coral (`#FF4D67`) is the primary action color; violet (`#6D5DFB`) is a secondary data accent.
- Editorial analytics layout: strong hierarchy and asymmetric composition instead of a
  uniform wall of cards.
- Subtle borders and shadows, generous whitespace, accessible focus states, and no
  decorative glassmorphism or gratuitous gradients.
- Estimates must be labelled beside the value, and charts must not rely on color alone.

## Route mapping

| Board                             | Routes and components                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `01-landing-ar-rtl.png`           | Landing, Navbar, Hero, features, process, pricing, agency CTA, Footer, and the visual language for Auth/Legal |
| `02-analysis-report-ar-rtl.png`   | `/analyze/[username]`, `/report/[reportId]`, report cards and PDF styling                                     |
| `03-creator-dashboard-ar-rtl.png` | Dashboard, Accounts, Account details, Compare, Settings, and shared AppShell                                  |
| `04-agency-admin-ar-rtl.png`      | Agency applicants/detail and all Admin routes                                                                 |

## Proposed boards — 2026-08-29

These higher-fidelity boards were generated as the next implementation reference. They are
kept separately from the original concept boards so the current production UI remains
unchanged until each screen is approved and rebuilt in code.

| Board                          | Intended implementation scope                                      |
| ------------------------------ | ------------------------------------------------------------------ |
| `05-landing-proposed.png`      | Landing page, marketing sections and responsive navigation         |
| `06-report-proposed.png`       | Analysis report, score cards and mobile report layout              |
| `07-dashboard-proposed.png`    | Creator dashboard, KPI cards, charts, tables and mobile navigation |
| `08-agency-admin-proposed.png` | Agency CRM, admin table, detail drawer and mobile bottom sheet     |

## Implementation rules

1. Inspect the relevant PNG before editing a route.
2. Recreate its hierarchy and visual grammar with the current React/Tailwind/shadcn stack;
   do not place the PNG in the product UI.
3. Preserve APIs, Prisma models, auth, permissions, and business logic.
4. Use `messages/ar.json` and `messages/en.json`; never copy garbled image text.
5. Implement loading, empty, error, and success states at 360, 768, and 1440 pixels.
6. Validate visually in both locales, then run typecheck, lint, tests, and build.

## Generation provenance

The four boards were generated with the built-in OpenAI image generation tool on
2026-08-22 from project-specific UI briefs. They are original design references, not
copies of an external product.
