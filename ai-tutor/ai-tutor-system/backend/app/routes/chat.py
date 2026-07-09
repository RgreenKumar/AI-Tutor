from fastapi import APIRouter
import uuid

from app.database import get_connection
from app.services.gemini_service import generate_answer

router = APIRouter()


# Create New Chat
@router.post("/chat/new")
def create_chat():

    chat_id = str(uuid.uuid4())

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO chats(chat_id,title)
        VALUES(%s,%s)
        """,
        (chat_id, "New Chat")
    )

    conn.commit()
    conn.close()

    return {"chat_id": chat_id}


# Send Message
@router.post("/chat/{chat_id}")
def chat(chat_id: str, data: dict):

    question = data["question"]

    answer = generate_answer(chat_id, question)

    return {"answer": answer}


# Recent Chats
@router.get("/chats")
def chats():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT chat_id,title
        FROM chats
        WHERE title IS NOT NULL
          AND title <> ''
          AND title <> 'New Chat'
        ORDER BY id DESC
        """
    )

    data = cur.fetchall()

    conn.close()

    return data


# Load Previous Chat
@router.get("/chat/{chat_id}")
def get_chat(chat_id: str):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT role,message
        FROM messages
        WHERE chat_id=%s
        ORDER BY id
        """,
        (chat_id,)
    )

    rows = cur.fetchall()

    conn.close()

    return rows


# Delete Chat
@router.delete("/chat/{chat_id}")
def delete_chat(chat_id: str):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM messages
        WHERE chat_id=%s
        """,
        (chat_id,)
    )

    cur.execute(
        """
        DELETE FROM chats
        WHERE chat_id=%s
        """,
        (chat_id,)
    )

    conn.commit()
    conn.close()

    return {"message": "Deleted"}