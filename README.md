# Region Byg & Rådgivning, website

Premium, dark-themed marketing site for a Danish construction & consulting
firm. Plain HTML/CSS/JS (no build step); open `index.html` or serve the
folder statically. Bilingual: **Danish default**, English toggle.

## Run locally
Any static server works, e.g.:
```
npx http-server . -p 4321
```
Then open http://localhost:4321

## Structure (page per section)
```
index.html            Home: hero · pillars · client-type chooser · custom teaser · about · contact
services.html         Services hub, visitor self-identifies: Private or Commercial
private.html          The 7 PRIVATE services (grid)
commercial.html       The 7 COMMERCIAL services (grid)
custom.html           Custom Services
about.html            About us, full flyer content (welcome, values, categories), construction photo hero
offer.html            "Get an Offer", 6-step wizard, service + client type auto-populated from URL
consultation.html     "Book a Consultation", single-step form
assets/
  css/styles.css      Design system (tokens, components, responsive, animations)
  js/
    i18n.js           All UI copy (DA/EN) + service catalog + language engine
    api.js            Submission service layer, the back-end boundary
    main.js           Shared header/footer (Services dropdown), nav, reveal, dynamic cards, icons
    offer.js          Multi-step wizard logic + validation
    consultation.js   Consultation form logic
  img/                Brand assets (logo source, banner, flyer)
```

**Shared chrome:** the header (with a *Services ▾* dropdown → Private / Commercial),
mobile menu, and footer are rendered once from `main.js` into `<div id="rb-header">`
and `<div id="rb-footer">` placeholders, so every page stays in sync. Edit nav/footer
in one place (`headerHTML()` / `footerHTML()` in `main.js`).

**Client identification:** Services → Private/Commercial are separate pages. Each
service card links to `offer.html?service=<slug>&type=<private|commercial>`, so the
chosen **client type** is captured in the submission (`data.service.group`), so you know
up front whether each lead is a private or commercial client.

## Where the back-end plugs in  (assets/js/api.js)
Every form submits through one function, `RB_API.submit(type, payload)`,
so going live touches **only this file**:

1. **HOOK #1, client signal:** `rb:submission` CustomEvent is dispatched on
   every submit (analytics / fire-and-forget webhook).
2. **HOOK #2, live transport:** set `RB_API.config.mode = "live"` and
   `config.endpoint = "<your URL>"`. The form is POSTed as `multipart/form-data`
   (JSON under `payload`, uploads as `file_0...n`).
3. **HOOK #3, server endpoint (you build this):**
   - **3a Google Sheets:** append a row (Apps Script Web App, or Sheets API
     `spreadsheets.values.append`). The `data` object maps 1:1 to columns.
   - **3b Notifications:** email to Kontakt@regionbyg.dk (Resend / SendGrid /
     Nodemailer) and/or SMS / Slack / push.
   - respond `200 { ok: true, id }`.

Until then the site runs in **mock mode**: submissions are validated, saved to
`localStorage` (`rb-submissions`) so nothing is lost, and the success screen
shows a reference ID. No markup changes are needed to switch to live.

## Notes
- Logo is an inline SVG (brick mark + wordmark) so it recolors per theme and
  stays crisp at any size.
- **Light/dark theme:** toggle in the header (sun/moon). Default is dark; the
  choice is saved (`rb-theme`) and applied pre-paint via a tiny `<head>` script
  to avoid a flash. Light values live in the `[data-theme="light"]` block in
  `styles.css`.
- **Section photos:** brand photos (cropped from banner/flyer into `assets/img`)
  are used as full-section backgrounds via `.section--photo` (img + overlay),
  distributed across hero, services, custom, about, contact, and the service pages.
- Contact details: **Kontakt@regionbyg.dk** · **+45 30 60 26 60**.
- `prefers-reduced-motion` is respected; all animations degrade gracefully.
