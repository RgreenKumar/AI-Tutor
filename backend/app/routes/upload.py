from fastapi import APIRouter, UploadFile, File
import os

router = APIRouter()

UPLOAD_FOLDER = "app/uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {
        "message": "PDF uploaded successfully",
        "filename": file.filename
    }
from fastapi import UploadFile, File
import os

UPLOAD_FOLDER = "app/uploads"

@router.put("/replace-pdf/{filename}")
async def replace_pdf(filename: str, file: UploadFile = File(...)):

    old_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if os.path.exists(old_path):
        os.remove(old_path)

    new_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    with open(new_path, "wb") as buffer:
        buffer.write(await file.read())

    return {
        "message": "PDF replaced successfully"
    }
from fastapi import Body
import shutil

@router.put("/rename-pdf")
def rename_pdf(data: dict = Body(...)):

    old_name = data["old_name"]
    new_name = data["new_name"]

    if not new_name.endswith(".pdf"):
        new_name += ".pdf"

    old_path = os.path.join(UPLOAD_FOLDER, old_name)
    new_path = os.path.join(UPLOAD_FOLDER, new_name)

    if not os.path.exists(old_path):
        return {"message": "File not found"}

    shutil.move(old_path, new_path)

    return {
        "message": "Renamed successfully"
    }
from fastapi import HTTPException
import os

UPLOAD_FOLDER = "app/uploads"

@router.delete("/delete-pdf/{filename}")
def delete_pdf(filename: str):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="PDF not found"
        )

    os.remove(file_path)

    return {
        "message": "PDF deleted successfully"
    }