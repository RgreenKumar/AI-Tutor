import os

from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

from app.database import get_connection

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")


def generate_answer(chat_id, question):

    conn = get_connection()
    cur = conn.cursor()

    # Save user message
    cur.execute(
        """
        INSERT INTO messages(chat_id, role, message)
        VALUES(%s,%s,%s)
        """,
        (chat_id, "user", question)
    )

    conn.commit()

    # Load previous conversation
    cur.execute(
        """
        SELECT role, message
        FROM messages
        WHERE chat_id=%s
        ORDER BY id
        """,
        (chat_id,)
    )

    rows = cur.fetchall()

    conversation = ""

    for row in rows:
        conversation += f"{row['role']}: {row['message']}\n"

    prompt = f"""
You are an expert AI tutor helping engineering students.

Answer naturally like ChatGPT.

Formatting Rules:

- Use Markdown.
- Use headings.
- Use **bold**.
- Use bullet points.
- Use numbered lists.
- Leave one blank line between sections.
- Never write one huge paragraph.
- Explain step by step whenever appropriate.

Conversation:

{conversation}

Latest Question:

{question}
"""

    try:

        response = model.generate_content(prompt)
        answer = response.text

    except ResourceExhausted:

        answer = "⚠ Gemini quota exceeded."

    # Save assistant reply
    cur.execute(
        """
        INSERT INTO messages(chat_id, role, message)
        VALUES(%s,%s,%s)
        """,
        (
            chat_id,
            "assistant",
            answer
        )
    )

    conn.commit()

    # Count messages
    cur.execute(
        """
        SELECT COUNT(*) AS total
        FROM messages
        WHERE chat_id=%s
        """,
        (chat_id,)
    )

    total = cur.fetchone()["total"]

    # Update title only after first question
    if total == 2:

        title = question.strip()

        if len(title) > 35:
            title = title[:35] + "..."

        cur.execute(
            """
            UPDATE chats
            SET title=%s
            WHERE chat_id=%s
            """,
            (
                title,
                chat_id
            )
        )

        conn.commit()

    conn.close()

    return answer

def generate_answer_with_context(question, context):

    prompt = f"""
You are an AI Tutor.

Answer ONLY using the supplied context.

Format using Markdown.

Use headings.

Use **bold**.

Use bullet points.

Leave blank lines.

If the answer is not present in the context, say:

"I couldn't find this information in the uploaded study material."

Context:

{context}

Question:

{question}
"""

    try:

        response = model.generate_content(prompt)

        return response.text

    except ResourceExhausted:

        return "⚠ Gemini quota exceeded."

    except Exception as e:

        return str(e)