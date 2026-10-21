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

## The solution that is now in the code

**Hard constraint: I have NO access to Simply.com**, which hosts `regionbyg.dk`
mail and its DNS. So no SPF/DKIM/DMARC change, no mail-filter change and no
forwarding rule is available. Any fix must work from code, Netlify and Resend
alone. Do not propose DNS edits.

**Why the mail goes missing.** The booking is sent *from* `booking@regionbyg.dk`
*to* `kontakt@regionbyg.dk` — the same domain, but from Resend's servers rather
than the domain's own mail host. The host therefore sees inbound mail claiming
to be from itself, sent by a server it doesn't recognise, which is what spoofing
looks like, so it quietly quarantines or discards it. Nothing bounces, so Resend
still reports "Delivered". Fixing that properly needs the DNS access we don't
have.

**What the code does instead.** Every booking is now sent as TWO independent
emails: one to `kontakt@regionbyg.dk`, and one to a backup inbox on a different
provider (`officialfarhat2k@gmail.com` by default). Independent sends, so one
being filtered or refused cannot affect the other. A booking therefore always
reaches someone, whatever the mail host does with the regionbyg.dk copy. This
needs no DNS and no Simply.com access, which is exactly why it was chosen.

The backup list is the Netlify variable `RB_NOTIFY_ALSO`: comma-separated
addresses, or `none` to switch the backup off once `kontakt@regionbyg.dk` is
proven reliable. It can only ADD recipients — it cannot replace or remove
`kontakt@regionbyg.dk`, which stays hard-coded precisely because an overriding
variable caused the original bug.

**This is a workaround, not a cure.** The regionbyg.dk copy may still be
filtered; the point is that a booking is no longer lost when it is. The real
cure needs one of these, all of which need access I don't have:

- Whoever controls `regionbyg.dk` DNS (the Simply.com account holder, likely the
  person who set up the domain or verified it in Resend) adds Resend's DKIM/SPF
  records and a DMARC record, and ideally moves sending to a subdomain such as
  `send.regionbyg.dk` so the From domain stops matching the recipient's domain.
  Then set `RB_FROM` to `Region Byg <booking@send.regionbyg.dk>` in Netlify — a
  variable change, no code change.
- Or the mailbox owner adds a Simply.com filter rule allowlisting mail from
  Resend, or forwards `kontakt@regionbyg.dk` to an inbox elsewhere.

Note: the domain IS already verified in Resend, because customer confirmations
send successfully from `booking@regionbyg.dk`. So some DNS records exist
already. Ask me who set that up — that person can finish the job above.

### How to tell the fix is working

After the Netlify upload, one test booking should put the enquiry in the backup
inbox every single time. That is the part that must never fail again. Whether
the `kontakt@regionbyg.dk` copy also lands tells us if the filtering is still
happening. The function's JSON response reports `sentTo`, `failedTo`, `from`
and `sandbox`, so a direct POST to `https://<my-netlify-site>/api/notify`
answers it without the Resend dashboard.

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
     I'll paste it or screenshot it. Remember I cannot change DNS, so use it
     only to understand what is happening, not to hand me DNS steps.
     - **Delayed, or nothing listed at all** → neither case above: the function
       isn't reaching Resend. Have me POST a test booking directly to
       `https://<my-netlify-site>/api/notify` and read back the `sentTo`,
       `from` and `sandbox` fields the function now returns.
   - I am not a developer. Give me click-by-click steps for the Resend,
     Netlify and Simply.com panels, and don't assume I know what SPF or DKIM
     mean.
3. If the backup inbox is receiving bookings reliably, that is the problem
   solved for day-to-day use. Say so plainly rather than leaving it open.
4. Optional, and worth suggesting: connect the Netlify site to the GitHub repo
   (Site configuration → Build & deploy, publish directory `deploy`) so future
   fixes deploy on push instead of by drag-and-drop. That needs the branch
   merged into `main`, so ask me before merging.

## Facts you'll need

- Resend account owner / sandbox-only recipient: `officialfarhat2k@gmail.com`
- Company address every booking must reach: `kontakt@regionbyg.dk`
- Netlify variables that still matter: `RESEND_API_KEY` (required), `RB_FROM`
- Obsolete and ignored: `RB_NOTIFY_EMAIL`
- Backup inbox list: `RB_NOTIFY_ALSO` (comma separated, or `none` to disable)
- Mail host and DNS for regionbyg.dk: Simply.com, which I CANNOT access
- Any code fix must exist inside `deploy/` before the Netlify upload, and both
  copies of `notify.js` and `api.js` must be kept identical.
