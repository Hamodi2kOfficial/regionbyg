/* ============================================================
   Netlify Function, booking notifications via Resend
   ------------------------------------------------------------
   Sends TWO emails on every booking:
     1) to YOU (the business), the full booking details
     2) to the CLIENT, a friendly confirmation

   Set these in Netlify → Site settings → Environment variables:
     RESEND_API_KEY   (required)  your Resend key, e.g. re_xxxxx
     RB_FROM          (optional)  the "from" address
                                  default: Region Byg <booking@regionbyg.dk>
                                  Must be on a domain verified in Resend.

   The company notification ALWAYS goes to kontakt@regionbyg.dk (COMPANY_EMAIL
   below). This is deliberately hard-coded: an old RB_NOTIFY_EMAIL variable in
   Netlify used to override it and silently sent every booking to a Gmail inbox
   instead. That variable is now ignored, so it can stay in Netlify harmlessly.

   Nothing redirects that address any more, not even Resend's sandbox. If Resend
   refuses to deliver there (an unverified @resend.dev sender can only reach the
   account owner), the booking is retried to the account owner's address with a
   subject saying so, rather than being dropped.
   ============================================================ */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return json(500, { ok: false, error: "RESEND_API_KEY is not set in Netlify" });

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch (e) { return json(400, { ok: false, error: "Invalid JSON body" }); }

  const {
    subject = "New booking",
    clientEmail = "",
    clientName = "",
    fields = {},
    attachments = [],
    attachmentsTooLarge = []
  } = payload;

  // Resend attachments: [{ filename, content(base64) }]
  const safeAttachments = Array.isArray(attachments)
    ? attachments.filter(a => a && a.filename && a.content)
    : [];

  // Where the business copy goes. Hard-coded on purpose, see the note at the top:
  // no environment variable may redirect the company's own bookings any more.
  const COMPANY_EMAIL = "kontakt@regionbyg.dk";
  // Owner of the Resend account, the only address Resend's sandbox will accept.
  const SANDBOX_FALLBACK_EMAIL = "officialfarhat2k@gmail.com";

  const from = process.env.RB_FROM || "Region Byg <booking@regionbyg.dk>";
  // Resend "sandbox": with an unverified @resend.dev sender, mail can ONLY reach
  // the account owner's address, so route there instead of failing outright.
  const sandbox = /@resend\.dev/i.test(from);
  // ALWAYS the company address, in every configuration. The sandbox address is
  // only ever tried as a last resort below, if Resend refuses this one.
  const notifyTo = COMPANY_EMAIL.trim().toLowerCase();

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

  // 1) Business notification. Every booking must reach the company address, so
  //    this is tried up to three ways before we give up on it.
  const businessBase = { from, to: notifyTo, reply_to: clientEmail || undefined, subject };
  let business = await sendEmail(KEY, {
    ...businessBase, html: businessHtml,
    ...(safeAttachments.length ? { attachments: safeAttachments } : {})
  });

  // 1b) A rejected or oversized attachment must not cost us the whole booking:
  //     resend the same details without the files, listing them by name instead.
  if (!business.ok && safeAttachments.length) {
    const names = safeAttachments.map(a => a.filename).join(", ");
    const retry = await sendEmail(KEY, {
      ...businessBase,
      html: businessHtml + note("The customer's files could not be attached (" + esc(names) + "). Ask them to email these directly.")
    });
    if (retry.ok) business = { ...retry, attachmentsDropped: names };
  }

  // 1c) Last resort, so a booking is never lost in silence. This is what the
  //     Resend sandbox needs (an unverified sender can only reach the account
  //     owner), and it also covers the company address being rejected outright.
  let businessFallback;
  if (!business.ok) {
    businessFallback = await sendEmail(KEY, {
      ...businessBase, to: SANDBOX_FALLBACK_EMAIL,
      subject: "[could not reach " + notifyTo + "] " + subject,
      html: businessHtml + note("Resend refused to deliver this booking to " + esc(notifyTo) + ": " + esc(String(business.error)))
    });
  }

  // 2) Client confirmation. In sandbox it's routed to YOUR inbox (a preview) so
  //    nothing violates Resend's test rule; after domain verification it goes to
  //    the real client. A failure here never breaks the booking.
  let client = { ok: true, skipped: true };
  if (clientEmail) {
    // In sandbox the preview must go to the Resend account owner, the only
    // recipient an unverified sender is allowed to reach.
    const to = (sandbox ? SANDBOX_FALLBACK_EMAIL : clientEmail).trim().toLowerCase();
    const subject2 = sandbox
      ? "[TEST, would send to " + clientEmail + "] Region Byg, booking received"
      : "Region Byg, booking modtaget / received";
    client = await sendEmail(KEY, { from, to, subject: subject2, html: clientHtml });
  }

  // sentTo/sandbox are echoed back so a single test booking shows exactly where
  // the company copy went, without needing the Resend dashboard.
  const meta = { sentTo: notifyTo, from, sandbox, ...(businessFallback ? { businessFallback } : {}) };

  // Only a booking that reached nobody at all is a failure the customer should
  // see. If the fallback got through, the booking is safe, so confirm it and
  // report the problem in the payload instead (the fallback mail's own subject
  // line already says the company address could not be reached).
  if (!business.ok) {
    if (businessFallback && businessFallback.ok) {
      return json(200, { ok: true, warning: "Delivered to the fallback address, " + notifyTo + " could not be reached: " + business.error, business, client, ...meta });
    }
    return json(502, { ok: false, error: business.error, business, client, ...meta });
  }
  return json(200, { ok: true, business, client, ...meta });
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

function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function note(text) {
  return `<p style="margin:14px 0 0;font:600 13px Arial,sans-serif;color:#b45309">${text}</p>`;
}
function wrap(inner) {
  return `<div style="background:#f7f4ef;padding:24px 12px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ececec;border-radius:14px;padding:24px">
      ${inner}
      <div style="height:4px;background:#c8996a;border-radius:2px;margin-top:22px"></div>
    </div></div>`;
}
