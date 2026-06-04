from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
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

class JobSearchRequest(BaseModel):
    query: str
    location: str = "Dhaka"
    num_results: int = 10

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def compute_fit_score_for_job(job_text: str, user_id: str) -> float:
    try:
        collection = get_cv_collection(user_id)
        count = collection.count()
        print(f"DEBUG: Collection for {user_id} has {count} items", flush=True)
        if count == 0:
            return 0.0
        jd_embedding = get_embedding(job_text)
        results = collection.query(
            query_embeddings=[jd_embedding],
            n_results=min(3, count),
            include=["embeddings"]
        )
        if not results["embeddings"] or not results["embeddings"][0]:
            print(f"DEBUG: Empty embeddings returned", flush=True)
            return 0.0
        scores = [cosine_similarity(jd_embedding, emb) for emb in results["embeddings"][0]]
        score = round(sum(scores) / len(scores) * 100, 1)
        print(f"DEBUG: Score={score}", flush=True)
        return score
    except Exception as e:
        print(f"DEBUG ERROR: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return 0.0

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
    
    data = response.json()
    jobs = data.get("jobs_results", [])
    return jobs

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
    # Get CV chunks for context
    cv_chunks = query_cv(user_id, request.query, top_k=3)
    
    # Search live jobs via SerpAPI
    raw_jobs = search_jobs_serpapi(request.query, request.location, request.num_results)
    
    if not raw_jobs:
        return {"jobs": [], "message": "No jobs found for this search"}
    
    # Process each job
    structured_jobs = []
    for job in raw_jobs[:8]:  # limit to 8 to avoid too many Groq calls
        title = job.get("title", "Unknown Role")
        company = job.get("company_name", "Unknown Company")
        location = job.get("location", request.location)
        description = job.get("description", "")
        
        # Extract salary if available
        salary = "Not specified"
        extensions = job.get("detected_extensions", {})
        if extensions.get("salary"):
            salary = extensions["salary"]
        
        # Extract deadline/posted date
        posted = extensions.get("posted_at", "Recently posted")
        
        # Compute fit score
        job_text = f"{title} {description}"
        fit_score = compute_fit_score_for_job(job_text, user_id)
        
        # Generate reasoning only for top matches to save API calls
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
            "section_scores": [],               
            "deadline": extensions.get("schedule_type", "")
        })
    
    # Sort by fit score descending
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