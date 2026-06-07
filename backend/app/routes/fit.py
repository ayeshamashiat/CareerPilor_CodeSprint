from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.utils.embeddings import get_embedding
from app.utils.chroma_client import get_cv_collection
from app.routes.auth import get_current_user
from app.utils.rag import generate_fit_analysis
from groq import Groq
import os
import json
import math

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

STOP_WORDS = {'the','a','an','and','or','for','in','on','at','to','of','is','are','was','with','that','this','it','as','be','by','from','have','has','not','but'}

class FitScoreRequest(BaseModel):
    job_description: str
    job_title: str = ""

def cosine_similarity(a, b):
    # If the inputs are nested lists, we assume they represent a single vector, so we flatten them if necessary, 
    # but chroma returns flat lists for embeddings anyway.
    if hasattr(a[0], '__iter__'): a = a[0]
    if hasattr(b[0], '__iter__'): b = b[0]
    
    dot_product = sum(float(x) * float(y) for x, y in zip(a, b))
    magnitude_a = math.sqrt(sum(float(x) * float(x) for x in a))
    magnitude_b = math.sqrt(sum(float(x) * float(x) for x in b))
    if magnitude_a == 0.0 or magnitude_b == 0.0:
        return 0.0
    return float(dot_product / (magnitude_a * magnitude_b))

def hybrid_score(jd_text: str, cv_text: str, embedding_sim: float) -> float:
    jd_words = set(jd_text.lower().split()) - STOP_WORDS
    cv_words = set(cv_text.lower().split()) - STOP_WORDS
    if not jd_words:
        return embedding_sim * 100
    overlap = len(jd_words & cv_words) / len(jd_words)
    keyword_score = min(overlap * 150, 100)
    final = (embedding_sim * 100 * 0.4) + (keyword_score * 0.6)
    return round(min(final, 100), 1)

async def ai_powered_score(jd_text: str, cv_sections: list) -> dict:
    sections_text = "\n\n".join([
        f"SECTION [{s['section'].upper()}]:\n{s['snippet']}"
        for s in cv_sections
    ])
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""You are an expert recruiter. Score how well each CV section matches the job requirements.

JOB REQUIREMENTS:
{jd_text[:800]}

CV SECTIONS:
{sections_text}

Scoring rules:
- If education requires CGPA > X and CV shows higher CGPA, score 90+
- If required skills are present in CV, score 85+
- If experience matches the domain, score 75+
- Use intelligent reasoning, not just keyword matching

Return ONLY a JSON object:
{{"skills": 85, "experience": 70, "education": 95, "projects": 60, "summary": 40}}

No markdown, no explanation, just valid JSON."""
        }],
        max_tokens=100
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

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

        section_scores = []
        for doc, emb, meta in zip(
            results["documents"][0],
            results["embeddings"][0],
            results["metadatas"][0]
        ):
            section_scores.append({
                "section": meta.get("section", "unknown"),
                "score": 0,
                "snippet": doc[:300] + "..." if len(doc) > 300 else doc,
                "_emb": emb
            })

        try:
            ai_scores = await ai_powered_score(request.job_description, section_scores)
            for s in section_scores:
                s["score"] = float(ai_scores.get(s["section"], 50))
        except Exception as e:
            print(f"AI scoring failed, using hybrid: {e}", flush=True)
            for s in section_scores:
                emb = s["_emb"]
                sim = cosine_similarity(jd_embedding, emb)
                s["score"] = hybrid_score(request.job_description, s["snippet"], sim)

        for s in section_scores:
            s.pop("_emb", None)

        section_weights = {
            "skills": 0.35,
            "experience": 0.30,
            "projects": 0.20,
            "education": 0.10,
            "summary": 0.05
        }
        weighted_sum = sum(
            s["score"] * section_weights.get(s["section"], 0.1)
            for s in section_scores
        )
        total_weight = sum(
            section_weights.get(s["section"], 0.1)
            for s in section_scores
        )
        overall = round(weighted_sum / total_weight, 1)

        top_section = max(section_scores, key=lambda x: x["score"])

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