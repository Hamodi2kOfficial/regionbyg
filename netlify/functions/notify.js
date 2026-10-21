/* ============================================================
   Netlify Function, booking notifications via Resend
   ------------------------------------------------------------
   Sends TWO emails on every booking:
     1) to YOU (the business), the full booking details
     2) to the CLIENT, a friendly confirmation

   Set these in Netlify → Site settings → Environment variables:
     RESEND_API_KEY     (required)  the Resend key, e.g. re_xxxxx
     (Company inbox is fixed in code: kontakt@regionbyg.dk. Any old RB_NOTIFY_EMAIL
      setting in Netlify is ignored and can be deleted.)
     RB_FROM            (optional)  the "from" address
                                    default: Region Byg <booking@regionbyg.dk>
                                    (must be on a domain verified in Resend)
     RB_NOTIFY_ALSO     (optional)  extra inboxes that ALSO get every booking, comma
                                    separated. Off by default (bookings go only to
                                    kontakt@regionbyg.dk).

   Every booking goes to kontakt@regionbyg.dk. Extra inboxes can be added with
   RB_NOTIFY_ALSO (off by default), each sent as a separate independent email. Live mode is automatic: as soon as regionbyg.dk
   is verified in Resend, customers get their confirmation.
   ============================================================ */

const MAX_BODY_CHARS = 6 * 1024 * 1024;
const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
const FILE_EXT_RE = /\.(jpe?g|png|webp|gif|heic|pdf|dwg|dxf|docx?|xlsx?|txt)$/i;
const BASE64_RE = /^[A-Za-z0-9+/=]+$/;

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

// Only our own site may call this function from a browser. Allowed: the host the
// request itself arrived on, regionbyg.dk (+www), Netlify preview URLs, and localhost.
function originAllowed(event) {
  const h = event.headers || {};
  const origin = String(h.origin || h.Origin || "").trim().toLowerCase();
  if (!origin) return false;
  let host;
  try { host = new URL(origin).hostname; } catch (e) { return false; }
  const reqHost = String(h["x-forwarded-host"] || h.host || "").split(":")[0].toLowerCase();
  return host === "regionbyg.dk" || host === "www.regionbyg.dk"
    || host.endsWith(".netlify.app")
    || (!!reqHost && host === reqHost)
    || host === "localhost";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }
  if (!originAllowed(event)) return json(403, { ok: false, error: "Forbidden" });
  if ((event.body || "").length > MAX_BODY_CHARS) return json(413, { ok: false, error: "Request too large" });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) {
    console.error("RESEND_API_KEY is not set in Netlify environment variables");
    return json(500, { ok: false, error: "Server not configured" });
  }

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch (e) { return json(400, { ok: false, error: "Invalid request" }); }
  if (!payload || typeof payload !== "object") return json(400, { ok: false, error: "Invalid request" });

  const subject = clean(payload.subject || "Ny henvendelse", 200).replace(/\s+/g, " ");
  // Danish by default. English only when the customer used the English version of the site.
  const lang = payload.lang === "en" ? "en" : "da";
  const clientEmailRaw = clean(payload.clientEmail, 254);
  const clientEmail = EMAIL_RE.test(clientEmailRaw) ? clientEmailRaw : "";
  const clientName = clean(payload.clientName, 120);

  const cleanFields = (raw) => {
    const out = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      Object.entries(raw).slice(0, 40).forEach(([k, v]) => { out[clean(k, 60)] = clean(v, 4000); });
    }
    return out;
  };
  const fields = cleanFields(payload.fields);                 // company copy, always Danish
  if (!Object.keys(fields).length) return json(400, { ok: false, error: "Invalid request" });
  const clientFields = Object.keys(cleanFields(payload.clientFields)).length
    ? cleanFields(payload.clientFields) : fields;             // customer copy, in their language

  // Resend attachments: [{ filename, content(base64) }], only safe names/types, max 10
  const safeAttachments = (Array.isArray(payload.attachments) ? payload.attachments : [])
    .slice(0, 10)
    .map(a => ({
      filename: clean(a && a.filename, 100).replace(/[^\w.\- ]/g, "_"),
      content: a && typeof a.content === "string" ? a.content : ""
    }))
    .filter(a => a.filename && FILE_EXT_RE.test(a.filename) && a.content && BASE64_RE.test(a.content));
  const attachmentsTooLarge = (Array.isArray(payload.attachmentsTooLarge) ? payload.attachmentsTooLarge : [])
    .slice(0, 10).map(n => clean(n, 100));

  // LIVE mode: send from the company domain to the company inbox.
  // Until regionbyg.dk is verified in Resend, Resend refuses everything except mail to
  // the Resend account owner; in that case we automatically fall back to the sandbox
  // sender and the owner's inbox so no booking is ever lost. Once the DNS records are
  // added and verified, live mode simply starts working, no change needed here.
  const LIVE_FROM = process.env.RB_FROM || "Region Byg <booking@regionbyg.dk>";
  const SANDBOX_FROM = "Region Byg <onboarding@resend.dev>";
  // The company inbox is fixed in code on purpose: an old RB_NOTIFY_EMAIL setting in
  // Netlify (it used to point at the developer's Gmail) must not be able to redirect bookings.
  const COMPANY_EMAIL = "kontakt@regionbyg.dk";
  // Resend account owner: the only inbox Resend's sandbox will deliver to, and a backup
  // inbox on a different provider (mail from regionbyg.dk to regionbyg.dk can be quietly
  // filtered by the domain's own mail host; Gmail is immune to that).
  const OWNER_EMAIL = "officialfarhat2k@gmail.com";
  const norm = (s) => String(s).trim().toLowerCase();
  // RB_NOTIFY_ALSO is OFF unless set: it can add extra inboxes (comma separated).
  // It can only ADD recipients; it can never replace or remove the company inbox.
  const alsoRaw = process.env.RB_NOTIFY_ALSO || "none";   // OFF by default: bookings go only to the company inbox
  const extras = alsoRaw.split(",").map(norm).filter(x => x && x !== "none" && EMAIL_RE.test(x));
  let from = LIVE_FROM;
  let sandbox = /@resend\.dev/i.test(from);
  // The company copy is sent FROM a different address than the one receiving it. If the
  // sender and the recipient are the same address (e.g. RB_FROM = kontakt@regionbyg.dk), a
  // mail host sees its own address arriving from outside and treats it as spoofing.
  const fromAddr = (LIVE_FROM.match(/<([^>]+)>/) || LIVE_FROM.match(/^\s*([^\s<>]+@[^\s<>]+)\s*$/) || [])[1];
  const siteSender = fromAddr && !sandbox ? "Region Byg hjemmeside <hjemmeside@" + fromAddr.split("@")[1] + ">" : from;
  let businessFrom = siteSender;
  // In Resend's sandbox only the account owner can receive mail.
  const recipients = (sandbox ? [norm(OWNER_EMAIL)] : [COMPANY_EMAIL, ...extras])
    .filter((x, i, all) => all.indexOf(x) === i);

  const toRows = (obj) => Object.entries(obj).map(([k, v]) =>
    `<tr>
       <td style="padding:6px 12px;color:#6b675f;font:600 13px Arial,sans-serif;white-space:nowrap;vertical-align:top">${esc(k)}</td>
       <td style="padding:6px 12px;color:#1a1714;font:400 14px Arial,sans-serif">${esc(String(v)).replace(/\n/g, "<br>")}</td>
     </tr>`).join("");

  // Email to the company: always Danish.
  const businessHtml = wrap(
    `<h2 style="margin:0 0 4px;font:700 18px Arial,sans-serif;color:#1a1714">${esc(subject)}</h2>
     <p style="margin:0 0 16px;color:#6b675f;font:400 13px Arial,sans-serif">Region Byg &amp; Rådgivning, ny henvendelse fra hjemmesiden</p>
     <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:8px">${toRows(fields)}</table>
     ${safeAttachments.length ? `<p style="margin:14px 0 0;font:600 13px Arial,sans-serif;color:#1a1714">${safeAttachments.length} fil(er) er vedhæftet denne e-mail.</p>` : ""}
     ${(attachmentsTooLarge && attachmentsTooLarge.length) ? `<p style="margin:8px 0 0;font:400 13px Arial,sans-serif;color:#b45309">Kunden har uploadet filer, der var for store til at vedhæfte: ${esc(attachmentsTooLarge.join(", "))}. Bed kunden sende dem direkte.</p>` : ""}
     ${clientEmail ? `<p style="margin:16px 0 0;font:400 13px Arial,sans-serif;color:#6b675f">Svar direkte til ${esc(clientEmail)}</p>` : ""}`
  );

  // Confirmation to the customer: Danish by default, English if they used the English site.
  const T = lang === "en" ? {
    hello: "Thank you", body: "We have received your request at <b>Region Byg &amp; Rådgivning</b> and will get back to you as soon as possible, typically within 1-2 business days.",
    subject: "Region Byg, we have received your request"
  } : {
    hello: "Tak", body: "Vi har modtaget din henvendelse hos <b>Region Byg &amp; Rådgivning</b> og kontakter dig hurtigst muligt, typisk inden for 1-2 hverdage.",
    subject: "Region Byg, vi har modtaget din henvendelse"
  };
  const clientHtml = wrap(
    `<h2 style="margin:0 0 8px;font:700 18px Arial,sans-serif;color:#1a1714">${T.hello}${clientName ? ", " + esc(clientName) : ""}!</h2>
     <p style="margin:0 0 16px;color:#3a3630;font:400 14px Arial,sans-serif">${T.body}</p>
     <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:8px">${toRows(clientFields)}</table>
     <p style="margin:18px 0 0;color:#6b675f;font:400 13px Arial,sans-serif">Region Byg &amp; Rådgivning ApS · Kontakt@regionbyg.dk · +45 30 60 26 60</p>`
  );

  // Plain-text versions: spam filters score HTML-only mail worse, and some mail apps show only text.
  const toText = (obj) => Object.entries(obj).map(([k, v]) => k + ": " + String(v).replace(/\s*\n\s*/g, " ")).join("\n");
  const businessText = subject + "\nRegion Byg & Rådgivning, ny henvendelse fra hjemmesiden\n\n" + toText(fields)
    + (safeAttachments.length ? "\n\n" + safeAttachments.length + " fil(er) er vedhæftet denne e-mail." : "")
    + (attachmentsTooLarge.length ? "\n\nKunden har uploadet filer, der var for store til at vedhæfte: " + attachmentsTooLarge.join(", ") + ". Bed kunden sende dem direkte." : "")
    + (clientEmail ? "\n\nSvar direkte til " + clientEmail : "");
  const clientText = T.hello + (clientName ? ", " + clientName : "") + "!\n\n" + T.body.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&")
    + "\n\n" + toText(clientFields) + "\n\nRegion Byg & Rådgivning ApS, Kontakt@regionbyg.dk, +45 30 60 26 60";

  // 1) Business notification. One independent email per recipient, so a failure
  //    for one address never costs the others their copy.
  const note = (text) => `<p style="margin:0 0 14px;padding:10px 12px;background:#fff6df;border:1px solid #f0dca0;border-radius:8px;color:#7a5900;font:600 13px Arial,sans-serif">${text}</p>`;
  async function sendBusinessTo(to, html, text) {
    const base = { from: businessFrom, to, reply_to: clientEmail || undefined, subject, text };
    let r = await sendEmail(KEY, { ...base, html, ...(safeAttachments.length ? { attachments: safeAttachments } : {}) });
    // A rejected attachment must not cost us the whole booking: resend without the
    // files and list them by name instead.
    if (!r.ok && safeAttachments.length && !domainNotVerified(r)) {
      const names = safeAttachments.map(x => x.filename).join(", ");
      const retry = await sendEmail(KEY, { ...base, text: text + "\n\nKundens filer kunne ikke vedhæftes (" + names + "). Bed kunden sende dem direkte.", html: html + note("Kundens filer kunne ikke vedhæftes (" + esc(names) + "). Bed kunden sende dem direkte.") });
      if (retry.ok) r = retry;
    }
    return { to, ...r };
  }

  let deliveries = await Promise.all(recipients.map(to => sendBusinessTo(to, businessHtml, businessText)));

  // regionbyg.dk not verified in Resend yet: every live send is refused. Fall back to the
  // sandbox sender and the account owner's inbox so no booking is ever lost. Once the DNS
  // records are verified this branch is simply never used.
  if (!sandbox && deliveries.every(d => !d.ok && domainNotVerified(d))) {
    console.error("regionbyg.dk is not verified in Resend yet, using the test inbox:", deliveries[0].error);
    sandbox = true;
    from = SANDBOX_FROM;
    businessFrom = SANDBOX_FROM;
    const banner = note("Testlevering: regionbyg.dk er endnu ikke verificeret i Resend, så denne henvendelse er sendt til test-indbakken i stedet for " + esc(COMPANY_EMAIL) + ". Videresend den venligst.");
    deliveries = [await sendBusinessTo(norm(OWNER_EMAIL), banner + businessHtml, "Testlevering: regionbyg.dk er endnu ikke verificeret i Resend. Videresend denne henvendelse til " + COMPANY_EMAIL + ".\n\n" + businessText)];
  }

  deliveries.filter(d => !d.ok).forEach(d => console.error("Business notification to " + d.to + " failed:", d.status || "", d.error));
  const delivered = deliveries.filter(d => d.ok).map(d => d.to);
  const failed = deliveries.filter(d => !d.ok).map(d => ({ to: d.to, status: d.status || null }));

  // Only a booking that reached NOBODY is an error the customer should see.
  if (!delivered.length) return json(502, { ok: false, error: "Email service error", sentTo: [], failedTo: failed });

  // 2) Client confirmation. In sandbox it goes to the account owner as a preview (Resend's
  //    test rule); once live it goes to the real customer. A failure here never breaks the booking.
  let client = { ok: true, skipped: true };
  if (clientEmail) {
    const to = norm(sandbox ? OWNER_EMAIL : clientEmail);
    const subject2 = sandbox
      ? "[TEST, ville være sendt til " + clientEmail + "] " + T.subject
      : T.subject;
    client = await sendEmail(KEY, { from, to, subject: subject2, html: clientHtml, text: clientText });
    if (!client.ok) console.error("Client confirmation failed:", client.status || "", client.error);
  }

  // The response shows where every copy went, so one test booking explains itself
  // without opening the Resend dashboard (addresses and status codes only, no error text).
  return json(200, {
    ok: true, sandbox, from, sentTo: delivered, failedTo: failed, confirmationSent: !!(clientEmail && client.ok),
    ...(delivered.includes(COMPANY_EMAIL) ? {} : { warning: COMPANY_EMAIL + " was not reached; the booking was delivered to the backup inbox" })
  });
};

async function sendEmail(key, msg) {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(msg)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: r.status, error: data && data.message ? data.message : "Resend error " + r.status };
    return { ok: true, id: data && data.id };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

function domainNotVerified(r) {
  return (r.status === 403 || r.status === 422) && /verif|domain|testing emails|own email/i.test(String(r.error || ""));
}
function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function wrap(inner) {
  return `<div style="background:#f7f4ef;padding:24px 12px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ececec;border-radius:14px;padding:24px">
      ${inner}
      <div style="height:4px;background:#c8996a;border-radius:2px;margin-top:22px"></div>
    </div></div>`;
}
