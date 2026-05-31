from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from app.routes.auth import get_current_user
from app.utils.rag import query_cv
from groq import Groq
import os

router = APIRouter()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# In-memory session store  {session_id: [{"role": ..., "content": ...}, ...]}
session_store: dict[str, list] = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str


@router.post("/message")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    session_id = request.session_id

    # Retrieve top-3 CV chunks relevant to the user's message
    cv_chunks = query_cv(user_id, request.message, top_k=3)
    cv_context = "\n\n".join(cv_chunks) if cv_chunks else "No CV data found yet."

    system_prompt = f"""You are CareerPilot, an expert AI career coach.
You have access to the user's CV. Use it to give personalised, specific advice.

USER'S CV (relevant sections):
{cv_context}

Guidelines:
- Always reference the user's actual experience and skills from the CV
- For cover letters: write in first person, reference specific achievements
- For skill gap analysis: compare CV to the given JD and list what's missing
- For roadmaps: give a week-by-week breakdown with real resources (Coursera, docs, YouTube)
- For role readiness: give a confident verdict with reasoning
- Format structured responses with markdown (headers, bullet points)
- Be concise but specific. Never be generic."""

    # Retrieve or create session history
    history = session_store.get(session_id, [])

    # Append the new user message
    history.append({"role": "user", "content": request.message})

    # Build full messages list
    messages = [{"role": "system", "content": system_prompt}] + history

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1500
        )
        assistant_reply = response.choices[0].message.content

        # Save assistant reply to history
        history.append({"role": "assistant", "content": assistant_reply})
        session_store[session_id] = history

        return {
            "reply": assistant_reply,
            "session_id": session_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.delete("/session/{session_id}")
async def clear_session(session_id: str, user_id: str = Depends(get_current_user)):
    """Clear conversation history for a session."""
    if session_id in session_store:
        del session_store[session_id]
    return {"message": "Session cleared"}