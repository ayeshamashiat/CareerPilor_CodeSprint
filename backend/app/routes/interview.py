from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.routes.auth import get_current_user
from app.utils.rag import query_cv
from groq import Groq
import os

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class InterviewStartRequest(BaseModel):
    job_description: str
    job_title: str = ""


class InterviewAnswerRequest(BaseModel):
    question: str
    answer: str
    job_title: str = ""


@router.post("/start")
async def start_interview(request: InterviewStartRequest, user_id: str = Depends(get_current_user)):
    """Generate 5 personalised interview questions based on JD + CV."""
    cv_chunks = query_cv(user_id, request.job_description, top_k=5)
    cv_context = "\n\n".join(cv_chunks) if cv_chunks else "No CV data."

    prompt = f"""You are a senior interviewer at a top tech company.
Generate exactly 5 realistic, specific interview questions for the role below.

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

Return ONLY a JSON array of exactly 5 strings:
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]

No markdown, no extra text, just the JSON array."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600
    )

    import json
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    questions = json.loads(raw.strip())
    return {"questions": questions, "job_title": request.job_title}


@router.post("/answer")
async def evaluate_answer(request: InterviewAnswerRequest, user_id: str = Depends(get_current_user)):
    """Evaluate a candidate's answer using the STAR framework."""
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
    "situation": {{score: 0-10, feedback: "..."}},
    "task": {{score: 0-10, feedback: "..."}},
    "action": {{score: 0-10, feedback: "..."}},
    "result": {{score: 0-10, feedback: "..."}}
  }},
  "overall_score": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "ideal_answer_hint": "A brief pointer on what an excellent answer would have included"
}}

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


@router.post("/summary")
async def session_summary(answers_payload: dict, user_id: str = Depends(get_current_user)):
    """Generate overall session readiness score and top improvements."""
    scores = answers_payload.get("scores", [])
    if not scores:
        raise HTTPException(400, "No scores provided")

    avg = sum(scores) / len(scores)
    level = "Ready" if avg >= 75 else "Almost Ready" if avg >= 55 else "Needs Practice"

    return {
        "overall_readiness": round(avg, 1),
        "readiness_level": level,
        "questions_answered": len(scores),
    }