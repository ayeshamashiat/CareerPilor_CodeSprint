from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.routes.auth import get_current_user
from app.utils.mongo_client import cv_metadata_collection

router = APIRouter()
applications_collection = cv_metadata_collection.database["applications"]
todos_collection = cv_metadata_collection.database["todos"]

COLUMNS = ["Applied", "Interviewing", "Offer", "Rejected"]


class ApplicationCreate(BaseModel):
    company: str
    role: str
    location: str = ""
    notes: str = ""
    deadline: str = ""
    source: str = ""


class ApplicationUpdate(BaseModel):
    column: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[str] = None


class TodoCreate(BaseModel):
    text: str
    due_date: str = ""


# ── Applications ──────────────────────────────────────────────────────────────

@router.post("/applications")
async def add_application(payload: ApplicationCreate, user_id: str = Depends(get_current_user)):
    doc = {
        "user_id": user_id,
        "company": payload.company,
        "role": payload.role,
        "location": payload.location,
        "notes": payload.notes,
        "deadline": payload.deadline,
        "source": payload.source,
        "column": "Applied",
        "created_at": datetime.utcnow(),
    }
    result = await applications_collection.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "company": doc["company"],
        "role": doc["role"],
        "location": doc["location"],
        "notes": doc["notes"],
        "deadline": doc["deadline"],
        "source": doc["source"],
        "column": "Applied",
        "created_at": doc["created_at"].strftime("%b %d, %Y"),
        "created_at_iso": doc["created_at"].isoformat(),
    }


@router.get("/applications")
async def get_applications(user_id: str = Depends(get_current_user)):
    apps = []
    async for doc in applications_collection.find({"user_id": user_id}, sort=[("created_at", -1)]):
        apps.append({
            "id": str(doc["_id"]),
            "company": doc.get("company", ""),
            "role": doc.get("role", ""),
            "location": doc.get("location", ""),
            "notes": doc.get("notes", ""),
            "deadline": doc.get("deadline", ""),
            "source": doc.get("source", ""),
            "column": doc.get("column", "Applied"),
            "created_at": doc["created_at"].strftime("%b %d, %Y"),
            "created_at_iso": doc["created_at"].isoformat(),
        })
    return {"applications": apps}


@router.patch("/applications/{app_id}")
async def update_application(app_id: str, payload: ApplicationUpdate, user_id: str = Depends(get_current_user)):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "Nothing to update")
    await applications_collection.update_one(
        {"_id": ObjectId(app_id), "user_id": user_id},
        {"$set": update}
    )
    return {"ok": True}


@router.delete("/applications/{app_id}")
async def delete_application(app_id: str, user_id: str = Depends(get_current_user)):
    await applications_collection.delete_one({"_id": ObjectId(app_id), "user_id": user_id})
    return {"ok": True}


# ── Todos ─────────────────────────────────────────────────────────────────────

@router.post("/todos")
async def add_todo(payload: TodoCreate, user_id: str = Depends(get_current_user)):
    doc = {
        "user_id": user_id,
        "text": payload.text,
        "due_date": payload.due_date,
        "done": False,
        "created_at": datetime.utcnow(),
    }
    result = await todos_collection.insert_one(doc)
    return {"id": str(result.inserted_id), "text": doc["text"], "due_date": doc["due_date"], "done": False}


@router.get("/todos")
async def get_todos(user_id: str = Depends(get_current_user)):
    todos = []
    async for doc in todos_collection.find({"user_id": user_id}, sort=[("created_at", -1)]):
        todos.append({
            "id": str(doc["_id"]),
            "text": doc.get("text", ""),
            "due_date": doc.get("due_date", ""),
            "done": doc.get("done", False),
        })
    return {"todos": todos}


@router.patch("/todos/{todo_id}")
async def toggle_todo(todo_id: str, user_id: str = Depends(get_current_user)):
    doc = await todos_collection.find_one({"_id": ObjectId(todo_id), "user_id": user_id})
    if not doc:
        raise HTTPException(404, "Todo not found")
    await todos_collection.update_one(
        {"_id": ObjectId(todo_id)},
        {"$set": {"done": not doc.get("done", False)}}
    )
    return {"ok": True}


@router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, user_id: str = Depends(get_current_user)):
    await todos_collection.delete_one({"_id": ObjectId(todo_id), "user_id": user_id})
    return {"ok": True}


# ── Streak & Nudge ────────────────────────────────────────────────────────────

@router.get("/streak")
async def get_streak(user_id: str = Depends(get_current_user)):
    dates = set()
    async for doc in applications_collection.find({"user_id": user_id}):
        dates.add(doc["created_at"].date())

    streak = 0
    today = datetime.utcnow().date()
    current = today
    while current in dates:
        streak += 1
        current -= timedelta(days=1)

    # If today not in dates, check from yesterday
    if streak == 0 and (today - timedelta(days=1)) in dates:
        current = today - timedelta(days=1)
        while current in dates:
            streak += 1
            current -= timedelta(days=1)

    this_week = sum(1 for d in dates if (today - d).days < 7)

    return {"streak": streak, "applied_today": today in dates, "this_week": this_week}


@router.get("/nudge")
async def get_nudge(user_id: str = Depends(get_current_user)):
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)

    recent_count = await applications_collection.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": datetime.combine(week_ago, datetime.min.time())}
    })

    if recent_count > 0:
        return {"nudge": None, "applied_this_week": recent_count}

    return {
        "nudge": "You haven't logged any applications this week. Head to Job Hunter to find matching roles.",
        "applied_this_week": 0,
    }