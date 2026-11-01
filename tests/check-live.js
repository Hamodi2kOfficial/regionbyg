// Compares the LIVE website with the deploy/ folder and probes headers and the email function
// (without sending any email). Run: node tests/check-live.js [https://regionbyg.dk]
const fs = require("fs"), path = require("path");
const BASE = (process.argv[2] || "https://regionbyg.dk").replace(/\/$/, "");
const root = path.resolve(__dirname, "..", "deploy");
let failures = 0;
const line = (ok, msg, extra) => { if (!ok) failures++; console.log((ok ? "PASS " : "FAIL ") + msg + (extra ? "\n      " + extra : "")); };

const textOf = (buf) => buf.toString("utf8").replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() + "|" + ((buf.toString("utf8").match(/<title[^>]*>([^<]*)/) || [])[1] || "").trim();

(async () => {
  // 1. every site file served live must be byte-identical to deploy/ (i.e. the latest upload is live)
  const files = [];
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).forEach(e => {
    const rel = path.posix.join(d, e.name);
    if (e.isDirectory()) walk(rel); else files.push(rel);
  });
  walk(".");
  const wanted = files.filter(f => /\.(html|js|css|svg|xml|txt|woff2|jpg|jpeg|png)$/.test(f) && !/^netlify\//.test(f));
  const stale = [], missing = [];
  for (const f of wanted) {
    try {
      const r = await fetch(BASE + "/" + f + "?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) { missing.push(f + " (" + r.status + ")"); continue; }
      const live = Buffer.from(await r.arrayBuffer());
      const local = fs.readFileSync(path.join(root, f));
      // Netlify's "pretty URLs" rewrites links in HTML (offer.html becomes /offer) and reorders
      // attributes, so HTML is compared by its visible text and title instead of exact bytes.
      const same = /\.html$/.test(f) ? textOf(live) === textOf(local) : live.equals(local);
      if (!same) stale.push(f);
    } catch (e) { missing.push(f + " (" + e.message + ")"); }
  }
  line(!missing.length && !stale.length, "Live site matches deploy/ (" + wanted.length + " files compared)",
    [missing.length ? "not reachable: " + missing.slice(0, 6).join(", ") : "", stale.length ? "OLD version live, upload deploy/ again. Differs: " + stale.slice(0, 8).join(", ") : ""].filter(Boolean).join(" | "));

  // 2. security + caching headers
  const h = await fetch(BASE + "/index.html", { cache: "no-store" });
  const need = ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "strict-transport-security"];
  line(need.every(k => h.headers.get(k)), "Security headers are served live", need.filter(k => !h.headers.get(k)).join(", "));
  const js = await fetch(BASE + "/assets/js/api.js", { cache: "no-store" });
  line(/must-revalidate|no-cache|max-age=0/.test(js.headers.get("cache-control") || ""), "Scripts are always re-checked (an upload shows immediately)", "cache-control: " + js.headers.get("cache-control"));

  // 3. unknown address shows the friendly 404 page with a real 404 status
  const nf = await fetch(BASE + "/does-not-exist-" + Date.now(), { cache: "no-store" });
  const nfText = await nf.text();
  line(nf.status === 404 && /Siden findes ikke|404/.test(nfText), "Unknown address gives the 404 page", "status " + nf.status);

  // 4. SEO files
  const rb = await fetch(BASE + "/robots.txt"), sm = await fetch(BASE + "/sitemap.xml");
  line(rb.ok && sm.ok && /<urlset/.test(await sm.text()), "robots.txt and sitemap.xml are served");

  // 5. email function: probes that can never send an email
  const origin = { Origin: BASE, "Content-Type": "application/json" };
  const get = await fetch(BASE + "/api/notify", { method: "GET" });
  line(get.status === 405, "Email function exists (GET refused with 405)", "status " + get.status);
  const bad = await fetch(BASE + "/api/notify", { method: "POST", headers: origin, body: "{nope" });
  const badText = await bad.text();
  line(bad.status === 400 && /Invalid request/.test(badText), "Email function is the new hardened version (bad input refused)", bad.status + " " + badText.slice(0, 60));
  const evil = await fetch(BASE + "/api/notify", { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: "{}" });
  line(evil.status === 403, "Email function refuses other websites", "status " + evil.status);

  console.log("\n" + (failures ? failures + " LIVE CHECK(S) FAILED" : "ALL LIVE CHECKS PASSED"));
  process.exit(failures ? 1 : 0);
})();
