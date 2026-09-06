import { describe, expect, it } from "vitest";
import { resolvePlanLimit } from "./analysis-quota";

describe("analysis plan limits", () => {
  it("uses the approved launch limits", () => {
    expect(resolvePlanLimit("free", null)).toBe(1);
    expect(resolvePlanLimit("individual", null)).toBe(100);
    expect(resolvePlanLimit("saver", null)).toBe(200);
    expect(resolvePlanLimit("agency", null)).toBeNull();
  });

  it("honors an explicit limit configured by an administrator", () => {
    expect(resolvePlanLimit("free", 0)).toBe(0);
    expect(resolvePlanLimit("individual", 125)).toBe(125);
    expect(resolvePlanLimit("saver", 250)).toBe(250);
  });
});
