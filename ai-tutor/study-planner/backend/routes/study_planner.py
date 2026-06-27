import os
import re
import requests
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import StudyPlanItem

router = APIRouter()

# Ollama configuration from environment variables
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


# ---- Request/Response schemas ----

class PlanRequest(BaseModel):
    course: str
    num_days: int


class ProgressUpdate(BaseModel):
    course: str
    day: int
    done: bool


# ---- Routes ----

@router.post("/generate-study-plan")
def generate_study_plan(req: PlanRequest, db: Session = Depends(get_db)):
    """Generate an AI-powered study plan using Ollama and save it to the database."""
    prompt = f"""Create a {req.num_days}-day study plan for {req.course}.
For each day, give exactly one topic.
Format each line EXACTLY like this with no extra text:
Day 1: topic name
Day 2: topic name
Continue for all {req.num_days} days."""

    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    )

    raw_text = response.json()["response"]

    # Clear old plan for this course
    db.query(StudyPlanItem).filter(StudyPlanItem.course == req.course).delete()

    plan = []
    for line in raw_text.split("\n"):
        match = re.match(r"\s*Day\s*(\d+)\s*[:\-]\s*(.+)", line, re.IGNORECASE)
        if match:
            day_number = int(match.group(1))
            topic = match.group(2).strip()
            plan.append({"day": day_number, "topic": topic, "done": False})

            db_item = StudyPlanItem(
                course=req.course, day=day_number, topic=topic, done=False
            )
            db.add(db_item)

    db.commit()
    return {"course": req.course, "num_days": req.num_days, "plan": plan}


@router.post("/update-progress")
def update_progress(req: ProgressUpdate, db: Session = Depends(get_db)):
    """Mark a specific day as done or undone."""
    item = db.query(StudyPlanItem).filter(
        StudyPlanItem.course == req.course,
        StudyPlanItem.day == req.day
    ).first()

    if item:
        item.done = req.done
        db.commit()
        return {"message": f"Day {req.day} for {req.course} updated", "done": req.done}

    return {"message": "No matching plan day found", "done": None}


@router.get("/get-plan/{course}")
def get_plan(course: str, db: Session = Depends(get_db)):
    """Fetch a saved study plan from the database."""
    items = (
        db.query(StudyPlanItem)
        .filter(StudyPlanItem.course == course)
        .order_by(StudyPlanItem.day)
        .all()
    )

    if not items:
        return {"course": course, "plan": []}

    plan = [{"day": i.day, "topic": i.topic, "done": i.done} for i in items]
    return {"course": course, "plan": plan}
