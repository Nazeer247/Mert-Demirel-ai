(() => {
"use strict";
const chat = document.getElementById("chat");
const actions = document.getElementById("actions");
if (!chat || !actions) return;

const clinic = { wa: "905458340606", phone: "+902165041810", intl: "+447782240606", email: "info@mertdemirel.com" };
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
let selectedProcedure = "Not sure yet";

const procedures = [
  ["Breast","Breast augmentation","Explore options for breast volume and proportion.","https://mertdemirel.com/breast-procedures/"],
  ["Breast","Breast lift","Learn about breast position, skin and shape.","https://mertdemirel.com/breast-procedures/"],
  ["Breast","Breast reduction","Understand breast weight, proportion and symptoms to discuss.","https://mertdemirel.com/breast-procedures/"],
  ["Face","Rhinoplasty","Explore nasal structure, appearance and breathing considerations.","https://mertdemirel.com/facial-procedures/"],
  ["Face","Eyelid surgery","Learn about eyelid position and facial balance.","https://mertdemirel.com/facial-procedures/"],
  ["Face","Facelift","Explore facial tissue position and rejuvenation options.","https://mertdemirel.com/facial-procedures/"],
  ["Body","Liposuction","Understand body contouring and areas of localised fat.","https://mertdemirel.com/body-procedures/"],
  ["Body","Tummy tuck","Learn about abdominal skin, wall and contour.","https://mertdemirel.com/body-procedures/"],
  ["Body","Body lift","Explore treatment of broader areas of redundant skin.","https://mertdemirel.com/body-procedures/"],
  ["Non-surgical","Botulinum toxin","Learn about selected non-surgical treatment options.","https://mertdemirel.com/treatments/"],
  ["Non-surgical","Dermal fillers","Explore volume and facial balance treatments.","https://mertdemirel.com/treatments/"],
  ["Men","Gynecomastia surgery","Explore male chest concerns and consultation topics.","https://mertdemirel.com/mens-procedures/"],
  ["Hair","Scalp hair transplant","Learn about hairline and coverage planning.","https://mertdemirel.com/hair-restoration/"],
  ["Hair","Beard transplant","Explore facial-hair restoration and natural direction.","https://mertdemirel.com/hair-restoration/"],
  ["Hair","Eyebrow transplant","Learn about brow shape and hair direction.","https://mertdemirel.com/hair-restoration/"]
];

const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const today = () => new Date().toLocaleDateString("en-CA");
function button(label, action, extra = "") {
  const primary = /class=["'][^"']*exp-btn--primary/.test(extra);
  const attrs = extra.replace(/\\sclass=["'][^"']*["']/, "");
  return '<button type="button" class="exp-btn' + (primary ? ' exp-btn--primary' : '') + '" data-exp="' + action + '" ' + attrs + '>' + label + '</button>';
}
function openPanel(title, subtitle, body) {
  const previous = document.getElementById("conciergeExperience");
  if (previous) previous.remove();
  const panel = document.createElement("section");
  panel.id = "conciergeExperience";
  panel.className = "experience";
  panel.innerHTML = '<header class="experience__head"><div><p class="experience__eyebrow">MERT DEMIREL CLINIC · DIGITAL CONCIERGE</p><h2>' + esc(title) + '</h2><p>' + esc(subtitle) + '</p></div><button type="button" class="experience__close" aria-label="Close experience">×</button></header><div class="experience__content">' + body + '</div>';
  chat.appendChild(panel);
  panel.querySelector(".experience__close").addEventListener("click", () => panel.remove());
  panel.scrollIntoView({behavior:"smooth", block:"nearest"});
  return panel;
}
function sendWhatsApp(message) {
  window.open("https://wa.me/" + clinic.wa + "?text=" + encodeURIComponent(message), "_blank", "noopener");
}
function showProcedures(category = "All") {
  const categories = ["All","Breast","Face","Body","Non-surgical","Men","Hair"];
  const shown = procedures.filter(item => category === "All" || item[0] === category);
  const cards = shown.map((item, index) =>
    '<article class="procedure-card procedure-slide"><div class="procedure-art" aria-hidden="true">' + esc(item[0].toUpperCase()) + '</div><div><span class="exp-tag">' + esc(item[0]) + '</span><h3>' + esc(item[1]) + '</h3><p>' + esc(item[2]) + '</p><a class="exp-link" href="' + item[3] + '" target="_blank" rel="noopener">Read the clinic guide</a><div class="procedure-card__actions">' + button("Choose this topic","choose-procedure",'data-name="' + esc(item[1]) + '"') + '</div></div></article>'
  ).join("");
  const chips = categories.map(x => '<button type="button" class="filter-chip ' + (x === category ? "is-active" : "") + '" data-category="' + x + '">' + x + '</button>').join("");
  const panel = openPanel("Explore procedures","Browse the clinic's procedure areas. Swipe the cards sideways or choose a category.",'<div class="exp-filters">' + chips + '</div><div class="procedure-carousel" aria-label="Swipeable procedure cards">' + cards + '</div><div class="exp-carousel-hint">Swipe left or right to explore more procedures</div><p class="exp-note">These guides are for information only. A consultation is needed to discuss suitability, risks and expected recovery.</p>' + button("Request a consultation","book","class=\"exp-btn exp-btn--primary\""));
  panel.querySelectorAll("[data-category]").forEach(el => el.addEventListener("click", () => showProcedures(el.dataset.category)));
}
function showConcern() {
  const panel = openPanel("Understand a concern","A guided set of questions to help organise what you want to discuss with the clinic.",'<div class="wizard-progress"><span data-progress>Step 1 of 3</span><div><i data-progress-bar></i></div></div><form class="exp-form" data-form="concern-wizard"><div data-step="1"><label>Which area would you like to discuss?<select name="area" required><option value="">Choose an area</option><option>Face</option><option>Breast</option><option>Body</option><option>Scalp hair</option><option>Beard or moustache</option><option>Eyebrows</option><option>Skin / non-surgical</option><option>Other</option></select></label><button type="button" class="exp-btn exp-btn--primary" data-next="2">Continue</button></div><div data-step="2" hidden><label>What would you most like help understanding?<select name="topic" required><option value="">Choose one</option><option>Appearance or shape</option><option>Changes over time</option><option>Possible treatment options</option><option>Risks and recovery</option><option>Costs and consultation process</option><option>I'm not sure yet</option></select></label><label>How long has this been a concern?<select name="duration"><option>Not sure</option><option>Less than 3 months</option><option>3–12 months</option><option>1–3 years</option><option>More than 3 years</option><option>Since childhood</option></select></label><button type="button" class="exp-btn" data-back="1">Back</button><button type="button" class="exp-btn exp-btn--primary" data-next="3">Continue</button></div><div data-step="3" hidden><label>Anything else you would like the team to know? (Optional)<textarea name="notes" rows="3" maxlength="500" placeholder="Describe your question in your own words"></textarea></label><label>Optional reference photo (stays on this device)<input type="file" name="photo" accept="image/*"></label><p class="exp-note">Your photo is not uploaded or sent by this demo. Avoid intimate or identifying images.</p><button type="button" class="exp-btn" data-back="2">Back</button><button type="submit" class="exp-btn exp-btn--primary">Create my discussion summary</button></div></form>');
  const form = panel.querySelector("form");
  const setStep = n => {
    form.querySelectorAll("[data-step]").forEach(el => el.hidden = el.dataset.step !== String(n));
    panel.querySelector("[data-progress]").textContent = "Step " + n + " of 3";
    panel.querySelector("[data-progress-bar]").style.width = (n / 3 * 100) + "%";
  };
  panel.querySelectorAll("[data-next]").forEach(el => el.addEventListener("click", () => {
    const current = form.querySelector('[data-step="' + (Number(el.dataset.next)-1) + '"]');
    const required = current.querySelector("select[required]");
    if (required && !required.value) { required.focus(); required.reportValidity(); return; }
    setStep(Number(el.dataset.next));
  }));
  panel.querySelectorAll("[data-back]").forEach(el => el.addEventListener("click", () => setStep(Number(el.dataset.back))));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(form);
    const summary = "My question for Mert Demirel Clinic: Area: " + data.get("area") + "; Main topic: " + data.get("topic") + "; Duration: " + data.get("duration") + "; Additional notes: " + (data.get("notes") || "None") + ". Please advise how I can arrange a consultation.";
    const result = document.createElement("div");
    result.className = "exp-result";
    result.innerHTML = "<h3>Your discussion summary is ready</h3><p>This organises your questions; it is not a diagnosis or treatment recommendation. The clinical team must assess your individual situation.</p>" + button("Discuss this with the AI concierge","ask-concern") + button("Send enquiry to the clinic","send-concern");
    form.replaceWith(result);
    result.querySelector('[data-exp="ask-concern"]').addEventListener("click", () => { if (typeof handleSend === "function") handleSend(summary); });
    result.querySelector('[data-exp="send-concern"]').addEventListener("click", () => sendWhatsApp("Hello Mert Demirel Clinic. " + summary));
  });
}
function showChecklist() {
  const sections = [
    ["Your consultation","Think about your goals and questions","List any previous procedures","Prepare relevant medical history and test results","Write down medicines, supplements and allergies"],
    ["If a procedure is being considered","Tell the team about medicines, supplements, allergies and nicotine use","Do not stop prescribed medicines unless your clinician instructs you","Follow the clinic's specific fasting and preparation instructions","Arrange a companion or support if advised"],
    ["Questions worth asking","What options and alternatives should I understand?","What are the important risks and limitations?","What recovery time and follow-up may be needed?","Who should I contact if I have a concern?"]
  ];
  const markup = sections.map((group,i) => '<div class="check-group"><h3>' + group[0] + '</h3>' + group.slice(1).map((item,j) => '<label class="check-row"><input type="checkbox" data-check><span>' + item + '</span></label>').join("") + '</div>').join("");
  const panel = openPanel("Prepare for consultation","Use this interactive checklist to get organised. Tick items as you complete them.",'<div class="check-progress"><span data-count>0 of 12 completed</span><div><i data-checkbar></i></div></div><div class="checklist">' + markup + '</div><p class="exp-note">This is a general preparation aid. Follow the personalised instructions provided by your clinical team.</p><div class="exp-actions">' + button("Send my checklist to the clinic","send-checklist") + button("Add a preparation reminder","calendar") + '</div>');
  const boxes = [...panel.querySelectorAll("[data-check]")];
  const update = () => { const count = boxes.filter(x => x.checked).length; panel.querySelector("[data-count]").textContent = count + " of " + boxes.length + " completed"; panel.querySelector("[data-checkbar]").style.width = (count / boxes.length * 100) + "%"; };
  boxes.forEach(x => x.addEventListener("change",update));
}
function showJourney() {
  const panel = openPanel("International journey planner","Build a travel enquiry step by step. The clinic must confirm all arrangements and costs.",'<div class="journey-steps"><div><b>01 · Before departure</b><p>Discuss your goals and complete the clinic's assessment process.</p></div><div><b>02 · Arrival in Istanbul</b><p>Ask the clinic to confirm any transfer or accommodation arrangements.</p></div><div><b>03 · Consultation and planning</b><p>The clinical team discusses examination findings, options and next steps.</p></div><div><b>04 · Recovery and return</b><p>Your treating team advises on follow-up and whether travel is appropriate.</p></div></div><form class="exp-form" data-form="journey"><label>Which country will you travel from?<input name="country" required maxlength="80" placeholder="Your country"></label><label>Which procedure are you interested in?<select name="procedure"><option>Not sure yet</option>' + procedures.map(x => '<option>' + esc(x[1]) + '</option>').join("") + '</select></label><label>When are you considering travelling?<select name="when"><option>Just researching</option><option>Within 1–3 months</option><option>In 3–6 months</option><option>In 6–12 months</option></select></label><label>Have you booked flights?<select name="flight"><option>Not yet</option><option>Yes</option><option>I need advice before booking</option></select></label><fieldset class="exp-fieldset"><legend>What support would you like to ask about?</legend>' + ["Airport transfer","Accommodation","Hospital coordination","Remote follow-up"].map(x => '<label class="check-row"><input type="checkbox" name="support" value="' + x + '"><span>' + x + '</span></label>').join("") + '</fieldset><p class="exp-note">Visa requirements depend on your passport. Check the <a class="exp-link" href="https://www.evisa.gov.tr/" target="_blank" rel="noopener">official Turkish e-Visa website</a>. This planner does not confirm services or quote prices.</p><button type="submit" class="exp-btn exp-btn--primary">Prepare my travel enquiry</button></form>');
  panel.querySelector("form").addEventListener("submit", e => {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const supports = d.getAll("support").join(", ") || "Not specified";
    const message = "Hello Mert Demirel Clinic. I am planning a visit to Istanbul. Country: " + d.get("country") + ". Procedure: " + d.get("procedure") + ". Timing: " + d.get("when") + ". Flights: " + d.get("flight") + ". Support to discuss: " + supports + ". Please advise the next steps and provide confirmed details and an itemised quote.";
    const done = document.createElement("div"); done.className="exp-success"; done.textContent="Your travel enquiry is prepared. WhatsApp will open so you can review and send it to the clinic.";
    e.currentTarget.replaceWith(done); sendWhatsApp(message);
  });
}
function showRecovery() {
  const stages = [
    ["Immediately after treatment","Follow the discharge instructions given by your treating team. Use only the medication and wound-care plan they provided."],
    ["First week","Attend scheduled checks. Ask the care team before changing dressings, washing routines or activity levels."],
    ["Following weeks","Healing varies by procedure and person. Keep follow-up appointments and report new or worsening concerns."],
    ["Longer-term follow-up","Attend reviews recommended for your procedure. Your clinician can explain progress and expected changes."]
  ];
  const panel = openPanel("Recovery & aftercare","Explore general recovery stages and know when to contact a medical professional.",'<div class="exp-filters">' + stages.map((s,i) => '<button type="button" class="filter-chip ' + (!i?"is-active":"") + '" data-stage="' + i + '">' + ["Immediately","Week 1","Following weeks","Longer term"][i] + '</button>').join("") + '</div><div class="recovery-list" data-stage-content><div><b>' + stages[0][0] + '</b><p>' + stages[0][1] + '</p></div></div><div class="exp-warning"><b>Seek urgent medical help</b><p>Breathing difficulty, chest pain, fainting, heavy bleeding, severe pain or rapidly worsening symptoms need urgent local medical assessment. For other new or concerning postoperative changes, contact your treating clinic promptly.</p></div><p class="exp-note">This is general information, not personal medical advice. Your own discharge instructions always take priority. This demo cannot assess symptoms or securely receive recovery photos.</p>' + button("Contact the care team","contact") + button("Request a follow-up","contact"));
  panel.querySelectorAll("[data-stage]").forEach(el => el.addEventListener("click", () => {
    panel.querySelectorAll("[data-stage]").forEach(x => x.classList.toggle("is-active",x===el));
    const s = stages[Number(el.dataset.stage)];
    panel.querySelector("[data-stage-content]").innerHTML = "<div><b>" + s[0] + "</b><p>" + s[1] + "</p></div>";
  }));
}
function showContact() {
  const panel = openPanel("Speak with the clinic","Choose how you would like to contact the team, or prepare a callback request.",'<div class="contact-actions"><a class="contact-link" href="https://wa.me/' + clinic.wa + '" target="_blank" rel="noopener"><b>WhatsApp</b><span>+90 545 834 06 06</span></a><a class="contact-link" href="tel:' + clinic.phone + '"><b>Call Istanbul clinic</b><span>+90 216 504 18 10</span></a><a class="contact-link" href="tel:' + clinic.intl + '"><b>International call</b><span>+44 7782 24 06 06</span></a><a class="contact-link" href="mailto:' + clinic.email + '"><b>Email</b><span>' + clinic.email + '</span></a></div><form class="exp-form" data-form="callback"><h3>Request a callback</h3><label>Your name<input name="name" required maxlength="100"></label><label>Phone number<input name="phone" required maxlength="40" placeholder="Include country code"></label><label>Preferred day<input type="date" name="day" min="' + today() + '" required></label><label>Preferred time<select name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Flexible</option></select></label><button type="submit" class="exp-btn exp-btn--primary">Prepare callback request</button></form><p class="exp-note">A callback is a request, not a confirmed appointment. The clinic must confirm availability.</p>');
  panel.querySelector("form").addEventListener("submit", e => {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const message = "Hello, please arrange a callback. Name: " + d.get("name") + ". Phone: " + d.get("phone") + ". Preferred day: " + d.get("day") + ". Preferred time: " + d.get("time") + ". Please confirm if possible.";
    const done = document.createElement("p"); done.className="exp-success"; done.textContent="Your callback request is ready. WhatsApp will open so you can review and send it.";
    e.currentTarget.replaceWith(done); sendWhatsApp(message);
  });
}
function addCalendarReminder() {
  const start = new Date(Date.now() + 86400000); start.setMinutes(0,0,0);
  const end = new Date(start.getTime() + 1800000);
  const fmt = d => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Mert Demirel Clinic//EN","BEGIN:VEVENT","UID:"+Date.now()+"@mertdemirel.com","DTSTAMP:"+fmt(new Date()),"DTSTART:"+fmt(start),"DTEND:"+fmt(end),"SUMMARY:Prepare for clinic consultation","DESCRIPTION:Prepare your questions and relevant medical information. Confirm any appointment directly with the clinic.","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar"})); const a=document.createElement("a"); a.href=url; a.download="clinic-consultation-reminder.ics"; a.click(); URL.revokeObjectURL(url);
}

// Bind each shortcut directly to its own button. This avoids relying on
// delegated bubbling/capture when embedded inside third-party chat widgets.
function activateQuickAction(trigger) {
  const label = (trigger.dataset.action || trigger.textContent || "").toLowerCase();
  try {
    if (label.includes("explore")) showProcedures();
    else if (label.includes("understand")) showConcern();
    else if (label.includes("prepare")) showChecklist();
    else if (label.includes("international")) showJourney();
    else if (label.includes("recovery")) showRecovery();
    else if (label.includes("speak")) showContact();
    else return;
  } catch (error) {
    console.error("[Concierge quick action]", label, error);
    openPanel("This section could not open", "Please try again. If the problem continues, contact the clinic team.", '<p class="exp-note">The interactive section encountered a loading error. Please refresh the page and try once more.</p>');
  }
}
actions.querySelectorAll("button.action").forEach(trigger => {
  trigger.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    activateQuickAction(trigger);
  });
});

chat.addEventListener("click", event => {
  const trigger = event.target.closest("[data-exp]");
  if (!trigger) return;
  const action = trigger.dataset.exp;
  if (action === "choose-procedure") { selectedProcedure = trigger.dataset.name || "Not sure yet"; openPanel("Procedure selected", "You can now request a consultation about this topic.", "<p><b>" + esc(selectedProcedure) + "</b></p>" + button("Continue to consultation request","book","class=\"exp-btn exp-btn--primary\"")); }
  if (action === "book") {
    const names = ["Not sure yet", ...procedures.map(x=>x[1]), "Other / need guidance"];
    const options = names.map(x=>'<option ' + (x===selectedProcedure?"selected":"") + '>' + esc(x) + '</option>').join("");
    openPanel("Request a consultation","Prepare an enquiry for the clinic. This does not book or confirm an appointment.",'<form class="exp-form" data-form="booking"><label>Procedure of interest<select name="procedure">' + options + '</select></label><label>Preferred date<input type="date" name="date" min="' + today() + '" required></label><label>Preferred time<select name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Flexible</option></select></label><label>Your name<input name="name" required maxlength="100"></label><label>Phone / WhatsApp<input name="phone" required maxlength="40" placeholder="Include country code"></label><label>Email (optional)<input type="email" name="email" maxlength="254"></label><label class="exp-check"><input type="checkbox" name="consent" required> I agree the clinic may receive these details to respond to my enquiry.</label><button type="submit" class="exp-btn exp-btn--primary">Prepare consultation request</button></form>');
  }
  if (action === "contact") showContact();
  if (action === "send-checklist") {
    const checked = [...chat.querySelectorAll(".checklist input:checked")].map(x=>x.parentElement.textContent.trim());
    if (!checked.length) { alert("Tick at least one item before sending your checklist."); return; }
    sendWhatsApp("Hello Mert Demirel Clinic. These are the items I have prepared for my consultation:\n• " + checked.join("\n• "));
  }
  if (action === "calendar") addCalendarReminder();
});

chat.addEventListener("submit", event => {
  const form = event.target.closest("[data-form]");
  if (!form || form.dataset.form === "concern-wizard" || form.dataset.form === "journey" || form.dataset.form === "callback") return;
  event.preventDefault();
  const d = new FormData(form);
  if (form.dataset.form === "booking") {
    const message = "Hello Mert Demirel Clinic. I would like to request a consultation. Procedure: " + d.get("procedure") + ". Preferred date: " + d.get("date") + ". Preferred time: " + d.get("time") + " (" + tz + "). Name: " + d.get("name") + ". Phone: " + d.get("phone") + ". Email: " + (d.get("email") || "Not provided") + ".";
    if (!d.get("consent")) return;
    form.innerHTML = '<p class="exp-success">Your request is ready. WhatsApp will open so you can review and send it. The clinic must confirm the appointment.</p>';
    sendWhatsApp(message);
  }
});
})();