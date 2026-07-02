from fastapi import APIRouter

from app.rag.pdf_loader import extract_text_from_pdf
from app.rag.chunker import create_chunks

router = APIRouter()


@router.get("/chunks")
def get_chunks():

    pdf_path = "app/uploads/OperatingSystems.pdf"   # use your actual filename

    text = extract_text_from_pdf(pdf_path)

    chunks = create_chunks(text)

    return {
        "total_chunks": len(chunks),
        "first_chunk": chunks[0]
    }