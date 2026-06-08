# CareerPilot 🚀

> An AI-powered career platform built for **IUTCS CodeSprint 2026**

CareerPilot helps job seekers navigate every stage of their career journey — from crafting tailored CVs to practicing interviews — through a suite of AI-driven tools backed by a production-grade, load-balanced backend.

---

## Features

### AI Career Chat Assistant
Retrieval-Augmented Generation (RAG) powered chat that answers career questions using your own uploaded documents as context. Built on LLaMA via Groq API with semantic search over ChromaDB and Redis-backed session memory for multi-turn conversations.

### Auto-Tailored CV Generator
Upload your base CV and a job description. CareerPilot rewrites and formats a tailored CV as a downloadable PDF — matching keywords, reordering sections, and emphasizing relevant experience automatically.

### Voice Interview Coach
Practice mock interviews with spoken responses. The coach evaluates your answers and provides structured feedback on clarity, relevance, and confidence.

### Application Tracker (Kanban Board)
Track every job application through a four-column kanban board: **Applied → Interviewing → Offer → Rejected**. Add application cards with company, role, date, and notes; move them between stages as your process progresses. Includes a calendar view for deadlines and interview dates, a to-do list linked to career goals, and a streak counter for daily activity.

### CV Library
Persistent storage of all your generated CVs, organized by job and date. Re-download or compare versions at any time.

### Dashboard
Real-time stats on your career activity — CVs generated, interviews practiced, and chat sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python) |
| **AI / LLM** | Groq API · LLaMA 3 |
| **Vector Search** | ChromaDB · sentence-transformers |
| **Session Memory** | Redis |
| **Database** | MongoDB |
| **File Storage** | Cloudinary |
| **Frontend** | React · Vite · Tailwind CSS |
| **Infrastructure** | Docker · Nginx (load balancer) |

---

## Architecture

The backend runs as **3 replicated FastAPI instances** behind an Nginx load balancer, all sharing a persistent ChromaDB volume and a single Redis instance for session state.

```
Client (React/Vite)
        │
        ▼
  Nginx :80  ──── round-robin ────▶  backend1 :8000
                                 ▶  backend2 :8000
                                 ▶  backend3 :8000
                                        │
                          ┌─────────────┼──────────────┐
                          ▼             ▼               ▼
                       MongoDB       Redis         ChromaDB
                     (user data,  (session mem)  (embeddings)
                      CV history)
                          │
                          ▼
                      Cloudinary
                     (CV PDFs, files)
```

---

## Project Structure

```
CareerPilor_CodeSprint/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── routers/             # Modular API routes
│   ├── services/            # Business logic (RAG, CV gen, voice)
│   ├── models/              # MongoDB document models
│   ├── .env                 # Environment variables (not committed)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Chat, CV Library, Interview
│   │   └── components/
│   └── vite.config.js
├── docker-compose.yml       # Full stack orchestration
├── nginx.conf               # Load balancer config
└── README.md
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- A [Groq API key](https://console.groq.com/)
- MongoDB Atlas connection string (or local MongoDB)
- Cloudinary account credentials

### Environment Setup

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URL=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REDIS_HOST=redis
REDIS_PORT=6379
CHROMA_PERSIST_PATH=/app/chroma_store
```

### Run with Docker

```bash
git clone https://github.com/ayeshamashiat/CareerPilor_CodeSprint.git
cd CareerPilor_CodeSprint

docker compose up --build
```

The app will be available at `http://localhost`.

> The backend spins up 3 replicas (`backend1`, `backend2`, `backend3`) with Nginx distributing traffic across them. ChromaDB data persists in a named Docker volume.

### Run without Docker (development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send a message to the RAG chat assistant |
| `POST` | `/cv/generate` | Generate a tailored CV PDF from JD + base CV |
| `GET` | `/cv/library` | List all saved CVs for the current user |
| `POST` | `/interview/start` | Start a mock interview session |
| `GET` | `/dashboard/stats` | Fetch real-time user activity stats |

---

## Team

Built at **IUTCS CodeSprint 2026** by a three-person team from Islamic University of Technology.

| Member | Role | Responsibilities |
|---|---|---|
| Israt Risha Ivey | Backend & RAG | CV upload pipeline, text extraction & chunking, ChromaDB vector store, job hunter agent with tool-calling, fit score computation, FastAPI endpoints, DB schema, demo video |
| Ayesha Mashiat | AI Agents & LLM | RAG chat assistant, auto-tailored CV PDF generator, voice interview coach, Docker/Nginx load balancer setup |
| Nishat Tasnim Preownti | Frontend & UI | React UI components, kanban tracker, dashboard, calendar view, recruiter outreach generator|

---

## Hackathon Context

This project was submitted to **IUTCS CodeSprint 2026**. The entire platform — from system design to deployment configuration — was built within the hackathon window.

---
