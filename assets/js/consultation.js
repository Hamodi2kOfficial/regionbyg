/* ============================================================
   consultation.js, single-step "Book a Consultation" form
   shares the same validation style + RB_API submission boundary
   ============================================================ */
(() => {
  const form = document.getElementById("consForm");
  if (!form) return;
  const success = document.getElementById("consSuccess");
  const btn = document.getElementById("consSubmit");

  function errorHost(el) { return el.closest(".field"); }
  function setError(host, on) { if (host) host.classList.toggle("field-error", on); }

  function validate() {
    let ok = true;
    form.querySelectorAll("[data-validate]").forEach(el => {
      const type = el.dataset.validate;
      let valid;
      if (type === "checkbox") valid = el.checked;
      else if (type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      else valid = el.value.trim().length > 0;
      setError(errorHost(el), !valid);
      if (!valid && ok) { ok = false; el.focus(); }
    });
    return ok;
  }
  form.addEventListener("input", e => setError(errorHost(e.target), false));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validate()) return;

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = RB_I18N.get("form.submitting");

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      datetime: form.datetime.value,
      notes: form.notes.value.trim(),
      consent: !!(form.consent && form.consent.checked),
      _hp: form.website ? form.website.value : ""
    };

    try {
      await RB_API.submitConsultation(payload);
      // Echo the requested date/time back, formatted to the active language
      const when = document.getElementById("consWhen");
      if (when && payload.datetime) {
        const locale = RB_I18N.lang() === "da" ? "da-DK" : "en-GB";
        when.textContent = new Date(payload.datetime)
          .toLocaleString(locale, { dateStyle: "long", timeStyle: "short" });
      }
      form.style.display = "none";
      success.classList.add("is-visible");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      window.RB_toast?.("⚠ " + (err.message || "Error"), "spark");
      btn.disabled = false;
      btn.textContent = original;
    }
  });
})();
