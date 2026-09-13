/**
 * One place for every locale-sensitive number and date in the UI.
 *
 * Two decisions are forced everywhere, on purpose:
 *
 * - numberingSystem "latn": Arabic locales otherwise render Arabic-Indic
 *   digits (١٠٢٦), which then sit next to Latin digits coming from anywhere
 *   that did not go through Intl. Mixed numerals in one row read as a bug.
 * - calendar "gregory": the "ar-SA" locale defaults to the Islamic calendar,
 *   so a report generated today was being shown as ١٤٤٨/٣/٢٥.
 */

type Loc = string | undefined;

const BASE = { numberingSystem: "latn", calendar: "gregory" } as const;

function resolve(locale: Loc): string {
  return locale === "ar" ? "ar-EG" : locale || "en-US";
}

/** 14/09/2026 */
export function formatDate(value: Date | string | number | null | undefined, locale?: Loc): string {
  if (value === null || value === undefined) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(resolve(locale), {
    ...BASE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 14 سبتمبر 2026 */
export function formatDateLong(
  value: Date | string | number | null | undefined,
  locale?: Loc
): string {
  if (value === null || value === undefined) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(resolve(locale), {
    ...BASE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** 14/09/2026, 21:40 */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  locale?: Loc
): string {
  if (value === null || value === undefined) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(resolve(locale), {
    ...BASE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** 1,284,000 */
export function formatNumber(value: number | null | undefined, locale?: Loc): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(resolve(locale), BASE).format(value);
}

/** 1.3M — compact, still in Latin digits */
export function formatCompact(value: number | null | undefined, locale?: Loc): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(resolve(locale), {
    ...BASE,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** 1,026.84 EGP */
export function formatCurrency(
  value: number | null | undefined,
  currency: string,
  locale?: Loc
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(resolve(locale), {
    ...BASE,
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Cents -> "1,026.84 EGP" */
export function formatCentsAsCurrency(
  cents: number | null | undefined,
  currency: string,
  locale?: Loc
): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "-";
  return formatCurrency(cents / 100, currency, locale);
}
