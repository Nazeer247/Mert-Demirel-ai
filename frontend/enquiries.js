(() => {
  "use strict";
  const API_BASE = (window.MERT_API_BASE || "https://mert-demirel-ai.onrender.com").replace(/\/$/, "");
  const chat = document.getElementById("chat");
  if (!chat) return;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  function addConsent(form, message) {
    if (form.querySelector('[name="consent"]')) return;
    const label = document.createElement("label");
    label.className = "exp-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "consent";
    checkbox.required = true;
    label.append(checkbox, document.createTextNode(message));
    const submit = form.querySelector('button[type="submit"]');
    if (submit) form.insertBefore(label, submit); else form.appendChild(label);
  }
  function setNotice(form, message, failed) {
    const p = document.createElement("p");
    p.className = failed ? "exp-note" : "exp-success";
    p.setAttribute("role", "status");
    p.textContent = message;
    form.replaceWith(p);
  }
  chat.addEventListener("submit", async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    const kind = form.dataset.form;
    if (!["booking", "callback", "journey"].includes(kind)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (kind !== "booking") addConsent(form, "I agree that the clinic may receive and use these contact details to respond to my enquiry.");
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = "Sending securely…"; }
    const payload = {
      enquiry_type: kind === "booking" ? "consultation" : kind === "callback" ? "callback" : "international",
      name: values.name || "",
      phone: values.phone || "",
      email: values.email || "",
      procedure: values.procedure || "Not sure yet",
      country: values.country || "",
      preferred_date: values.date || values.day || values.when || "",
      preferred_time: values.time || "",
      timezone,
      consent: values.consent === "on",
      website: values.website || ""
    };
    try {
      const response = await fetch(API_BASE + "/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Your enquiry could not be submitted.");
      const message = result.notification_sent === false
        ? "Your enquiry has been saved, but the clinic email notification is not configured yet. Please contact the clinic directly to make sure they receive it."
        : "Thank you. Your enquiry has been securely submitted to the clinic. The clinic team will contact you to confirm the next step. This is not a confirmed appointment.";
      setNotice(form, message, false);
    } catch (error) {
      if (submit) { submit.disabled = false; submit.textContent = "Try again"; }
      setNotice(form, error.message + " You can contact the clinic directly using the Speak with the Clinic option.", true);
    }
  }, true);
  chat.addEventListener("focusin", (event) => {
    const form = event.target.closest('form[data-form="callback"], form[data-form="journey"]');
    if (form) addConsent(form, "I agree that the clinic may receive and use these contact details to respond to my enquiry.");
  });
  const style = document.createElement("style");
  style.textContent = ".exp-check{display:flex;gap:9px;align-items:flex-start;font-size:12px;line-height:1.5;color:#5f625c;margin:12px 0}.exp-check input{margin-top:3px;flex:0 0 auto}";
  document.head.appendChild(style);
})();