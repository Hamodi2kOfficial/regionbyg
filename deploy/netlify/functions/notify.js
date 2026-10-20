/* ============================================================
   Netlify Function, booking notifications via Resend
   ------------------------------------------------------------
   Sends TWO emails on every booking:
     1) to YOU (the business), the full booking details
     2) to the CLIENT, a friendly confirmation

   Set these in Netlify → Site settings → Environment variables:
     RESEND_API_KEY     (required)  the Resend key, e.g. re_xxxxx
     RB_NOTIFY_EMAIL    (optional)  where the company gets bookings
                                    default: kontakt@regionbyg.dk
     RB_FROM            (optional)  the "from" address
                                    default: Region Byg <booking@regionbyg.dk>
     RB_FALLBACK_EMAIL  (optional)  Resend account owner's inbox, used ONLY while
                                    regionbyg.dk is not verified in Resend yet
                                    default: the developer's address

   Live mode is automatic: as soon as regionbyg.dk is verified in Resend,
   bookings go to RB_NOTIFY_EMAIL and customers get their confirmation.
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

  const subject = clean(payload.subject || "New booking", 200).replace(/\s+/g, " ");
  const clientEmailRaw = clean(payload.clientEmail, 254);
  const clientEmail = EMAIL_RE.test(clientEmailRaw) ? clientEmailRaw : "";
  const clientName = clean(payload.clientName, 120);

  const rawFields = payload.fields && typeof payload.fields === "object" && !Array.isArray(payload.fields) ? payload.fields : {};
  const fields = {};
  Object.entries(rawFields).slice(0, 40).forEach(([k, v]) => { fields[clean(k, 60)] = clean(v, 4000); });
  if (!Object.keys(fields).length) return json(400, { ok: false, error: "Invalid request" });

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
  const notifyTo = (process.env.RB_NOTIFY_EMAIL || "kontakt@regionbyg.dk").trim().toLowerCase();
  // Lowercase/trim: Resend's sandbox allow-list is case-sensitive.
  const fallbackTo = (process.env.RB_FALLBACK_EMAIL || "officialfarhat2k@gmail.com").trim().toLowerCase();
  let from = LIVE_FROM;
  let sandbox = /@resend\.dev/i.test(from);

  const rows = Object.entries(fields).map(([k, v]) =>
    `<tr>
       <td style="padding:6px 12px;color:#6b675f;font:600 13px Arial,sans-serif;white-space:nowrap;vertical-align:top">${esc(k)}</td>
       <td style="padding:6px 12px;color:#1a1714;font:400 14px Arial,sans-serif">${esc(String(v)).replace(/\n/g, "<br>")}</td>
     </tr>`).join("");

  const businessHtml = wrap(
    `<h2 style="margin:0 0 4px;font:700 18px Arial,sans-serif;color:#1a1714">${esc(subject)}</h2>
     <p style="margin:0 0 16px;color:#6b675f;font:400 13px Arial,sans-serif">Region Byg &amp; Rådgivning, new website booking</p>
     <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:8px">${rows}</table>
     ${safeAttachments.length ? `<p style="margin:14px 0 0;font:600 13px Arial,sans-serif;color:#1a1714">${safeAttachments.length} file(s) attached to this email.</p>` : ""}
     ${(attachmentsTooLarge && attachmentsTooLarge.length) ? `<p style="margin:8px 0 0;font:400 13px Arial,sans-serif;color:#b45309">The customer uploaded files that were too large to attach: ${esc(attachmentsTooLarge.join(", "))}. Ask them to email these directly.</p>` : ""}
     ${clientEmail ? `<p style="margin:16px 0 0;font:400 13px Arial,sans-serif;color:#6b675f">Reply directly to <a href="mailto:${esc(clientEmail)}">${esc(clientEmail)}</a></p>` : ""}`
  );

  const clientHtml = wrap(
    `<h2 style="margin:0 0 8px;font:700 18px Arial,sans-serif;color:#1a1714">Tak${clientName ? ", " + esc(clientName) : ""}!</h2>
     <p style="margin:0 0 12px;color:#3a3630;font:400 14px Arial,sans-serif">Vi har modtaget din henvendelse hos <b>Region Byg &amp; Rådgivning</b> og kontakter dig hurtigst muligt, typisk inden for 1-2 hverdage.</p>
     <p style="margin:0 0 16px;color:#3a3630;font:400 14px Arial,sans-serif">We've received your request and will get in touch as soon as possible, typically within 1-2 business days.</p>
     <table style="border-collapse:collapse;width:100%;border:1px solid #eee;border-radius:8px">${rows}</table>
     <p style="margin:18px 0 0;color:#6b675f;font:400 13px Arial,sans-serif">Region Byg &amp; Rådgivning · Kontakt@regionbyg.dk · +45 30 60 26 60</p>`
  );

  // 1) Business notification to the company inbox (kontakt@regionbyg.dk).
  const sendBusiness = (html) => sendEmail(KEY, {
    from, to: sandbox ? fallbackTo : notifyTo, reply_to: clientEmail || undefined, subject, html,
    ...(safeAttachments.length ? { attachments: safeAttachments } : {})
  });
  let business = await sendBusiness(businessHtml);
  if (!business.ok && !sandbox && domainNotVerified(business)) {
    console.error("regionbyg.dk is not verified in Resend yet, using the test inbox:", business.error);
    sandbox = true;
    from = SANDBOX_FROM;
    const banner = `<p style="margin:0 0 14px;padding:10px 12px;background:#fff6df;border:1px solid #f0dca0;border-radius:8px;color:#7a5900;font:600 13px Arial,sans-serif">Test delivery: regionbyg.dk is not verified in Resend yet, so this booking was sent to the test inbox instead of ${esc(notifyTo)}. Please forward it.</p>`;
    business = await sendBusiness(banner + businessHtml);
  }

  if (!business.ok) {
    console.error("Business notification failed:", business.status || "", business.error);
    return json(502, { ok: false, error: "Email service error" });
  }

  // 2) Client confirmation. In sandbox it's routed to the test inbox (a preview) so
  //    nothing violates Resend's test rule; once live it goes to the real client.
  //    A failure here never breaks the booking.
  let client = { ok: true, skipped: true };
  if (clientEmail) {
    const to = (sandbox ? fallbackTo : clientEmail).trim().toLowerCase();
    const subject2 = sandbox
      ? "[TEST, would send to " + clientEmail + "] Region Byg, booking received"
      : "Region Byg, booking modtaget / received";
    client = await sendEmail(KEY, { from, to, subject: subject2, html: clientHtml });
  }

  if (!client.ok) console.error("Client confirmation failed:", client.status || "", client.error);
  return json(200, { ok: true });
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
