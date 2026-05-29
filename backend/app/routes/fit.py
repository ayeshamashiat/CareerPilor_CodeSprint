from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.utils.embeddings import get_embedding
from app.utils.chroma_client import get_cv_collection
from app.routes.auth import get_current_user
from app.utils.rag import generate_fit_analysis
import numpy as np

router = APIRouter()

class FitScoreRequest(BaseModel):
    job_description: str
    job_title: str = ""

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@router.post("/score")
async def compute_fit_score(
    request: FitScoreRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        collection = get_cv_collection(user_id)
        jd_embedding = get_embedding(request.job_description)
        
        results = collection.query(
            query_embeddings=[jd_embedding],
            n_results=5,
            include=["documents", "embeddings", "metadatas"]
        )
        
        if not results["documents"][0]:
            raise HTTPException(404, "No CV found. Please upload your CV first.")
        
        # Compute similarity scores per section
        section_scores = []
        for doc, emb, meta in zip(
            results["documents"][0],
            results["embeddings"][0],
            results["metadatas"][0]
        ):
            sim = cosine_similarity(jd_embedding, emb)
            section_scores.append({
                "section": meta.get("section", "unknown"),
                "score": round(sim * 100, 1),
                "snippet": doc[:150] + "..." if len(doc) > 150 else doc
            })
        
        # Overall fit score = weighted average
        overall = round(sum(s["score"] for s in section_scores) / len(section_scores), 1)
        
        # Generate explanation using top matching section
        top_section = max(section_scores, key=lambda x: x["score"])
        
        # Simple explanation
        if overall >= 75:
            match_level = "Strong Match"
            explanation = f"Your {top_section['section']} section aligns well with this role."
        elif overall >= 50:
            match_level = "Moderate Match"
            explanation = f"Your {top_section['section']} shows relevant experience but some gaps exist."
        else:
            match_level = "Weak Match"
            explanation = f"This role requires skills not prominently featured in your CV."
        
        ai_analysis = generate_fit_analysis(
            request.job_title,
            request.job_description,
            section_scores,
            overall
)
        return {
            "overall_score": overall,
            "match_level": match_level,
            "explanation": explanation,
            "ai_analysis": ai_analysis,
            "section_scores": section_scores,
            "job_title": request.job_title
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error computing fit score: {str(e)}")