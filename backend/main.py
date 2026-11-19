import os
import json
import logging
import time
import uuid
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from groq import Groq
from pydantic import BaseModel, Field
import psycopg

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mert_concierge")
app = FastAPI(title="Mert Demirel Patient Concierge", version="0.1.0")

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "https://mert-demirel-frontend.onrender.com,http://localhost:5500,http://127.0.0.1:5500",
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

SYSTEM = """You are the virtual patient concierge for Mert Demirel Clinic in Türkiye.
Your style is warm, confident, discreet, professional and genuinely helpful.

RESPONSE LENGTH AND STYLE:
- Be concise but useful. Usually answer in 2–4 short sentences (about 45–85 words).
- Use up to 3 brief bullet points only when they make steps or options clearer.
- Do not write long introductions, repeat the visitor's question, or add unrelated background.
- Explain unfamiliar terms in plain language. Give the most useful information first.
- End with ONE relevant next step or ONE simple question when guidance is needed.
- Never ask several questions at once. Do not overwhelm the visitor with every possible detail.
- If the visitor asks a broad question, give a short overview and guide them one step at a time.
- If a visitor has already provided information, do not ask for it again.
- Do not repeat the same explanation in later turns unless asked.

CLINIC AND MEDICAL SAFETY:
- Provide general administrative and educational information and help visitors prepare for consultation.
- Never diagnose, prescribe, determine surgical eligibility, recommend an operation, or promise outcomes.
- Never invent clinic facts, prices, availability, credentials, hospitals, policies, outcomes or travel services.
- Use only facts supported by the official clinic knowledge base. If a detail is not verified, say briefly that the clinic team must confirm it.
- Do not turn a simple question into a long list of services or claims.
- For symptoms, explain briefly that a qualified clinician must assess them. For severe or emergency symptoms, advise contacting local emergency services.
- Do not request passport numbers, payment card details or unnecessary sensitive information.
- Do not claim an appointment, transfer, hotel or service is booked or confirmed. An enquiry is not a booking.
- Explain that this is an automated patient-concierge demo and clinical decisions require a qualified clinician.
- When collecting an enquiry, ask only for the single most useful missing detail at each turn."""

KNOWLEDGE_PATH = Path(__file__).with_name("clinic_knowledge.md")
try:
    CLINIC_KNOWLEDGE = KNOWLEDGE_PATH.read_text(encoding="utf-8")
except OSError:
    CLINIC_KNOWLEDGE = ""

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
        "clinic_knowledge_loaded": bool(CLINIC_KNOWLEDGE),
    }


class EnquiryRequest(BaseModel):
    enquiry_type: Literal["consultation", "callback", "international"] = "consultation"
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=40)
    email: str = Field(default="", max_length=254)
    procedure: str = Field(default="Not sure yet", max_length=120)
    country: str = Field(default="", max_length=80)
    preferred_date: str = Field(default="", max_length=20)
    preferred_time: str = Field(default="", max_length=40)
    timezone: str = Field(default="", max_length=80)
    consent: bool
    website: str = Field(default="", max_length=200)


def _send_clinic_notification(enquiry_id: str, data: EnquiryRequest) -> bool:
    api_key = os.getenv("RESEND_API_KEY")
    recipient = os.getenv("NOTIFICATION_EMAIL", "info@mertdemirel.com")
    sender = os.getenv("RESEND_FROM_EMAIL")
    if not api_key or not sender:
        logger.warning("Enquiry %s saved but email notification is not configured.", enquiry_id)
        return False
    body = {
        "from": sender,
        "to": [recipient],
        "subject": f"New patient enquiry — {enquiry_id[:8]}",
        "text": (
            f"A new patient enquiry was securely saved. Reference: {enquiry_id}\n"
            f"Type: {data.enquiry_type}\nName: {data.name}\nPhone: {data.phone}\n"
            f"Email: {data.email or 'Not provided'}\nInterest: {data.procedure}\n"
            f"Country: {data.country or 'Not provided'}\n"
            f"Preferred date/time: {data.preferred_date or 'Not specified'} / "
            f"{data.preferred_time or 'Not specified'} ({data.timezone or 'timezone not provided'})\n\n"
            "Please contact the patient directly. No clinical notes or medical records are included."
        ),
    }
    request = Request(
        "https://api.resend.com/emails",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            return 200 <= response.status < 300
    except (HTTPError, URLError, TimeoutError) as exc:
        logger.error("Clinic notification failed for enquiry %s: %s", enquiry_id, type(exc).__name__)
        return False


@app.post("/api/enquiries")
def create_enquiry(payload: EnquiryRequest):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Please provide consent before sending your enquiry.")
    if payload.website:
        # Honeypot: quietly accept automated spam without storing it.
        return {"status": "received"}
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="The secure enquiry service is not configured yet.")
    enquiry_id = str(uuid.uuid4())
    try:
        with psycopg.connect(database_url, sslmode="require", connect_timeout=8) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS patient_enquiries (
                        id UUID PRIMARY KEY,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        enquiry_type TEXT NOT NULL,
                        patient_name TEXT NOT NULL,
                        phone TEXT NOT NULL,
                        email TEXT,
                        procedure_interest TEXT,
                        country TEXT,
                        preferred_date TEXT,
                        preferred_time TEXT,
                        timezone TEXT,
                        consent BOOLEAN NOT NULL
                    )
                """)
                cur.execute("""
                    INSERT INTO patient_enquiries
                    (id, enquiry_type, patient_name, phone, email, procedure_interest,
                     country, preferred_date, preferred_time, timezone, consent)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    enquiry_id, payload.enquiry_type, payload.name.strip(), payload.phone.strip(),
                    payload.email.strip() or None, payload.procedure.strip(), payload.country.strip(),
                    payload.preferred_date, payload.preferred_time, payload.timezone, payload.consent
                ))
    except Exception as exc:
        logger.error("Enquiry database write failed: %s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="We could not save your enquiry just now. Please contact the clinic directly.")
    notified = _send_clinic_notification(enquiry_id, payload)
    return {"status": "saved", "reference": enquiry_id, "notification_sent": notified}


@app.post("/api/chat")
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
        {"role": "system", "content": "OFFICIAL CLINIC KNOWLEDGE BASE (use these verified public website facts when relevant; do not contradict or invent details):\\n\\n" + CLINIC_KNOWLEDGE},
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
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            max_completion_tokens=420,
            stream=True,
        )
    except Exception as exc:
        print(f"Groq API error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not respond right now. Please try again shortly.",
        )

    def generate():
        request_started = time.perf_counter()
        first_token_at = None
        try:
            for chunk in stream:
                if not chunk.choices:
                    continue
                piece = chunk.choices[0].delta.content
                if piece:
                    if first_token_at is None:
                        first_token_at = time.perf_counter()
                        logger.info("groq_ttft_seconds=%.3f model=%s", first_token_at - request_started, MODEL)
                    yield piece
            logger.info("groq_total_stream_seconds=%.3f model=%s", time.perf_counter() - request_started, MODEL)
        except Exception as exc:
            logger.exception("Groq streaming failed: %s", type(exc).__name__)

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
