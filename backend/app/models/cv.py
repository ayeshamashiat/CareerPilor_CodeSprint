from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CVMetadata(BaseModel):
    user_id: str
    filename: str
    cloudinary_url: str
    sections_indexed: List[str]
    uploaded_at: datetime

class CVQueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = 3

class CVQueryResponse(BaseModel):
    user_id: str
    question: str
    results: List[str]