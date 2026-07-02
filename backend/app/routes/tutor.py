from fastapi import APIRouter

from app.models.request_models import QuestionRequest
from app.services.gemini_service import generate_answer

router = APIRouter()


@router.post("/ask")
def ask_question(request: QuestionRequest):

    answer = generate_answer(
        request.question
    )

    return {
        "answer": answer
    }