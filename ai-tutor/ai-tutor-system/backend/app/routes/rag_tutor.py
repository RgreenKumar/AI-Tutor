from fastapi import APIRouter
from pydantic import BaseModel
import os

from app.rag.pdf_loader import extract_text_from_pdf
from app.rag.chunker import create_chunks
from app.rag.retriever import retrieve_relevant_chunk
from app.services.gemini_service import generate_answer_with_context

router = APIRouter()


class QuestionRequest(BaseModel):
    subject: str
    question: str


UPLOAD_FOLDER = "app/uploads"


@router.post("/rag-ask")
def rag_ask(data: QuestionRequest):

    pdf_path = None

    # Find the selected PDF dynamically
    for file in os.listdir(UPLOAD_FOLDER):

        if not file.lower().endswith(".pdf"):
            continue

        filename = os.path.splitext(file)[0]

        if filename.lower() == data.subject.lower():

            pdf_path = os.path.join(UPLOAD_FOLDER, file)

            break

    if pdf_path is None:

        return {
            "answer": "Selected PDF was not found."
        }

    # Extract text
    text = extract_text_from_pdf(pdf_path)

    # Create chunks
    chunks = create_chunks(text)

    # Retrieve relevant chunk
    context = retrieve_relevant_chunk(
        data.question,
        chunks
    )

    if context is None:

        return {
            "answer": "This topic is not available in the selected study material."
        }

    # Generate answer
    answer = generate_answer_with_context(
        data.question,
        context
    )

    return {
        "subject": data.subject,
        "answer": answer
    }