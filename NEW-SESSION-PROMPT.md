# Prompt for the new session

Copy everything below the line into a fresh Claude session.

---

Repo: Hamodi2kOfficial/regionbyg (static Netlify site for Region Byg & Rådgivning).
Branch to work on: `claude/amazing-wright-htk752`.

## Background, read this first

The website has two forms (consultation booking + offer request). They POST to a
Netlify Function at `/api/notify` (`netlify/functions/notify.js`, duplicated at
`deploy/netlify/functions/notify.js` — the `deploy/` folder is what gets dragged
onto Netlify Drop). The function calls the Resend API and sends TWO emails per
booking:

1. the **company copy** to the business, with all booking details
2. the **customer confirmation** to whoever filled in the form

**The bug:** the customer confirmation arrived fine, but the company copy never
reached `kontakt@regionbyg.dk`. Root cause found: a Netlify environment variable
`RB_NOTIFY_EMAIL` was set to `officialfarhat2k@gmail.com` and the function read
it as the business recipient, so every booking notification went to that Gmail
inbox instead of the company address.

**Fix already written and committed locally in the previous session** (commit
"Send booking notifications to kontakt@regionbyg.dk, not a Gmail override"):

- `notify.js` now hard-codes `COMPANY_EMAIL = "kontakt@regionbyg.dk"` and no
  longer reads `RB_NOTIFY_EMAIL` at all, so the stale Netlify variable cannot
  redirect it.
- Default `RB_FROM` changed from Resend's sandbox sender
  `onboarding@resend.dev` to `Region Byg <booking@regionbyg.dk>`, so a missing
  variable no longer silently drops the site into Resend sandbox mode.
- A sandbox fallback remains: if the sender is still `@resend.dev`, mail routes
  to the Resend account owner's address, because Resend refuses any other
  recipient while the domain is unverified.
- The function's JSON response now echoes `sentTo`, `from` and `sandbox`, so one
  test booking shows exactly where the company copy went.
- Setup notes in `assets/js/api.js` updated to match.

It was verified against a stubbed Resend API in three scenarios: live sender
with the stale Gmail variable still set (company copy → `kontakt@regionbyg.dk`),
`RB_FROM` unset, and an explicit sandbox sender. All behaved correctly.

**The previous session could not push** — Claude had no GitHub write access to
the repo (HTTP 403, "Claude doesn't have GitHub access to
Hamodi2kOfficial/regionbyg"). So the commit may not be on GitHub yet.

## What I need you to do

1. Check whether `claude/amazing-wright-htk752` on GitHub already contains the
   fix (look for `COMPANY_EMAIL` / `kontakt@regionbyg.dk` in
   `netlify/functions/notify.js`). If not, re-apply the change described above
   to BOTH `netlify/functions/notify.js` and
   `deploy/netlify/functions/notify.js`, commit, and push to that branch. If the
   push is refused with a 403 again, tell me immediately and give me the file
   contents / a zip instead of retrying.
2. Then help me confirm delivery. I have redeployed and sent a test booking.
   What I still need to rule out is the second possible cause: the mail may be
   **sent correctly by Resend but filtered by Simply.com**, which hosts
   `regionbyg.dk` mail. Sending *from* `booking@regionbyg.dk` *to*
   `kontakt@regionbyg.dk` via a third-party service trips that up when DNS
   isn't right. So:
   - Ask me for the status of the newest email to `kontakt@regionbyg.dk` in the
     Resend dashboard (resend.com/emails): Delivered, Bounced or Delayed. I will
     paste it or send a screenshot. **Do not try to log into Resend yourself —
     that failed last session and wasted the whole limit.**
   - If it says **Delivered** → the code and Resend are fine, the mail is being
     filtered or sorted on the Simply.com side. Walk me through checking the
     SPF, DKIM and DMARC records for `regionbyg.dk` (Resend's required records
     alongside Simply.com's existing SPF entry — there must be exactly ONE SPF
     record containing both), plus Simply.com's spam/quarantine folder.
   - If it says **Bounced** → read me the bounce reason and fix accordingly.
   - If it says **Delayed** or nothing is listed at all → the function isn't
     reaching Resend. Have me POST a test booking straight to
     `https://<my-netlify-site>/api/notify` and read the `sentTo` / `from` /
     `sandbox` fields the function now returns, so we can see which path it took.
3. Also tell me how to delete the obsolete `RB_NOTIFY_EMAIL` variable in
   Netlify, since nothing reads it any more and it's confusing to leave behind.

Useful facts: the Resend account owner's address is `officialfarhat2k@gmail.com`
(the sandbox-only recipient). Netlify variables currently relevant:
`RESEND_API_KEY` (required) and `RB_FROM`. The site is deployed by dragging the
`deploy` folder onto Netlify Drop, so any fix must exist inside `deploy/` before
upload.
