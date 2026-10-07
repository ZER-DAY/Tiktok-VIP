import { z } from "zod";

export const resultSchema = z.object({
  status: z.enum([
    "eligible",
    "ineligible",
    "unknown",
    "verification_required",
    "login_required",
    "unavailable",
  ]),
  reason: z.enum([
    "available",
    "not_found",
    "unsupported_region",
    "ineligible",
    "no_live_access",
    "agency_restricted",
    "unknown",
    "verification_required",
    "login_required",
    "unavailable",
  ]),
  checkedAt: z.string().datetime(),
});
export type EligibilityResult = z.infer<typeof resultSchema>;
export function unavailable(
  status: "verification_required" | "login_required" | "unavailable" = "unavailable"
): EligibilityResult {
  return { status, reason: status, checkedAt: new Date().toISOString() };
}

const responseSchema = z.object({
  status_code: z.number().optional(),
  BaseResp: z.object({ StatusCode: z.number() }).optional(),
  data: z
    .object({
      IsBanned: z.boolean().optional(),
      DontHaveInviteBenefit: z.boolean().optional(),
      AnchorList: z.array(
        z.object({
          AnchorStatus: z.number(),
          BKSpecialInviteStatus: z.number().optional(),
          CanUseInvitationType: z.array(z.number()).optional(),
          UserBaseInfo: z.object({ DisplayID: z.string(), NoPermission: z.boolean().optional() }),
        })
      ),
    })
    .optional(),
});

// Status values were verified against the current Backstage invitation UI.
// Unknown/malformed responses must never be treated as a positive eligibility check.
export function parseEligibility(input: unknown, username: string): EligibilityResult {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return unavailable();
  const value = parsed.data;
  const code = value.BaseResp?.StatusCode ?? value.status_code;
  if (code === 4030004) return unavailable("verification_required");
  if (code !== 0 || !value.data) return unavailable();
  const checkedAt = new Date().toISOString();
  if (value.data.IsBanned || value.data.DontHaveInviteBenefit) {
    return { status: "unknown", reason: "agency_restricted", checkedAt };
  }
  const anchor = value.data.AnchorList.find(
    (a) => a.UserBaseInfo.DisplayID.toLowerCase() === username.toLowerCase()
  );
  if (!anchor || anchor.UserBaseInfo.NoPermission)
    return { status: "unknown", reason: "unknown", checkedAt };
  const codeValue = anchor.BKSpecialInviteStatus === 0 ? 0 : anchor.AnchorStatus;
  if (codeValue === 0) {
    return anchor.CanUseInvitationType?.length
      ? { status: "eligible", reason: "available", checkedAt }
      : { status: "unknown", reason: "unknown", checkedAt };
  }
  const reasons = {
    1: "not_found",
    2: "unsupported_region",
    3: "ineligible",
    4: "no_live_access",
  } as const;
  const reason = reasons[codeValue as keyof typeof reasons];
  return reason
    ? { status: "ineligible", reason, checkedAt }
    : { status: "unknown", reason: "unknown", checkedAt };
}
