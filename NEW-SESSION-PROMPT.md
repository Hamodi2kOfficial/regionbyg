# Prompt for a new session

Copy everything below the line into a fresh Claude session.

---

Repo: `Hamodi2kOfficial/regionbyg` — static Netlify site for Region Byg & Rådgivning.
Work on branch `claude/amazing-wright-htk752`. It is pushed and up to date on GitHub.

## The problem

The site has two forms (consultation booking + offer request). They POST to a
Netlify Function at `/api/notify` (`netlify/functions/notify.js`, duplicated at
`deploy/netlify/functions/notify.js` — the `deploy/` folder is what gets dragged
onto Netlify). The function calls Resend and sends two emails per booking:
the **company copy** with the booking details, and the **customer confirmation**.

The customer confirmation always worked. The company copy never arrived at
`kontakt@regionbyg.dk`.

## What a previous session already did (all committed and pushed)

Three commits on `claude/amazing-wright-htk752`:

- `ed4cd56` Send booking notifications to kontakt@regionbyg.dk, not a Gmail override
- `c94f6b8` Add handoff notes for the booking-email fix, ignore the deploy zip
- `449a905` Guarantee every booking is sent to kontakt@regionbyg.dk

**Root cause found:** a Netlify environment variable `RB_NOTIFY_EMAIL` was set
to `officialfarhat2k@gmail.com`, and the function read it as the business
recipient. Every booking notification went to that Gmail inbox instead of the
company address. The customer confirmation was unaffected because it uses the
address from the form.

**Changes made to `notify.js` (both copies):**

1. `COMPANY_EMAIL = "kontakt@regionbyg.dk"` is hard-coded and is the first,
   unconditional recipient of every submission. `RB_NOTIFY_EMAIL` is no longer
   read at all, so the stale Netlify variable cannot redirect anything.
2. Default `RB_FROM` changed from Resend's sandbox sender `onboarding@resend.dev`
   to `Region Byg <booking@regionbyg.dk>`, so a missing variable no longer
   silently drops the site into Resend sandbox mode.
3. If Resend rejects the attachments, the booking is resent to the same address
   without the files, listing them by name, so the enquiry still arrives.
4. If the company address itself is refused, the booking is retried to
   `officialfarhat2k@gmail.com` with `[could not reach kontakt@regionbyg.dk]`
   in the subject — so a booking is never lost silently and the
   misconfiguration is visible.
5. A booking that only got through on that fallback returns HTTP 200 with a
   `warning` field, so the customer still sees a confirmation. Only a booking
   that reached nobody returns 502.
6. The sandbox customer preview goes to the Resend account owner, the only
   recipient an unverified sender may reach.
7. The response now echoes `sentTo`, `from`, `sandbox` (and `businessFallback`),
   so one test booking reveals the delivery path without the Resend dashboard.

**Change made to `assets/js/api.js` (both copies):** it used to fall back to
silent "mock mode" whenever `/api/notify` returned 404/405, which on the live
site meant the form showed the customer a success message while sending no
email at all. Mock mode is now limited to localhost; on the live site a missing
function raises a real error.

**Verified** against a stubbed Resend API in six configurations: verified
sender with the stale Gmail variable still set, `RB_FROM` unset, sandbox sender,
rejected attachment, company address refused outright, and Resend fully down.
`kontakt@regionbyg.dk` was the first delivery attempt in all six.

## What is NOT done

- **The fix is not live.** The site is deployed by dragging the `deploy` folder
  onto Netlify, and that upload has not happened. The live site may still be
  running the old code.
- **End-to-end delivery is unconfirmed.** Nobody has yet seen a real booking
  land in `kontakt@regionbyg.dk`.
- **A second possible cause was never ruled out:** the mail may be sent
  correctly by Resend but filtered by Simply.com, which hosts `regionbyg.dk`
  mail. Sending *from* `booking@regionbyg.dk` *to* `kontakt@regionbyg.dk` via a
  third-party service trips that up when SPF/DKIM/DMARC aren't right. This is
  not a code problem and nothing above fixes it. The previous sessions could
  not check the Resend dashboard (no browser access, and a login attempt
  burned an entire session's usage limit).

## The solution, if the test booking still does not arrive

If the mail is missing, the cause is no longer the code. There are only two
possibilities and the Resend status tells you which:

**A. Resend says Bounced** — the recipient server rejected it. The bounce text
names the reason; fix that and nothing below is needed.

**B. Resend says Delivered, but it is not in the inbox or the spam folder** —
this is the likely one. The mail is sent *from* `booking@regionbyg.dk` *to*
`kontakt@regionbyg.dk`. Both are the same domain, but the mail comes from
Resend's servers, not Simply.com's. Simply.com therefore sees inbound mail
claiming to be from its own domain, sent by a server it does not recognise,
which is exactly what spoofed mail looks like — so it is silently quarantined
or discarded. Authentication is the usual culprit for spam placement.

### Fix B, in order. Stop as soon as a test booking arrives.

**Step 1 — publish the authentication records Resend asks for.**
In Resend → Domains → `regionbyg.dk`, Resend lists the exact DNS records it
needs. The DKIM value is unique per domain, so it must be copied from there,
not guessed. Add them in Simply.com → DNS Administration. Expect roughly:
a DKIM `TXT` at host `resend._domainkey`, an SPF `TXT` and an `MX` on the
sending host. Two pitfalls that break this:

- **Never create a second SPF record on the same host.** Simply.com already has
  one for its own mail. Two SPF records cause an immediate PermError and break
  authentication altogether. If a record exists on that host, merge Resend's
  `include:` into the existing one instead of adding another.
- **Simply.com appends the domain to the Host field.** Enter `resend._domainkey`,
  not `resend._domainkey.regionbyg.dk`, or you create
  `resend._domainkey.regionbyg.dk.regionbyg.dk` and verification never passes.

Then add DMARC if it is absent: `TXT` at host `_dmarc`, value
`v=DMARC1; p=none; rua=mailto:kontakt@regionbyg.dk`. Resend does not set this
up automatically but strongly recommends it. Wait for Resend to show the domain
as Verified, then send another test booking.

**Step 2 — if it still does not arrive, move the sender to a subdomain.**
This is the robust fix and is Resend's own recommended setup. Verify
`send.regionbyg.dk` as a separate domain in Resend and send from
`booking@send.regionbyg.dk`. It solves the problem three ways at once: the From
domain is no longer identical to the receiving domain, so the self-spoofing
heuristic stops firing; the subdomain gets its own SPF record, so Simply.com's
root SPF is never touched and cannot PermError; and the subdomain's sending
reputation is kept separate from the company's normal mail.

To apply it, set the Netlify variable `RB_FROM` to
`Region Byg <booking@send.regionbyg.dk>`. No code change is needed — the
function reads that variable. If this becomes permanent, also update the
default value in both copies of `notify.js` so a missing variable doesn't fall
back to the root domain, and commit that.

Replies still work: the function already sets `reply_to` to the customer's own
address, so hitting Reply on a booking goes to the customer, not the subdomain.

**Step 3 — only if 1 and 2 both fail.** Ask Simply.com support to check their
inbound mail log for a message from Resend to `kontakt@regionbyg.dk` at the
timestamp of the test, and whether a filter quarantined it. Resend showing
Delivered means their server accepted it, so they can see what happened to it
afterwards. As a stopgap while that is open, add a second business recipient
that is not on `regionbyg.dk` so bookings are never invisible — or set
forwarding from `kontakt@regionbyg.dk` to a Gmail address in Simply.com.

### How to tell it worked

Send a test booking and confirm all three: it arrives in the
`kontakt@regionbyg.dk` inbox, not the spam folder; Resend shows Delivered; and
the Gmail inbox gets nothing. Then delete the obsolete `RB_NOTIFY_EMAIL`
variable from Netlify, since nothing reads it any more.

## What I need from you

1. Do not try to log into Resend or Netlify yourself. You almost certainly
   cannot, and the last attempt wasted a whole session. Ask me to read values
   out of those dashboards instead.
2. I have now deployed (or am about to) and sent a test booking. Ask me whether
   it arrived at `kontakt@regionbyg.dk`, spam folder included.
   - **If it arrived** → confirm we're done, then help me delete the obsolete
     `RB_NOTIFY_EMAIL` variable from Netlify, since nothing reads it any more.
   - **If it did not arrive** → ask me for the status of the newest email to
     `kontakt@regionbyg.dk` at resend.com/emails: Delivered, Bounced or Delayed.
     I'll paste it or screenshot it. Then work the matching case in
     "The solution" above and walk me through it one step at a time, waiting
     for me to confirm each DNS change before moving on.
     - **Delayed, or nothing listed at all** → neither case above: the function
       isn't reaching Resend. Have me POST a test booking directly to
       `https://<my-netlify-site>/api/notify` and read back the `sentTo`,
       `from` and `sandbox` fields the function now returns.
   - I am not a developer. Give me click-by-click steps for the Resend,
     Netlify and Simply.com panels, and don't assume I know what SPF or DKIM
     mean.
3. Optional, and worth suggesting: connect the Netlify site to the GitHub repo
   (Site configuration → Build & deploy, publish directory `deploy`) so future
   fixes deploy on push instead of by drag-and-drop. That needs the branch
   merged into `main`, so ask me before merging.

## Facts you'll need

- Resend account owner / sandbox-only recipient: `officialfarhat2k@gmail.com`
- Company address every booking must reach: `kontakt@regionbyg.dk`
- Netlify variables that still matter: `RESEND_API_KEY` (required), `RB_FROM`
- Obsolete and ignored: `RB_NOTIFY_EMAIL`
- Mail host for regionbyg.dk: Simply.com
- Any code fix must exist inside `deploy/` before the Netlify upload, and both
  copies of `notify.js` and `api.js` must be kept identical.
