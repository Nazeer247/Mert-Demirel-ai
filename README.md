# Mert Demirel AI Patient Concierge

Responsive HTML/CSS/JavaScript chat frontend with a Python FastAPI backend powered by Groq.

## Project structure

- `frontend/` — responsive patient chat interface
- `backend/main.py` — FastAPI application and Groq chat endpoint
- `backend/requirements.txt` — Python dependencies
- `backend/.env.example` — safe environment template

## Run locally

Requires Python 3.10 or newer.

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment (Windows PowerShell: `.venv\\Scripts\\Activate.ps1`; macOS/Linux: `source .venv/bin/activate`), then:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set your Groq API key:

```env
GROQ_API_KEY=your_real_key
GROQ_MODEL=llama-3.3-70b-versatile
FRONTEND_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Start the API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

In a second terminal from the repository root:

```bash
python -m http.server 5500 --directory frontend
```

Open http://127.0.0.1:5500.

## API endpoints

- `GET /` — service information
- `GET /health` — health and Groq configuration status
- `POST /api/chat` — chat completion using Groq

## Security and production readiness

Keep the Groq key only in the backend environment. Never commit real secrets or put API keys in browser code.

This repository is an initial demonstration, not a production clinical system. Do not enter real patient information. Before live use, implement consent and privacy notices, authenticated staff access, encrypted persistent storage, retention/deletion controls, rate limiting, audit logging, and a reviewed human handover workflow. Verify clinic-specific information with the practice. The assistant must not diagnose or make clinical decisions.
