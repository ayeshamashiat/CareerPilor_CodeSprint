from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime
import tempfile
import os

from app.routes.auth import get_current_user
from app.utils.rag import query_cv
from app.utils.mongo_client import cv_metadata_collection
from groq import Groq
from bson import ObjectId

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
interview_sessions_collection = cv_metadata_collection.database["interview_sessions"]


class InterviewStartRequest(BaseModel):
    job_description: str
    job_title: str = ""
    num_questions: int = 5


class InterviewAnswerRequest(BaseModel):
    question: str
    answer: str
    job_title: str = ""


class SaveSessionRequest(BaseModel):
    job_title: str
    job_description: str
    questions: List[str]
    evaluations: List[dict]
    scores: List[float]
    overall_score: float
    readiness_level: str


@router.post("/start")
async def start_interview(request: InterviewStartRequest, user_id: str = Depends(get_current_user)):
    num_q = max(3, min(10, request.num_questions))
    cv_chunks = query_cv(user_id, request.job_description, top_k=5)
    cv_context = "\n\n".join(cv_chunks) if cv_chunks else "No CV data."

    prompt = f"""You are a senior interviewer at a top tech company.
Generate exactly {num_q} realistic, specific interview questions for the role below.

ROLE: {request.job_title}

JOB DESCRIPTION:
{request.job_description[:800]}

CANDIDATE'S CV:
{cv_context}

RULES:
- Questions must directly reference the candidate's actual projects, skills, or experience
- Mix behavioural (STAR) and technical questions relevant to the role
- Do NOT ask generic questions like "tell me about yourself"
- Each question should be challenging but fair

Return ONLY a JSON array of exactly {num_q} strings:
["Question 1", "Question 2", ...]

No markdown, no extra text, just the JSON array."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200 * num_q
    )

    import json
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    questions = json.loads(raw.strip())
    return {"questions": questions, "job_title": request.job_title, "cv_context": cv_chunks}


@router.post("/answer")
async def evaluate_answer(request: InterviewAnswerRequest, user_id: str = Depends(get_current_user)):
    prompt = f"""You are an expert interview coach evaluating a candidate's answer.

ROLE BEING INTERVIEWED FOR: {request.job_title}

INTERVIEW QUESTION:
{request.question}

CANDIDATE'S ANSWER:
{request.answer}

Evaluate the answer using the STAR framework (Situation, Task, Action, Result).

Return a JSON object with these exact keys:
{{
  "star_scores": {{
    "situation": {{"score": 0, "feedback": "..."}},
    "task": {{"score": 0, "feedback": "..."}},
    "action": {{"score": 0, "feedback": "..."}},
    "result": {{"score": 0, "feedback": "..."}}
  }},
  "overall_score": 0,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "ideal_answer_hint": "A brief pointer on what an excellent answer would have included"
}}

Scores: star scores 0-10, overall_score 0-100.
Be specific, constructive, and honest. Return ONLY valid JSON."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )

    import json
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    evaluation = json.loads(raw.strip())
    return evaluation


@router.post("/save")
async def save_session(payload: SaveSessionRequest, user_id: str = Depends(get_current_user)):
    doc = {
        "user_id": user_id,
        "job_title": payload.job_title,
        "job_description": payload.job_description[:200],
        "questions": payload.questions,
        "evaluations": payload.evaluations,
        "scores": payload.scores,
        "overall_score": payload.overall_score,
        "readiness_level": payload.readiness_level,
        "created_at": datetime.utcnow(),
    }
    result = await interview_sessions_collection.insert_one(doc)
    return {"session_id": str(result.inserted_id)}


@router.get("/sessions")
async def get_sessions(user_id: str = Depends(get_current_user)):
    cursor = interview_sessions_collection.find(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    sessions = []
    async for doc in cursor:
        sessions.append({
            "id": str(doc["_id"]),
            "job_title": doc.get("job_title", ""),
            "overall_score": doc.get("overall_score", 0),
            "readiness_level": doc.get("readiness_level", ""),
            "questions_count": len(doc.get("questions", [])),
            "created_at": doc["created_at"].strftime("%b %d, %Y"),
        })
    return {"sessions": sessions}


@router.get("/export/{session_id}")
async def export_session(session_id: str, user_id: str = Depends(get_current_user)):
    doc = await interview_sessions_collection.find_one(
        {"_id": ObjectId(session_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(404, "Session not found")

    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_CENTER

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name

    doc_pdf = SimpleDocTemplate(
        output_path, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    title_style = ParagraphStyle("Title", fontSize=20, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#5b21b6"), alignment=TA_CENTER, spaceAfter=4)
    sub_style = ParagraphStyle("Sub", fontSize=11,
        textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER, spaceAfter=4)
    score_style = ParagraphStyle("Score", fontSize=11, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#059669"), alignment=TA_CENTER, spaceAfter=12)
    section_style = ParagraphStyle("Section", fontSize=11, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#5b21b6"), spaceBefore=14, spaceAfter=4)
    body_style = ParagraphStyle("Body", fontSize=10, leading=14, spaceAfter=3)
    hint_style = ParagraphStyle("Hint", fontSize=9, fontName="Helvetica-Oblique",
        textColor=colors.HexColor("#6b7280"), spaceAfter=4)

    story = []
    story.append(Paragraph("Interview Session Report", title_style))
    story.append(Paragraph(f"{doc.get('job_title', 'Interview')} — {doc['created_at'].strftime('%b %d, %Y')}", sub_style))
    story.append(Paragraph(f"Overall Score: {doc.get('overall_score', 0)}% — {doc.get('readiness_level', '')}", score_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#5b21b6")))
    story.append(Spacer(1, 12))

    for i, (q, ev) in enumerate(zip(doc.get("questions", []), doc.get("evaluations", []))):
        story.append(Paragraph(f"Q{i+1}: {q}", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"Score: {ev.get('overall_score', 0)}%", body_style))
        star = ev.get("star_scores", {})
        for key, val in star.items():
            story.append(Paragraph(f"{key.upper()}: {val.get('score', 0)}/10 — {val.get('feedback', '')}", body_style))
        if ev.get("strengths"):
            story.append(Paragraph("Strengths: " + " | ".join(ev["strengths"]), body_style))
        if ev.get("improvements"):
            story.append(Paragraph("Improve: " + " | ".join(ev["improvements"]), body_style))
        if ev.get("ideal_answer_hint"):
            story.append(Paragraph(f"Hint: {ev['ideal_answer_hint']}", hint_style))
        story.append(Spacer(1, 8))

    doc_pdf.build(story)

    job_title_safe = doc.get("job_title", "interview").replace(" ", "_")
    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=f"interview_report_{job_title_safe}.pdf"
    )


@router.post("/summary")
async def session_summary(answers_payload: dict, user_id: str = Depends(get_current_user)):
    scores = answers_payload.get("scores", [])
    if not scores:
        raise HTTPException(400, "No scores provided")
    avg = sum(scores) / len(scores)
    level = "Ready" if avg >= 75 else "Almost Ready" if avg >= 55 else "Needs Practice"
    return {"overall_readiness": round(avg, 1), "readiness_level": level, "questions_answered": len(scores)}