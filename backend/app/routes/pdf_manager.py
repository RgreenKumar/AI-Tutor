from fastapi import APIRouter, UploadFile, File
import os
import shutil
from datetime import datetime
from fastapi import HTTPException
router = APIRouter()

UPLOAD_FOLDER = "app/uploads"


@router.get("/pdfs")
def get_pdfs():

    pdfs = []

    if not os.path.exists(UPLOAD_FOLDER):
        return []

    for file in os.listdir(UPLOAD_FOLDER):

        if file.lower().endswith(".pdf"):

            path = os.path.join(UPLOAD_FOLDER, file)

            pdfs.append({

                "name": file,

                "size": round(os.path.getsize(path) / 1024 / 1024, 2),

                "date": datetime.fromtimestamp(
                    os.path.getmtime(path)
                ).strftime("%d %b %Y")

            })

    return pdfs


# ---------------- UPLOAD PDF ----------------

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):

        return {
            "success": False,
            "message": "Only PDF files are allowed."
        }

    save_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(save_path, "wb") as buffer:

        shutil.copyfileobj(file.file, buffer)

    return {

        "success": True,

        "message": "PDF uploaded successfully."

    }
# ---------------- DELETE PDF ----------------

@router.delete("/delete-pdf/{filename}")
def delete_pdf(filename: str):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="PDF not found."
        )

    os.remove(file_path)

    return {

        "success": True,

        "message": "PDF deleted successfully."

    }