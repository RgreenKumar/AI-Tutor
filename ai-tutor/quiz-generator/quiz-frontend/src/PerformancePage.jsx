import { useEffect, useState } from "react";

export default function PerformancePage({ onClose, onClear, onContinue }) {
  const [data, setData] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quiz_performance") || "{}";
      setData(JSON.parse(raw));
    } catch (e) {
      setData({});
    }
  }, []);

  useEffect(() => {
    // trigger a short burst animation when page loads
    const root = document.documentElement;
    root.classList.add("perf-burst");
    const t = setTimeout(() => root.classList.remove("perf-burst"), 1200);
    return () => clearTimeout(t);
  }, []);

  const entries = Object.entries(data || {});
  const summary = entries.reduce(
    (acc, [topic, stats]) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      acc.overallTotal += stats.total || 0;
      acc.overallCorrect += stats.correct || 0;
      if (accuracy >= 75) acc.strong.push(topic);
      else acc.weak.push(topic);
      return acc;
    },
    { overallTotal: 0, overallCorrect: 0, strong: [], weak: [] }
  );
  const overallAccuracy = summary.overallTotal > 0 ? Math.round((summary.overallCorrect / summary.overallTotal) * 100) : 0;

  const formatSeconds = (s) => {
    if (!s) return '0s';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const fmtDate = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return '-';
    }
  };

  const difficultyLabel = (accuracy) => {
    if (accuracy >= 90) return 'Mastered';
    if (accuracy >= 80) return 'Excellent';
    if (accuracy >= 65) return 'Good';
    if (accuracy >= 50) return 'Learning';
    return 'Beginner';
  };

  return (
    <div className="perf-page">
      <div className="perf-header">
        <div>
          <h1>Your Performance Trophy Room</h1>
          <p>Understand your strongest topics and the areas that need more practice.</p>
        </div>
        <div className="perf-actions">
          <button onClick={onClear} className="btn muted">Clear Data</button>
          <button onClick={onClose} className="btn primary">Back</button>
        </div>
      </div>

      <div className="perf-summary">
        <div className="perf-summary-card">
          <strong>{entries.length}</strong>
          <span>Topics tracked</span>
        </div>
        <div className="perf-summary-card">
          <strong>{summary.overallTotal}</strong>
          <span>Total questions</span>
        </div>
        <div className="perf-summary-card">
          <strong>{overallAccuracy}%</strong>
          <span>Overall accuracy</span>
        </div>
      </div>

      <div className="perf-grid">
        {entries.length === 0 && <div className="empty">No attempts yet — take a quiz to earn trophies!</div>}
        {entries.map(([topic, stats]) => {
          const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          const weak = accuracy < 75;
          const attemptsList = Array.isArray(stats.attemptsList) ? stats.attemptsList : [];
          const avgScore = attemptsList.length > 0 ? Math.round((attemptsList.reduce((s,a)=>s+Math.round((a.correct/a.total)*100),0)/attemptsList.length)) : (stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);
          const best = stats.bestScore || (attemptsList.length>0? Math.max(...attemptsList.map(a=>Math.round((a.correct/a.total)*100))):0);
          const last = stats.lastAttempt || (attemptsList.length>0?attemptsList[attemptsList.length-1].timestamp:null);
          const totalTime = stats.totalStudyTime || attemptsList.reduce((s,a)=>s+(a.duration||0),0);
          const mastery = difficultyLabel(accuracy);

          return (
            <div key={topic} className={`perf-card ${weak ? "weak" : "strong"}`}>
                <div className="perf-card-header">
                <div className="trophy">🏆</div>
                <div style={{flex:1}}>
                  <h3>{topic}</h3>
                  <div className="status-tag">{mastery}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="stat small">Attempts: {stats.attempts || attemptsList.length}</div>
                  <div className="stat small">Best: {best}%</div>
                  {onContinue && (
                    <div style={{marginTop:8}}>
                      <button className="btn primary" onClick={() => onContinue(topic)}>Practice again</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="stat">Questions answered: {stats.total || attemptsList.reduce((s,a)=>s+a.total,0)}</div>
              <div className="stat">Correct: {stats.correct || attemptsList.reduce((s,a)=>s+a.correct,0)}</div>
              <div className="stat">Wrong: {(stats.total || attemptsList.reduce((s,a)=>s+a.total,0)) - (stats.correct || attemptsList.reduce((s,a)=>s+a.correct,0))}</div>

              <div className="perf-bar">
                <div className="perf-fill" style={{ width: `${accuracy}%` }} />
              </div>
              <div className="stat accuracy-label">Accuracy: <strong>{accuracy}%</strong> &middot; Avg: <strong>{avgScore}%</strong></div>

              <div className="stat">Last attempt: {last ? fmtDate(last) : '—'}</div>
              <div className="stat">Total study time: {formatSeconds(totalTime)}</div>

              <div className="advice">
                {weak ? "Review this topic again and target the low-accuracy questions." : "Keep practicing to maintain this strong performance."}
              </div>

              {attemptsList.length > 0 && (
                <details className="attempts-list">
                  <summary>View attempts ({attemptsList.length})</summary>
                  <ul>
                    {attemptsList.slice().reverse().map((a, idx) => (
                      <li key={idx}>
                        <strong>{Math.round((a.correct/a.total)*100)}%</strong> — {a.correct}/{a.total} — {formatSeconds(a.duration)} — {fmtDate(a.timestamp)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>

      <div className="flower-layer" aria-hidden>
        <div className="flower">🌸</div>
        <div className="flower">🌼</div>
        <div className="flower">🌺</div>
        <div className="flower">💐</div>
      </div>
    </div>
  );
}
