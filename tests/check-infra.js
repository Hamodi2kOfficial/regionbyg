// Health check of everything the site depends on: DNS records for email, SSL certificate,
// www redirect and every URL in the sitemap. Needs internet. Run: node tests/check-infra.js
const dns = require("dns").promises, tls = require("tls");
const DOMAIN = "regionbyg.dk";
let failures = 0, warnings = 0;
const line = (state, msg, extra) => {
  if (state === "FAIL") failures++; if (state === "WARN") warnings++;
  console.log(state + " " + msg + (extra ? "\n      " + extra : ""));
};
const txt = async (name) => { try { return (await dns.resolveTxt(name)).map(a => a.join("")); } catch (e) { return []; } };
const cname = async (name) => { try { return await dns.resolveCname(name); } catch (e) { return []; } };

(async () => {
  // 1. Email authentication records (Resend). If any vanishes, customer emails start failing.
  const dkim = await txt("resend._domainkey." + DOMAIN);
  line(dkim.some(r => /^p=MIG/.test(r)) ? "PASS" : "FAIL", "DNS: DKIM record for Resend is present", dkim.length ? "" : "resend._domainkey." + DOMAIN + " not found");
  const rsend = await cname("rsend." + DOMAIN), send = await cname("send." + DOMAIN);
  line(rsend.length && send.length ? "PASS" : "FAIL", "DNS: Resend sending records (rsend, send) are present", "rsend=" + rsend + " send=" + send);
  const dmarc = await txt("_dmarc." + DOMAIN);
  line(dmarc.some(r => /^v=DMARC1/.test(r)) ? "PASS" : "WARN", "DNS: DMARC record present", dmarc.join(" "));

  // 2. The company's own mailbox must still be routed to Simply.com, and its SPF must be intact
  let mx = []; try { mx = (await dns.resolveMx(DOMAIN)).map(m => m.exchange); } catch (e) {}
  line(mx.some(m => /simply\.com$/.test(m)) && !mx.some(m => /amazonaws|resend/.test(m)) ? "PASS" : "FAIL", "DNS: company mail (MX) still goes to Simply.com and is not hijacked", mx.join(", "));
  const spf = (await txt(DOMAIN)).filter(r => /^v=spf1/.test(r));
  line(spf.length === 1 ? "PASS" : "FAIL", "DNS: exactly one SPF record (two would break all mail)", spf.join(" | "));

  // 3. Website records and SSL certificate
  let a = []; try { a = await dns.resolve4(DOMAIN); } catch (e) {}
  line(a.length ? "PASS" : "FAIL", "DNS: website address resolves", a.join(", "));
  await new Promise(res => {
    const s = tls.connect(443, DOMAIN, { servername: DOMAIN }, () => {
      const c = s.getPeerCertificate(), days = Math.round((new Date(c.valid_to) - Date.now()) / 864e5);
      line(days > 14 ? "PASS" : days > 0 ? "WARN" : "FAIL", "SSL certificate valid for " + days + " more days", "expires " + c.valid_to);
      s.end(); res();
    });
    s.on("error", e => { line("FAIL", "SSL connection failed", e.message); res(); });
  });

  // 4. www address and http redirect
  for (const u of ["https://www." + DOMAIN + "/", "http://" + DOMAIN + "/"]) {
    try {
      const r = await fetch(u, { redirect: "manual" });
      const loc = r.headers.get("location") || "";
      line(r.status >= 300 && r.status < 400 && loc.includes(DOMAIN) ? "PASS" : (r.ok ? "PASS" : "FAIL"), u + " reaches the site", "status " + r.status + (loc ? " -> " + loc : ""));
    } catch (e) { line("FAIL", u + " unreachable", e.message); }
  }

  // 5. Every URL listed in the sitemap answers 200
  try {
    const sm = await (await fetch("https://" + DOMAIN + "/sitemap.xml")).text();
    const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const bad = [];
    for (const u of urls) { const r = await fetch(u); if (!r.ok) bad.push(u + " (" + r.status + ")"); }
    line(bad.length ? "FAIL" : "PASS", "Sitemap: all " + urls.length + " URLs answer 200", bad.join(", "));
  } catch (e) { line("FAIL", "Sitemap unreadable", e.message); }

  // 6. External links used by the site
  for (const u of ["https://www.datatilsynet.dk"]) {
    try { const r = await fetch(u, { method: "HEAD" }); line(r.ok || r.status === 403 ? "PASS" : "WARN", "External link works: " + u, "status " + r.status); }
    catch (e) { line("WARN", "External link unreachable: " + u, e.message); }
  }

  console.log("\n" + (failures ? failures + " INFRASTRUCTURE CHECK(S) FAILED" : "INFRASTRUCTURE HEALTHY") + (warnings ? " (" + warnings + " warning(s))" : ""));
  process.exit(failures ? 1 : 0);
})();
