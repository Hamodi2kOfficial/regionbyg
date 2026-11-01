// Site integrity checks. Run: node tests/check-site.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
let failures = 0;
const check = (name, problems) => {
  const bad = problems.length > 0;
  if (bad) failures++;
  console.log((bad ? "FAIL " : "PASS ") + name);
  problems.slice(0, 12).forEach(p => console.log("      - " + p));
};

const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith(".html"));
const jsFiles = ["assets/js/api.js", "assets/js/consultation.js", "assets/js/i18n.js", "assets/js/main.js", "assets/js/offer.js", "netlify/functions/notify.js"];

// 1. JavaScript syntax (project and deploy copy)
{
  const p = [];
  for (const f of [...jsFiles, ...jsFiles.map(f => "deploy/" + f)]) {
    const r = spawnSync(process.execPath, ["--check", path.join(root, f)], { encoding: "utf8" });
    if (r.status !== 0) p.push(f + ": " + (r.stderr || "").split("\n")[0]);
  }
  check("JavaScript syntax (project + deploy)", p);
}

// 2. Pages: links, assets, ids, one h1, alt text, canonical, no Google requests, unique titles
{
  const p = [], titles = [];
  for (const f of htmlFiles) {
    const h = rd(f);
    const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    ids.filter((x, i) => ids.indexOf(x) !== i).forEach(d => p.push(f + ": duplicate id " + d));
    const expectedH1 = (f === "privatlivspolitik.html" || f === "vilkaar.html") ? 2 : 1;   // DA + EN block
    const h1 = (h.match(/<h1[\s>]/g) || []).length;
    if (h1 !== expectedH1) p.push(f + ": h1 count " + h1);
    for (const m of h.matchAll(/(?:href|src)="([^"#?]+)(?:#[^"]*)?"/g)) {
      const u = m[1];
      if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
      if (!fs.existsSync(path.join(root, u))) p.push(f + ": missing file " + u);
    }
    for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(m[0])) p.push(f + ": image without alt");
    if (f !== "404.html" && !/rel="canonical"/.test(h)) p.push(f + ": no canonical link");
    if (!/<meta name="description"|<meta name="robots"/.test(h)) p.push(f + ": no description");
    if (/googleapis|gstatic/.test(h)) p.push(f + ": still requests Google");
    if (!/<html lang="da"/.test(h)) p.push(f + ": default language is not Danish");
    titles.push((h.match(/<title[^>]*>([^<]*)/) || [])[1]);
  }
  if (new Set(titles).size !== titles.length) p.push("two pages share the same title");
  check("Pages (" + htmlFiles.length + "): links, assets, h1, alt, canonical, titles, Danish default", p);
}

// 3. Translations: Danish and English have identical keys; every key used on a page exists
{
  const p = [];
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(rd("assets/js/i18n.js").replace(/^const /gm, "var ").split("/* ---- i18n engine ---- */")[0], ctx);
  const T = ctx.RB_TRANSLATIONS, da = new Set(Object.keys(T.da)), en = new Set(Object.keys(T.en));
  [...da].filter(k => !en.has(k)).forEach(k => p.push("missing in English: " + k));
  [...en].filter(k => !da.has(k)).forEach(k => p.push("missing in Danish: " + k));
  const used = new Set();
  for (const f of [...htmlFiles, "assets/js/main.js", "assets/js/offer.js", "assets/js/consultation.js", "assets/js/api.js"]) {
    const t = rd(f);
    for (const m of t.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) used.add(m[1]);
    for (const m of t.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(",").forEach(x => used.add(x.split(":")[1].trim()));
    for (const m of t.matchAll(/RB_I18N\.get\("([^"]+)"\)/g)) used.add(m[1]);
  }
  [...used].filter(k => !da.has(k) || !en.has(k)).forEach(k => p.push("used but not translated: " + k));
  check("Translations: " + da.size + " Danish / " + en.size + " English keys, none missing", p);
}

// 4. House rule: no em-dashes anywhere in the project
{
  const p = [];
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).forEach(e => {
    const rel = path.posix.join(d, e.name);
    if (e.isDirectory()) { if (!/^(\.git|ourcustomers|node_modules)$/.test(e.name)) walk(rel); }
    else if (/\.(html|js|css|md|toml|xml|txt|sh|json)$/.test(e.name) && !/^NEW-SESSION/.test(e.name)) {
      if (fs.readFileSync(path.join(root, rel), "utf8").includes(String.fromCharCode(8212))) p.push(rel);
    }
  });
  walk(".");
  check("No em-dashes anywhere", p);
}

// 5. deploy/ must be an exact copy of the project (the folder that gets uploaded to Netlify)
{
  const p = [];
  const same = (rel) => {
    const a = path.join(root, rel), b = path.join(root, "deploy", rel);
    if (!fs.existsSync(b)) return p.push("missing in deploy/: " + rel);
    if (!fs.readFileSync(a).equals(fs.readFileSync(b))) p.push("differs in deploy/: " + rel);
  };
  [...htmlFiles, "robots.txt", "sitemap.xml", "netlify.toml", "netlify/functions/notify.js"].forEach(same);
  const walkAssets = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).forEach(e => {
    const rel = path.posix.join(d, e.name);
    e.isDirectory() ? walkAssets(rel) : same(rel);
  });
  walkAssets("assets");
  check("deploy/ is an exact copy of the project", p);
}

// 6. The developer's personal address must not be in the site or function code
{
  const p = [];
  for (const f of [...htmlFiles, ...jsFiles, "netlify.toml"]) if (/officialfarhat/i.test(rd(f))) p.push(f);
  check("Developer address not present in site or function code", p);
}

// 7. Security headers are configured
{
  const t = rd("netlify.toml"), p = [];
  ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Strict-Transport-Security"].forEach(h => { if (!t.includes(h)) p.push("missing header " + h); });
  if (/fonts\.g/.test(t)) p.push("CSP still allows Google fonts");
  check("Security headers configured", p);
}

console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "ALL SITE CHECKS PASSED"));
process.exit(failures ? 1 : 0);
