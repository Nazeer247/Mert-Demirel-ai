const API_BASE = (window.MERT_API_BASE || "https://mert-demirel-ai.onrender.com").replace(/\/$/, "");
const chat = document.getElementById("chat");
const composer = document.getElementById("composer");
const input = document.getElementById("messageInput");
const sendButton = composer.querySelector(".send");
const actions = document.getElementById("actions");
const closeBtn = document.getElementById("closeBtn");
const widget = document.getElementById("widget");
const history = [];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function scrollChat() {
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}
function appendMessage(message, role = "bot") {
  const row = document.createElement("div");
  row.className = role === "user" ? "msg msg--user" : "msg msg--bot";
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "M";
    row.appendChild(avatar);
  }
  const col = document.createElement("div");
  col.className = "msg__col";
  const bubble = document.createElement("div");
  bubble.className = role === "user" ? "bubble bubble--user" : "bubble bubble--white";
  bubble.textContent = message;
  const time = document.createElement("time");
  time.className = "time";
  time.textContent = nowTime();
  col.append(bubble, time);
  row.appendChild(col);
  chat.appendChild(row);
  scrollChat();
}
function showTyping(show) {
  let note = document.getElementById("typingNotice");
  if (show && !note) {
    note = document.createElement("div");
    note.id = "typingNotice";
    note.className = "chat-notice";
    note.textContent = "Your concierge is preparing a response…";
    chat.appendChild(note);
  } else if (!show && note) note.remove();
  if (show) scrollChat();
}
async function requestBotReply(message) {
  const response = await fetch(API_BASE + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-12) })
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error("The concierge returned an unexpected response. Please try again."); }
  if (!response.ok) throw new Error(data.detail || "The concierge is temporarily unavailable.");
  if (!data.reply) throw new Error("The concierge could not prepare a reply. Please try again.");
  return data.reply;
}
async function handleSend(value) {
  const message = value.trim();
  if (!message || sendButton.disabled) return;
  appendMessage(message, "user");
  history.push({ role: "user", content: message });
  input.value = "";
  sendButton.disabled = true;
  showTyping(true);
  try {
    const reply = await requestBotReply(message);
    history.push({ role: "assistant", content: reply });
    showTyping(false);
    appendMessage(reply, "bot");
  } catch (error) {
    showTyping(false);
    appendMessage(error.message === "Failed to fetch"
      ? "I can't reach the concierge service right now. Please try again in a moment."
      : error.message, "bot");
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
}
composer.addEventListener("submit", event => {
  event.preventDefault();
  handleSend(input.value);
});
actions.addEventListener("click", event => {
  const button = event.target.closest(".action");
  if (button) handleSend(button.dataset.action || button.textContent.trim());
});
closeBtn.addEventListener("click", () => {
  widget.classList.toggle("is-closed");
  document.dispatchEvent(new CustomEvent("concierge:close"));
});
// The current FastAPI endpoint accepts text only. Keep the attachment control
// visible as designed, but do not pretend files are uploaded or sent.
document.getElementById("attachBtn").addEventListener("click", () => {
  appendMessage("File attachments are not enabled in this demo yet.", "bot");
});


/* Multilingual interface: translations are currently complete for 7 languages. */
const LANGUAGES = [
 ["en","English"],["tr","Türkçe"],["ar","العربية",1],["fr","Français"],["es","Español"],["de","Deutsch"],
 ["ru","Русский"],["it","Italiano"],["pt","Português"],["nl","Nederlands"],["pl","Polski"],["uk","Українська"],
 ["ro","Română"],["el","Ελληνικά"],["cs","Čeština"],["sv","Svenska"],["no","Norsk"],["da","Dansk"],
 ["fi","Suomi"],["hu","Magyar"],["bg","Български"],["sr","Српски"],["hr","Hrvatski"],["az","Azərbaycanca"],
 ["kk","Қазақша"],["fa","فارسی",1],["he","עברית",1],["ur","اردو",1],["hi","हिन्दी"],["bn","বাংলা"],
 ["zh","中文"],["ja","日本語"],["ko","한국어"],["th","ไทย"],["vi","Tiếng Việt"],["id","Bahasa Indonesia"],
 ["ms","Bahasa Melayu"],["sw","Kiswahili"]
];
const I18N = {
 en:{subtitle:"AI Patient Concierge",online:"24/7 Online",hello:"Hello!",welcome:"Welcome to Mert Demirel Clinic.",help:"How can I assist you today?",bt:"Expert Care. Natural Results.",bs:"Your journey to confidence<br>starts here.",a:["Explore Procedures","Understand a Concern","Prepare for Consultation","International Journey","Recovery & Aftercare","Speak with the Clinic"],ph:"Type your message...",secure:"Your information is secure and confidential.",feel:"Feel free to ask me anything — from procedures to travel, booking, or aftercare. I'm here to help.",search:"Search language..."},
 tr:{subtitle:"Yapay Zekâ Hasta Danışmanı",online:"7/24 Çevrimiçi",hello:"Merhaba!",welcome:"Mert Demirel Kliniği'ne hoş geldiniz.",help:"Bugün size nasıl yardımcı olabilirim?",bt:"Uzman Bakım. Doğal Sonuçlar.",bs:"Özgüvene giden yolculuğunuz<br>burada başlıyor.",a:["Prosedürleri Keşfedin","Bir Endişeyi Anlayın","Konsültasyona Hazırlık","Uluslararası Yolculuk","İyileşme ve Bakım","Klinikle Konuşun"],ph:"Mesajınızı yazın...",secure:"Bilgileriniz güvenli ve gizlidir.",feel:"Prosedürlerden seyahate, rezervasyondan bakıma kadar bana her şeyi sorabilirsiniz. Yardımcı olmak için buradayım.",search:"Dil ara..."},
 ar:{subtitle:"مساعد المرضى بالذكاء الاصطناعي",online:"متصل 24/7",hello:"مرحباً!",welcome:"أهلاً بك في عيادة ميرت ديميريل.",help:"كيف يمكنني مساعدتك اليوم؟",bt:"رعاية متخصصة. نتائج طبيعية.",bs:"رحلتك نحو الثقة<br>تبدأ من هنا.",a:["استكشف الإجراءات","افهم مشكلتك","التحضير للاستشارة","الرحلة الدولية","التعافي والرعاية اللاحقة","تحدث مع العيادة"],ph:"اكتب رسالتك...",secure:"معلوماتك آمنة وسرية.",feel:"اسألني عن أي شيء، من الإجراءات إلى السفر والحجز والرعاية اللاحقة. أنا هنا للمساعدة.",search:"ابحث عن لغة..."},
 fr:{subtitle:"Concierge IA des patients",online:"En ligne 24h/24",hello:"Bonjour !",welcome:"Bienvenue à la Clinique Mert Demirel.",help:"Comment puis-je vous aider aujourd'hui ?",bt:"Soins d'experts. Résultats naturels.",bs:"Votre parcours vers la confiance<br>commence ici.",a:["Découvrir les procédures","Comprendre une préoccupation","Préparer la consultation","Voyage international","Convalescence et suivi","Parler à la clinique"],ph:"Écrivez votre message...",secure:"Vos informations sont sécurisées et confidentielles.",feel:"Posez-moi toutes vos questions, des procédures au voyage, à la réservation ou au suivi. Je suis là pour vous aider.",search:"Rechercher une langue..."},
 es:{subtitle:"Conserje de pacientes con IA",online:"En línea 24/7",hello:"¡Hola!",welcome:"Bienvenido a la Clínica Mert Demirel.",help:"¿En qué puedo ayudarle hoy?",bt:"Cuidado experto. Resultados naturales.",bs:"Su camino hacia la confianza<br>comienza aquí.",a:["Explorar procedimientos","Entender una inquietud","Preparar la consulta","Viaje internacional","Recuperación y cuidados","Hablar con la clínica"],ph:"Escriba su mensaje...",secure:"Su información es segura y confidencial.",feel:"Pregúnteme lo que quiera: procedimientos, viaje, reservas o cuidados posteriores. Estoy aquí para ayudar.",search:"Buscar idioma..."},
 de:{subtitle:"KI-Patientenconcierge",online:"24/7 Online",hello:"Hallo!",welcome:"Willkommen in der Mert Demirel Klinik.",help:"Wie kann ich Ihnen heute helfen?",bt:"Expertenpflege. Natürliche Ergebnisse.",bs:"Ihr Weg zu mehr Selbstvertrauen<br>beginnt hier.",a:["Behandlungen entdecken","Ein Anliegen verstehen","Beratung vorbereiten","Internationale Reise","Erholung & Nachsorge","Mit der Klinik sprechen"],ph:"Nachricht eingeben...",secure:"Ihre Daten sind sicher und vertraulich.",feel:"Fragen Sie mich alles – von Behandlungen über Reise und Buchung bis zur Nachsorge. Ich helfe gern.",search:"Sprache suchen..."},
 ru:{subtitle:"ИИ-консьерж для пациентов",online:"Онлайн 24/7",hello:"Здравствуйте!",welcome:"Добро пожаловать в клинику Mert Demirel.",help:"Чем я могу вам помочь сегодня?",bt:"Экспертный уход. Естественный результат.",bs:"Ваш путь к уверенности<br>начинается здесь.",a:["Узнать о процедурах","Разобраться в проблеме","Подготовка к консультации","Международная поездка","Восстановление и уход","Связаться с клиникой"],ph:"Введите сообщение...",secure:"Ваши данные защищены и конфиденциальны.",feel:"Спрашивайте о чём угодно: процедуры, поездка, запись или уход после лечения. Я готов помочь.",search:"Поиск языка..."}
};
const langBtn=document.getElementById("langBtn"),langPanel=document.getElementById("langPanel"),langList=document.getElementById("langList"),langSearch=document.getElementById("langSearch"),langCurrent=document.getElementById("langCurrent");
let currentLang="en";
function applyLanguage(code){
 const meta=LANGUAGES.find(l=>l[0]===code)||LANGUAGES[0],t=I18N[code]||I18N.en;
 currentLang=meta[0];widget.setAttribute("dir",meta[2]?"rtl":"ltr");document.documentElement.lang=currentLang;langCurrent.textContent=meta[1];
 const welcome=document.querySelector(".bubble--white");
 welcome.innerHTML="<strong></strong> <span class='wave'>👋</span><br><span class='welcome-copy'></span>";
 welcome.querySelector("strong").textContent=t.hello;
 welcome.querySelector(".welcome-copy").textContent=t.welcome+" "+t.help;
 document.querySelector(".header__titles p").textContent=t.subtitle;
 document.querySelector(".status-text").textContent=t.online;
 document.querySelector(".banner__text h2").textContent=t.bt;
 document.querySelector(".banner__text p").innerHTML=t.bs;
 document.querySelectorAll(".action .action__label").forEach((el,i)=>el.textContent=t.a[i]);
 input.placeholder=t.ph;
 const secure=document.querySelector(".secure");secure.lastChild.textContent=t.secure;
 document.querySelector(".bubble--beige").textContent=t.feel;langSearch.placeholder=t.search;
 try{localStorage.setItem("concierge_lang",currentLang)}catch(e){}
 document.dispatchEvent(new CustomEvent("concierge:language",{detail:{code:currentLang}}));
}
function renderLanguages(filter=""){
 const q=filter.trim().toLowerCase();langList.innerHTML="";
 LANGUAGES.filter(l=>l[1].toLowerCase().includes(q)||l[0].includes(q)).forEach(l=>{
  const li=document.createElement("li");li.setAttribute("role","option");li.textContent=l[1];if(l[0]===currentLang)li.classList.add("active");
  li.addEventListener("click",()=>{applyLanguage(l[0]);closeLang()});langList.appendChild(li);
 });
}
function openLang(){langPanel.hidden=false;langBtn.setAttribute("aria-expanded","true");langSearch.value="";renderLanguages();langSearch.focus()}
function closeLang(){langPanel.hidden=true;langBtn.setAttribute("aria-expanded","false")}
langBtn.addEventListener("click",e=>{e.stopPropagation();langPanel.hidden?openLang():closeLang()});
langSearch.addEventListener("input",()=>renderLanguages(langSearch.value));
langPanel.addEventListener("click",e=>e.stopPropagation());document.addEventListener("click",closeLang);
let saved="en";try{saved=localStorage.getItem("concierge_lang")||"en"}catch(e){}applyLanguage(saved);
