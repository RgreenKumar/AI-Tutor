import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileJson,
  Filter,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Search,
  Sparkles,
} from "lucide-react";

const samplePlan = {
  course: "Java",
  num_days: 7,
  plan: [
    { day: 1, topic: "Variables and Data Types", done: false },
    { day: 2, topic: "Conditional Statements", done: false },
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
  "ngrok-skip-browser-warning": "true",
};

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
      topic: String(item.topic || "Study topic"),
      done: Boolean(item.done),
    })),
  };
}

export default function App() {
  const [course, setCourse] = useState("Java");
  const [numDays, setNumDays] = useState(7);
  const [planner, setPlanner] = useState(samplePlan);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Create a focused day-by-day study plan.");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savedPlans, setSavedPlans] = useState(() => {
    const saved = localStorage.getItem("studyplanner:savedPlans");
    return saved ? JSON.parse(saved) : [];
  });

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
        filter === "all" || (filter === "done" && item.done) || (filter === "pending" && !item.done);
      return matchesSearch && matchesFilter;
    });
  }, [filter, planner.plan, search]);

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
      setPlanner(cleanPlan);
      localStorage.setItem("studyplanner:lastPlan", JSON.stringify(cleanPlan));
      setMessage("Your study plan is ready.");
    } catch (error) {
      const mockPlan = createMockPlan(course, Number(numDays));
      setPlanner(mockPlan);
      localStorage.setItem("studyplanner:lastPlan", JSON.stringify(mockPlan));
      setMessage("Backend not reachable, showing demo plan.");
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

    setPlanner(updated);
    localStorage.setItem("studyplanner:lastPlan", JSON.stringify(updated));

    try {
      await fetch(`${apiBaseUrl}/update-progress`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ course: planner.course, day, done: nextDone }),
      });
      setMessage("Progress updated in backend.");
    } catch (error) {
      setMessage("Progress saved in browser, backend not reachable.");
    }
  }

  function setAllDone(done) {
    const updated = {
      ...planner,
      plan: planner.plan.map((item) => ({ ...item, done })),
    };

    setPlanner(updated);
    localStorage.setItem("studyplanner:lastPlan", JSON.stringify(updated));
    setMessage(done ? "All days marked as complete." : "Progress reset.");
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
      setPlanner(cleanPlan);
      localStorage.setItem("studyplanner:lastPlan", JSON.stringify(cleanPlan));
      setMessage("Backend saved plan loaded.");
    } catch (error) {
      const saved = localStorage.getItem("studyplanner:lastPlan");
      if (!saved) {
        setMessage("No backend or browser saved plan found.");
        return;
      }

      setPlanner(JSON.parse(saved));
      setMessage("Backend not reachable, browser saved plan loaded.");
    }
  }

  function savePlanSnapshot() {
    const snapshot = {
      id: crypto.randomUUID(),
      savedAt: new Date().toLocaleString(),
      ...planner,
    };
    const updated = [snapshot, ...savedPlans].slice(0, 5);

    setSavedPlans(updated);
    localStorage.setItem("studyplanner:savedPlans", JSON.stringify(updated));
    localStorage.setItem("studyplanner:lastPlan", JSON.stringify(planner));
    setMessage("Plan saved in browser storage.");
  }

  function openSavedPlan(id) {
    const selected = savedPlans.find((item) => item.id === id);
    if (!selected) return;

    const { savedAt, id: planId, ...plan } = selected;
    setPlanner(plan);
    setCourse(plan.course);
    setNumDays(plan.num_days);
    setMessage(`Loaded saved plan from ${savedAt}.`);
  }

  async function copyPlan() {
    const text = planner.plan
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
    setPlanner(samplePlan);
    setCourse(samplePlan.course);
    setNumDays(samplePlan.num_days);
    setSearch("");
    setFilter("all");
    setMessage("Demo plan reset.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>Study Planner</h1>
            <p>Plan your study schedule</p>
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
              max="120"
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
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Study Planner</span>
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
            {filteredPlan.map((item) => (
              <label className={`day-row ${item.done ? "done" : ""}`} key={item.day}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleDay(item.day)}
                />
                <span className="day-number">Day {item.day}</span>
                <span className="topic-text">{item.topic}</span>
                <span className="status">{item.done ? "Done" : "Pending"}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="saved-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Storage</span>
              <h3>Recent saved plans</h3>
            </div>
            <span className="pill">{savedPlans.length} saved</span>
          </div>
          {savedPlans.length ? (
            <div className="saved-list">
              {savedPlans.map((item) => (
                <button type="button" key={item.id} onClick={() => openSavedPlan(item.id)}>
                  <strong>{item.course}</strong>
                  <span>
                    {item.num_days} days · {item.savedAt}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-note">No saved snapshots yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}
