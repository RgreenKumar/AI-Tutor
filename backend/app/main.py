from fastapi import FastAPI

from app.routes.tutor import router as tutor_router
from app.routes.upload import router as upload_router
from app.routes.pdf_test import router as pdf_router
from app.routes.chunk_test import router as chunk_router
from app.routes.rag_tutor import router as rag_router
from app.routes.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(tutor_router)
app.include_router(upload_router)
app.include_router(pdf_router)
app.include_router(chunk_router)
app.include_router(rag_router)
app.include_router(chat_router)

@app.get("/")
def home():
    return {
        "message": "AI Tutor Backend Running"
    }