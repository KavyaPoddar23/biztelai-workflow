# BiztelAI Workflow Automation System

AI-powered web application to digitize handwritten manufacturing documents into structured, reviewable operational records.

## Features
- Upload handwritten machine shop log images
- AI-based data extraction using Groq (Llama 4)
- Confidence scoring for each extracted field
- Manual review and correction workflow
- Validation with business rules
- Analytics dashboard
- Search and filter records

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI
- **AI:** Groq API (Llama 4 Scout)
- **Database:** SQLite

## Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
GROQ_API_KEY=your_groq_api_key_here

## Architecture
- Frontend (React) → Backend (FastAPI) → Groq AI API
- Uploaded images stored in `/backend/uploads`
- SQLite database stores uploads and extracted records
- Validation runs automatically after extraction

## Assumptions & Tradeoffs
- Used Groq (free tier) instead of paid APIs for AI extraction
- SQLite used for simplicity — can be replaced with PostgreSQL
- Machine number format assumed to be MC-XXX (3 digits)
- Employee number format assumed to be BT followed by 4 digits