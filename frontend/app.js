const API_BASE=(window.MERT_API_BASE||"https://mert-demirel-ai.onrender.com").replace(/\/$/,"");
const box=document.getElementById("messages");
const form=document.getElementById("form");
const input=document.getElementById("message");
const send=form.querySelector(".send-button");
const history=[];
document.getElementById("year").textContent=new Date().getFullYear();

function add(text,role="assistant"){
  const el=document.createElement("article");
  el.className=role==="user"?"bubble user":"bubble";
  const p=document.createElement("p");p.textContent=text;
  const t=document.createElement("small");t.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  el.append(p,t);box.append(el);box.scrollTop=box.scrollHeight;
}
function typing(on){
  let n=document.getElementById("typing");
  if(on&&!n){n=document.createElement("div");n.id="typing";n.className="typing";n.textContent="Your concierge is preparing a response…";box.append(n);}
  else if(!on&&n)n.remove();
  box.scrollTop=box.scrollHeight;
}
async function ask(value){
  const message=value.trim();
  if(!message||send.disabled)return;
  add(message,"user");history.push({role:"user",content:message});
  input.value="";input.style.height="auto";send.disabled=true;typing(true);
  try{
    const response=await fetch(API_BASE+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,history:history.slice(-12)})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.detail||"The concierge is temporarily unavailable.");
    const reply=data.reply||"Please try again.";
    history.push({role:"assistant",content:reply});typing(false);add(reply);
  }catch(error){
    typing(false);
    add(error.message==="Failed to fetch"?"The concierge connection is not available yet. Please try again in a moment.":error.message);
  }finally{send.disabled=false;input.focus();}
}
form.addEventListener("submit",event=>{event.preventDefault();ask(input.value);});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,100)+"px";});
input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();form.requestSubmit();}});
document.getElementById("services").addEventListener("click",event=>{
  const card=event.target.closest("[data-prompt]");
  if(card)ask(card.dataset.prompt);
});
document.getElementById("reset").addEventListener("click",()=>{
  history.length=0;box.innerHTML='<p class="chat-date">YOUR CONVERSATION STARTS HERE</p>';
  add("Welcome back. How may I help you today?");
});
document.getElementById("language").addEventListener("click",()=>{
  const language=prompt("Which language would you like to use?");
  if(language&&language.trim())ask("Please continue our conversation in "+language.trim()+".");
});