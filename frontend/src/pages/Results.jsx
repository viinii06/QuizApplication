import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Results({ token, result, onRetry, onAuthError }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/attempts', { token })
      .then(setHistory)
      .catch((err) => (err.status === 401 ? onAuthError() : setError(err.message)));
  }, [token]);

  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <section>
      {result && (
        <div className="card score">
          <p className="tag">Your score</p>
          <p className="big-score">{result.score}<small>/{result.total}</small></p>
          <p>{pct >= 80 ? 'Brilliant! 🎉' : pct >= 50 ? 'Nice work! 👍' : 'Keep practising! 💪'}</p>
          <button className="btn" onClick={onRetry}>Try again</button>
        </div>
      )}

      {result && (
        <div className="card">
          <h3>Review</h3>
          <ul className="review">
            {result.questions.map((q) => {
              const ok = result.answers[q.id] === result.correct[q.id];
              return (
                <li key={q.id} className={ok ? 'ok' : 'bad'}>
                  <b>{ok ? '✓' : '✗'}</b> {q.text}
                  {!ok && <span className="muted"> — answer: {q.options[result.correct[q.id]]}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>Recent attempts</h3>
        {error && <p className="error">{error}</p>}
        {!error && history.length === 0 && <p className="muted">No attempts yet.</p>}
        <ul className="history">
          {history.map((a) => (
            <li key={a.id}>
              <span>{new Date(a.created_at + 'Z').toLocaleString()}</span>
              <b>{a.score}/{a.total}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
