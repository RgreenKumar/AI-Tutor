# 📚 AI Tutor using Retrieval-Augmented Generation (RAG)

## Project Overview

AI Tutor is an intelligent web-based learning assistant that enables students to interact with their study materials through natural language. Users can upload PDF documents, ask questions related to the uploaded content, and receive AI-generated answers based on the selected document.

The application combines Retrieval-Augmented Generation (RAG) with Google's Gemini Large Language Model (LLM) to generate context-aware responses instead of generic AI answers.

The system also provides PDF management, voice input support, chat history, and user authentication to create an interactive learning environment.

---

# Features

- User Login and Signup
- AI Tutor Mode
- PDF Tutor Mode
- Upload PDF documents
- View uploaded PDFs
- Replace existing PDFs
- Rename PDFs
- Delete PDFs
- Dynamic PDF listing
- Recent chat history
- Voice input using Speech Recognition
- AI avatar interface
- User profile page
- Logout functionality

---

# Technology Stack

## Frontend

- React.js
- Vite
- Axios
- React Router DOM
- React Icons
- Framer Motion
- React Speech Recognition

## Backend

- FastAPI
- Python 3.11+
- Uvicorn
- Pydantic

## AI & RAG

- Google Gemini API
- Retrieval-Augmented Generation (RAG)

## PDF Processing

- PyMuPDF (fitz)

## Storage

- Local File Storage (`app/uploads`)
- Local JSON storage for chats (if applicable)

---

# Project Structure

```
AI_TUTOR_PROJECT

├── backend
│   ├── app
│   │   ├── main.py
│   │   ├── routes
│   │   ├── rag
│   │   ├── services
│   │   ├── uploads
│   │   └── ...
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   └── ...
│   └── package.json
│
└── README.md
```

---

# Backend Architecture

The backend is developed using **FastAPI**.

Main responsibilities include:

- User requests
- PDF upload and management
- Retrieval-Augmented Generation pipeline
- Gemini API communication
- Chat history management

---

# Backend Modules

## main.py

Application entry point.

Responsibilities:

- Creates FastAPI app
- Configures CORS
- Registers API routes
- Serves uploaded PDFs

---

## upload.py

Handles PDF management.

Endpoints include:

- Upload PDF
- Replace PDF
- Rename PDF
- Delete PDF

Uploaded files are stored inside:

```
app/uploads/
```

---

## pdf_manager.py

Reads all uploaded PDFs and returns:

- filename
- file size
- upload date

This data is displayed in

- Sidebar
- PDF Manager

---

## rag_tutor.py

Core AI module.

Workflow:

1. Receive selected PDF name
2. Receive user question
3. Extract PDF text
4. Split text into chunks
5. Retrieve most relevant chunk
6. Send context to Gemini
7. Return generated answer

---

## pdf_loader.py

Extracts plain text from uploaded PDFs using PyMuPDF.

---

## chunker.py

Splits extracted text into manageable chunks.

This improves retrieval efficiency.

---

## retriever.py

Finds the chunk most relevant to the user's question.

Only the retrieved chunk is sent to Gemini.

---

## gemini_service.py

Responsible for communicating with Google's Gemini API.

Functions:

- Creates prompts
- Sends context
- Receives AI responses

---

## chat.py

Manages chat history.

Functions include:

- Load previous chats
- Delete chats
- Store conversations

---

# Frontend Architecture

Frontend is built using React and Vite.

Main pages include:

- Login
- Signup
- Tutor
- PDF Manager
- Profile

Reusable components:

- Sidebar
- Chat Window
- Avatar Panel
- Chat Input
- Profile Card

---

# AI Integration

## Large Language Model Used

Google Gemini

Purpose:

Generate answers from the retrieved PDF context.

The model does not answer directly from general knowledge.

Instead, it receives:

```
Relevant PDF Context
+
User Question
```

and generates an answer based on the selected study material.

---

# RAG Pipeline

```
User Question

↓

React Frontend

↓

FastAPI (/rag-ask)

↓

Extract PDF Text

↓

Chunk Text

↓

Retrieve Relevant Chunk

↓

Gemini API

↓

Generated Answer

↓

Frontend Chat Window
```

---

# Third-Party Libraries

## Frontend

- react
- react-dom
- react-router-dom
- axios
- react-icons
- framer-motion
- react-speech-recognition

## Backend

- fastapi
- uvicorn
- python-multipart
- pydantic
- PyMuPDF
- google-generativeai
- scikit-learn
- numpy

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

# Backend Setup

Navigate to backend

```bash
cd backend
```

Create virtual environment

Windows

```bash
python -m venv venv
```

Activate

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run server

```bash
uvicorn app.main:app --reload
```

Backend runs on

```
http://localhost:8000
```

---

# Frontend Setup

Navigate to frontend

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run development server

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Environment Variables

Create a `.env` file in the backend directory.

Example

```
GEMINI_API_KEY=YOUR_API_KEY
```

Replace with your own Gemini API key.

---

# API Endpoints

| Method | Endpoint | Description |
|----------|----------------|----------------|
| GET | / | Backend status |
| POST | /upload-pdf | Upload PDF |
| GET | /pdfs | Get uploaded PDFs |
| PUT | /replace-pdf/{filename} | Replace PDF |
| PUT | /rename-pdf | Rename PDF |
| DELETE | /delete-pdf/{filename} | Delete PDF |
| POST | /rag-ask | Ask questions from PDF |
| GET | /chats | Fetch chat history |
| DELETE | /chat/{id} | Delete chat |

---

# AI Integration Flow

```
Frontend

↓

ChatWindow.jsx

↓

Axios POST

↓

/rag-ask

↓

rag_tutor.py

↓

pdf_loader.py

↓

chunker.py

↓

retriever.py

↓

gemini_service.py

↓

Google Gemini API

↓

Generated Answer

↓

Frontend
```

---

# Future Improvements

- Database integration
- JWT Authentication
- Multiple users
- Cloud storage for PDFs
- Vector database (FAISS/ChromaDB)
- Conversation memory
- Streaming AI responses
- OCR support for scanned PDFs
- Multilanguage support 

---
