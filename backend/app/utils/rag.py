import fitz  
import docx
import io
from app.utils.chroma_client import get_cv_collection
from app.utils.embeddings import get_embedding
from groq import Groq
import os


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())

def chunk_cv_by_section(text: str) -> dict:
    sections = {
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "summary": []
    }
    keywords = {
        "skills": ["skills", "technologies", "tools", "tech stack"],
        "experience": ["experience", "work history", "employment", "internship"],
        "education": ["education", "academic", "degree", "university", "cgpa"],
        "projects": ["projects", "portfolio", "built"],
        "summary": ["summary", "objective", "profile", "about"]
    }
    current_section = "summary"
    for line in text.split("\n"):
        lower = line.lower().strip()
        if not lower:
            continue
        for section, keys in keywords.items():
            if any(k in lower for k in keys):
                current_section = section
                break
        sections[current_section].append(line)

    return {k: " ".join(v) for k, v in sections.items() if v}

def index_cv(user_id: str, file_bytes: bytes, file_type: str) -> list:
    if file_type == "pdf":
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_docx(file_bytes)

    chunks = chunk_cv_by_section(text)
    collection = get_cv_collection(user_id)

    collection.upsert(
        documents=list(chunks.values()),
        embeddings=[get_embedding(chunk) for chunk in chunks.values()],
        ids=[f"{user_id}_{section}" for section in chunks.keys()],
        metadatas=[{"section": section, "user_id": user_id}
                   for section in chunks.keys()]
    )
    return list(chunks.keys())

def query_cv(user_id: str, question: str, top_k: int = 3) -> list:
    collection = get_cv_collection(user_id)
    results = collection.query(
        query_embeddings=[get_embedding(question)],
        n_results=top_k
    )
    return results["documents"][0] if results["documents"] else []


groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_cv_greeting(user_name: str, sections: list) -> str:
    sections_str = ", ".join(sections)
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": f"A user named {user_name} just uploaded their CV. The following sections were detected: {sections_str}. Write a short, warm, personalized 2-sentence greeting acknowledging their profile. Be encouraging and specific about what was found."
            }
        ],
        max_tokens=100
    )
    return response.choices[0].message.content