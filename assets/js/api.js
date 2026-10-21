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
        (everything else is automatic: bookings go to kontakt@regionbyg.dk once
         regionbyg.dk is verified in Resend, see netlify/functions/notify.js)
     4. Re-deploy. Done, every booking now emails the company + the client.

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
  const isLocal = () => location.protocol === "file:" ||
    /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/i.test(location.hostname);
  const endpointIsReal = (u) => typeof u === "string" && /^https?:\/\//i.test(u) && !/PASTE|YOUR|HERE/i.test(u);
  const keyIsReal = (k) => typeof k === "string" && k.length >= 20 && !/PASTE|YOUR|HERE/i.test(k);
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  function envelope(type, payload) {
    return {
      type, submittedAt: new Date().toISOString(),
      lang: (typeof RB_I18N !== "undefined" && RB_I18N.lang()) || "da",
      pageUrl: location.href, data: payload
    };
  }

  function saveLocally(record) {
    try {
      const all = JSON.parse(localStorage.getItem("rb-submissions") || "[]");
      all.push({ ...record, data: { ...record.data, _files: undefined, _hp: undefined } });
      localStorage.setItem("rb-submissions", JSON.stringify(all.slice(-5)));
    } catch (e) { /* non-fatal */ }
  }

  /* The company works in Danish: emails to the company are always Danish.
     The customer's confirmation uses the language they used on the site. */
  const tr = (key, lang, fallback) =>
    (typeof RB_I18N !== "undefined" && RB_I18N.get(key, lang)) || fallback || key;

  const LABELS = {
    da: {
      offerSubject: "Ny tilbudsforespørgsel", consSubject: "Ny konsultationsbooking",
      type: "Henvendelsestype", typeOffer: "Tilbudsforespørgsel", typeCons: "Konsultationsbooking",
      clientType: "Kundetype", service: "Ydelse", help: "Har brug for hjælp til",
      description: "Projektbeskrivelse", budget: "Estimeret budget (DKK)", timeline: "Tidsramme",
      drawings: "Tegninger", files: "Uploadede filer", extra: "Yderligere oplysninger",
      nameCompany: "Navn / virksomhed", name: "Navn", cvr: "CVR", email: "E-mail", phone: "Telefon",
      address: "Adresse", projectAddress: "Projektadresse", city: "By", postal: "Postnummer",
      when: "Ønsket dato og tidspunkt", notes: "Bemærkninger",
      consent: "Samtykke", yes: "Ja (vilkår og privatlivspolitik accepteret)", no: "Nej",
      received: "Modtaget", language: "Kundens sprog", langName: { da: "Dansk", en: "Engelsk" }, locale: "da-DK"
    },
    en: {
      offerSubject: "New offer request", consSubject: "New consultation booking",
      type: "Request type", typeOffer: "Offer request", typeCons: "Consultation booking",
      clientType: "Client type", service: "Service", help: "Needs help with",
      description: "Project description", budget: "Estimated budget (DKK)", timeline: "Timeline",
      drawings: "Drawings", files: "Uploaded files", extra: "Additional information",
      nameCompany: "Name / company", name: "Name", cvr: "CVR", email: "Email", phone: "Phone",
      address: "Address", projectAddress: "Project address", city: "City", postal: "Postal code",
      when: "Preferred date and time", notes: "Notes",
      consent: "Consent", yes: "Yes (terms and privacy policy accepted)", no: "No",
      received: "Received", language: "Customer language", langName: { da: "Danish", en: "English" }, locale: "en-GB"
    }
  };
  const TIMELINE_KEY = { urgent: "tl_urgent", "2-4m": "tl_24", "4m+": "tl_4plus", unsure: "tl_unsure" };

  function subjectFor(type, d, lang) {
    const L = LABELS[lang === "en" ? "en" : "da"];
    return "Region Byg, " + (type === "offer" ? L.offerSubject : L.consSubject) + (d.name ? ", " + d.name : "");
  }

  function fmtDate(value, lang, withZone) {
    try {
      const opts = { dateStyle: "long", timeStyle: "short" };
      if (withZone) opts.timeZone = "Europe/Copenhagen";
      return new Date(value).toLocaleString(LABELS[lang].locale, opts);
    } catch (e) { return value || "-"; }
  }

  /* ---- readable, labeled fields for the emails (lang = "da" | "en") ---- */
  function emailFields(type, d, record, lang) {
    lang = lang === "en" ? "en" : "da";
    const L = LABELS[lang];
    const fileNames = (d._files || []).map(f => f.name).join(", ") || "-";
    const common = {
      [L.consent]: d.consent ? L.yes : L.no,
      [L.received]: fmtDate(record.submittedAt, lang, true),
      [L.language]: L.langName[record.lang === "en" ? "en" : "da"]
    };
    if (type === "offer") {
      const svc = d.service || {};
      const group = svc.group === "commercial" ? tr("choose.commercial_title", lang) : svc.group === "private" ? tr("choose.private_title", lang) : "-";
      return {
        [L.type]: L.typeOffer,
        [L.clientType]: group,
        [L.service]: (lang === "en" ? svc.name_en : svc.name_da) || "-",
        [L.help]: d.help ? tr("offer.help_" + d.help, lang, d.help) : "-",
        [L.description]: d.description || "-",
        [L.budget]: d.budget || "-",
        [L.timeline]: d.timeline ? tr("offer." + (TIMELINE_KEY[d.timeline] || d.timeline), lang, d.timeline) : "-",
        [L.drawings]: (d.drawings || []).map(v => tr("offer.draw_" + v, lang, v)).join(", ") || "-",
        [L.files]: fileNames,
        [L.extra]: d.extra || "-",
        [L.nameCompany]: d.name,
        ...(d.cvr ? { [L.cvr]: d.cvr } : {}),
        [L.email]: d.email, [L.phone]: d.phone,
        [L.address]: d.address, [L.city]: d.city, [L.postal]: d.postal,
        ...common
      };
    }
    return {
      [L.type]: L.typeCons,
      [L.name]: d.name, [L.email]: d.email, [L.phone]: d.phone,
      [L.projectAddress]: d.address,
      [L.when]: d.datetime ? fmtDate(d.datetime, lang, false) : "-",
      [L.notes]: d.notes || "-",
      ...common
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
      subject: subjectFor(type, d, record.lang),
      clientEmail: d.email || "",
      clientName: d.name || "",
      lang: record.lang === "en" ? "en" : "da",
      fields: emailFields(type, d, record, record.lang),
      clientFields: emailFields(type, d, record, record.lang),
      attachments,
      attachmentsTooLarge: (files.length && totalBytes > MAX_ATTACH)
        ? files.map(f => f.name) : []
    };
    const res = await fetch(config.notifyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    // Function not available (a plain static host returns 404/405). On localhost that is
    // expected, so fall back to mock mode. On the LIVE site it means no email was sent, so
    // fail loudly instead of telling the customer everything went through.
    if (res.status === 404 || res.status === 405) {
      if (isLocal()) {
        console.warn("[RB_API] Notify function not found (local dev), MOCK mode.");
        return { ok: true, mock: true };
      }
      throw new Error("Notification service unavailable (" + res.status + ")");
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
    // Honeypot: real visitors never fill the hidden field. Pretend success, send nothing.
    if (payload && payload._hp) { await delay(config.mockLatencyMs); return { ok: true }; }

    const record = envelope(type, payload);
    document.dispatchEvent(new CustomEvent("rb:submission", { detail: record }));

    // Personal data is only kept in the browser if sending fails (so nothing is lost).
    const send = async () => {
      if (config.mode === "resend")                                       return await sendViaResend(type, record);
      if (config.mode === "form-endpoint" && endpointIsReal(config.endpoint)) return await sendViaFormEndpoint(type, record);
      if (config.mode === "web3forms" && keyIsReal(config.web3formsKey))      return await sendViaWeb3Forms(type, record);
      return null;
    };
    let result;
    try { result = await send(); }
    catch (err) {
      console.error("[RB_API] send failed:", err);
      saveLocally(record);
      throw new Error((typeof RB_I18N !== "undefined" && RB_I18N.get("form.err_send")) || "Could not send. Please try again.");
    }
    if (result) { if (result.mock) saveLocally(record); return result; }

    // MOCK fallback
    saveLocally(record);
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
