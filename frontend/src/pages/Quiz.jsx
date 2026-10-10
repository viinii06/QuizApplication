import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Quiz({ token, onFinish, onAuthError }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api('/questions', { token })
      .then(setQuestions)
      .catch((err) => (err.status === 401 ? onAuthError() : setError(err.message)))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      return setError('Answer every question before submitting.');
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await api('/attempts', { method: 'POST', token, body: { answers } });
      onFinish({ ...result, questions, answers });
    } catch (err) {
      if (err.status === 401) return onAuthError();
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <p className="muted center">Loading questions…</p>;

  const answered = Object.keys(answers).length;

  return (
    <section>
      <div className="progress">
        <div style={{ width: `${(answered / (questions.length || 1)) * 100}%` }} />
      </div>
      <p className="muted">{answered} of {questions.length} answered</p>

      {questions.map((q, i) => (
        <div key={q.id} className="card question">
          <p className="tag">Q{i + 1}</p>
          <h3>{q.text}</h3>
          <div className="options">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                className={`option ${answers[q.id] === idx ? 'picked' : ''}`}
                onClick={() => setAnswers({ ...answers, [q.id]: idx })}
              >
                <span className="letter">{'ABCD'[idx]}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="error">{error}</p>}
      <button className="btn big" onClick={submit} disabled={submitting || !questions.length}>
        {submitting ? 'Scoring…' : 'Submit answers'}
      </button>
    </section>
  );
}
