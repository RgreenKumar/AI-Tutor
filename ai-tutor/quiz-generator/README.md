# Quiz Generator (QuizDash)

## Overview

Quiz Generator (QuizDash) is a small full-stack application that generates multiple-choice quizzes using a local LLM API and provides a React-based dashboard to take quizzes, review answers, and track cumulative performance in the browser (LocalStorage). The backend is a FastAPI service that prepares prompts and forwards them to a third-party or locally-hosted LLM endpoint; it also supports PDF-based quiz generation using embeddings (SentenceTransformers + ChromaDB).

The project is intended as a study/practice tool for learners and instructors who want to quickly generate topic-based quizzes and keep track of cumulative performance locally.

## Repository layout

- `main.py` — FastAPI backend that accepts quiz-generation requests and (1) calls an LLM generation endpoint or (2) processes uploaded PDFs to generate context-based quizzes.
- `requirements.txt` — Python dependencies for the backend.
- `quiz-frontend/` — React + Vite frontend (UI, quiz flow, performance tracking).
  - `quiz-frontend/src/App.jsx` — Main application and quiz logic.
  - `quiz-frontend/src/PerformancePage.jsx` — Performance / history view.
  - `quiz-frontend/package.json` — Frontend dependencies and scripts.

## Key libraries, frameworks and tools

Backend (Python)
- `fastapi` — HTTP API framework.
- `uvicorn` — ASGI server for running the FastAPI app.
- `requests` — HTTP client used to call the LLM service.
- `pypdf` — PDF parsing for the PDF-quiz flow.
- `python-multipart` — file uploads support for FastAPI.
- `sentence-transformers` — for encoding PDF text into embeddings (`all-MiniLM-L6-v2` used).
- `chromadb` — lightweight vector store used to retrieve relevant PDF chunks by embedding similarity.

Frontend (React)
- React 19 (via `react` and `react-dom`)
- Vite — dev server and build tooling.

LLM / Model Server
- The backend posts prompt payloads to `http://localhost:11434/api/generate` with a payload that contains `model`, `prompt`, `format`, etc. In the default code it targets `llama3.2:3b` (this is a model identifier used by the local model server in this environment).

## Exact dependency list (from repo)

Backend (`requirements.txt`):

- fastapi
- uvicorn
- requests
- pypdf
- python-multipart
- sentence-transformers
- chromadb

Frontend (`quiz-frontend/package.json`):

- react ^19.2.6
- react-dom ^19.2.6
- vite ^8.0.12 (dev)
- @vitejs/plugin-react ^6.0.1 (dev)
- ESLint and types/dev helpers (dev)

## How the AI/LLM integration works

Where: `main.py`

- Topic-based quiz generation: endpoint `POST /generate-quiz` accepts JSON `{ "topic": "..." }`. The backend composes a prompt specifying constraints (10 MCQs, 4 options, JSON-only output, etc.) and then forwards that prompt to an LLM generation endpoint via an HTTP `POST` to `http://localhost:11434/api/generate`.
  - Example payload (from `main.py`):
    {
      "model": "llama3.2:3b",
      "prompt": "<constructed prompt>",
      "stream": False,
      "format": "json"
    }
  - The backend expects the LLM to return text that includes a JSON object. The FastAPI code attempts to extract the first JSON object in the model response string and parse it to validate `questions` and ensure each question has exactly 4 options and the answer matches one of them.

- PDF-based quiz generation: endpoint `POST /generate-pdf-quiz` accepts a `file` (PDF) and `topic` (form). The backend:
  1. Extracts text from the uploaded PDF using `pypdf`.
  2. Splits the text into overlapping chunks and computes embeddings with `sentence-transformers` (`all-MiniLM-L6-v2`).
  3. Stores chunk embeddings & documents in a `chromadb` collection and queries for relevant chunks given the `topic` embedding.
  4. Trims the retrieved context and builds a detailed prompt that instructs the model to generate JSON-only MCQs based on that context.
  5. Calls the same LLM generation endpoint as above and post-processes the returned JSON similarly.

Notes on integration flow
- The backend does not call a remote cloud-hosted API by default; it posts to a model server running on `localhost:11434` (this is often a local LLM host, e.g., Ollama, a custom model server, or another local inference API). The code assumes the server exposes a `/api/generate` endpoint that returns JSON containing `response` with model text.
- The LLM integration is implemented synchronously using `requests.post(..., timeout=120)` and expects non-streaming JSON responses.

## Setup and run instructions (Development)

Prerequisites
- Python 3.10+ (or 3.11+ recommended)
- Node.js (v18+ recommended) and `npm`
- A working local LLM server compatible with the expected `/api/generate` interface (see "Model server" below) running on `localhost:11434` (or update `main.py` to point at your server)

1) Backend setup

- Create and activate a Python virtual environment (Windows example):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

- Install Python dependencies:

```powershell
pip install -r requirements.txt
```

- Start the backend FastAPI app (from repository root):

```powershell
cd C:\Users\adams\OneDrive\Desktop\quiz-generator
python -m uvicorn main:app --reload --port 8000
```

The backend will be available at `http://127.0.0.1:8000/`.

2) Frontend setup

- Open a separate terminal and install Node dependencies:

```bash
cd quiz-frontend
npm install
```

- Start the development server:

```bash
npm run dev
```

By default Vite tries ports `5173`, `5174`, ...; the dev server will print a Local URL (e.g., `http://localhost:5176/`) — open that in your browser.

3) Model server (LLM) requirement

- The backend expects a model server at `http://localhost:11434/api/generate`. The sample requests in `main.py` use a JSON format like:

```json
{
  "model": "llama3.2:3b",
  "prompt": "...",
  "stream": false,
  "format": "json"
}
```

- How you run this model server depends on the provider. Examples:
  - Ollama (local): start Ollama and ensure it exposes an HTTP API that matches the usage above or adapt `main.py` to your server's API.
  - Custom server: If you have a local Flask/FastAPI server that wraps a model, point `main.py` to its `/api/generate` endpoint.

If you do not have a local model server available, the endpoints in `main.py` will return connection errors. In that case either run a compatible server or modify `main.py` to call a cloud LLM provider (OpenAI, etc.) — you will need to adapt prompt and response parsing code accordingly and add API keys / environment variables as described below.

## Environment variables & configuration

- The current code does not read runtime configuration from environment variables for the model server URL or API key; these values are hard-coded in `main.py` as `http://localhost:11434/api/generate`. For production or flexible setup consider exposing the model server URL and model name via environment variables. Example variables you could add and use in `main.py`:

- `MODEL_SERVER_URL` — default `http://localhost:11434/api/generate`
- `MODEL_NAME` — default `llama3.2:3b`
- For cloud models (OpenAI, etc.) you would add `OPENAI_API_KEY` or equivalent.

To adapt `main.py` to environment variables, replace hard-coded URLs and names with `os.environ.get("MODEL_SERVER_URL", "http://localhost:11434/api/generate")` and similar.

## Troubleshooting

- Vite port conflicts: If Vite reports a port already in use it will try the next available port; consult the console output to find the Local URL. You can force Vite's port by setting `PORT` environment variable or passing `--port` to the dev server.
- Backend cannot reach LLM server: make sure your model server is running on `localhost:11434` (or change `main.py`). If you see connection refused or timeout errors, confirm the model server process is up and listening on that port.
- PDF extraction: If `pypdf` cannot extract any text from a PDF, the backend returns `{"error": "Could not extract text from PDF."}`. Try with a text-based PDF (not scanned images) or run OCR before sending the PDF.
- ChromaDB: the code uses `chromadb.Client()` with default settings. Depending on your environment you may need to run a Chroma server or install compatible storage plugins. See the ChromaDB docs if you hit storage/permission errors.

## Security and production notes

- The project is currently configured for local development. Do not expose the model server or backend to the public internet without authentication and rate limiting.
- When integrating cloud LLMs, store API keys in environment variables and never commit them to source control.
- Consider adding request size limits and stronger validation when accepting file uploads.

## Where to look in the code

- `main.py` — core backend logic, prompt templates and LLM calls, PDF processing pipeline and embedding+Chroma logic.
- `quiz-frontend/src/App.jsx` — main UI, quiz flow, loading overlay, `savePerformance()` function (LocalStorage) and UI controls.
- `quiz-frontend/src/PerformancePage.jsx` — performance dashboard and "practice again" flow.
- `requirements.txt` and `quiz-frontend/package.json` — dependency lists for backend and frontend.

## Example requests (for developers)

- Generate a quiz (topic) from the UI: the frontend sends a `POST` request to `http://127.0.0.1:8000/generate-quiz` with JSON `{ "topic": "Photosynthesis" }`.
- Generate a PDF quiz: `POST` a `multipart/form-data` request with `file` and `topic` fields to `http://127.0.0.1:8000/generate-pdf-quiz`.

## Extending or swapping the LLM provider

- If you'd like to use OpenAI, Anthropic, or another hosted provider, replace the `requests.post(...)` call in `main.py` with the appropriate SDK or HTTP call and update the prompt/response parsing. Make sure to add any required environment variables (API keys) and update `README.md` accordingly.

