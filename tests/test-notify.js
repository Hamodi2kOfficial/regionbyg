// Tests for the booking email function against a simulated Resend. Run: node tests/test-notify.js
const path = require("path");
const fnPath = path.resolve(__dirname, "..", "netlify", "functions", "notify.js");
const fresh = () => { delete require.cache[require.resolve(fnPath)]; return require(fnPath).handler; };
process.env.RESEND_API_KEY = "re_test_key";
["RB_NOTIFY_ALSO", "RB_FALLBACK_EMAIL", "RB_FROM", "RB_NOTIFY_EMAIL"].forEach(k => delete process.env[k]);
console.error = () => {};

const ok = () => ({ ok: true, status: 200, json: async () => ({ id: "id" }) });
const err = (status, message) => ({ ok: false, status, json: async () => ({ message }) });
const ORIGIN = { origin: "https://regionbyg.dk" };
const COMPANY = "kontakt@regionbyg.dk";
const payload = (over = {}) => ({
  subject: "Region Byg, Ny tilbudsforespoergsel, Kim", lang: "da", clientEmail: "kunde@example.dk", clientName: "Kim",
  fields: { Navn: "Kim" }, clientFields: { Navn: "Kim" }, ...over
});
let failures = 0, total = 0;

async function t(name, { env = {}, headers = ORIGIN, body, respond = () => ok(), expect }) {
  total++;
  const saved = {};
  for (const k of Object.keys(env)) { saved[k] = process.env[k]; if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; }
  const sent = [];
  global.fetch = async (u, o) => { const m = JSON.parse(o.body); sent.push(m); return respond(m); };
  const res = await fresh()({ httpMethod: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body || payload()) });
  for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  let json = {}; try { json = JSON.parse(res.body); } catch (e) {}
  let pass = false, why = "";
  try { pass = !!expect(res.statusCode, json, sent); } catch (e) { why = String(e.message || e); }
  if (!pass) failures++;
  console.log((pass ? "PASS " : "FAIL ") + name + (pass ? "" : "\n      http=" + res.statusCode + " to=" + JSON.stringify(sent.map(s => s.to)) + " " + why));
}
const to = (sent) => sent.map(s => s.to);
const strip = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

(async () => {
  // recipients
  await t("default: only kontakt@ and the submitter get an email", { expect: (s, j, c) => s === 200 && to(c).join() === COMPANY + ",kunde@example.dk" && j.sentTo.join() === COMPANY });
  await t("a stale RB_NOTIFY_EMAIL setting cannot redirect bookings", { env: { RB_NOTIFY_EMAIL: "someone@example.com" }, expect: (s, j, c) => to(c).join() === COMPANY + ",kunde@example.dk" });
  await t("RB_NOTIFY_ALSO adds an extra inbox (off by default)", { env: { RB_NOTIFY_ALSO: "a@example.com, B@Example.com, junk" }, expect: (s, j, c) => j.sentTo.join() === COMPANY + ",a@example.com,b@example.com" });
  await t("invalid customer email: booking delivered, no confirmation", { body: payload({ clientEmail: "nope" }), expect: (s, j, c) => s === 200 && to(c).join() === COMPANY && j.confirmationSent === false });

  // language
  await t("Danish request: company copy and customer copy in Danish", { expect: (s, j, c) => /ny henvendelse fra hjemmesiden/.test(c[0].html) && /Vi har modtaget/.test(c[1].html) && /Tak/.test(c[1].text) });
  await t("English request: company copy and customer copy in English", { body: payload({ lang: "en", attachmentsTooLarge: ["big.pdf"] }), expect: (s, j, c) => /new request from the website/.test(c[0].html) && /Reply directly to/.test(c[0].html) && /too large to attach/.test(c[0].html) && /We have received/.test(c[1].html) && !/hjemmesiden|Svar direkte|Vi har modtaget/.test(c[0].html + c[1].html) });
  await t("unknown language falls back to Danish", { body: payload({ lang: "de" }), expect: (s, j, c) => /ny henvendelse/.test(c[0].html) && /Vi har modtaget/.test(c[1].html) });

  // sender and content
  await t("company copy never comes from the address that receives it", { env: { RB_FROM: "Region Byg <kontakt@regionbyg.dk>" }, expect: (s, j, c) => !/kontakt@regionbyg\.dk>/.test(c[0].from) && /hjemmeside@regionbyg\.dk/.test(c[0].from) });
  await t("every email has a plain-text part as well as HTML", { expect: (s, j, c) => c.length === 2 && c.every(m => m.html && typeof m.text === "string" && m.text.length > 20) });
  await t("customer input is escaped and the subject cannot inject headers", { body: payload({ subject: "Hi\r\nBcc: evil@x.com", clientName: "<b>Kim</b>", fields: { Navn: "<script>x</script>" } }), expect: (s, j, c) => !/[\r\n]/.test(c[0].subject) && !c[0].html.includes("<script>") && !c[1].html.includes("<b>Kim") });

  // attachments
  await t("unsafe attachments are filtered out", { body: payload({ attachments: [{ filename: "plan.pdf", content: "QUJD" }, { filename: "../../evil.exe", content: "QUJD" }, { filename: "bad.pdf", content: "<<not base64>>" }] }), expect: (s, j, c) => c[0].attachments.map(a => a.filename).join() === "plan.pdf" });
  await t("attachment rejected by Resend: booking retried without the files", { body: payload({ attachments: [{ filename: "a.pdf", content: "QUJD" }] }), respond: m => (m.to === COMPANY && m.attachments) ? err(422, "attachment too large") : ok(), expect: (s, j, c) => s === 200 && j.sentTo.includes(COMPANY) && c.some(m => m.to === COMPANY && !m.attachments) });

  // failures
  await t("company inbox refused, no backup: customer sees an error", { respond: m => m.to === COMPANY ? err(550, "mailbox unavailable") : ok(), expect: (s, j, c) => s === 502 && !c.some(m => m.to === "kunde@example.dk") });
  await t("company inbox refused, backup configured: backup still gets it", { env: { RB_NOTIFY_ALSO: "backup@example.com" }, respond: m => m.to === COMPANY ? err(550, "x") : ok(), expect: (s, j) => s === 200 && j.sentTo.join() === "backup@example.com" && /not reached/.test(j.warning) });
  await t("Resend completely down: customer sees an error", { respond: () => err(500, "boom"), expect: (s, j) => s === 502 && j.sentTo.length === 0 });
  await t("domain not verified, no fallback set: error, nobody else emailed", { respond: m => /regionbyg\.dk/.test(m.from) ? err(403, "The regionbyg.dk domain is not verified") : ok(), expect: (s, j, c) => s === 502 && c.every(m => /regionbyg\.dk/.test(m.from)) });
  await t("domain not verified + RB_FALLBACK_EMAIL set: fallback inbox gets it", { env: { RB_FALLBACK_EMAIL: "fallback@example.com" }, respond: m => /regionbyg\.dk/.test(m.from) ? err(403, "domain is not verified") : ok(), expect: (s, j) => s === 200 && j.sandbox && j.sentTo.join() === "fallback@example.com" });
  await t("sandbox sender configured without fallback: nothing is sent", { env: { RB_FROM: "Region Byg <onboarding@resend.dev>" }, expect: (s, j, c) => s === 502 && c.length === 0 });

  // protection
  await t("request from another website is refused", { headers: { origin: "https://evil.example" }, expect: (s, j, c) => s === 403 && c.length === 0 });
  await t("request without an origin is refused", { headers: {}, expect: (s, j, c) => s === 403 && c.length === 0 });
  await t("look-alike domains are refused", { headers: { origin: "https://regionbyg.dk.evil.com" }, expect: (s) => s === 403 });
  await t("Netlify preview address and www are accepted", { headers: { origin: "https://my-site.netlify.app" }, expect: (s) => s === 200 });
  await t("invalid JSON, empty fields and oversized bodies are rejected", { body: "{nope", expect: (s) => s === 400 });
  await t("empty booking is rejected", { body: payload({ fields: {} }), expect: (s, j, c) => s === 400 && c.length === 0 });
  await t("oversized request is rejected", { body: "x".repeat(7 * 1024 * 1024), expect: (s) => s === 413 });

  console.log("\n" + (failures ? failures + " OF " + total + " TESTS FAILED" : "ALL " + total + " EMAIL TESTS PASSED"));
  process.exit(failures ? 1 : 0);
})();
