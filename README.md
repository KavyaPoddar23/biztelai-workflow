# BiztelAI AI-Powered Workflow Automation System

An AI-powered web application to digitize handwritten manufacturing documents into structured, reviewable operational records with analytics and validation workflows.

## Live Demo

- **Frontend:** https://biztelai-workflow.vercel.app
- **Backend API:** https://biztelai-backend-d3fh.onrender.com
- **API Docs:** https://biztelai-backend-d3fh.onrender.com/docs

Note: Backend is hosted on Render free tier and may take 30 seconds to wake up on first request.

## Features

- Upload handwritten machine shop log images (JPG, PNG, PDF)
- AI-based data extraction using Groq (Llama 4 Scout)
- Confidence scoring per extracted field (color coded)
- Manual review and correction workflow
- Validation with business rules and error highlighting
- Analytics dashboard with charts and summaries
- Search and filter records by shift, machine, date, employee

## Tech Stack

Frontend: React.js, Tailwind CSS, Recharts
Backend: Python, FastAPI
AI/OCR: Groq API (Llama 4 Scout)
Database: SQLite
Deployment: Vercel (frontend), Render (backend)

## Project Structure

biztelai-workflow/
backend/
main.py FastAPI app and all endpoints
database.py SQLite setup and connection
extractor.py Groq AI extraction logic
validator.py Business rule validation
requirements.txt
runtime.txt
.env.example
README.md
AGENTS.md
frontend/
src/
pages/
UploadPage.js
ReviewPage.js
DashboardPage.js
SearchPage.js
components/
Navbar.js
config.js

## Setup Instructions

### Backend

Step 1 - Go to backend folder
cd backend

Step 2 - Create virtual environment
python -m venv venv

Step 3 - Activate virtual environment
Windows: venv\Scripts\activate
Mac/Linux: source venv/bin/activate

Step 4 - Install dependencies
pip install -r requirements.txt

Step 5 - Run the server
uvicorn main:app --reload

### Frontend

Step 1 - Go to frontend folder
cd frontend

Step 2 - Install dependencies
npm install

Step 3 - Start the app
npm start

## Environment Variables

Copy .env.example to .env and fill in your keys

GROQ_API_KEY=your_groq_api_key_here

## Architecture Overview

1. User uploads image via React frontend
2. FastAPI saves file and stores upload record in SQLite
3. Groq AI (Llama 4 Scout) reads the image and extracts structured data
4. Validation rules run automatically on extracted data
5. User reviews, edits, and saves records
6. Dashboard aggregates all records for operational insights

## Validation Rules Implemented

- Missing mandatory fields (date, shift, emp no, machine no)
- Invalid shift values (must be I, II, III or 1, 2, 3)
- Employee number format (must be BT followed by 4 digits)
- Machine number format (must be MC-XXX)
- Suspicious quantity values (0 or above 200)
- Negative quantities
- Time taken above 24 hours
- Duplicate work order numbers

## Assumptions and Tradeoffs

- Used Groq free tier instead of paid APIs for AI extraction
- SQLite used for simplicity, can be replaced with PostgreSQL for production
- Machine number format assumed to be MC-XXX (3 digits)
- Employee number format assumed to be BT followed by 4 digits
- Render free tier spins down after inactivity, first request may be slow
