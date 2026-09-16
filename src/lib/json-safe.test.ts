import { describe, it, expect } from "vitest";
import { toJsonSafe } from "./json-safe";

describe("toJsonSafe", () => {
  it("is what stands between a BIGINT column and a 500", () => {
    // The actual failure: the agency applicants list includes an account
    // snapshot, whose totalLikes is a BIGINT, and NextResponse.json() threw
    // "Do not know how to serialize a BigInt" for the whole response.
    const prismaish = {
      applications: [
        {
          id: "a1",
          fullName: "عبد الرحمن",
          account: { snapshots: [{ followers: 52000, totalLikes: BigInt(1234567) }] },
        },
      ],
      total: 1,
    };

    expect(() => JSON.stringify(prismaish)).toThrow(TypeError);
    expect(() => JSON.stringify(toJsonSafe(prismaish))).not.toThrow();
    expect(JSON.parse(JSON.stringify(toJsonSafe(prismaish)))).toEqual({
      applications: [
        {
          id: "a1",
          fullName: "عبد الرحمن",
          account: { snapshots: [{ followers: 52000, totalLikes: 1234567 }] },
        },
      ],
      total: 1,
    });
  });

  it("keeps a number a number, so clients can do arithmetic on it", () => {
    expect(toJsonSafe({ n: BigInt(42) })).toEqual({ n: 42 });
    expect(typeof (toJsonSafe({ n: BigInt(42) }) as { n: unknown }).n).toBe("number");
  });

  it("falls back to a string rather than silently rounding a huge count", () => {
    const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(10);
    const out = toJsonSafe({ n: tooBig }) as { n: unknown };
    expect(out.n).toBe(tooBig.toString());
    // Number(tooBig) would have lost the exact value.
    expect(out.n).not.toBe(Number(tooBig));
  });

  it("leaves dates alone so they still serialize as ISO strings", () => {
    const date = new Date("2026-09-15T12:00:00.000Z");
    const out = toJsonSafe({ createdAt: date }) as { createdAt: Date };
    expect(out.createdAt).toBe(date);
    expect(JSON.parse(JSON.stringify(out)).createdAt).toBe("2026-09-15T12:00:00.000Z");
  });

  it("walks arrays and nesting, and handles null", () => {
    expect(toJsonSafe([{ a: [{ b: BigInt(1) }] }, null])).toEqual([{ a: [{ b: 1 }] }, null]);
    expect(toJsonSafe(null)).toBeNull();
    expect(toJsonSafe(undefined)).toBeUndefined();
  });

  it("returns the same object when there is nothing to convert", () => {
    // Avoids copying every Prisma result on every request for no reason.
    const input = { a: 1, b: { c: "x" }, d: [1, 2] };
    expect(toJsonSafe(input)).toBe(input);
  });
});
