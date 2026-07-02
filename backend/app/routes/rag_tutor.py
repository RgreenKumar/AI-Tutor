from fastapi import APIRouter
from pydantic import BaseModel

from app.rag.pdf_loader import extract_text_from_pdf
from app.rag.chunker import create_chunks
from app.rag.retriever import retrieve_relevant_chunk

from app.services.gemini_service import generate_answer_with_context

router = APIRouter()


class QuestionRequest(BaseModel):
    subject: str
    question: str


SUBJECT_PDFS = {
    "Operating System": "app/uploads/OperatingSystems.pdf",
    "DBMS": "app/uploads/DBMS.pdf",
    "Computer Networks": "app/uploads/ComputerNetworks.pdf",
    "Data Structures": "app/uploads/DataStructures.pdf",
}


@router.post("/rag-ask")
def rag_ask(data: QuestionRequest):

    # Check whether the selected subject exists
    if data.subject not in SUBJECT_PDFS:
        return {
            "answer": "Invalid subject selected."
        }

    pdf_path = SUBJECT_PDFS[data.subject]

    text = extract_text_from_pdf(pdf_path)

    chunks = create_chunks(text)

    context = retrieve_relevant_chunk(
        data.question,
        chunks
    )

    if context is None:
        return {
            "answer": "This topic is not available in the selected study material."
        }

    answer = generate_answer_with_context(
        data.question,
        context
    )

    return {
        "subject": data.subject,
        "answer": answer
    }