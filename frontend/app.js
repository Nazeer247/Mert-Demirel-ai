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
