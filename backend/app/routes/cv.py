from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.utils.cloudinary_client import upload_cv
from app.routes.auth import get_current_user
from datetime import datetime
from app.utils.rag import index_cv, query_cv, generate_cv_greeting
from app.utils.mongo_client import cv_metadata_collection, users_collection
from bson import ObjectId

router = APIRouter()

@router.post("/upload")
async def upload_cv_endpoint(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only PDF or DOCX files allowed")

    file_bytes = await file.read()
    file_type = "pdf" if "pdf" in file.content_type else "docx"

    cloudinary_url = upload_cv(file_bytes, file.filename, user_id)
    sections_indexed = index_cv(user_id, file_bytes, file_type)

    await cv_metadata_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "filename": file.filename,
            "cloudinary_url": cloudinary_url,
            "sections_indexed": sections_indexed,
            "uploaded_at": datetime.utcnow()
        }},
        upsert=True
    )

    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user_name = user["name"] if user else "there"
    greeting = generate_cv_greeting(user_name, sections_indexed)

    return JSONResponse({
        "message": "CV uploaded and indexed successfully",
        "sections_indexed": sections_indexed,
        "cloudinary_url": cloudinary_url,
        "greeting": greeting
    })
    

@router.get("/query")
async def query_cv_endpoint(
    question: str,
    top_k: int = 3,
    user_id: str = Depends(get_current_user)
):
    chunks = query_cv(user_id, question, top_k)
    if not chunks:
        raise HTTPException(404, "No CV data found for this user")
    return {"user_id": user_id, "question": question, "results": chunks}

@router.get("/metadata")
async def get_cv_metadata(user_id: str = Depends(get_current_user)):
    metadata = await cv_metadata_collection.find_one({"user_id": user_id})
    if not metadata:
        raise HTTPException(404, "No CV found for this user")
    metadata["_id"] = str(metadata["_id"])
    return metadata