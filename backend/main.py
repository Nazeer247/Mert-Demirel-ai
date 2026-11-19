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

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5500,http://127.0.0.1:5500",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

SYSTEM = """You are the virtual patient concierge for the Mert Demirel practice in Türkiye.
Be warm, concise, discreet and professional.
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
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Message] = Field(default_factory=list, max_length=12)
    language: str = Field(default="English", max_length=60)
    language_code: str = Field(default="en", max_length=8)


class ChatResponse(BaseModel):
    reply: str
    model: str


@app.get("/")
def root():
    return {
        "name": "Mert Demirel Patient Concierge",
        "status": "running",
        "provider": "Groq",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise HTTPException(
            status_code=503,
            detail="Groq API key is not configured on the server.",
        )

    selected_language = payload.language.strip() or "English"
    selected_code = payload.language_code.strip() or "en"

    language_instruction = (
        f"MANDATORY LANGUAGE RULE: The visitor selected {selected_language} "
        f"(language code: {selected_code}). "
        f"Write the entire reply in {selected_language}, including greetings, "
        "questions, explanations, button-flow responses and follow-up questions. "
        "Do not answer in English unless English is the selected language. "
        "Do not let the language used in previous messages change this selection. "
        "Keep using this selected language for every turn until a new language is selected. "
        "Use natural, fluent wording; do not merely describe or translate the language rule."
    )

    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "system", "content": language_instruction},
    ]

    for item in payload.history:
        messages.append({"role": item.role, "content": item.content})

    if (
        not payload.history
        or payload.history[-1].role != "user"
        or payload.history[-1].content != payload.message
    ):
        messages.append({"role": "user", "content": payload.message})

    try:
        client = Groq(api_key=key)
        result = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            max_completion_tokens=700,
        )
        reply = result.choices[0].message.content or ""
        if not reply.strip():
            raise ValueError("The AI returned an empty reply.")
        return ChatResponse(reply=reply, model=result.model)
    except Exception as exc:
        print(f"Groq API error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not respond right now. Please try again shortly.",
        )
