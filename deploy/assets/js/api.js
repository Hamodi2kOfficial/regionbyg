/* ============================================================
   api.js, SUBMISSION SERVICE LAYER  (the front-end boundary)
   ------------------------------------------------------------
   Every form submits through RB_API.submit(). This is the ONLY
   place the site talks to the outside world.

   BACKEND = Netlify Function ("/api/notify") that calls Resend and
   sends TWO emails on each booking:
       • to YOU (the business), full booking details
       • to the CLIENT, a friendly confirmation
   The Resend secret key lives ONLY in the Netlify function (never in
   this file / the browser), which is why we use a function.

   ▶ WHAT YOU NEED TO DO (one-time):
     1. Create a free account at https://resend.com  → copy your API
        key (re_...).
     2. Deploy this site to Netlify (drag the `deploy` folder onto
        https://app.netlify.com/drop).
     3. Netlify → Site settings → Environment variables → add:
          RESEND_API_KEY  = re_your_key
          RB_NOTIFY_EMAIL = Officialfarhat2k@gmail.com   (test inbox)
        (optional, after you verify regionbyg.dk in Resend:)
          RB_FROM = Region Byg <booking@regionbyg.dk>
     4. Re-deploy. Done, every booking now emails you + the client.

   Testing note: on plain localhost (no Netlify) the function doesn't
   exist, so the site runs in safe MOCK mode (logs, no email). Test
   the real emails on your Netlify URL (or with `netlify dev`).
   ============================================================ */

const RB_API = (() => {
  const config = {
    // "resend" = Netlify function → Resend · "mock" · "form-endpoint" (Getform/Formspree) · "web3forms"
    mode: "resend",
    notifyEndpoint: "/api/notify",          // the Netlify function (relative, same site)

    endpoint: "PASTE_YOUR_FORMSPREE_OR_GETFORM_ENDPOINT_HERE",  // only if mode = "form-endpoint"
    web3formsKey: "PASTE_YOUR_WEB3FORMS_ACCESS_KEY_HERE",       // only if mode = "web3forms"
    mockLatencyMs: 700
  };

  /* ---- helpers ---- */
  const endpointIsReal = (u) => typeof u === "string" && /^https?:\/\//i.test(u) && !/PASTE|YOUR|HERE/i.test(u);
  const keyIsReal = (k) => typeof k === "string" && k.length >= 20 && !/PASTE|YOUR|HERE/i.test(k);
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  function envelope(type, payload) {
    return {
      type, submittedAt: new Date().toISOString(),
      lang: (window.RB_I18N && RB_I18N.lang && RB_I18N.lang()) || "da",
      pageUrl: location.href, data: payload
    };
  }

  function saveLocally(record) {
    try {
      const all = JSON.parse(localStorage.getItem("rb-submissions") || "[]");
      all.push({ ...record, data: { ...record.data, _files: undefined } });
      localStorage.setItem("rb-submissions", JSON.stringify(all));
    } catch (e) { /* non-fatal */ }
  }

  function subjectFor(type, d) {
    const label = type === "offer" ? "New offer request" : "New consultation booking";
    return "Region Byg, " + label + (d.name ? ", " + d.name : "");
  }

  /* ---- readable, labeled fields for the emails ---- */
  function emailFields(type, d, record) {
    const fileNames = (d._files || []).map(f => f.name).join(", ") || "-";
    if (type === "offer") {
      const svc = d.service || {};
      return {
        "Booking type": "Offer request",
        "Service": (svc.name_en || "-") + (svc.group ? " (" + svc.group + ")" : ""),
        "Needs help with": d.help || "-",
        "Project description": d.description || "-",
        "Estimated budget (DKK)": d.budget || "-",
        "Timeline": d.timeline || "-",
        "Drawings": (d.drawings || []).join(", ") || "-",
        "Uploaded files": fileNames,
        "Additional info": d.extra || "-",
        "Name / Company": d.name,
        ...(d.cvr ? { "CVR": d.cvr } : {}),
        "Email": d.email, "Phone": d.phone,
        "Address": d.address, "City": d.city, "Postal code": d.postal,
        "Consent": d.consent ? "Yes (privacy policy accepted)" : "No",
        "Submitted": record.submittedAt, "Language": record.lang
      };
    }
    return {
      "Booking type": "Consultation booking",
      "Name": d.name, "Email": d.email, "Phone": d.phone,
      "Project address": d.address,
      "Preferred date & time": d.datetime || "-",
      "Notes": d.notes || "-",
      "Consent": d.consent ? "Yes (privacy policy accepted)" : "No",
      "Submitted": record.submittedAt, "Language": record.lang
    };
  }

  /* ---- read a File as base64 (for email attachments) ---- */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  /* ---- Netlify function → Resend (emails business + client) ---- */
  async function sendViaResend(type, record) {
    const d = record.data;

    // Attach uploaded files (base64). Cap total size so the request stays
    // under the serverless payload limit; larger files are listed by name only.
    const files = d._files || [];
    const totalBytes = files.reduce((a, f) => a + (f.size || 0), 0);
    const MAX_ATTACH = 3.5 * 1024 * 1024;   // ~3.5 MB total
    let attachments = [];
    if (files.length && totalBytes <= MAX_ATTACH) {
      attachments = await Promise.all(files.map(async f => ({
        filename: f.name, content: await fileToBase64(f)
      })));
    }

    const body = {
      type,
      subject: subjectFor(type, d),
      clientEmail: d.email || "",
      clientName: d.name || "",
      fields: emailFields(type, d, record),
      attachments,
      attachmentsTooLarge: (files.length && totalBytes > MAX_ATTACH)
        ? files.map(f => f.name) : []
    };
    const res = await fetch(config.notifyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    // Function not available here (plain static host returns 404/405) → safe mock fallback
    if (res.status === 404 || res.status === 405) {
      console.warn("[RB_API] Notify function not found (deploy to Netlify to enable emails), MOCK mode.");
      return { ok: true, mock: true };
    }
    let json = {};
    try { json = await res.json(); } catch (e) {}
    if (!res.ok || json.ok === false) {
      throw new Error(json.error || ("Notification failed (" + res.status + ")"));
    }
    return { ok: true };
  }

  /* ---- Formspree / Getform (alternative, multipart → real attachments) ---- */
  async function sendViaFormEndpoint(type, record) {
    const d = record.data;
    const fd = new FormData();
    Object.entries(emailFields(type, d, record)).forEach(([k, v]) => fd.append(k, v == null ? "" : String(v)));
    fd.append("email", d.email || "");
    fd.append("_subject", subjectFor(type, d));
    fd.append("_gotcha", "");
    (d._files || []).forEach((f, i) => fd.append("attachment_" + (i + 1), f, f.name));
    const res = await fetch(config.endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
    let json = {}; try { json = await res.json(); } catch (e) {}
    if (!res.ok || json.ok === false || (json.errors && json.errors.length)) {
      throw new Error((json.errors && json.errors.map(e => e.message).join(", ")) || json.message || ("Submission failed (" + res.status + ")"));
    }
    return { ok: true };
  }

  /* ---- Web3Forms (alternative) ---- */
  async function sendViaWeb3Forms(type, record) {
    const d = record.data;
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: config.web3formsKey, subject: subjectFor(type, d),
        from_name: "Region Byg website", replyto: d.email || "", botcheck: "",
        ...emailFields(type, d, record)
      })
    });
    let json = {}; try { json = await res.json(); } catch (e) {}
    if (!res.ok || !json.success) throw new Error(json.message || ("Email service error (" + res.status + ")"));
    return { ok: true };
  }

  /* ============================================================
     submit(type, payload) → Promise<{ ok: true }>
     ============================================================ */
  async function submit(type, payload) {
    const record = envelope(type, payload);
    saveLocally(record);
    document.dispatchEvent(new CustomEvent("rb:submission", { detail: record }));

    if (config.mode === "resend")                                       return await sendViaResend(type, record);
    if (config.mode === "form-endpoint" && endpointIsReal(config.endpoint)) return await sendViaFormEndpoint(type, record);
    if (config.mode === "web3forms" && keyIsReal(config.web3formsKey))      return await sendViaWeb3Forms(type, record);

    // MOCK fallback
    if (config.mode !== "mock") {
      console.warn("[RB_API] Backend not configured, running in MOCK mode (no email sent).");
    }
    await delay(config.mockLatencyMs);
    console.info("[RB_API mock] Captured booking:", record);
    return { ok: true, mock: true };
  }

  const submitOffer        = (payload) => submit("offer", payload);
  const submitConsultation = (payload) => submit("consultation", payload);

  return { config, submit, submitOffer, submitConsultation };
})();
