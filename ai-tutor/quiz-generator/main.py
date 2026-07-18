from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
from fastapi import UploadFile, File
from pypdf import PdfReader
from fastapi import Form
from sentence_transformers import SentenceTransformer
import chromadb
app = FastAPI()
embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizRequest(BaseModel):
    topic: str


@app.post("/generate-quiz")
def generate_quiz(data: QuizRequest):

    prompt = f"""
Generate exactly 10 MCQ questions on {data.topic}.

Rules:
1. Questions must be strictly about {data.topic}.
2. Each question must have exactly 4 options.
3. Options must contain only answer text.
4. Do not include A, B, C, D inside options.
5. Answer must exactly match one of the options and dont add numbers or alphabets to indicate options.
6. Return only JSON.
7. No explanations.
8. No introductory text.

Format:

{{
  "questions":[
    {{
      "question":"...",
      "options":["...","...","...","..."],
      "answer":"..."
    }}
  ]
}}
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
            "format": "json"
        },
        timeout=120
    )

    raw_response = response.json()["response"]

    print("RAW RESPONSE:")
    print(raw_response)

    start = raw_response.find("{")
    end = raw_response.rfind("}") + 1

    json_text = raw_response[start:end]

    try:
        quiz = json.loads(json_text)
        if "questions" not in quiz:
           return {
            "error": "Model did not return questions"
        }
        fixed_questions = []
        for q in quiz["questions"]:
            if len(q["options"]) != 4:
                continue
            if q["answer"] not in q["options"]:
                found = False
                for option in q["options"]:
                   if option.lower().strip() == q["answer"].lower().strip():
                       q["answer"] = option
                       found = True
                       break
                if not found:
                   continue
            fixed_questions.append(q)
        quiz["questions"] = fixed_questions
        return quiz

    except Exception as e:
        return {
            "error": str(e),
            "raw_response": raw_response
        }
@app.post("/generate-pdf-quiz")
async def generate_pdf_quiz(
    file: UploadFile = File(...),
    topic: str = Form(...)
):
    pdf_path = "temp.pdf"

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    reader = PdfReader(pdf_path)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    if not text.strip():
        return {
          "error": "Could not extract text from PDF."
        }

    chunks = []
    chunk_size = 1500
    overlap = 200
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i+chunk_size])

    client = chromadb.Client()
    collection = client.get_or_create_collection(
      name="pdf_chunks"
    )  
    try:
       ids = collection.get()["ids"]
       if ids:
           collection.delete(ids=ids)
    except:
           pass
    for i, chunk in enumerate(chunks):

        embedding = embedding_model.encode(
           chunk
        ).tolist()

        collection.add(
           ids=[str(i)],
           embeddings=[embedding],
           documents=[chunk]
      )
    query_embedding = embedding_model.encode(
      topic
    ).tolist()

    results = collection.query(
    query_embeddings=[query_embedding],
    n_results=1
    )
    context = "\n".join(
    results["documents"][0]
    )
    context = context[:2500]
    print("Full PDF length:", len(text))
    print("Retrieved context length:", len(context))
    prompt = f"""
Generate exactly 10 MCQ questions.

Topic:
{topic}

Use ONLY the following study material.

Study Material:
{context}

Rules:

1. Generate EXACTLY 10 questions.
2. Every question MUST have EXACTLY 4 options.
3. Never generate True/False questions.
4. Never generate Yes/No questions.
5. Never generate fewer than 4 options.
6. Answer must be exactly one of the options.
7. Options must be short.
8. Return VALID JSON ONLY.
9. No explanations.
10. No text outside JSON.
11. Don't add any numbers or letter to the answer ,it must match only with one of the options.
Make the answer match with one of the options of the particular question.
Dont create extra notes with the answer just match it with one of the options.
If a question cannot have 4 options, do not generate that question.
Do not return options labels as answer ,return the exact option as answer.
IMPORTANT:
Do not generate less than 4 options for any question.
There must be exactly 4 options for each question.
If you cannot generate all 10 questions,
generate fewer questions but always return COMPLETE VALID JSON.
Never stop in the middle of a question.

Example:

{{
  "question": "Who created Python?",
  "options": [
    "John Smith",
    "Guido van Rossum",
    "Bill Gates",
    "Steve Jobs"
  ],
  "answer": "Guido van Rossum"
}}

Bad example:

{{
  "answer": "It was created by Guido van Rossum."
}}

Return valid JSON only.


Format:

{{
  "questions": [
    {{
      "question": "...",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "answer": "..."
    }}
  ]
}}
"""
    
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
            "format":"json",
            "options": {
            "num_predict": 800,
            "temperature": 0.2
            }
        },
        timeout=120
    )

    raw_response = response.json()["response"]
    print("RAW RESPONSE:")
    print(raw_response)
    start = raw_response.find("{")
    end = raw_response.rfind("}") + 1

    json_text = raw_response[start:end]
    
    try:

        quiz = json.loads(json_text)
        fixed_questions = []
        if "questions" not in quiz:
            return {
               "error": "Model did not return questions"
            }
        for q in quiz["questions"]:
            if len(q["options"]) != 4:
               continue
            if q["answer"] not in q["options"]:
                found = False
                for option in q["options"]:
                   if option.lower().strip() == q["answer"].lower().strip():
                         q["answer"] = option
                         found = True
                         break
                if not found:
                    continue
            fixed_questions.append(q)
        quiz["questions"] = fixed_questions
        return quiz
       

    except Exception as e:
        return {
            "error": str(e),
            "raw_response": raw_response
        }
    