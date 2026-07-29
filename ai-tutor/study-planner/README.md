# LearnHub AI — Study Planner

AI-powered study plan generator that creates personalized day-by-day learning roadmaps using **Ollama (llama3.2)** with user authentication, notes, AI summaries, and document analysis.

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| **Frontend**     | React 18 + Vite                     |
| **Backend**      | FastAPI + Uvicorn                   |
| **Database**     | PostgreSQL + SQLAlchemy             |
| **AI Model**     | Ollama (llama3.2, runs locally)     |
| **Auth**         | JWT (PyJWT) + bcrypt password hashing |

## Project Structure

```
study-planner/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── study_planner.py      # Study plan, notes, documents, AI endpoints
│   │   └── auth.py               # Login, signup, password reset
│   ├── migrations/
│   │   ├── add_date_and_created_at.sql
│   │   ├── add_notes_table.sql
│   │   ├── add_documents_table.sql
│   │   └── add_users_and_ownership.sql
│   ├── database.py               # DB connection & session
│   ├── main.py                   # FastAPI entry point
│   ├── models.py                 # SQLAlchemy models (User, StudyPlanItem, Note, Document)
│   ├── security.py               # JWT tokens & password hashing
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Auth page + Dashboard (all UI components)
│   │   ├── main.jsx              # React entry point
│   │   └── styles.css            # Full application styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Features

### Authentication
- Separate full-screen Login / Register page
- JWT-based authentication with bcrypt password hashing
- User profile section with account details and sign-out
- Password reset flow (token-based)

### Study Plan Generation
- AI-generated study plans via Ollama (llama3.2)
- Customizable course name and number of days
- Progress tracking with checkboxes
- Drag-and-drop day reordering
- Search & filter by topic or completion status

### Notes & AI Tools
- Per-day notes editor with auto-save
- AI-powered note summarization
- AI topic explanation
- AI flashcard generation for revision

### Calendar View
- Monthly calendar with study plan overlay
- Assign study topics to specific dates
- Visual progress tracking by date

### Document Upload & Analysis
- Upload study documents (PDF, TXT)
- AI-powered document summarization
- Auto-extract key topics from documents
- Generate study plans from uploaded content
- Estimate study time per document

### Data Management
- PostgreSQL persistence for all data
- Export plans to clipboard or JSON
- Plan history with up to 5 saved snapshots
- Offline fallback with demo plan

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL**
- **Ollama** — after install, run: `ollama pull llama3.2`

## Setup & Run

### 1. Database

```sql
CREATE DATABASE learnhub;
```

Run the migration scripts in order:

```bash
psql -d learnhub -f backend/migrations/add_date_and_created_at.sql
psql -d learnhub -f backend/migrations/add_notes_table.sql
psql -d learnhub -f backend/migrations/add_documents_table.sql
psql -d learnhub -f backend/migrations/add_users_and_ownership.sql
```

### 2. Backend

```bash
cd backend

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Copy and fill in .env.example → .env
copy .env.example .env

# Set environment variables (Windows PowerShell):
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/learnhub"
$env:JWT_SECRET="your-secret-key-here"

pip install -r requirements.txt
python main.py
```

Backend runs on **http://localhost:8001**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5174**

## API Endpoints

### Authentication
| Method | Endpoint                | Description                |
|--------|-------------------------|----------------------------|
| POST   | `/auth/signup`          | Register a new user        |
| POST   | `/auth/login`           | Login and get JWT token    |
| POST   | `/auth/forgot-password` | Request password reset     |
| POST   | `/auth/reset-password`  | Reset password with token  |

### Study Plans
| Method | Endpoint               | Description                |
|--------|------------------------|----------------------------|
| GET    | `/`                    | Health check               |
| POST   | `/generate-study-plan` | Generate AI study plan     |
| POST   | `/update-progress`     | Mark a day done/undone     |
| GET    | `/get-plan/{course}`   | Fetch saved plan           |

### Notes & AI
| Method | Endpoint               | Description                |
|--------|------------------------|----------------------------|
| GET    | `/notes/{course}/{day}`| Get note for a specific day|
| PUT    | `/notes`               | Save or update a note      |
| POST   | `/notes/summarize`     | AI-summarize a note        |
| POST   | `/explain`             | AI-explain a topic         |
| POST   | `/flashcards`          | Generate AI flashcards     |

### Documents
| Method | Endpoint                          | Description                |
|--------|-----------------------------------|----------------------------|
| POST   | `/upload-document`                | Upload a study document    |
| POST   | `/documents/{id}/summarize`       | AI-summarize document      |
| POST   | `/documents/{id}/topics`          | Extract topics from doc    |
| POST   | `/documents/{id}/estimate-time`   | Estimate study time        |
| POST   | `/documents/{id}/generate-plan`   | Generate plan from doc     |
