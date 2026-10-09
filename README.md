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
privatlivspolitik.html  Privacy policy (GDPR)
vilkaar.html          Terms and conditions
404.html              Not-found page (Netlify serves it automatically)
robots.txt, sitemap.xml  SEO
netlify.toml          Security headers (CSP etc.), caching, /api/notify route
netlify/functions/notify.js  Sends booking emails via Resend
deploy/               Copy of everything above, this is the folder you drag to Netlify
assets/
  css/styles.css      Design system (tokens, components, responsive, animations)
  js/
    i18n.js           All UI copy (DA/EN) + service catalog + language engine
    api.js            Submission service layer, the back-end boundary
    main.js           Shared header/footer (Services dropdown), nav, reveal, dynamic cards, icons
    offer.js          Multi-step wizard logic + validation
    consultation.js   Consultation form logic
  img/                Brand assets (logo source, banner, flyer, customer logos, favicon)
  fonts/              Self-hosted Inter + Sora (no Google Fonts request)
```

**Shared chrome:** the header (with a *Services ▾* dropdown → Private / Commercial),
mobile menu, and footer are rendered once from `main.js` into `<div id="rb-header">`
and `<div id="rb-footer">` placeholders, so every page stays in sync. Edit nav/footer
in one place (`headerHTML()` / `footerHTML()` in `main.js`).

**Client identification:** Services → Private/Commercial are separate pages. Each
service card links to `offer.html?service=<slug>&type=<private|commercial>`, so the
chosen **client type** is captured in the submission (`data.service.group`), so you know
up front whether each lead is a private or commercial client.

## How the forms send email (assets/js/api.js + netlify/functions/notify.js)
Every form submits through `RB_API.submit(type, payload)`. The browser posts to
`/api/notify` (a Netlify Function), which emails the business and sends the
customer a confirmation through Resend. The Resend key never reaches the browser.

Set these in Netlify, Site settings, Environment variables:

| Variable | Required | Meaning |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key (`re_...`) |
| `RB_NOTIFY_EMAIL` | no | Inbox that receives bookings (default: the owner's address) |
| `RB_FROM` | no | Sender, e.g. `Region Byg <booking@regionbyg.dk>`. Needs the domain verified in Resend. Until set, Resend's sandbox sender is used: bookings reach the business inbox, but customers get no confirmation and the subject shows `[TEST ...]` |

The function only accepts requests from regionbyg.dk, www.regionbyg.dk, its own host and
*.netlify.app addresses, validates and size-limits all input, and only forwards safe
attachment types. Spam bots are caught by a hidden honeypot field in both forms.
On plain localhost the function does not exist, so the site falls back to mock
mode (logs only, nothing is sent).

## Deploying
Drag the `deploy/` folder onto Netlify (Deploys tab). `deploy/` must be a copy of
the project files above, so refresh it after every change.

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
