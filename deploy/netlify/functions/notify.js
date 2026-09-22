/* ============================================================
   Netlify Function, booking notifications via Resend
   ------------------------------------------------------------
   Sends TWO emails on every booking:
     1) to YOU (the business), the full booking details
     2) to the CLIENT, a friendly confirmation

   Set these in Netlify → Site settings → Environment variables:
     RESEND_API_KEY   (required)  your Resend key, e.g. re_xxxxx
     RB_NOTIFY_EMAIL  (optional)  where YOU get notified
                                  default: Officialfarhat2k@gmail.com
     RB_FROM          (optional)  the "from" address
                                  default: Region Byg <onboarding@resend.dev>
                                  ↑ Resend's sandbox sender. It can only email
                                    YOUR OWN Resend account address until you
                                    verify a domain. After verifying regionbyg.dk,
                                    set this to e.g.  Region Byg <booking@regionbyg.dk>
                                    and client confirmations will work for everyone.
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

  const from = process.env.RB_FROM || "Region Byg <onboarding@resend.dev>";
  // lowercase/trim: Resend's sandbox allow-list is case-sensitive, so "Official…"
  // must be sent as "official…" to match the account address exactly.
  const notifyTo = (process.env.RB_NOTIFY_EMAIL || "officialfarhat2k@gmail.com").trim().toLowerCase();
  // Resend "sandbox": until a domain is verified, mail can ONLY reach your own
  // account address. While the from-address is the sandbox one, route everything
  // to notifyTo so testing always succeeds (no "can only send to your own email"
  // error). After you verify regionbyg.dk and set RB_FROM, real client emails flow.
  const sandbox = /@resend\.dev/i.test(from);

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

  // 1) Business notification (works immediately in the Resend sandbox,
  //    because notifyTo is your own Resend account email).
  const business = await sendEmail(KEY, {
    from, to: notifyTo, reply_to: clientEmail || undefined, subject, html: businessHtml,
    ...(safeAttachments.length ? { attachments: safeAttachments } : {})
  });

  // 2) Client confirmation. In sandbox it's routed to YOUR inbox (a preview) so
  //    nothing violates Resend's test rule; after domain verification it goes to
  //    the real client. A failure here never breaks the booking.
  let client = { ok: true, skipped: true };
  if (clientEmail) {
    const to = (sandbox ? notifyTo : clientEmail).trim().toLowerCase();
    const subject2 = sandbox
      ? "[TEST, would send to " + clientEmail + "] Region Byg, booking received"
      : "Region Byg, booking modtaget / received";
    client = await sendEmail(KEY, { from, to, subject: subject2, html: clientHtml });
  }

  if (!business.ok) return json(502, { ok: false, error: business.error, business, client });
  return json(200, { ok: true, business, client });
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
function wrap(inner) {
  return `<div style="background:#f7f4ef;padding:24px 12px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ececec;border-radius:14px;padding:24px">
      ${inner}
      <div style="height:4px;background:#c8996a;border-radius:2px;margin-top:22px"></div>
    </div></div>`;
}
