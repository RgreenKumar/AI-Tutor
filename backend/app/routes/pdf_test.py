from fastapi import APIRouter

from app.rag.pdf_loader import extract_text_from_pdf

router = APIRouter()


SUBJECT_PDFS = {
    "Operating System": "app/uploads/OperatingSystems.pdf",
    "DBMS": "app/uploads/DBMS.pdf",
    "Computer Networks": "app/uploads/ComputerNetworks.pdf",
    "Data Structures": "app/uploads/DataStructures.pdf",
}


@router.get("/read-pdf/{subject}")
def read_pdf(subject: str):

    if subject not in SUBJECT_PDFS:
        return {
            "message": "Subject not found."
        }

    pdf_path = SUBJECT_PDFS[subject]

    text = extract_text_from_pdf(pdf_path)

    return {
        "subject": subject,
        "characters": len(text),
        "preview": text[:2000]
    }