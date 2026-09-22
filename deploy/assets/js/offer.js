/* ============================================================
   offer.js, multi-step "Get an Offer" wizard
   step nav · progress · per-step validation · file upload ·
   service auto-population · submit via RB_API
   ============================================================ */
(() => {
  const form = document.getElementById("offerForm");
  if (!form) return;

  /* ---------- Read the URL first ---------- */
  const params = new URLSearchParams(location.search);
  const slug = params.get("service");
  const urlGroup = params.get("type");            // "private" | "commercial" | null
  const customMode = params.get("custom") === "1";

  // Client-type is the FIRST step of the wizard, but only when we don't already
  // know it (a Private/Commercial service card already sets ?type=...).
  const clientStep = form.querySelector("[data-clientstep]");
  if (urlGroup && clientStep) clientStep.remove();

  // Effective client type: from the URL, or from the first-step choice.
  function effectiveGroup() {
    if (urlGroup) return urlGroup;
    const el = form.querySelector('input[name="clienttype"]:checked');
    return el ? el.value : "";
  }

  const steps     = [...form.querySelectorAll(".step")];
  const total     = steps.length;
  const fill      = document.getElementById("progressFill");
  const stepNum   = document.getElementById("stepNum");
  const stepTotal = document.getElementById("stepTotal");
  const stepPct   = document.getElementById("stepPct");
  const btnBack   = document.getElementById("btnBack");
  const btnNext   = document.getElementById("btnNext");
  const btnSubmit = document.getElementById("btnSubmit");
  const success   = document.getElementById("offerSuccess");
  let current = 0;
  let files = [];

  stepTotal.textContent = total;

  /* ---------- Selected service (auto-populated from URL) ---------- */
  const selectedEl = document.getElementById("selectedService");
  let selected = null;

  function resolveSelected() {
    if (!slug || typeof RB_SERVICES === "undefined") return null;
    const list = RB_SERVICES[urlGroup] || [...RB_SERVICES.private, ...RB_SERVICES.commercial];
    return list.find(s => s.slug === slug) || null;
  }
  function paintSelected() {
    selected = resolveSelected();
    if (selected) {
      selectedEl.textContent = selected[RB_I18N.lang()];
      selectedEl.removeAttribute("data-i18n"); // keep the resolved service name
    } else if (customMode) {
      selectedEl.setAttribute("data-i18n", "offer.custom_service");
      selectedEl.textContent = RB_I18N.get("offer.custom_service");
    }
  }
  paintSelected();
  document.addEventListener("rb:langchange", () => {
    if (selected) selectedEl.textContent = selected[RB_I18N.lang()];
  });

  /* ---------- Adapt contact fields to client type ----------
     Commercial → "Company name" + a required CVR field. */
  function applyClientType() {
    const commercial = effectiveGroup() === "commercial";
    form.classList.toggle("is-commercial", commercial);
    const nameInput = form.querySelector("#name");
    if (nameInput) nameInput.placeholder = RB_I18N.get(commercial ? "form.company_ph" : "form.name_ph");
  }
  applyClientType();
  form.addEventListener("change", e => { if (e.target.name === "clienttype") applyClientType(); });
  document.addEventListener("rb:langchange", applyClientType);

  /* ---------- Step display ---------- */
  function render() {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === current));
    const pct = Math.round(((current + 1) / total) * 100);
    fill.style.width = pct + "%";
    stepNum.textContent = current + 1;
    stepPct.textContent = pct + "%";
    btnBack.hidden = current === 0;
    btnNext.hidden = current === total - 1;
    btnSubmit.hidden = current !== total - 1;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Validation ---------- */
  function errorHost(el) {
    let node = el;
    while (node && node !== form) {
      if (node.querySelector && node.querySelector(":scope > .error-msg")) return node;
      node = node.parentElement;
    }
    return el.closest(".field") || el.closest(".step");
  }
  function setError(host, on) { if (host) host.classList.toggle("field-error", on); }

  function validateStep(stepEl) {
    let ok = true;

    stepEl.querySelectorAll("[data-validate]").forEach(el => {
      if (el.offsetParent === null) return;   // skip hidden fields (e.g. CVR for private clients)
      const type = el.dataset.validate;
      let valid = true;

      if (type === "radio") {
        const name = el.dataset.field;
        valid = !!form.querySelector(`input[name="${name}"]:checked`);
      } else if (type === "required") {
        valid = el.value.trim().length > 0;
      } else if (type === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      } else if (type === "checkbox") {
        valid = el.checked;
      }

      setError(errorHost(el), !valid);
      if (!valid && ok) {
        ok = false;
        (el.focus ? el : el.querySelector("input"))?.focus?.();
      }
    });
    return ok;
  }

  // Clear errors as the user fixes them
  form.addEventListener("input", e => setError(errorHost(e.target), false));
  form.addEventListener("change", e => {
    if (e.target.matches('input[type="radio"]')) {
      const host = errorHost(e.target.closest("[data-validate]") || e.target);
      setError(host, false);
    }
  });

  /* ---------- Navigation ---------- */
  btnNext.addEventListener("click", () => {
    if (!validateStep(steps[current])) return;
    if (current < total - 1) { current++; render(); }
  });
  btnBack.addEventListener("click", () => {
    if (current > 0) { current--; render(); }
  });

  /* ---------- File upload ---------- */
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");

  function renderFiles() {
    fileList.innerHTML = files.map((f, i) =>
      `<li><span>${f.name} <span style="color:var(--text-faint)">(${(f.size/1024).toFixed(0)} KB)</span></span>
       <button type="button" data-remove="${i}" aria-label="Remove">×</button></li>`).join("");
  }
  fileInput.addEventListener("change", () => {
    files = files.concat([...fileInput.files]);
    fileInput.value = "";
    renderFiles();
  });
  fileList.addEventListener("click", e => {
    const i = e.target.dataset.remove;
    if (i !== undefined) { files.splice(+i, 1); renderFiles(); }
  });
  ["dragover", "dragenter"].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove("is-drag"); }));
  dropzone.addEventListener("drop", e => {
    if (e.dataTransfer?.files) { files = files.concat([...e.dataTransfer.files]); renderFiles(); }
  });

  /* ---------- Collect + submit ---------- */
  function collect() {
    const checked = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
    return {
      service: selected
        ? { slug: selected.slug, group: effectiveGroup(), name_da: selected.da, name_en: selected.en }
        : (customMode
            ? { slug: "custom", group: effectiveGroup(), name_da: "Skræddersyet løsning", name_en: "Custom solution" }
            : { slug: "", group: effectiveGroup(), name_da: "Generel forespørgsel", name_en: "General inquiry" }),
      help: checked("help")[0] || "",
      description: form.description.value.trim(),
      budget: form.budget.value.trim(),
      timeline: checked("timeline")[0] || "",
      drawings: checked("drawings"),
      extra: form.extra.value.trim(),
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      city: form.city.value.trim(),
      postal: form.postal.value.trim(),
      cvr: (form.cvr && effectiveGroup() === "commercial") ? form.cvr.value.trim() : "",
      consent: !!(form.consent && form.consent.checked),
      _files: files
    };
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateStep(steps[current])) return;

    const label = btnSubmit.querySelector("span") || btnSubmit;
    const original = label.textContent;
    btnSubmit.disabled = true;
    label.textContent = RB_I18N.get("form.submitting");

    try {
      await RB_API.submitOffer(collect());
      form.style.display = "none";
      document.querySelector(".selected-service").style.display = "none";
      success.classList.add("is-visible");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      window.RB_toast?.("⚠ " + (err.message || "Error"), "spark");
      btnSubmit.disabled = false;
      label.textContent = original;
    }
  });

  render();
})();
