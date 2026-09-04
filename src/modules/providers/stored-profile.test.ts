import { describe, expect, it } from "vitest";
import { getStoredProfileDisplayName } from "./stored-profile";

describe("getStoredProfileDisplayName", () => {
  it("returns a trimmed TikTok display name", () => {
    expect(getStoredProfileDisplayName({ profile: { displayName: "  Creator Name  " } })).toBe(
      "Creator Name"
    );
  });

  it.each([
    null,
    {},
    { profile: null },
    { profile: { displayName: "" } },
    { profile: { displayName: 123 } },
  ])("returns null for an unavailable display name", (rawPayload) => {
    expect(getStoredProfileDisplayName(rawPayload)).toBeNull();
  });
});
