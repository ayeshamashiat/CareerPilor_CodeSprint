from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.cv import router as cv_router
from app.routes.fit import router as fit_router
from app.routes.chat import router as chat_router
from app.routes.tailor import router as tailor_router
from app.routes.interview import router as interview_router
from app.routes.jobs import router as jobs_router
import app.utils.cloudinary_client  
from app.routes.tracker import router as tracker_router

app = FastAPI(title="CareerPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(cv_router, prefix="/api/cv", tags=["CV"])
app.include_router(fit_router, prefix="/api/fit", tags=["Fit Score"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(tailor_router, prefix="/api/tailor", tags=["CV Tailor"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview Coach"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(tracker_router, prefix="/api/tracker", tags=["Tracker"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "CareerPilot Backend"}