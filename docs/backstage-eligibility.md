# Backstage invitation eligibility

The report's eligibility button queues a read-only check in the agency's dedicated
local browser. It does not send invitations, click Follow, or advance beyond the
first invitation wizard step. Account performance scores are unrelated to this
result. A positive result is provisional and does not guarantee invitation quota.

## Local services

- `src/workers/backstage-browser.ts`: headed Chromium with a dedicated persistent
  profile, configured through `BACKSTAGE_CHROMIUM_EXECUTABLE`, optional
  `BACKSTAGE_PROFILE_DIR` and `BACKSTAGE_BROWSER_PROXY`. CDP listens on loopback
  port 9224 only. Never publish that port or put the profile/cookies in Git.
- `src/workers/backstage-worker.ts`: run on the same host with local `REDIS_URL`,
  using `node --env-file=.env --import tsx src/workers/backstage-worker.ts`.
- Installed user services: `tiktok-backstage-browser.service` and
  `tiktok-backstage-worker.service`. View status with `systemctl --user status`.
  Stop the worker before manually navigating the dedicated browser.
- A logged-in graphical desktop is needed for the browser. Session expiry,
  verification challenges and upstream UI changes require operator attention.
  Verification must be completed manually. No retry or bypass is attempted.

## Request flow

Authenticated users POST a report UUID to `/api/agency/eligibility`. The server
resolves the username from the report, rate limits uncached checks to 30/hour per
user, and queues work. GET on the same route polls a job belonging to that user.
Checks are serialized, separated by at least five seconds, and old jobs expire.
Only confirmed eligible/ineligible results are cached in local Redis for five
minutes. Returned data includes status, reason and check time, never session
cookies, creator private details or a raw Backstage response.

The worker observes the Backstage UI request to
`/creators/live/union_platform_api/agency/union_invite/batch_check_anchor/`.
This is an internal UI endpoint, not a promised public TikTok API. Observed status
mapping: 0 available, 1 not found, 2 unsupported region, 3 ineligible, 4 no LIVE
access. Unknown codes and missing invitation permissions fail closed. Error
4030004 is treated as requiring manual verification, never as ineligibility.

If changing the agency/region of this dedicated session, stop the worker and
clear only `backstage:eligibility:v1:*` cache keys using SCAN before restarting;
results are specific to the linked agency. Keep this profile assigned to one agency.
