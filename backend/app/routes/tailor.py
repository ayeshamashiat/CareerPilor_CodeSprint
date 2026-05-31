from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import tempfile

from app.routes.auth import get_current_user
from app.utils.rag import query_cv
from app.utils.mongo_client import cv_metadata_collection
from groq import Groq

# reportlab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class TailorRequest(BaseModel):
    job_description: str
    job_title: str = ""


def generate_tailored_content(cv_chunks: list, job_description: str, job_title: str) -> dict:
    """Use LLM to rewrite CV sections to match the JD."""
    cv_text = "\n\n".join([f"Section:\n{chunk}" for chunk in cv_chunks])

    prompt = f"""You are an expert CV writer. Rewrite the user's CV sections to better match the job description below.

RULES:
- Do NOT fabricate or invent any experience, skills, or projects not in the CV
- Rephrase bullet points to use keywords from the JD naturally
- Reorder information so the most relevant experience appears first
- Keep all information truthful and grounded in the original CV
- Focus on quantifiable achievements where possible

JOB TITLE: {job_title}

JOB DESCRIPTION:
{job_description[:1000]}

USER'S CV SECTIONS:
{cv_text}

Return a JSON object with these exact keys:
{{
  "summary": "A 2-3 sentence professional summary tailored to this role",
  "skills": ["skill1", "skill2", "skill3", ...],  
  "experience": ["Bullet point 1", "Bullet point 2", ...],
  "projects": ["Project bullet 1", "Project bullet 2", ...],
  "changes_made": "Brief explanation of what was changed and why"
}}

Return ONLY valid JSON, no markdown, no extra text."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500
    )

    import json
    raw = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def build_pdf(tailored: dict, job_title: str, user_name: str, output_path: str):
    """Build a clean PDF from the tailored CV content."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    story = []

    # Name header
    name_style = ParagraphStyle(
        "Name",
        fontSize=22,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#5b21b6"),
        alignment=TA_CENTER,
        spaceAfter=4
    )
    role_style = ParagraphStyle(
        "Role",
        fontSize=12,
        textColor=colors.HexColor("#6b7280"),
        alignment=TA_CENTER,
        spaceAfter=12
    )
    section_header_style = ParagraphStyle(
        "SectionHeader",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#5b21b6"),
        spaceBefore=14,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        "Body",
        fontSize=10,
        leading=14,
        spaceAfter=3
    )
    note_style = ParagraphStyle(
        "Note",
        fontSize=9,
        textColor=colors.HexColor("#6b7280"),
        fontName="Helvetica-Oblique",
        spaceBefore=16,
        spaceAfter=4
    )

    story.append(Paragraph(user_name, name_style))
    story.append(Paragraph(f"Tailored for: {job_title}" if job_title else "Tailored CV", role_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#5b21b6")))
    story.append(Spacer(1, 8))

    # Summary
    if tailored.get("summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_header_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4))
        story.append(Paragraph(tailored["summary"], body_style))

    # Skills
    if tailored.get("skills"):
        story.append(Paragraph("SKILLS", section_header_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4))
        skills_text = " • ".join(tailored["skills"])
        story.append(Paragraph(skills_text, body_style))

    # Experience
    if tailored.get("experience"):
        story.append(Paragraph("EXPERIENCE", section_header_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4))
        for bullet in tailored["experience"]:
            story.append(Paragraph(f"• {bullet}", body_style))

    # Projects
    if tailored.get("projects"):
        story.append(Paragraph("PROJECTS", section_header_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4))
        for bullet in tailored["projects"]:
            story.append(Paragraph(f"• {bullet}", body_style))

    # Changes note
    if tailored.get("changes_made"):
        story.append(Spacer(1, 16))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Paragraph(f"AI Tailoring Note: {tailored['changes_made']}", note_style))

    doc.build(story)


@router.post("/cv")
async def tailor_cv(request: TailorRequest, user_id: str = Depends(get_current_user)):
    # Get user name from metadata
    metadata = await cv_metadata_collection.find_one({"user_id": user_id})
    if not metadata:
        raise HTTPException(404, "No CV found. Please upload your CV first.")

    # RAG: get most relevant CV chunks for this JD
    cv_chunks = query_cv(user_id, request.job_description, top_k=5)
    if not cv_chunks:
        raise HTTPException(404, "No CV content found. Please upload your CV first.")

    try:
        tailored = generate_tailored_content(cv_chunks, request.job_description, request.job_title)
    except Exception as e:
        raise HTTPException(500, f"Failed to generate tailored content: {str(e)}")

    # Build PDF
    user_name = metadata.get("filename", "Candidate").replace(".pdf", "").replace(".docx", "")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name

    try:
        build_pdf(tailored, request.job_title, user_name, output_path)
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {str(e)}")

    filename = f"tailored_cv_{request.job_title.replace(' ', '_') or 'role'}.pdf"
    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=filename,
        headers={"X-Changes-Made": tailored.get("changes_made", "")}
    )