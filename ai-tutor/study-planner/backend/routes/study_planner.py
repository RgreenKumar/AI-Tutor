import os
import io
import re
import json
import html
import requests
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import StudyPlanItem, Note, Document
from security import get_current_user_id

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".txt")

router = APIRouter()

# Ollama configuration from environment variables
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


# ---- Request/Response schemas ----

class PlanRequest(BaseModel):
    course: str
    num_days: int
    start_date: Optional[date] = None  # ISO format, defaults to today


class ProgressUpdate(BaseModel):
    course: str
    day: int
    done: bool


class RescheduleRequest(BaseModel):
    course: str
    day: int
    new_date: date  # ISO format


class NoteRequest(BaseModel):
    course: str
    day: int
    content: str


class SummarizeRequest(BaseModel):
    course: str
    day: int


class ExplainRequest(BaseModel):
    topic: str
    context: Optional[str] = None  # optional note text for extra context


class FlashcardRequest(BaseModel):
    course: str
    day: int
    count: int = 5


class DocumentPlanRequest(BaseModel):
    num_days: int
    start_date: Optional[date] = None  # ISO format, defaults to today
    course: Optional[str] = None       # defaults to the filename without extension


# ---- Helpers ----

def _serialize(item: StudyPlanItem) -> dict:
    """Convert a StudyPlanItem row into the JSON contract {day, date, topic, done}."""
    return {
        "day": item.day,
        "date": item.date.isoformat() if item.date else None,
        "topic": item.topic,
        "done": item.done,
    }


def _ollama_generate(prompt: str, fmt: Optional[dict] = None) -> str:
    """Call Ollama once and return the raw response text.

    Pass `fmt` (a JSON schema) to use Ollama's structured-output mode, which
    constrains the model to emit valid JSON of that exact shape.

    Mirrors the error-handling used by generate-study-plan:
    503 if Ollama is unreachable, 502 if the response envelope is malformed.
    """
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    if fmt is not None:
        payload["format"] = fmt

    try:
        response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Ollama service is unreachable")

    try:
        return response.json()["response"]
    except (ValueError, KeyError):
        raise HTTPException(status_code=502, detail="Malformed response from Ollama")


def _strip_html(text: str) -> str:
    """Convert rich-text-editor HTML note content into plain text for AI prompts.

    Removes script/style blocks, turns block/line-break tags into spaces so words
    don't run together, strips remaining tags, decodes HTML entities, and collapses
    whitespace. Only used when building prompts — the stored note keeps its HTML.
    """
    if not text:
        return ""

    cleaned = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", text)
    cleaned = re.sub(r"(?i)<(br|/p|/div|/li|/h[1-6])\s*/?>", " ", cleaned)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _strip_fences(text: str) -> str:
    """Remove Markdown code fences (```json ... ```) the model often wraps output in."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Drop the opening fence (with optional language hint) and the closing fence.
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _topic_for(db: Session, course: str, day: int, user_id: Optional[int]) -> Optional[str]:
    """Look up the plan topic for a (course, day), or None if there is no such day."""
    item = (
        db.query(StudyPlanItem)
        .filter(
            StudyPlanItem.course == course,
            StudyPlanItem.day == day,
            StudyPlanItem.user_id == user_id,
        )
        .first()
    )
    return item.topic if item else None


def _generate_plan(
    db: Session,
    course: str,
    num_days: int,
    start_date: Optional[date],
    context: str = "",
    user_id: Optional[int] = None,
) -> list:
    """Ollama-generate a day-wise plan, replace any existing plan for the course,
    and store it. Shared by /generate-study-plan and the document plan endpoint so
    both save identical StudyPlanItem rows (with dates and done flags)."""
    context_block = (
        f"\nBase the plan on these topics from the student's material:\n{context}\n"
        if context
        else ""
    )
    prompt = f"""Create a {num_days}-day study plan for {course}.{context_block}
For each day, give exactly one topic.
Format each line EXACTLY like this with no extra text:
Day 1: topic name
Day 2: topic name
Continue for all {num_days} days."""

    raw_text = _ollama_generate(prompt)

    start = start_date or date.today()

    # Clear this user's existing plan for the course (scoped so users don't wipe
    # each other's same-named courses; None user_id targets un-owned rows).
    db.query(StudyPlanItem).filter(
        StudyPlanItem.course == course,
        StudyPlanItem.user_id == user_id,
    ).delete()

    plan = []
    for line in raw_text.split("\n"):
        match = re.match(r"\s*Day\s*(\d+)\s*[:\-]\s*(.+)", line, re.IGNORECASE)
        if match:
            day_number = int(match.group(1))
            topic = match.group(2).strip()
            item_date = start + timedelta(days=day_number - 1)

            db_item = StudyPlanItem(
                course=course,
                day=day_number,
                topic=topic,
                done=False,
                date=item_date,
                user_id=user_id,
            )
            db.add(db_item)
            plan.append(_serialize(db_item))

    db.commit()
    return plan


def _extract_topics(text: str) -> list:
    """Ask Ollama for the important topics in a document as a JSON list of strings."""
    schema = {
        "type": "object",
        "properties": {"topics": {"type": "array", "items": {"type": "string"}}},
        "required": ["topics"],
    }
    prompt = f"""Read the following study material and list the most important topics to study.
Return ONLY a JSON object with a "topics" array of short topic strings.

MATERIAL:
{text[:8000]}"""

    raw = _strip_fences(_ollama_generate(prompt, fmt=schema))
    try:
        parsed = json.loads(raw)
    except (ValueError, TypeError):
        raise HTTPException(status_code=502, detail="Ollama did not return valid JSON")

    entries = parsed.get("topics") if isinstance(parsed, dict) else parsed
    if not isinstance(entries, list):
        raise HTTPException(status_code=502, detail="Ollama did not return a topic list")

    topics = [str(t).strip() for t in entries if str(t).strip()]
    if not topics:
        raise HTTPException(status_code=502, detail="No topics found in Ollama response")
    return topics


def _summarize_text(text: str) -> str:
    """Chapter/section-wise summary. Long documents (>~3000 words) are chunked,
    each chunk summarized, then the chunk summaries combined into one summary."""
    words = text.split()

    def summarize_chunk(chunk: str) -> str:
        prompt = f"""Summarize the following study material chapter/section-wise in simple language.
Use a short heading per section followed by 1-3 plain sentences.
Return only the summary.

MATERIAL:
{chunk}"""
        return _strip_fences(_ollama_generate(prompt))

    if len(words) <= 3000:
        return summarize_chunk(text)

    chunk_summaries = []
    for i in range(0, len(words), 3000):
        chunk = " ".join(words[i:i + 3000])
        chunk_summaries.append(summarize_chunk(chunk))

    combined = "\n\n".join(chunk_summaries)
    final_prompt = f"""Combine these partial summaries into one clear, chapter/section-wise
summary in simple language. Remove repetition and keep the section headings.

PARTIAL SUMMARIES:
{combined}"""
    return _strip_fences(_ollama_generate(final_prompt))


def _reading_hours_fallback(text: str) -> float:
    """Rough study-time estimate from word count (~200 wpm read, ~3x study overhead)."""
    word_count = len(text.split())
    reading_hours = word_count / 200 / 60
    return round(max(0.5, reading_hours * 3), 1)


def _get_document(db: Session, document_id: int, user_id: Optional[int]) -> Document:
    """Fetch a document row owned by this user (or un-owned when no token), or 404."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    return doc


def _extract_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        raise HTTPException(status_code=500, detail="pypdf is not installed. Run: pip install pypdf")
    reader = PdfReader(io.BytesIO(content))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _extract_docx(content: bytes) -> str:
    try:
        import docx
    except ImportError:
        raise HTTPException(status_code=500, detail="python-docx is not installed. Run: pip install python-docx")
    document = docx.Document(io.BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def _extract_text(filename: str, content: bytes) -> str:
    """Dispatch text extraction by file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _extract_pdf(content)
    if lower.endswith(".docx"):
        return _extract_docx(content)
    if lower.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    # Should be unreachable — callers validate the extension first.
    return ""


# ---- Routes ----

@router.post("/generate-study-plan")
def generate_study_plan(
    req: PlanRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Generate an AI-powered study plan using Ollama and save it to the database."""
    plan = _generate_plan(db, req.course, req.num_days, req.start_date, user_id=user_id)
    return {"course": req.course, "num_days": req.num_days, "plan": plan}


@router.post("/update-progress")
def update_progress(
    req: ProgressUpdate,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Mark a specific day as done or undone."""
    item = db.query(StudyPlanItem).filter(
        StudyPlanItem.course == req.course,
        StudyPlanItem.day == req.day,
        StudyPlanItem.user_id == user_id,
    ).first()

    if item:
        item.done = req.done
        db.commit()
        return {"message": f"Day {req.day} for {req.course} updated", "done": req.done}

    return {"message": "No matching plan day found", "done": None}


@router.get("/get-plan/{course}")
def get_plan(
    course: str,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Fetch a saved study plan from the database."""
    items = (
        db.query(StudyPlanItem)
        .filter(StudyPlanItem.course == course, StudyPlanItem.user_id == user_id)
        .order_by(StudyPlanItem.day)
        .all()
    )

    if not items:
        return {"course": course, "plan": []}

    plan = [_serialize(i) for i in items]
    return {"course": course, "plan": plan}


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Return a summary of every saved plan, grouped by course."""
    items = (
        db.query(StudyPlanItem)
        .filter(StudyPlanItem.user_id == user_id)
        .order_by(StudyPlanItem.course, StudyPlanItem.day)
        .all()
    )

    grouped: dict[str, list[StudyPlanItem]] = {}
    for item in items:
        grouped.setdefault(item.course, []).append(item)

    plans = []
    for course, plan_items in grouped.items():
        total_days = len(plan_items)
        days_done = sum(1 for i in plan_items if i.done)
        created_ats = [i.created_at for i in plan_items if i.created_at]
        created_at = min(created_ats) if created_ats else None
        status = "Completed" if total_days > 0 and days_done == total_days else "In Progress"

        plans.append({
            "course": course,
            "created_at": created_at.isoformat() if created_at else None,
            "total_days": total_days,
            "days_done": days_done,
            "status": status,
        })

    return {"plans": plans}


@router.patch("/reschedule")
def reschedule(
    req: RescheduleRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Move a day's task to new_date and shift all later days forward so no
    two tasks share a date."""
    items = (
        db.query(StudyPlanItem)
        .filter(StudyPlanItem.course == req.course, StudyPlanItem.user_id == user_id)
        .order_by(StudyPlanItem.day)
        .all()
    )

    target = next((i for i in items if i.day == req.day), None)
    if target is None:
        raise HTTPException(
            status_code=404,
            detail=f"Day {req.day} for {req.course} not found",
        )

    # Move the target task, then re-date every later day consecutively.
    target.date = req.new_date
    later_days = [i for i in items if i.day > req.day]  # already ordered by day
    for offset, item in enumerate(later_days, start=1):
        item.date = req.new_date + timedelta(days=offset)

    db.commit()

    plan = [_serialize(i) for i in items]
    return {"course": req.course, "plan": plan}


# ---- Notes & flashcards ----

@router.put("/notes")
def save_note(
    req: NoteRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Create or update the note for a (course, day) pair (used by auto-save)."""
    note = (
        db.query(Note)
        .filter(Note.course == req.course, Note.day == req.day, Note.user_id == user_id)
        .first()
    )

    if note:
        note.content = req.content
    else:
        note = Note(course=req.course, day=req.day, content=req.content, user_id=user_id)
        db.add(note)

    db.commit()
    return {
        "course": req.course,
        "day": req.day,
        "content": req.content,
        "message": "Note saved",
    }


@router.get("/notes/{course}/{day}")
def get_note(
    course: str,
    day: int,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Fetch the saved note (content + ai_summary) for a day, 404 if none exists."""
    note = (
        db.query(Note)
        .filter(Note.course == course, Note.day == day, Note.user_id == user_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail=f"No note found for {course} day {day}",
        )

    return {
        "course": note.course,
        "day": note.day,
        "content": note.content,
        "ai_summary": note.ai_summary,
    }


@router.post("/notes/summarize")
def summarize_note(
    req: SummarizeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Summarize a saved note into 2-3 plain-language sentences and store the result."""
    note = (
        db.query(Note)
        .filter(Note.course == req.course, Note.day == req.day, Note.user_id == user_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail=f"No note found for {req.course} day {req.day}",
        )

    topic = _topic_for(db, req.course, req.day, user_id) or req.course
    note_text = _strip_html(note.content)

    prompt = f"""You are helping a student review their notes on "{topic}".
Summarize the following notes in 2-3 short, plain-language sentences.
Return only the summary text with no preamble, headings, or markdown.

NOTES:
{note_text}"""

    summary = _strip_fences(_ollama_generate(prompt))
    if not summary:
        raise HTTPException(status_code=502, detail="Ollama returned an empty summary")

    note.ai_summary = summary
    db.commit()

    return {"course": req.course, "day": req.day, "ai_summary": summary}


@router.post("/explain")
def explain(req: ExplainRequest):
    """Return a beginner-friendly explanation of a topic (not stored)."""
    context_text = _strip_html(req.context) if req.context else ""
    context_block = f"\n\nUse this note text as extra context:\n{context_text}" if context_text else ""

    prompt = f"""Explain "{req.topic}" in easy language, as if teaching a beginner student.
Use simple words and a short example if helpful.
Return only the explanation with no preamble, headings, or markdown.{context_block}"""

    explanation = _strip_fences(_ollama_generate(prompt))
    if not explanation:
        raise HTTPException(status_code=502, detail="Ollama returned an empty explanation")

    return {"explanation": explanation}


@router.post("/flashcards")
def flashcards(
    req: FlashcardRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Generate question/answer flashcards for a day from its topic and saved note."""
    topic = _topic_for(db, req.course, req.day, user_id) or req.course

    note = (
        db.query(Note)
        .filter(Note.course == req.course, Note.day == req.day, Note.user_id == user_id)
        .first()
    )
    note_text = _strip_html(note.content) if note else ""
    note_block = f"\n\nUse these notes as source material:\n{note_text}" if note_text else ""

    prompt = f"""Create {req.count} study flashcards about "{topic}".
Each flashcard has a "question" and a short "answer".{note_block}"""

    # Structured-output schema: forces Ollama to return {"cards": [{question, answer}]}.
    schema = {
        "type": "object",
        "properties": {
            "cards": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "answer": {"type": "string"},
                    },
                    "required": ["question", "answer"],
                },
            },
        },
        "required": ["cards"],
    }

    raw = _strip_fences(_ollama_generate(prompt, fmt=schema))

    try:
        parsed = json.loads(raw)
    except (ValueError, TypeError):
        raise HTTPException(status_code=502, detail="Ollama did not return valid JSON")

    # Schema yields {"cards": [...]}, but tolerate a bare array just in case.
    entries = parsed.get("cards") if isinstance(parsed, dict) else parsed
    if not isinstance(entries, list):
        raise HTTPException(status_code=502, detail="Ollama did not return a card list")

    cards = []
    for entry in entries[: req.count]:
        if isinstance(entry, dict) and "question" in entry and "answer" in entry:
            cards.append({
                "question": str(entry["question"]).strip(),
                "answer": str(entry["answer"]).strip(),
            })

    if not cards:
        raise HTTPException(status_code=502, detail="No valid flashcards in Ollama response")

    return {"course": req.course, "day": req.day, "cards": cards}


# ---- Document upload & AI review ----

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Accept a .pdf/.docx/.txt file, extract its text, and store it."""
    filename = file.filename or "upload"

    if not filename.lower().endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    text = _extract_text(filename, content).strip()

    # Scanned/image PDFs (and empty files) yield little or no extractable text.
    if len(text) < 20:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text — scanned/image files are not supported",
        )

    doc = Document(filename=filename, text_content=text, user_id=user_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {"document_id": doc.id, "filename": doc.filename, "char_count": len(text)}


@router.post("/documents/{document_id}/summarize")
def summarize_document(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Chapter/section-wise summary of the document in simple language."""
    doc = _get_document(db, document_id, user_id)
    summary = _summarize_text(doc.text_content)
    if not summary:
        raise HTTPException(status_code=502, detail="Ollama returned an empty summary")
    return {"document_id": document_id, "summary": summary}


@router.post("/documents/{document_id}/topics")
def document_topics(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Extract the important topics from the document as a list of strings."""
    doc = _get_document(db, document_id, user_id)
    topics = _extract_topics(doc.text_content)
    return {"document_id": document_id, "topics": topics}


@router.post("/documents/{document_id}/estimate-time")
def estimate_study_time(
    document_id: int,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Estimate study hours from the document's topics and length.

    Uses Ollama for a per-topic breakdown, falling back to a word-count-based
    estimate if the AI output is missing or unusable.
    """
    doc = _get_document(db, document_id, user_id)
    topics = _extract_topics(doc.text_content)
    fallback_hours = _reading_hours_fallback(doc.text_content)

    schema = {
        "type": "object",
        "properties": {
            "estimated_hours": {"type": "number"},
            "breakdown": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string"},
                        "hours": {"type": "number"},
                    },
                    "required": ["topic", "hours"],
                },
            },
        },
        "required": ["estimated_hours", "breakdown"],
    }
    prompt = f"""Estimate how many study hours a student needs for this material.
The document has about {len(doc.text_content.split())} words.
Topics: {", ".join(topics)}.
Give a total "estimated_hours" number and a "breakdown" list of {{topic, hours}} per topic."""

    # AI is best-effort here: any malformed/empty output falls back to the code estimate.
    try:
        parsed = json.loads(_strip_fences(_ollama_generate(prompt, fmt=schema)))
        estimated_hours = float(parsed["estimated_hours"])
        breakdown = [
            {"topic": str(row["topic"]).strip(), "hours": float(row["hours"])}
            for row in parsed["breakdown"]
            if isinstance(row, dict) and "topic" in row and "hours" in row
        ]
        if estimated_hours <= 0 or not breakdown:
            raise ValueError("unusable AI estimate")
    except (ValueError, TypeError, KeyError):
        per_topic = round(fallback_hours / max(1, len(topics)), 1)
        estimated_hours = fallback_hours
        breakdown = [{"topic": topic, "hours": per_topic} for topic in topics]

    return {
        "document_id": document_id,
        "estimated_hours": round(estimated_hours, 1),
        "breakdown": breakdown,
    }


@router.post("/documents/{document_id}/generate-plan")
def generate_plan_from_document(
    document_id: int,
    req: DocumentPlanRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """Extract topics from the document and generate a day-wise study plan, stored
    like any other plan (appears in /plans, works with /reschedule)."""
    doc = _get_document(db, document_id, user_id)

    course = req.course or os.path.splitext(doc.filename)[0]
    topics = _extract_topics(doc.text_content)
    context = "\n".join(f"- {topic}" for topic in topics)

    plan = _generate_plan(
        db, course, req.num_days, req.start_date, context=context, user_id=user_id
    )
    return {
        "document_id": document_id,
        "course": course,
        "num_days": req.num_days,
        "plan": plan,
    }
