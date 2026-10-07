import { describe, expect, it } from "vitest";
import { parseEligibility } from "./result";
function payload(status: number, fields = {}) {
  return {
    status_code: 0,
    data: {
      IsBanned: false,
      DontHaveInviteBenefit: false,
      AnchorList: [{ AnchorStatus: status, UserBaseInfo: { DisplayID: "primelive" }, ...fields }],
    },
  };
}
describe("Backstage eligibility responses", () => {
  it("maps the observed unsupported-region response", () =>
    expect(parseEligibility(payload(2), "primelive")).toMatchObject({
      status: "ineligible",
      reason: "unsupported_region",
    }));
  it.each([
    [1, "not_found"],
    [3, "ineligible"],
    [4, "no_live_access"],
  ])("maps status %s", (status, reason) =>
    expect(parseEligibility(payload(Number(status)), "primelive")).toMatchObject({
      status: "ineligible",
      reason,
    })
  );
  it("requires an allowed invitation type for a positive result", () => {
    expect(parseEligibility(payload(0), "primelive").status).toBe("unknown");
    expect(parseEligibility(payload(0, { CanUseInvitationType: [3] }), "primelive").status).toBe(
      "eligible"
    );
  });
  it("recognizes a special-invitation override only with a permitted type", () =>
    expect(
      parseEligibility(
        payload(3, { BKSpecialInviteStatus: 0, CanUseInvitationType: [4] }),
        "primelive"
      ).status
    ).toBe("eligible"));
  it("does not interpret a verification challenge as ineligibility", () =>
    expect(parseEligibility({ BaseResp: { StatusCode: 4030004 } }, "primelive").status).toBe(
      "verification_required"
    ));
  it.each([null, {}, { status_code: 0 }, { status_code: 123, data: { AnchorList: [] } }])(
    "fails closed on invalid responses",
    (input) => expect(parseEligibility(input, "primelive").status).toBe("unavailable")
  );
  it("does not use another account's result", () =>
    expect(parseEligibility(payload(0, { CanUseInvitationType: [3] }), "someone_else").status).toBe(
      "unknown"
    ));
  it("does not guess future status codes", () =>
    expect(parseEligibility(payload(99), "primelive").status).toBe("unknown"));
  it("reports agency restrictions separately", () => {
    const input = payload(0, { CanUseInvitationType: [3] });
    input.data.IsBanned = true;
    expect(parseEligibility(input, "primelive")).toMatchObject({
      status: "unknown",
      reason: "agency_restricted",
    });
  });
});
