import os
from typing import Literal
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

load_dotenv()
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
app = FastAPI(title="Mert Demirel Patient Concierge", version="0.1.0")
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET","POST"], allow_headers=["Content-Type"])

SYSTEM = """You are the virtual patient concierge for the Mert Demirel practice in Türkiye.
Reply in the patient's language and be warm, concise, discreet and professional.
Provide general administrative information and help visitors prepare a consultation.
Never diagnose, prescribe, decide surgical eligibility, recommend an operation, or promise outcomes.
Never invent clinic facts, prices, availability, credentials, hospitals, policies or travel services.
If verified information is unavailable, say the clinic team must confirm it.
For symptoms, explain that a qualified clinician must assess them. For severe or emergency symptoms,
advise contacting local emergency services. Ask one question at a time when gathering an enquiry.
Do not request passport numbers, payment card details or unnecessary sensitive information.
Explain that this is an automated demo and all clinical decisions require a qualified clinician.
Do not claim an appointment is booked. Offer to prepare an enquiry for human follow-up."""

class Message(BaseModel):
    role: Literal["user","assistant"]
    content: str = Field(min_length=1,max_length=4000)
class ChatRequest(BaseModel):
    message: str = Field(min_length=1,max_length=2000)
    history: list[Message] = Field(default_factory=list,max_length=12)\n    language: str = Field(default="English",max_length=60)\n    language_code: str = Field(default="en",max_length=8)
class ChatResponse(BaseModel):
    reply: str
    model: str

@app.get("/")
def root():
    return {"name":"Mert Demirel Patient Concierge","status":"running","provider":"Groq"}
@app.get("/health")
def health():
    return {"status":"ok","groq_configured":bool(os.getenv("GROQ_API_KEY"))}
@app.post("/api/chat",response_model=ChatResponse)
def chat(payload: ChatRequest):
    key=os.getenv("GROQ_API_KEY")
    if not key:
        raise HTTPException(status_code=503,detail="Groq API key is not configured on the server.")
    language_instruction = (\n        f"\n\nMANDATORY RESPONSE LANGUAGE: {payload.language} (code: {payload.language_code}). " \n        f"Write every response and every follow-up question entirely in {payload.language}. " \n        "Do not switch to English unless the selected language is English or the patient explicitly asks to change language. " \n        "This rule applies especially to shortcut-button flows and multi-step questionnaires. " \n        "Keep the selected language for the entire conversation, regardless of the language used in earlier chat history."\n    )\n    messages=[{"role":"system","content":SYSTEM + language_instruction}]
    for item in payload.history:
        messages.append({"role":item.role,"content":item.content})
    if not payload.history or payload.history[-1].role!="user" or payload.history[-1].content!=payload.message:
        messages.append({"role":"user","content":payload.message})
    try:
        client=Groq(api_key=key)
        result=client.chat.completions.create(model=MODEL,messages=messages,temperature=0.4,max_completion_tokens=700)
        return ChatResponse(reply=result.choices[0].message.content or "I'm sorry, please try again.",model=result.model)
    except Exception as exc:
        print(f"Groq API error: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=502,detail="The AI service could not respond right now. Please try again shortly.")
