from fastapi import APIRouter, Depends
from app.routes.auth import get_current_user
from app.utils.mongo_client import cv_metadata_collection, tailored_cvs_collection

router = APIRouter()
interview_sessions_collection = cv_metadata_collection.database["interview_sessions"]


@router.get("/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    # CV
    cv = await cv_metadata_collection.find_one({"user_id": user_id})

    # Tailored CVs
    tailored_count = await tailored_cvs_collection.count_documents({"user_id": user_id})
    recent_tailored = []
    async for doc in tailored_cvs_collection.find({"user_id": user_id}, sort=[("created_at", -1)]).limit(3):
        recent_tailored.append({
            "id": str(doc["_id"]),
            "job_title": doc.get("job_title", ""),
            "changes_made": doc.get("changes_made", ""),
            "created_at": doc["created_at"].strftime("%b %d, %Y"),
            "pdf_url": doc.get("pdf_url", ""),
            "filename": doc.get("filename", ""),
        })

    # Interview sessions
    sessions_count = await interview_sessions_collection.count_documents({"user_id": user_id})
    recent_sessions = []
    all_scores = []
    async for doc in interview_sessions_collection.find({"user_id": user_id}, sort=[("created_at", -1)]).limit(3):
        recent_sessions.append({
            "id": str(doc["_id"]),
            "job_title": doc.get("job_title", ""),
            "overall_score": doc.get("overall_score", 0),
            "readiness_level": doc.get("readiness_level", ""),
            "questions_count": len(doc.get("questions", [])),
            "created_at": doc["created_at"].strftime("%b %d, %Y"),
        })
        all_scores.append(doc.get("overall_score", 0))

    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    return {
        "cv": {
            "uploaded": cv is not None,
            "filename": cv.get("filename", "") if cv else "",
        },
        "tailored_cvs": {
            "count": tailored_count,
            "recent": recent_tailored,
        },
        "interview_sessions": {
            "count": sessions_count,
            "avg_score": avg_score,
            "recent": recent_sessions,
        },
    }