import { useState, useRef, useEffect } from "react";
import "./App.css";
import PerformancePage from "./PerformancePage";

function App() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState({});
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfTopic, setPdfTopic] = useState("");
  const [mode, setMode] = useState("");
  const [view, setView] = useState("dashboard");
  const [errorMessage, setErrorMessage] = useState("");
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("quiz_settings");
      return saved
        ? JSON.parse(saved)
        : { numQuestions: 10, timer: "no-limit", theme: "light" };
    } catch {
      return { numQuestions: 10, timer: "no-limit", theme: "light" };
    }
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const controllerRef = useRef(null);
  const [bursts, setBursts] = useState({});

  const answeredCount = Object.keys(answered).length;
  const completed = quiz.length > 0 && answeredCount === quiz.length;
  const correctCount = Object.values(answered).filter((item) => item.isCorrect).length;
  const percentage = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    try {
      localStorage.setItem("quiz_settings", JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  useEffect(() => {
    if (quiz.length > 0 && !completed && settings.timer !== "no-limit") {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, completed, settings.timer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const startTimer = () => {
    if (settings.timer === "no-limit" || quiz.length === 0) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const total = settings.timer === "2min" ? 120 : settings.timer === "5min" ? 300 : 0;
    setTimeLeft(total);

    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const savePerformance = () => {
    try {
      const topicKey = topic || pdfTopic || "General";
      const stored = JSON.parse(localStorage.getItem("quiz_performance") || "{}");
      const prev = stored[topicKey] || { attempts: 0, correct: 0, total: 0 };
      stored[topicKey] = {
        attempts: prev.attempts + 1,
        correct: prev.correct + correctCount,
        total: prev.total + quiz.length,
      };
      localStorage.setItem("quiz_performance", JSON.stringify(stored));
    } catch {
      // ignore storage errors
    }
  };

  const resetSession = (keepMode = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setQuiz([]);
    setAnswered({});
    setScore(0);
    setTimeLeft(0);
    setErrorMessage("");
    setView("dashboard");
    if (!keepMode) {
      setMode("");
      setTopic("");
      setPdfTopic("");
      setFile(null);
    }
  };

  const fetchQuiz = async (endpoint, body, isForm = false) => {
    try {
      setErrorMessage("");
      setLoading(true);
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch(endpoint, {
        method: "POST",
        body,
        signal: controller.signal,
        headers: isForm ? undefined : { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.questions) {
        setQuiz(data.questions);
        setAnswered({});
        setScore(0);
        setView("dashboard");
      } else {
        setErrorMessage(data.error || "Quiz generation failed. Please try again.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        setErrorMessage("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = () => {
    if (!topic.trim()) {
      setErrorMessage("Please enter a topic to continue.");
      return;
    }
    fetchQuiz(
      "http://127.0.0.1:8000/generate-quiz",
      JSON.stringify({ topic, num_questions: settings.numQuestions }),
    );
  };

  const generatePdfQuiz = () => {
    if (!file) {
      setErrorMessage("Please select a PDF file.");
      return;
    }
    if (!pdfTopic.trim()) {
      setErrorMessage("Please enter a PDF topic.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", pdfTopic);
    formData.append("num_questions", settings.numQuestions);
    fetchQuiz("http://127.0.0.1:8000/generate-pdf-quiz", formData, true);
  };

  const checkAnswer = (index, option, correct) => {
    if (answered[index]) return;
    const isCorrect = option === correct;
    setAnswered((prev) => ({ ...prev, [index]: { selected: option, isCorrect } }));
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setBursts((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => setBursts((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      }), 800);
    }
  };

  const handleFinish = () => {
    savePerformance();
    setView("performance");
  };

  if (view === "performance") {
    return (
      <PerformancePage
        onClose={() => resetSession(false)}
        onClear={() => {
          localStorage.removeItem("quiz_performance");
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-icon">🎯</div>
          <div>
            <h1>QuizDash</h1>
            <p>Professional learning dashboard</p>
          </div>
        </div>

        <div className="sidebar-card">
          <h2>Session overview</h2>
          <p><strong>Mode:</strong> {mode || "Not selected"}</p>
          <p><strong>Questions:</strong> {settings.numQuestions}</p>
          <p><strong>Timer:</strong> {settings.timer === "no-limit" ? "No limit" : settings.timer}</p>
        </div>

        <div className="sidebar-card highlight-card">
          <h2>Live stats</h2>
          <div className="stat-row">
            <div><span>{quiz.length}</span><small>Total</small></div>
            <div><span>{correctCount}</span><small>Correct</small></div>
            <div><span>{percentage}%</span><small>Accuracy</small></div>
          </div>
        </div>

        <div className="sidebar-card">
          <h2>Quick settings</h2>
          <label>Questions</label>
          <select value={settings.numQuestions} onChange={(e) => setSettings((prev) => ({ ...prev, numQuestions: Number(e.target.value) }))}>
            {[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>

          <label>Timer</label>
          <select value={settings.timer} onChange={(e) => setSettings((prev) => ({ ...prev, timer: e.target.value }))}>
            <option value="no-limit">No limit</option>
            <option value="2min">2 min</option>
            <option value="5min">5 min</option>
          </select>

          <label>Theme</label>
          <select value={settings.theme} onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value }))}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="sidebar-card actions-card">
          <button className="btn primary" onClick={() => setView("performance")} disabled={!quiz.length}>View performance</button>
          <button className="btn secondary" onClick={() => resetSession()}>Start fresh</button>
        </div>
      </aside>

      <main className="content-panel">
        <section className="hero-block">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Turn every study session into a polished performance workflow.</h2>
            <p>Pick a mode, configure your quiz and finish only when you're ready to open the performance review.</p>
          </div>
          <div className="hero-cards">
            <div className="hero-card"><strong>{quiz.length}</strong><span>Loaded questions</span></div>
            <div className="hero-card"><strong>{settings.numQuestions}</strong><span>Goal size</span></div>
            <div className="hero-card"><strong>{settings.timer === "no-limit" ? "∞" : formatTime(timeLeft)}</strong><span>Timer</span></div>
          </div>
        </section>

        <section className="panel-grid">
          <article className="panel mode-panel">
            <h3>Choose quiz type</h3>
            <div className="mode-grid">
              <button className={`mode-card ${mode === "topic" ? "active" : ""}`} onClick={() => setMode("topic")}>
                Topic quiz
              </button>
              <button className={`mode-card ${mode === "pdf" ? "active" : ""}`} onClick={() => setMode("pdf")}>
                PDF quiz
              </button>
            </div>
          </article>

          <article className="panel start-panel">
            <h3>{mode === "pdf" ? "PDF quiz setup" : "Topic quiz setup"}</h3>
            {mode === "pdf" ? (
              <>
                <label>Upload PDF file</label>
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
                <label>PDF topic</label>
                <input type="text" placeholder="Chapter 3" value={pdfTopic} onChange={(e) => setPdfTopic(e.target.value)} />
              </>
            ) : (
              <>
                <label>Quiz topic</label>
                <input type="text" placeholder="Photosynthesis" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </>
            )}

            <div className="button-group">
              <button className="btn primary" onClick={mode === "pdf" ? generatePdfQuiz : generateQuiz} disabled={loading || (mode === "topic" ? !topic.trim() : !file || !pdfTopic.trim())}>
                {loading ? "Loading..." : "Start quiz"}
              </button>
              <button className="btn secondary" onClick={() => resetSession()}>
                Reset
              </button>
            </div>
            {errorMessage && <div className="alert-box">{errorMessage}</div>}
          </article>
        </section>

        {quiz.length > 0 && (
          <section className="quiz-section">
            <div className="quiz-header">
              <div>
                <p className="eyebrow">{completed ? "Finished" : "In progress"}</p>
                <h3>{completed ? "Quiz complete" : "Answer all questions to finish"}</h3>
              </div>
              <div className="pill">{settings.timer === "no-limit" ? "No limit" : formatTime(timeLeft)}</div>
            </div>

            <div className="score-grid">
              <div className="score-card"><strong>{correctCount}</strong><span>Correct</span></div>
              <div className="score-card"><strong>{answeredCount}/{quiz.length}</strong><span>Answered</span></div>
              <div className="score-card"><strong>{percentage}%</strong><span>Accuracy</span></div>
            </div>

            <div className="questions-list">
              {quiz.map((question, index) => {
                const answer = answered[index];
                return (
                  <div key={index} className="question-card">
                    <div className="question-title">
                      <span>Q{index + 1}</span>
                      <p>{question.question}</p>
                    </div>

                    <div className="options-list">
                      {question.options.map((option, idx) => {
                        const selected = answer?.selected === option;
                        const statusClass = answer ? (selected ? (answer.isCorrect ? "correct" : "wrong") : "disabled") : "";
                        return (
                          <button
                            key={idx}
                            className={`option-button ${statusClass}`}
                            disabled={!!answer}
                            onClick={() => checkAnswer(index, option, question.answer)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {answer && (
                      <div className={`feedback ${answer.isCorrect ? "correct" : "wrong"}`}>
                        {answer.isCorrect ? "Correct!" : `Wrong — correct answer: ${question.answer}`}
                      </div>
                    )}

                    {bursts[index] && <div className="burst">✨</div>}
                  </div>
                );
              })}
            </div>

            {completed && (
              <div className="finish-panel">
                <button className="btn secondary" onClick={() => resetSession(false)}>Restart quiz</button>
                <button className="btn danger" onClick={handleFinish}>Finish & view performance</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
