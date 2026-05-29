from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.cv import router as cv_router
from app.routes.fit import router as fit_router

app = FastAPI(title="CareerPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(cv_router, prefix="/api/cv", tags=["CV"])
app.include_router(fit_router, prefix="/api/fit", tags=["Fit Score"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "CareerPilot Backend"}