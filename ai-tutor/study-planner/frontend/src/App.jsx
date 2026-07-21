import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileJson,
  FileText,
  Filter,
  Loader2,
  LockKeyhole,
  NotebookPen,
  Play,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Upload,
  UserCircle,
} from "lucide-react";

const samplePlan = {
  course: "Java",
  num_days: 7,
  plan: [
    { day: 1, topic: "Variables and Data Types", done: true },
    { day: 2, topic: "Conditional Statements", done: true },
    { day: 3, topic: "Loops", done: false },
    { day: 4, topic: "Arrays", done: false },
    { day: 5, topic: "Methods", done: false },
    { day: 6, topic: "OOP Basics", done: false },
    { day: 7, topic: "Revision and Practice Test", done: false },
  ],
};

const apiBaseUrl = "http://localhost:8001";
const apiHeaders = {
  "Content-Type": "application/json",
};

/* ─── Standalone Auth Page (Login / Register) ─── */
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        const res = await fetch(`${apiBaseUrl}/auth/signup`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Signup failed");
        // Auto-login after signup
        setMode("login");
        setError("");
        setBusy(false);
        // Fall through to login
        const loginRes = await fetch(`${apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.detail || "Login failed");
        onLogin(loginData.access_token, { email, name: name || email.split("@")[0] });
        return;
      }
      // Login
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      onLogin(data.access_token, { email, name: email.split("@")[0] });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles size={32} />
          </div>
          <h1>Study Planner</h1>
          <p>Plan, track, and ace your studies with AI</p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => { setMode("register"); setError(""); }}
            type="button"
          >
            Register
          </button>
        </div>

        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Name
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : null}
            {mode === "register" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            className="auth-switch"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function toIsoDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const tabs = [
  { id: "plan", label: "Plan", icon: ClipboardCheck },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "uploads", label: "Files", icon: Upload },
  { id: "account", label: "Account", icon: UserCircle },
  { id: "history", label: "History", icon: BookOpen },
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function createMockPlan(course, numDays) {
  const topics = [
    "Introduction and setup",
    "Core concepts",
    "Important examples",
    "Practice problems",
    "Common mistakes",
    "Revision notes",
    "Mock test",
  ];

  return {
    course,
    num_days: numDays,
    plan: Array.from({ length: numDays }, (_, index) => ({
      day: index + 1,
      topic: topics[index % topics.length],
      done: false,
    })),
  };
}

function normalizePlan(payload, fallbackCourse, fallbackDays) {
  if (!payload || !Array.isArray(payload.plan)) {
    throw new Error("Backend response must include a plan array.");
  }

  return {
    course: payload.course || fallbackCourse,
    num_days: Number(payload.num_days || fallbackDays),
    plan: payload.plan.map((item, index) => ({
      day: Number(item.day || index + 1),
      date: item.date || null,
      topic: String(item.topic || "Study topic"),
      done: Boolean(item.done),
    })),
  };
}

function persistPlan(plan) {
  localStorage.setItem("studyplanner:lastPlan", JSON.stringify(plan));
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function isoFor(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function getMonthCells(year, month) {
  // Monday-first grid sized to the given month.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  const offset = (firstWeekday + 6) % 7; // shift so Monday is column 0
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, index) => {
    const date = index - offset + 1;
    return date >= 1 && date <= daysInMonth ? date : null;
  });
}

function buildSummary(topic, notes) {
  const firstSentence = notes
    .split(/[.!?]/)
    .map((line) => line.trim())
    .filter(Boolean)[0];

  if (firstSentence) {
    return `${topic}: ${firstSentence}. In simple terms, focus on the main idea, one example, and one practice question.`;
  }

  return `${topic} is an important study topic. Start with the definition, understand one clear example, then revise with short practice questions.`;
}

function buildFlashcards(topic, notes) {
  const words = notes
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 5)
    .slice(0, 3);

  const terms = words.length ? words : [topic, "example", "revision"];
  return terms.map((term, index) => ({
    q: `Q${index + 1}. What should you remember about ${term}?`,
    a: `Connect ${term} with ${topic} and write one short example.`,
  }));
}

export default function App() {
  // ── Auth state ──
  const [authToken, setAuthToken] = useState(() => readStorage("studyplanner:token", null));
  const [authUser, setAuthUser] = useState(() => readStorage("studyplanner:user", null));

  const handleLogin = useCallback((token, user) => {
    setAuthToken(token);
    setAuthUser(user);
    localStorage.setItem("studyplanner:token", JSON.stringify(token));
    localStorage.setItem("studyplanner:user", JSON.stringify(user));
  }, []);

  function handleLogout() {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem("studyplanner:token");
    localStorage.removeItem("studyplanner:user");
  }

  // ── Gate: show AuthPage if not logged in ──
  if (!authToken) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // ── Main app (only visible after login) ──
  return <Dashboard authUser={authUser} onLogout={handleLogout} />;
}

function Dashboard({ authUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("plan");
  const [course, setCourse] = useState("Java");
  const [numDays, setNumDays] = useState(7);
  const [planner, setPlanner] = useState(() =>
    readStorage("studyplanner:lastPlan", samplePlan)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Create a focused day-by-day study plan.");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState(4);
  const [draggedDay, setDraggedDay] = useState(null);
  const [savedPlans, setSavedPlans] = useState(() =>
    readStorage("studyplanner:savedPlans", [])
  );
  const [notes, setNotes] = useState(() => readStorage("studyplanner:notes", {}));
  const [documents, setDocuments] = useState(() =>
    readStorage("studyplanner:documents", []).map((doc) => ({
      ...doc,
      busy: { summary: false, topics: false, estimate: false, plan: false },
    }))
  );
  const [account] = useState(() =>
    readStorage("studyplanner:account", {
      name: authUser?.name || "User",
      email: authUser?.email || "",
      signedIn: true,
      courses: ["Java", "Python Basics"],
    })
  );

  // Notes + AI state (backed by the FastAPI endpoints, with local fallback).
  const [noteContent, setNoteContent] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [explanation, setExplanation] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [aiBusy, setAiBusy] = useState({ summary: false, explain: false, cards: false });
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(6); // 0-indexed: 6 = July
  const [selectedIso, setSelectedIso] = useState(null); // selected calendar date (ISO) or null
  const saveTimer = useRef(null);

  const completedCount = useMemo(
    () => planner.plan.filter((item) => item.done).length,
    [planner]
  );

  const progress = planner.plan.length
    ? Math.round((completedCount / planner.plan.length) * 100)
    : 0;

  const filteredPlan = useMemo(() => {
    return planner.plan.filter((item) => {
      const matchesSearch = item.topic.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "done" && item.done) ||
        (filter === "pending" && !item.done);
      return matchesSearch && matchesFilter;
    });
  }, [filter, planner.plan, search]);

  const selectedTopic = planner.plan.find((item) => item.day === selectedDay);
  const notesTopic = selectedTopic || planner.plan[0];
  const selectedNotesKey = notesTopic
    ? `${planner.course}:${notesTopic.day}:${notesTopic.topic}`
    : "";
  const calendarCells = useMemo(
    () => getMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // The task shown in the calendar detail panel is keyed by the selected real
  // date (falling back to day-number for the pre-backend demo plan).
  const selectedCellDay = selectedIso ? Number(selectedIso.split("-")[2]) : null;
  const calendarTask = planner.plan.find((item) =>
    item.date ? item.date === selectedIso : item.day === selectedCellDay
  );
  const firstPlanDate = planner.plan.find((item) => item.date)?.date || null;

  // When a plan with real dates loads, jump the calendar to its first month.
  useEffect(() => {
    if (!firstPlanDate) return;
    const [year, month] = firstPlanDate.split("-").map(Number);
    setViewYear(year);
    setViewMonth(month - 1);
    setSelectedIso(firstPlanDate);
  }, [firstPlanDate]);

  // Load the saved note (and its stored AI summary) whenever the Notes tab
  // opens or the selected day/course changes. Falls back to localStorage.
  useEffect(() => {
    if (activeTab !== "notes" || !notesTopic) return;
    let cancelled = false;
    const localKey = `${planner.course}:${notesTopic.day}:${notesTopic.topic}`;
    setAiSummary("");
    setExplanation("");
    setFlashcards([]);

    (async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/notes/${encodeURIComponent(planner.course)}/${notesTopic.day}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setNoteContent(data.content || "");
            setAiSummary(data.ai_summary || "");
          }
          return;
        }
        // 404 (no note yet) falls through to the local fallback below.
      } catch {
        // backend offline -> local fallback
      }
      const local = readStorage("studyplanner:notes", {})[localKey] || "";
      if (!cancelled) setNoteContent(local);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notesTopic?.day, notesTopic?.topic, planner.course]);

  function updatePlanner(updated, nextMessage) {
    setPlanner(updated);
    persistPlan(updated);
    if (nextMessage) setMessage(nextMessage);
  }

  function updateHistory(plan) {
    const snapshot = {
      id: crypto.randomUUID(),
      savedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      savedAtFull: new Date().toLocaleString(),
      course: plan.course,
      progress: `${Math.round(
        (plan.plan.filter((item) => item.done).length / plan.plan.length) * 100
      )}%`,
      status: plan.plan.every((item) => item.done) ? "Completed" : "In Progress",
      num_days: plan.num_days,
      plan: plan.plan,
    };
    const updated = [snapshot, ...savedPlans].slice(0, 10);
    setSavedPlans(updated);
    localStorage.setItem("studyplanner:savedPlans", JSON.stringify(updated));
  }

  async function generatePlan(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("Generating study plan...");

    try {
      const response = await fetch(`${apiBaseUrl}/generate-study-plan`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ course, num_days: Number(numDays) }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const payload = await response.json();
      const cleanPlan = normalizePlan(payload, course, numDays);
      updatePlanner(cleanPlan, "Your study plan is ready.");
      updateHistory(cleanPlan);
      setSelectedDay(1);
    } catch {
      const mockPlan = createMockPlan(course, Number(numDays));
      updatePlanner(mockPlan, "Backend not reachable, showing demo plan.");
      updateHistory(mockPlan);
      setSelectedDay(1);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleDay(day) {
    const selected = planner.plan.find((item) => item.day === day);
    const nextDone = !selected?.done;
    const updated = {
      ...planner,
      plan: planner.plan.map((item) =>
        item.day === day ? { ...item, done: nextDone } : item
      ),
    };

    updatePlanner(updated, "Progress saved.");

    try {
      await fetch(`${apiBaseUrl}/update-progress`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ course: planner.course, day, done: nextDone }),
      });
      setMessage("Progress updated in backend.");
    } catch {
      setMessage("Progress saved in browser, backend not reachable.");
    }
  }

  function setAllDone(done) {
    const updated = {
      ...planner,
      plan: planner.plan.map((item) => ({ ...item, done })),
    };

    updatePlanner(updated, done ? "All days marked as complete." : "Progress reset.");
    updateHistory(updated);
  }

  async function loadSavedPlan() {
    try {
      const response = await fetch(`${apiBaseUrl}/get-plan/${encodeURIComponent(course)}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const payload = await response.json();
      const cleanPlan = normalizePlan(payload, course, numDays);
      updatePlanner(cleanPlan, "Backend saved plan loaded.");
    } catch {
      const saved = localStorage.getItem("studyplanner:lastPlan");
      if (!saved) {
        setMessage("No backend or browser saved plan found.");
        return;
      }

      const restored = JSON.parse(saved);
      setPlanner(restored);
      setMessage("Backend not reachable, browser saved plan loaded.");
    }
  }

  function savePlanSnapshot() {
    updateHistory(planner);
    persistPlan(planner);
    setMessage("Plan saved in browser storage.");
  }

  function openSavedPlan(id) {
    const selected = savedPlans.find((item) => item.id === id);
    if (!selected) return;

    const restored = {
      course: selected.course,
      num_days: selected.num_days,
      plan: selected.plan,
    };
    setPlanner(restored);
    setCourse(restored.course);
    setNumDays(restored.num_days);
    setSelectedDay(1);
    setMessage(`Loaded saved plan from ${selected.savedAtFull}.`);
  }

  async function copyPlan() {
    const text = planner.plan
      .slice()
      .sort((a, b) => a.day - b.day)
      .map((item) => `Day ${item.day}: ${item.topic} - ${item.done ? "Done" : "Pending"}`)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setMessage("Plan copied to clipboard.");
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(planner, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${planner.course.toLowerCase().replace(/\s+/g, "-")}-study-plan.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("JSON file downloaded.");
  }

  function resetPlan() {
    updatePlanner(samplePlan, "Demo plan reset.");
    setCourse(samplePlan.course);
    setNumDays(samplePlan.num_days);
    setSearch("");
    setFilter("all");
    setSelectedDay(4);
  }

  async function rescheduleTask(fromDay, newIso) {
    if (!fromDay || !newIso) return;
    const prettyDate = new Date(`${newIso}T00:00:00`).toDateString();

    try {
      const res = await fetch(`${apiBaseUrl}/reschedule`, {
        method: "PATCH",
        headers: apiHeaders,
        body: JSON.stringify({ course: planner.course, day: fromDay, new_date: newIso }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      const cleanPlan = normalizePlan(
        { course: planner.course, num_days: planner.num_days, plan: data.plan },
        planner.course,
        planner.num_days
      );
      updatePlanner(cleanPlan, `Day ${fromDay} moved to ${prettyDate}; later days shifted.`);
    } catch {
      // Offline fallback: mirror the backend's "shift later days forward" locally.
      const start = new Date(`${newIso}T00:00:00`);
      const updatedPlan = planner.plan.map((item) => {
        if (item.day < fromDay) return item;
        const shifted = new Date(start);
        shifted.setDate(shifted.getDate() + (item.day - fromDay));
        return { ...item, date: toIsoDate(shifted) };
      });
      updatePlanner(
        { ...planner, plan: updatedPlan },
        `Day ${fromDay} moved to ${prettyDate} locally (backend offline).`
      );
    }

    setSelectedIso(newIso);
    setDraggedDay(null);
  }

  function shiftMonth(delta) {
    const base = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }

  function saveNotes(value) {
    setNoteContent(value);

    // Mirror to localStorage immediately (offline safety).
    const updated = { ...notes, [selectedNotesKey]: value };
    setNotes(updated);
    localStorage.setItem("studyplanner:notes", JSON.stringify(updated));

    // Debounced auto-save to the backend (PUT /notes overwrites per course+day).
    setMessage("Saving notes...");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/notes`, {
          method: "PUT",
          headers: apiHeaders,
          body: JSON.stringify({
            course: planner.course,
            day: notesTopic.day,
            content: value,
          }),
        });
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        setMessage("Notes auto-saved to backend.");
      } catch {
        setMessage("Notes saved in browser (backend offline).");
      }
    }, 900);
  }

  async function handleSummarize() {
    if (!notesTopic) return;
    setAiBusy((state) => ({ ...state, summary: true }));
    setMessage("Generating AI summary...");
    try {
      const res = await fetch(`${apiBaseUrl}/notes/summarize`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ course: planner.course, day: notesTopic.day }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setAiSummary(data.ai_summary || "");
      setMessage("AI summary ready.");
    } catch {
      setAiSummary(buildSummary(notesTopic.topic, noteContent));
      setMessage("Showing offline summary (backend/AI unavailable).");
    } finally {
      setAiBusy((state) => ({ ...state, summary: false }));
    }
  }

  async function handleExplain() {
    if (!notesTopic) return;
    setAiBusy((state) => ({ ...state, explain: true }));
    setMessage("Asking AI for a simple explanation...");
    try {
      const res = await fetch(`${apiBaseUrl}/explain`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          topic: notesTopic.topic,
          context: noteContent || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setExplanation(data.explanation || "");
      setMessage("Explanation ready.");
    } catch {
      setExplanation(
        `Think of ${notesTopic.topic} as a small tool. Learn what it does, when to use it, and practice it twice.`
      );
      setMessage("Showing offline explanation (backend/AI unavailable).");
    } finally {
      setAiBusy((state) => ({ ...state, explain: false }));
    }
  }

  async function handleFlashcards() {
    if (!notesTopic) return;
    setAiBusy((state) => ({ ...state, cards: true }));
    setMessage("Generating flashcards...");
    try {
      const res = await fetch(`${apiBaseUrl}/flashcards`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ course: planner.course, day: notesTopic.day, count: 5 }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setFlashcards((data.cards || []).map((card) => ({ q: card.question, a: card.answer })));
      setMessage("Flashcards ready.");
    } catch {
      setFlashcards(buildFlashcards(notesTopic.topic, noteContent));
      setMessage("Showing offline flashcards (backend/AI unavailable).");
    } finally {
      setAiBusy((state) => ({ ...state, cards: false }));
    }
  }

  function persistDocuments(next) {
    localStorage.setItem("studyplanner:documents", JSON.stringify(next));
  }

  function updateDoc(id, patch) {
    setDocuments((prev) => {
      const next = prev.map((doc) =>
        doc.document_id === id ? { ...doc, ...patch } : doc
      );
      persistDocuments(next);
      return next;
    });
  }

  function setDocBusy(id, key, value) {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.document_id === id ? { ...doc, busy: { ...doc.busy, [key]: value } } : doc
      )
    );
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      setMessage(`Uploading ${file.name}...`);
      const form = new FormData();
      form.append("file", file);

      try {
        // No Content-Type header here — the browser sets the multipart boundary.
        const res = await fetch(`${apiBaseUrl}/upload-document`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const detail =
            (await res.json().catch(() => ({}))).detail || `Upload failed (${res.status})`;
          setMessage(`${file.name}: ${detail}`);
          continue;
        }

        const data = await res.json(); // {document_id, filename, char_count}
        const doc = {
          document_id: data.document_id,
          filename: data.filename,
          char_count: data.char_count,
          summary: "",
          topics: [],
          estimate: null,
          busy: { summary: false, topics: false, estimate: false, plan: false },
        };
        setDocuments((prev) => {
          const next = [doc, ...prev].slice(0, 8);
          persistDocuments(next);
          return next;
        });
        setMessage(`${file.name} uploaded — ${data.char_count} characters extracted.`);
      } catch {
        setMessage(`${file.name}: backend not reachable. Start the server to upload.`);
      }
    }

    event.target.value = "";
  }

  async function summarizeDoc(id) {
    setDocBusy(id, "summary", true);
    setMessage("Summarizing document...");
    try {
      const res = await fetch(`${apiBaseUrl}/documents/${id}/summarize`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateDoc(id, { summary: data.summary });
      setMessage("Document summary ready.");
    } catch {
      setMessage("Summarize failed (backend/AI unavailable).");
    } finally {
      setDocBusy(id, "summary", false);
    }
  }

  async function extractDocTopics(id) {
    setDocBusy(id, "topics", true);
    setMessage("Extracting important topics...");
    try {
      const res = await fetch(`${apiBaseUrl}/documents/${id}/topics`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateDoc(id, { topics: data.topics || [] });
      setMessage("Topics extracted.");
    } catch {
      setMessage("Topic extraction failed (backend/AI unavailable).");
    } finally {
      setDocBusy(id, "topics", false);
    }
  }

  async function estimateDocTime(id) {
    setDocBusy(id, "estimate", true);
    setMessage("Estimating study time...");
    try {
      const res = await fetch(`${apiBaseUrl}/documents/${id}/estimate-time`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateDoc(id, { estimate: data });
      setMessage("Study-time estimate ready.");
    } catch {
      setMessage("Estimate failed (backend/AI unavailable).");
    } finally {
      setDocBusy(id, "estimate", false);
    }
  }

  async function planFromDoc(id) {
    setDocBusy(id, "plan", true);
    setMessage("Generating study plan from document...");
    try {
      const res = await fetch(`${apiBaseUrl}/documents/${id}/generate-plan`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ num_days: Number(numDays) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); // {document_id, course, num_days, plan}
      const cleanPlan = normalizePlan(data, data.course, data.num_days);
      updatePlanner(cleanPlan, `Study plan generated from ${data.course}.`);
      updateHistory(cleanPlan);
      setCourse(data.course);
      setNumDays(data.num_days);
      setActiveTab("plan");
    } catch {
      setMessage("Plan generation failed (backend/AI unavailable).");
    } finally {
      setDocBusy(id, "plan", false);
    }
  }

  // submitAccount removed — auth is now handled by AuthPage

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>Study Planner</h1>
            <p>Plan, track, revise</p>
          </div>
        </div>

        <form className="planner-form" onSubmit={generatePlan}>
          <label>
            Course
            <input
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              placeholder="Java"
              required
            />
          </label>

          <label>
            Number of days
            <input
              type="number"
              min="1"
              max="31"
              value={numDays}
              onChange={(event) => setNumDays(event.target.value)}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            Generate Plan
          </button>
        </form>

        <nav className="side-tabs" aria-label="Planner sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">July 2026 Dashboard</span>
            <h2>{planner.course} study roadmap</h2>
            <p>{message}</p>
          </div>
          <div className="top-actions">
            <button type="button" onClick={savePlanSnapshot} title="Save plan">
              <Save size={18} />
              Save
            </button>
            <button type="button" onClick={loadSavedPlan} title="Load saved plan">
              <ClipboardCheck size={18} />
              Load
            </button>
            <button type="button" onClick={copyPlan} title="Copy plan">
              <Download size={18} />
              Copy
            </button>
            <button type="button" onClick={downloadJson} title="Download JSON">
              <FileJson size={18} />
              JSON
            </button>
            <button type="button" onClick={resetPlan} title="Reset demo plan">
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <article>
            <CalendarDays size={20} />
            <strong>{planner.num_days}</strong>
            <span>Total days</span>
          </article>
          <article>
            <CheckCircle2 size={20} />
            <strong>{completedCount}</strong>
            <span>Completed</span>
          </article>
          <article>
            <AlertCircle size={20} />
            <strong>{planner.plan.length - completedCount}</strong>
            <span>Pending</span>
          </article>
          <article>
            <Sparkles size={20} />
            <strong>{progress}%</strong>
            <span>Progress</span>
          </article>
        </section>

        <section className="progress-panel">
          <div>
            <strong>{progress}% complete</strong>
            <span>
              {completedCount} of {planner.plan.length} days done
            </span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>

        {activeTab === "plan" && (
          <>
            <section className="controls-panel">
              <div className="search-box">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search topics"
                />
              </div>
              <div className="filter-group" aria-label="Plan filter">
                <Filter size={18} />
                {["all", "pending", "done"].map((item) => (
                  <button
                    className={filter === item ? "active" : ""}
                    key={item}
                    onClick={() => setFilter(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button className="plain-action" type="button" onClick={() => setAllDone(true)}>
                Mark all done
              </button>
              <button className="plain-action" type="button" onClick={() => setAllDone(false)}>
                Reset progress
              </button>
            </section>

            <section className="plan-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Checklist</span>
                  <h3>Day-by-day plan</h3>
                </div>
                <span className="pill">{filteredPlan.length} shown</span>
              </div>

              <div className="plan-list">
                {filteredPlan
                  .slice()
                  .sort((a, b) => a.day - b.day)
                  .map((item) => (
                    <label
                      className={`day-row ${item.done ? "done" : ""}`}
                      draggable
                      key={`${item.day}-${item.topic}`}
                      onDragStart={() => setDraggedDay(item.day)}
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleDay(item.day)}
                      />
                      <button
                        className="day-number"
                        onClick={() => {
                          setSelectedDay(item.day);
                          setActiveTab("notes");
                        }}
                        type="button"
                      >
                        Day {item.day}
                      </button>
                      <span className="topic-text">{item.topic}</span>
                      <span className="status">{item.done ? "Done" : "Pending"}</span>
                    </label>
                  ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "calendar" && (
          <section className="feature-grid">
            <article className="calendar-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Month View</span>
                  <h3>{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="plain-action"
                    onClick={() => shiftMonth(-1)}
                    aria-label="Previous month"
                  >
                    ‹ Prev
                  </button>
                  <button
                    type="button"
                    className="plain-action"
                    onClick={() => shiftMonth(1)}
                    aria-label="Next month"
                  >
                    Next ›
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {weekdays.map((day) => (
                  <strong className="weekday" key={day}>
                    {day}
                  </strong>
                ))}
                {calendarCells.map((date, index) => {
                  const cellIso = date ? isoFor(viewYear, viewMonth, date) : null;
                  const task = planner.plan.find((item) =>
                    item.date ? item.date === cellIso : item.day === date
                  );
                  return (
                    <button
                      className={`calendar-cell ${cellIso && cellIso === selectedIso ? "selected" : ""} ${
                        task?.done ? "done" : ""
                      }`}
                      disabled={!date}
                      key={`${date || "blank"}-${index}`}
                      onClick={() => cellIso && setSelectedIso(cellIso)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => cellIso && rescheduleTask(draggedDay, cellIso)}
                      type="button"
                    >
                      {date && (
                        <>
                          <span>{date}</span>
                          <small>{task ? (task.done ? "Done" : "Pending") : "Free"}</small>
                          {task && <em draggable onDragStart={() => setDraggedDay(task.day)}>{task.topic}</em>}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="detail-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Daily Schedule</span>
                  <h3>
                    {selectedIso
                      ? new Date(`${selectedIso}T00:00:00`).toDateString()
                      : "Select a date"}
                  </h3>
                </div>
                <span className="pill">{calendarTask?.done ? "Done" : "Pending"}</span>
              </div>
              {calendarTask ? (
                <div className="schedule-card">
                  <strong>{calendarTask.topic}</strong>
                  <span>
                    {calendarTask.date
                      ? new Date(`${calendarTask.date}T00:00:00`).toDateString()
                      : `Day ${calendarTask.day}`}
                  </span>
                  <p>Review concept notes, solve practice tasks, and write a short recap.</p>
                  <button type="button" onClick={() => toggleDay(calendarTask.day)}>
                    <CheckCircle2 size={18} />
                    Toggle completion
                  </button>
                </div>
              ) : (
                <p className="empty-note">No task planned for this date.</p>
              )}
            </article>
          </section>
        )}

        {activeTab === "notes" && notesTopic && (
          <section className="feature-grid">
            <article className="notes-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Day {notesTopic.day}</span>
                  <h3>{notesTopic.topic}</h3>
                </div>
                <span className="pill">Auto-save</span>
              </div>
              <div className="editor-toolbar" aria-label="Rich text controls">
                {["B", "I", "H1", "List"].map((control) => (
                  <button type="button" key={control}>
                    {control}
                  </button>
                ))}
              </div>
              <textarea
                value={noteContent}
                onChange={(event) => saveNotes(event.target.value)}
                placeholder="Write your personal notes here..."
              />
            </article>

            <article className="ai-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">AI Study Helper</span>
                  <h3>Summary and flashcards</h3>
                </div>
                <Sparkles size={22} />
              </div>
              <div className="summary-box">
                <strong>AI Summary</strong>
                <p>{aiSummary || "Save your notes, then generate a plain-language summary."}</p>
                <button
                  className="plain-action"
                  type="button"
                  onClick={handleSummarize}
                  disabled={aiBusy.summary}
                >
                  {aiBusy.summary ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  Summarize notes
                </button>
              </div>
              <div className="summary-box">
                <strong>Simple Explanation</strong>
                <p>{explanation || `Get a beginner-friendly explanation of ${notesTopic.topic}.`}</p>
                <button
                  className="plain-action"
                  type="button"
                  onClick={handleExplain}
                  disabled={aiBusy.explain}
                >
                  {aiBusy.explain ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  Explain simply
                </button>
              </div>
              <div className="summary-box">
                <strong>Flashcards</strong>
                <button
                  className="plain-action"
                  type="button"
                  onClick={handleFlashcards}
                  disabled={aiBusy.cards}
                >
                  {aiBusy.cards ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  Generate flashcards
                </button>
              </div>
              <div className="flashcard-list">
                {flashcards.map((card, index) => (
                  <div className="flashcard" key={`${index}-${card.q}`}>
                    <strong>{card.q}</strong>
                    <span>{card.a}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === "uploads" && (
          <section className="feature-grid">
            <article className="upload-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">File Upload</span>
                  <h3>AI review</h3>
                </div>
                <Upload size={22} />
              </div>
              <label className="drop-zone">
                <FileText size={34} />
                <strong>Upload PDF, DOCX, or TXT notes / textbook / syllabus</strong>
                <span>
                  Text is extracted on the server and reviewed by AI. Max 10&nbsp;MB.
                  Scanned images / handwritten photos aren't supported (no OCR yet).
                </span>
                <input
                  accept=".pdf,.docx,.txt"
                  multiple
                  onChange={handleFiles}
                  type="file"
                />
              </label>
            </article>

            <article className="review-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Extracted Insights</span>
                  <h3>AI review</h3>
                </div>
                <span className="pill">{documents.length} files</span>
              </div>
              <div className="review-list">
                {documents.length ? (
                  documents.map((doc) => (
                    <div className="review-card" key={doc.document_id}>
                      <strong>{doc.filename}</strong>
                      <span>{doc.char_count.toLocaleString()} characters extracted</span>

                      <div className="editor-toolbar">
                        <button type="button" onClick={() => summarizeDoc(doc.document_id)} disabled={doc.busy.summary}>
                          {doc.busy.summary ? <Loader2 className="spin" size={14} /> : null} Summarize
                        </button>
                        <button type="button" onClick={() => extractDocTopics(doc.document_id)} disabled={doc.busy.topics}>
                          {doc.busy.topics ? <Loader2 className="spin" size={14} /> : null} Topics
                        </button>
                        <button type="button" onClick={() => estimateDocTime(doc.document_id)} disabled={doc.busy.estimate}>
                          {doc.busy.estimate ? <Loader2 className="spin" size={14} /> : null} Estimate time
                        </button>
                        <button type="button" onClick={() => planFromDoc(doc.document_id)} disabled={doc.busy.plan}>
                          {doc.busy.plan ? <Loader2 className="spin" size={14} /> : null} Generate plan
                        </button>
                      </div>

                      {doc.summary && <p><strong>Summary:</strong> {doc.summary}</p>}

                      {doc.topics.length > 0 && (
                        <p><strong>Topics:</strong> {doc.topics.join(", ")}</p>
                      )}

                      {doc.estimate && (
                        <p>
                          <strong>Estimated study time:</strong> {doc.estimate.estimated_hours} hour(s)
                          {doc.estimate.breakdown?.length
                            ? ` — ${doc.estimate.breakdown
                                .map((b) => `${b.topic}: ${b.hours}h`)
                                .join("; ")}`
                            : ""}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="empty-note">No files uploaded yet.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === "account" && (
          <section className="feature-grid">
            <article className="account-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Profile</span>
                  <h3>Your Account</h3>
                </div>
                <UserCircle size={22} />
              </div>
              <div className="profile-info">
                <div className="profile-avatar">
                  <UserCircle size={64} />
                </div>
                <div className="profile-details">
                  <div className="profile-row">
                    <span className="profile-label">Name</span>
                    <span className="profile-value">{authUser?.name || "User"}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Email</span>
                    <span className="profile-value">{authUser?.email || "—"}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Status</span>
                    <span className="pill">Signed in</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Courses</span>
                    <span className="profile-value">{account.courses.join(", ")}</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={onLogout} type="button">
                  Sign Out
                </button>
              </div>
            </article>

            <article className="detail-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Workspace</span>
                  <h3>Your Study Data</h3>
                </div>
                <span className="pill">{savedPlans.length} plans saved</span>
              </div>
              <ul className="feature-list">
                <li>Your study plans are saved and linked to your account.</li>
                <li>Track study history and completion percentage.</li>
                <li>Manage multiple courses: {account.courses.join(", ")}.</li>
              </ul>
            </article>
          </section>
        )}

        {activeTab === "history" && (
          <section className="saved-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Plan History</span>
                <h3>Previous study plans</h3>
              </div>
              <span className="pill">{savedPlans.length} saved</span>
            </div>
            <div className="history-table">
              <div className="history-head">
                <span>Date</span>
                <span>Course</span>
                <span>Progress</span>
                <span>Action</span>
              </div>
              {savedPlans.length ? (
                savedPlans.map((item) => (
                  <div className="history-row" key={item.id}>
                    <span>{item.savedAt}</span>
                    <strong>{item.course}</strong>
                    <span>{item.status} - {item.progress}</span>
                    <button type="button" onClick={() => openSavedPlan(item.id)}>
                      Open
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-note">No saved snapshots yet.</p>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
