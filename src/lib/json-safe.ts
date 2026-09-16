/**
 * Make Prisma results safe to hand to NextResponse.json().
 *
 * Postgres BIGINT columns come back as JavaScript BigInt, and JSON.stringify
 * throws on BigInt ("Do not know how to serialize a BigInt") rather than
 * skipping it. A single BigInt anywhere in the tree takes down the whole
 * response, which is how the agency applicants list returned 500 as soon as
 * there was one applicant to show - the snapshot it includes carries
 * totalLikes.
 *
 * Most of the codebase converts these at the call site with Number(...). Use
 * this where a whole Prisma object graph is returned as-is, so a BigInt added
 * to the schema later cannot reintroduce the same 500.
 *
 * Values are converted to number when they fit exactly, and to string when
 * they do not, because silently rounding a count is worse than changing its
 * type. Dates are left alone: JSON.stringify already turns them into ISO
 * strings, which is what the clients parse.
 */
export function toJsonSafe<T>(value: T): T {
  return convert(value) as T;
}

function convert(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }

  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const converted = convert(item);
      if (converted !== item) changed = true;
      return converted;
    });
    return changed ? next : value;
  }

  // Leave class instances (Decimal, Buffer, …) intact; only walk plain objects.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const converted = convert(item);
    if (converted !== item) changed = true;
    next[key] = converted;
  }
  return changed ? next : value;
}
