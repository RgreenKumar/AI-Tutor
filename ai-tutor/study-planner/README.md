# LearnHub AI — Study Planner

AI-powered study plan generator that creates personalized day-by-day learning roadmaps using **Ollama (llama3.2)**.

## Tech Stack

| Layer        | Technology                      |
|--------------|---------------------------------|
| **Frontend** | React 18 + Vite                 |
| **Backend**  | FastAPI + Uvicorn               |
| **Database** | PostgreSQL + SQLAlchemy         |
| **AI Model** | Ollama (llama3.2, runs locally) |

## Project Structure

```
learnhub-ai/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   └── study_planner.py     # API routes
│   ├── database.py              # DB connection & session
│   ├── main.py                  # FastAPI entry point
│   ├── models.py                # SQLAlchemy models
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variable template
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── App.jsx              # Main React component
│   │   ├── main.jsx             # React entry point
│   │   └── styles.css           # Styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

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

# Set DATABASE_URL (Windows PowerShell):
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/learnhub"

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

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | `/`                    | Health check             |
| POST   | `/generate-study-plan` | Generate AI study plan   |
| POST   | `/update-progress`     | Mark a day done/undone   |
| GET    | `/get-plan/{course}`   | Fetch saved plan         |

## Features

- AI-generated plans via Ollama
- PostgreSQL persistence
- Progress tracking with checkboxes
- Search & filter by topic / status
- Export to clipboard or JSON
- Plan snapshots (up to 5 saved locally)
- Stats dashboard with progress bar
- Offline fallback demo plan
