# Recovery guide: Region Byg & Rådgivning website

What to do if the laptop is lost, broken or replaced. No passwords or API keys are written here on purpose;
keep those in a password manager.

## 1. Where everything lives

| Thing | Where | Who controls it |
|---|---|---|
| Website code, tests, this guide | GitHub repository `Hamodi2kOfficial/regionbyg` | Developer |
| Live website + booking function | Netlify (drag the `deploy/` folder, or connect to GitHub) | Developer's Netlify account |
| Domain regionbyg.dk, DNS, the company mailbox kontakt@regionbyg.dk | Simply.com | The client |
| Sending booking emails | Resend, domain regionbyg.dk (region Ireland) | Developer's Resend account |
| Secrets (Resend API key) | Netlify, Site configuration, Environment variables | Keep a copy in a password manager |

## 2. Get the project back on a new computer
1. Install Git for Windows and Node.js (version 18 or newer).
2. `git clone https://github.com/Hamodi2kOfficial/regionbyg.git`
3. `cd regionbyg` then `git checkout audit/launch-hardening` (this branch holds the latest work until it is merged into `main`).
4. Verify the copy is complete and healthy: `node tests/run-all.js` (should end with EVERYTHING PASSED).
5. Optional: open the folder in Claude Code. The automatic backup is re-created by section 5.

## 3. Rebuild the live site if Netlify is lost
1. Create a Netlify site and drag the `deploy/` folder onto it (Deploys tab). `deploy/` is an exact copy of the site and contains the booking function.
2. Add the environment variables (Site configuration, Environment variables):
   - `RESEND_API_KEY` (required). Create a new key in Resend, API keys.
   - `RB_FROM` (optional, default `Region Byg <booking@regionbyg.dk>`).
   - `RB_NOTIFY_ALSO` (optional, extra inboxes, off by default).
   - `RB_FALLBACK_EMAIL` (optional, used only while the domain is unverified, off by default).
   - Not needed any more: `RB_NOTIFY_EMAIL` (ignored by the code).
3. Point the domain regionbyg.dk at the new site (Domain management in Netlify, then update DNS at Simply.com).
4. Upload `deploy/` again after setting the variables so the function picks them up.
5. Check: `node tests/check-live.js` and `node tests/check-infra.js`.

## 4. Email: how it works and what must stay true
- Every booking goes to **kontakt@regionbyg.dk** (hard-coded) and the submitter gets a confirmation. Both emails follow the language of the request (Danish by default).
- Sender is `Region Byg hjemmeside <hjemmeside@regionbyg.dk>` for the company copy and `booking@regionbyg.dk` for the customer.
- DNS records at Simply.com that must exist (exact values are shown in Resend, Domains, regionbyg.dk):
  - TXT `resend._domainkey` (DKIM)
  - CNAME `rsend` and CNAME `send` (sending)
  - TXT `_dmarc`
- Do NOT add Resend's MX record, and never add a second SPF record: the client's mailbox would break.
- Check any time with `node tests/check-infra.js`.
- If bookings seem to go missing: Resend, Emails shows every send and whether it was Delivered. If kontakt@ shows Delivered but the client sees nothing, look in the mailbox's spam folder (Simply.com).

## 5. Automatic backup of this project to GitHub
Two independent mechanisms save work to the branch `audit/launch-hardening` (never to `main`) and refuse to commit secrets:
1. A Claude Code hook (`.claude/auto-sync.sh`) after each Claude reply. It is configured in `.claude/settings.local.json`, which is not stored on GitHub.
2. A Windows scheduled task `RegionBygGitHubBackup` every 10 minutes (script `.claude/scheduled-backup.ps1`, log in `%USERPROFILE%\regionbyg-backup.log`). To re-create it on a new computer, run in PowerShell:

```
$ps1 = "<full path to>\.claude\scheduled-backup.ps1"
$a = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ps1`""
$t = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName RegionBygGitHubBackup -Action $a -Trigger $t -Force
```
Remove it with `Unregister-ScheduledTask -TaskName RegionBygGitHubBackup -Confirm:$false`.

## 6. Not stored on GitHub (back these up separately)
- Netlify environment variable values (especially `RESEND_API_KEY`).
- Logins for Netlify, Resend, GitHub and the Simply.com account (client).
- The unrelated files `ourcustomers/Invoice...` and `ourcustomers/Honey Volcano...` are deliberately excluded and are not part of this project.
