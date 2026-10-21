/* ============================================================
   main.js, shared site behaviour
   nav · scroll reveal · sticky header · language toggle ·
   service tabs + dynamic cards · mobile menu · toast
   ============================================================ */

/* ---- Icon set (stroke icons share style; brand pillars use fill) ---- */
const RB_ICONS = {
  arrow:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  mail:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  phone:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
  pin:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  upload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
  // service / pillar icons
  home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>',
  reno:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 7 3 3"/><path d="M5 6v4M3 8h4"/><path d="M5 19v-2M4 18h2"/><path d="M14.5 5.5 18 2l4 4-3.5 3.5L21 12l-9 9-7-2-2-7 9-9Z"/></svg>',
  expand:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l7-5 7 5v13"/><path d="M3 21h18"/><path d="M17 12h4v9"/><path d="M8 21v-5h4v5"/></svg>',
  advice:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/></svg>',
  permit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>',
  pm:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M3 21a6 6 0 0 1 12 0"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21a6 6 0 0 0-5-5.91"/></svg>',
  repair:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2Z"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>',
  turnkey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 9-9 2 2-3 3 2 2-2 2-2-2-1.5 1.5"/></svg>',
  spark:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
  shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  sun:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>'
};

function injectIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => {
    const name = el.dataset.icon;
    if (RB_ICONS[name] && !el.dataset.iconDone) {
      el.innerHTML = RB_ICONS[name];
      el.dataset.iconDone = "1";
    }
  });
}

/* ============================================================
   Theme (light / dark). Default dark; choice persisted.
   An inline <head> snippet sets the attribute pre-paint to avoid
   a flash; this module handles the toggle button.
   ============================================================ */
const RB_THEME = (() => {
  const KEY = "rb-theme";
  const current = () => document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  function set(t) {
    if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem(KEY, t); } catch (e) {}
    document.querySelectorAll("[data-theme-toggle]").forEach(b =>
      b.setAttribute("aria-pressed", String(t === "light")));
  }
  function toggle() { set(current() === "light" ? "dark" : "light"); }
  function init() {
    let s; try { s = localStorage.getItem(KEY); } catch (e) {}
    if (s) set(s); else set(current());
  }
  return { set, current, toggle, init };
})();

function initThemeToggle() {
  document.querySelectorAll("[data-theme-toggle]").forEach(btn =>
    btn.addEventListener("click", () => RB_THEME.toggle()));
}

/* ============================================================
   Shared chrome, header (with Services dropdown), mobile menu,
   footer. Rendered into placeholders so all pages stay in sync:
     <div id="rb-header"></div> ... <div id="rb-footer"></div>
   ============================================================ */
// Brick mark, 5 rows, matching the real logo (black bricks inverted to
// warm-white for the dark theme, as on the brand's own dark banner).
const RB_BRAND_MARK = `
  <svg class="brand__mark" viewBox="0 0 96 100" fill="none" aria-hidden="true">
    <rect x="0"  y="0"  width="96" height="16" rx="2" fill="var(--accent)"/>
    <rect x="0"  y="21" width="57" height="16" rx="2" fill="var(--brick-contrast)"/>
    <rect x="61" y="21" width="35" height="16" rx="2" fill="var(--accent)"/>
    <rect x="0"  y="42" width="96" height="16" rx="2" fill="var(--accent)"/>
    <rect x="0"  y="63" width="29" height="16" rx="2" fill="var(--accent)"/>
    <rect x="33" y="63" width="63" height="16" rx="2" fill="var(--brick-contrast)"/>
    <rect x="0"  y="84" width="96" height="16" rx="2" fill="var(--accent)"/>
  </svg>`;
const RB_BRAND = `
  <a class="brand" href="index.html">
    ${RB_BRAND_MARK}<span class="brand__word"><span>Region</span> <span>Byg &amp;</span> <span>Rådgivning <em>ApS</em></span></span>
  </a>`;

function headerHTML() {
  return `
  <a class="skip-link" href="#main-content" data-i18n="nav.skip"></a>
  <header class="header">
    <div class="container header__inner">
      ${RB_BRAND}
      <nav class="nav" data-i18n-attr="aria-label:nav.aria_main" aria-label="Primær">
        <div class="nav__links">
          <a href="index.html" data-nav="index.html" data-i18n="nav.home"></a>
          <div class="nav__item nav__item--menu">
            <a href="services.html" class="nav__top" data-nav="services.html|private.html|commercial.html" data-i18n="nav.services"></a>
            <span class="nav__caret" aria-hidden="true">▾</span>
            <div class="nav__menu">
              <a href="private.html" data-i18n="nav.private"></a>
              <a href="commercial.html" data-i18n="nav.commercial"></a>
            </div>
          </div>
          <a href="custom.html" data-nav="custom.html" data-i18n="nav.custom"></a>
          <a href="about.html" data-nav="about.html" data-i18n="nav.about"></a>
          <a href="index.html#contact" data-i18n="nav.contact"></a>
        </div>
        <div class="nav__actions">
          <div class="lang-toggle" role="group" aria-label="Sprog / Language">
            <button data-lang-btn="da" type="button">DA</button>
            <button data-lang-btn="en" type="button">EN</button>
          </div>
          <button class="theme-toggle" type="button" data-i18n-attr="aria-label:nav.aria_theme" aria-label="Skift lyst/mørkt tema" data-theme-toggle>
            <span class="icon-sun" data-icon="sun"></span>
            <span class="icon-moon" data-icon="moon"></span>
          </button>
          <a class="btn btn--primary" href="offer.html" data-i18n="nav.offer"></a>
          <button class="nav__burger" aria-label="Menu" aria-expanded="false" type="button">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
    </div>
  </header>
  <div class="mobile-menu" id="mobileMenu">
    <a href="index.html" data-i18n="nav.home"></a>
    <a href="private.html" data-i18n="nav.private"></a>
    <a href="commercial.html" data-i18n="nav.commercial"></a>
    <a href="custom.html" data-i18n="nav.custom"></a>
    <a href="about.html" data-i18n="nav.about"></a>
    <a href="index.html#contact" data-i18n="nav.contact"></a>
    <a class="btn btn--primary btn--lg" href="offer.html" data-i18n="nav.offer"></a>
    <a class="btn btn--ghost btn--lg" href="consultation.html" data-i18n="nav.consultation"></a>
  </div>`;
}

function footerHTML() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          ${RB_BRAND}
          <p data-i18n="footer.tagline"></p>
        </div>
        <div class="footer__col">
          <p class="footer__title" data-i18n="footer.col_nav"></p>
          <a href="index.html" data-i18n="nav.home"></a>
          <a href="custom.html" data-i18n="nav.custom"></a>
          <a href="about.html" data-i18n="nav.about"></a>
          <a href="index.html#contact" data-i18n="nav.contact"></a>
          <a href="privatlivspolitik.html" data-i18n="nav.privacy"></a>
          <a href="vilkaar.html" data-i18n="nav.terms"></a>
        </div>
        <div class="footer__col">
          <p class="footer__title" data-i18n="footer.col_services"></p>
          <a href="private.html" data-i18n="nav.private"></a>
          <a href="commercial.html" data-i18n="nav.commercial"></a>
          <a href="offer.html" data-i18n="nav.offer"></a>
          <a href="consultation.html" data-i18n="nav.consultation"></a>
        </div>
        <div class="footer__col">
          <p class="footer__title" data-i18n="footer.col_contact"></p>
          <a href="mailto:Kontakt@regionbyg.dk">Kontakt@regionbyg.dk</a>
          <a href="tel:+4530602660">+45 30 60 26 60</a>
          <span class="footer__cvr" data-i18n="contact.cvr"></span>
        </div>
      </div>
      <div class="footer__bottom">
        <span>Region Byg &amp; Rådgivning ApS</span>
        <span data-i18n="footer.built"></span>
      </div>
    </div>
  </footer>`;
}

/* Confirmation contact card, shown on every success screen so the
   user always has the reference + how to reach back. One source of
   truth for the contact details (email / phone / hours). */
function confirmContactHTML() {
  return `
  <div class="confirm-contact">
    <h4 data-i18n="confirm.reach_title"></h4>
    <p data-i18n="confirm.reach_body"></p>
    <div class="confirm-contact__items">
      <a class="confirm-row" href="mailto:Kontakt@regionbyg.dk">
        <span data-icon="mail"></span>
        <span><small data-i18n="contact.email_l"></small><b>Kontakt@regionbyg.dk</b></span>
      </a>
      <a class="confirm-row" href="tel:+4530602660">
        <span data-icon="phone"></span>
        <span><small data-i18n="contact.phone_l"></small><b>+45 30 60 26 60</b></span>
      </a>
      <div class="confirm-row">
        <span data-icon="clock"></span>
        <span><small data-i18n="contact.hours_l"></small><b data-i18n="contact.hours_v"></b></span>
      </div>
    </div>
  </div>`;
}
function renderConfirmContacts() {
  document.querySelectorAll("[data-confirm-contact]").forEach(el => { el.innerHTML = confirmContactHTML(); });
}

function renderChrome() {
  const h = document.getElementById("rb-header");
  if (h) h.innerHTML = headerHTML();
  const f = document.getElementById("rb-footer");
  if (f) f.innerHTML = footerHTML();
  renderConfirmContacts();

  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";
  const skip = document.querySelector(".skip-link");
  if (skip && main) skip.setAttribute("href", "#" + main.id);

  // Mark the active top-level nav item
  const page = (location.pathname.split("/").pop() || "index.html") || "index.html";
  document.querySelectorAll(".nav__links [data-nav]").forEach(a => {
    const matches = a.dataset.nav.split("|");
    if (matches.includes(page)) a.classList.add("is-active");
  });
}

/* ---- Sticky header ---- */
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  requestAnimationFrame(onScroll);
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---- Mobile menu ---- */
function initMobileMenu() {
  const burger = document.querySelector(".nav__burger");
  const menu = document.querySelector(".mobile-menu");
  if (!burger || !menu) return;
  const toggle = (open) => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => toggle(!menu.classList.contains("is-open")));
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => toggle(false)));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { toggle(false); burger.focus(); }
  });
}

/* ---- Language toggle wiring ---- */
function initLangToggle() {
  document.querySelectorAll("[data-lang-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      RB_I18N.set(btn.dataset.langBtn);
      showToast(RB_I18N.get("toast.lang"), "checkCircle");
    });
  });
}

/* ---- Scroll reveal ---- */
function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  els.forEach(e => io.observe(e));
}

/* ---- Service tabs + dynamic cards ---- */
function renderServices() {
  const lang = RB_I18N.lang();
  ["private", "commercial"].forEach(group => {
    const grid = document.querySelector(`[data-service-grid="${group}"]`);
    if (!grid || typeof RB_SERVICES === "undefined") return;
    grid.innerHTML = RB_SERVICES[group].map((s, i) => `
      <article class="card" data-reveal data-delay="${(i % 3) + 1}">
        <span class="card__icon" data-icon="${s.icon}"></span>
        <h3 aria-level="2">${s[lang]}</h3>
        <p>${s[lang + "_d"]}</p>
        <a class="card__link" href="offer.html?service=${s.slug}&type=${group}">
          <span>${RB_I18N.get("services.request")}</span>
          <span data-icon="arrow"></span>
        </a>
      </article>`).join("");
  });
  injectIcons();
  initReveal();
}

function initServiceTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll("[data-panel]").forEach(p =>
        p.classList.toggle("is-active", p.dataset.panel === target));
    });
  });
}

/* ---- Smooth scroll for in-page anchors (and close menu) ---- */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  });
}

/* ---- Toast ---- */
let toastTimer;
function showToast(msg, icon = "checkCircle") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span data-icon="${icon}"></span><span></span>`;
  toast.querySelector("span:last-child").textContent = msg;
  injectIcons(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}
window.RB_toast = showToast;

/* ---- Footer year ---- */
function initYear() {
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
}

/* ---- Logo marquee: fill one set to the viewport width, then clone it once
        so translateX(-50%) loops seamlessly (never empty). Rebuilds on resize.

        Repeat count is computed mathematically from a single measured
        "unit width", never by re-measuring scrollWidth right after
        appending fresh duplicate <img> elements in a loop, freshly
        inserted images can report a stale/too-small width for a tick,
        which was silently cutting the loop short (most visible on page
        load, before the browser had "settled").

        Guards against transient 0/near-0 container widths (e.g. a resize
        event firing mid-layout on some phones) overwriting a good build
        with a too-narrow one. ---- */
function initMarquee() {
  document.querySelectorAll("[data-marquee]").forEach(mq => {
    const track = mq.querySelector(".marquee__track");
    const set = track && track.querySelector(".marquee__set");
    if (!set) return;
    if (!set.dataset.base) set.dataset.base = set.innerHTML;

    let built = false;
    let repeatCount = 1;   // matches the untouched, already-rendered initial markup
    const build = () => {
      const mqWidth = mq.offsetWidth;
      if (built && mqWidth < 40) return;   // bogus/transient width, keep the last good build
      const need = (mqWidth || window.innerWidth) + 100;
      const unitWidth = (set.scrollWidth / repeatCount) || 1;
      repeatCount = Math.max(1, Math.min(12, Math.ceil(need / unitWidth)));
      set.innerHTML = set.dataset.base.repeat(repeatCount);
      track.querySelectorAll(".marquee__set--clone").forEach(c => c.remove());
      const clone = set.cloneNode(true);
      clone.classList.add("marquee__set--clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
      track.style.setProperty("--rb-marquee-dur", Math.max(16, Math.round((unitWidth * repeatCount) / 55)) + "s");
      built = true;
    };

    const imgs = [...set.querySelectorAll("img")];
    let pending = imgs.filter(i => !i.complete).length;
    if (pending === 0) build();
    else imgs.forEach(i => i.addEventListener("load", () => { if (--pending <= 0) build(); }, { once: true }));

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 250); });
  });
}

/* ---- Boot ---- */
document.addEventListener("DOMContentLoaded", () => {
  renderChrome();          // inject shared header/footer first…
  RB_THEME.init();         // apply saved theme + sync toggle state
  RB_I18N.init();          // …then translate everything (incl. chrome)
  injectIcons();
  initThemeToggle();
  initHeader();
  initMobileMenu();
  initLangToggle();
  initServiceTabs();
  renderServices();
  initReveal();
  initSmoothAnchors();
  initYear();
  initMarquee();
});

// Re-render dynamic, language-dependent content when language changes
document.addEventListener("rb:langchange", () => {
  renderServices();
});
