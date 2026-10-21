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
     RB_NOTIFY_ALSO   (optional)  extra backup inboxes, comma separated.
                                  default: officialfarhat2k@gmail.com
                                  Set it to "none" to switch the backup off.

   EVERY booking is sent to kontakt@regionbyg.dk (COMPANY_EMAIL below). That is
   hard-coded and no environment variable can redirect it: an old
   RB_NOTIFY_EMAIL variable used to override it and silently sent every booking
   to a Gmail inbox instead. That variable is now ignored entirely.

   The same booking is ALSO sent, as a separate email, to each address in
   RB_NOTIFY_ALSO. This exists because mail from regionbyg.dk to
   regionbyg.dk is sent by Resend rather than by the domain's own mail host, so
   that host may quietly quarantine it as spoofed, and fixing that needs DNS
   access we do not have. A backup inbox on a different provider is immune to
   it, so a booking is never lost while the main address is unreliable.

   The sends are independent: one failing never stops the other, and an
   attachment Resend rejects is retried without the files rather than losing
   the whole enquiry.
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

  // Where the business copy goes. Hard-coded on purpose, see the note at the
  // top: no environment variable may redirect the company's own bookings.
  const COMPANY_EMAIL = "kontakt@regionbyg.dk";
  // Backup inbox on another provider, so a booking survives the company
  // address being filtered. It is also the Resend account owner, the only
  // address Resend's sandbox will deliver to.
  const BACKUP_EMAIL = "officialfarhat2k@gmail.com";

  const from = process.env.RB_FROM || "Region Byg <booking@regionbyg.dk>";
  const sandbox = /@resend\.dev/i.test(from);

  const clean = (s) => String(s).trim().toLowerCase();
  // RB_NOTIFY_ALSO can add or replace the backup inboxes, or switch them off
  // with "none". It can only ADD to the company address, never replace it.
  const raw = process.env.RB_NOTIFY_ALSO === undefined ? BACKUP_EMAIL : process.env.RB_NOTIFY_ALSO;
  const extras = raw.split(",").map(clean).filter(a => a && a !== "none" && a.includes("@"));
  const notifyTo = clean(COMPANY_EMAIL);
  const recipients = [notifyTo, ...extras].filter((a, i, all) => all.indexOf(a) === i);

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

  // 1) Business notification. One independent email per recipient, so a
  //    failure for one address never costs the others their copy.
  async function sendBusinessTo(to) {
    const base = { from, to, reply_to: clientEmail || undefined, subject };
    let r = await sendEmail(KEY, {
      ...base, html: businessHtml,
      ...(safeAttachments.length ? { attachments: safeAttachments } : {})
    });
    // A rejected or oversized attachment must not cost us the whole booking:
    // resend the same details without the files, listing them by name instead.
    if (!r.ok && safeAttachments.length) {
      const names = safeAttachments.map(a => a.filename).join(", ");
      const retry = await sendEmail(KEY, {
        ...base,
        html: businessHtml + note("The customer's files could not be attached (" + esc(names) + "). Ask them to email these directly.")
      });
      if (retry.ok) r = { ...retry, attachmentsDropped: names };
    }
    return { to, ...r };
  }

  const deliveries = await Promise.all(recipients.map(sendBusinessTo));
  const toCompany = deliveries.find(d => d.to === notifyTo) || { ok: false, error: "not attempted" };
  // The booking is safe as long as ONE inbox received it.
  const business = { ok: deliveries.some(d => d.ok), deliveries };

  // 2) Client confirmation. In sandbox it's routed to YOUR inbox (a preview) so
  //    nothing violates Resend's test rule; after domain verification it goes to
  //    the real client. A failure here never breaks the booking.
  let client = { ok: true, skipped: true };
  if (clientEmail) {
    // In sandbox the preview must go to the Resend account owner, the only
    // recipient an unverified sender is allowed to reach.
    const to = clean(sandbox ? BACKUP_EMAIL : clientEmail);
    const subject2 = sandbox
      ? "[TEST, would send to " + clientEmail + "] Region Byg, booking received"
      : "Region Byg, booking modtaget / received";
    client = await sendEmail(KEY, { from, to, subject: subject2, html: clientHtml });
  }

  // Echoed back so a single test booking shows exactly where every copy went,
  // and whether Resend accepted it, without opening the Resend dashboard.
  const meta = {
    from, sandbox,
    sentTo: deliveries.filter(d => d.ok).map(d => d.to),
    failedTo: deliveries.filter(d => !d.ok).map(d => ({ to: d.to, error: d.error }))
  };

  // Only a booking that reached NOBODY is a failure the customer should see.
  if (!business.ok) {
    return json(502, { ok: false, error: toCompany.error, business, client, ...meta });
  }
  if (!toCompany.ok) {
    return json(200, {
      ok: true,
      warning: notifyTo + " could not be reached (" + toCompany.error + "), the booking was delivered to the backup inbox instead",
      business, client, ...meta
    });
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
