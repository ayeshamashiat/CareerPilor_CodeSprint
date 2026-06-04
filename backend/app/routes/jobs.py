from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.routes.auth import get_current_user
from app.utils.rag import query_cv
from app.utils.embeddings import get_embedding
from app.utils.chroma_client import get_cv_collection
from groq import Groq
import numpy as np
import os
import requests

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

STOP_WORDS = {'the','a','an','and','or','for','in','on','at','to','of','is','are','was','with','that','this','it','as','be','by','from','have','has','not','but'}

class JobSearchRequest(BaseModel):
    query: str
    location: str = "Dhaka"
    num_results: int = 10

def cosine_similarity(a, b):
    a = np.array(a, dtype=float).flatten()
    b = np.array(b, dtype=float).flatten()
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def hybrid_score(jd_text: str, cv_text: str, embedding_sim: float) -> float:
    jd_words = set(jd_text.lower().split()) - STOP_WORDS
    cv_words = set(cv_text.lower().split()) - STOP_WORDS
    if not jd_words:
        return embedding_sim * 100
    overlap = len(jd_words & cv_words) / len(jd_words)
    keyword_score = min(overlap * 150, 100)
    final = (embedding_sim * 100 * 0.4) + (keyword_score * 0.6)
    return round(min(final, 100), 1)

async def compute_fit_score_for_job(job_text: str, job_title: str, user_id: str) -> dict:
    try:
        collection = get_cv_collection(user_id)
        count = collection.count()
        if count == 0:
            return {"score": 0.0, "section_scores": []}

        jd_embedding = get_embedding(job_text)
        results = collection.query(
            query_embeddings=[jd_embedding],
            n_results=min(5, count),
            include=["documents", "embeddings", "metadatas"]
        )

        if not results["documents"] or not results["documents"][0]:
            return {"score": 0.0, "section_scores": []}

        section_scores = []
        for doc, emb, meta in zip(
            results["documents"][0],
            results["embeddings"][0],
            results["metadatas"][0]
        ):
            sim = cosine_similarity(jd_embedding, emb)
            score = hybrid_score(job_text, doc, sim)
            section_scores.append({
                "section": meta.get("section", "unknown"),
                "score": score
            })

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
        return {"score": overall, "section_scores": section_scores}
    except Exception as e:
        print(f"Fit score error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"score": 0.0, "section_scores": []}

def search_jobs_serpapi(query: str, location: str, num_results: int) -> list:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        raise HTTPException(500, "SERPAPI_KEY not configured")

    params = {
        "engine": "google_jobs",
        "q": query,
        "location": location,
        "api_key": api_key,
        "num": num_results
    }

    response = requests.get("https://serpapi.com/search", params=params)
    if response.status_code != 200:
        raise HTTPException(500, f"SerpAPI error: {response.status_code}")

    return response.json().get("jobs_results", [])

def generate_match_reasoning(job_title: str, job_description: str, cv_chunks: list, fit_score: float) -> str:
    cv_context = "\n".join(cv_chunks[:2]) if cv_chunks else "No CV data"
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""Given this job and candidate CV, explain in 1-2 sentences why the fit score is {fit_score}%.

Job: {job_title}
Job Description (first 300 chars): {job_description[:300]}
CV Summary: {cv_context[:400]}

Be specific and concise. Start with 'Your' or 'This role'."""
        }],
        max_tokens=80
    )
    return response.choices[0].message.content

@router.post("/search")
async def search_jobs(
    request: JobSearchRequest,
    user_id: str = Depends(get_current_user)
):
    cv_chunks = query_cv(user_id, request.query, top_k=3)
    raw_jobs = search_jobs_serpapi(request.query, request.location, request.num_results)

    if request.location.lower() not in ["anywhere", "remote", ""]:
        location_filtered = [
            job for job in raw_jobs
            if request.location.lower() in job.get("location", "").lower()
            or "remote" in job.get("location", "").lower()
            or "anywhere" in job.get("location", "").lower()
        ]
        if len(location_filtered) >= 3:
            raw_jobs = location_filtered

    if not raw_jobs:
        return {"jobs": [], "message": "No jobs found for this search"}

    structured_jobs = []
    for job in raw_jobs[:8]:
        title = job.get("title", "Unknown Role")
        company = job.get("company_name", "Unknown Company")
        location = job.get("location", request.location)
        description = job.get("description", "")

        salary = "Not specified"
        extensions = job.get("detected_extensions", {})
        if extensions.get("salary"):
            salary = extensions["salary"]

        posted = extensions.get("posted_at", "Recently posted")

        job_text = f"{title} {description}"
        fit_result = await compute_fit_score_for_job(job_text, title, user_id)
        fit_score = fit_result["score"]
        section_scores = fit_result["section_scores"]

        reasoning = ""
        if fit_score > 20 and cv_chunks:
            try:
                reasoning = generate_match_reasoning(title, description, cv_chunks, fit_score)
            except:
                reasoning = f"Your profile has a {fit_score}% match with this role."
        else:
            reasoning = "Limited overlap with your current CV profile."

        structured_jobs.append({
            "title": title,
            "company": company,
            "location": location,
            "salary": salary,
            "posted": posted,
            "overall_score": fit_score,
            "explanation": reasoning,
            "description": description[:500],
            "url": job.get("related_links", [{}])[0].get("link", "") if job.get("related_links") else "",
            "section_scores": section_scores,
            "deadline": extensions.get("schedule_type", "")
        })

    structured_jobs.sort(key=lambda x: x["overall_score"], reverse=True)

    return {
        "jobs": structured_jobs,
        "total": len(structured_jobs),
        "query": request.query,
        "location": request.location,
        "agent_message": f"Found {len(structured_jobs)} jobs matching '{request.query}' in {request.location}. Results ranked by CV fit score."
    }

@router.get("/search")
async def search_jobs_get(
    query: str,
    location: str = "Dhaka",
    user_id: str = Depends(get_current_user)
):
    return await search_jobs(JobSearchRequest(query=query, location=location), user_id)