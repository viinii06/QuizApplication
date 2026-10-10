import { useState } from 'react';
import Login from './pages/Login.jsx';
import Quiz from './pages/Quiz.jsx';
import Results from './pages/Results.jsx';

const appName = import.meta.env.VITE_APP_NAME || 'QuizPop';

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem('session')) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [page, setPage] = useState('quiz');
  const [result, setResult] = useState(null);

  function login(data) {
    localStorage.setItem('session', JSON.stringify(data));
    setSession(data);
    setPage('quiz');
  }

  function logout() {
    localStorage.removeItem('session');
    setSession(null);
    setResult(null);
  }

  function finish(res) {
    setResult(res);
    setPage('results');
  }

  return (
    <div className="shell">
      <header className="topbar">
        <h1 className="logo">{appName}<span>?</span></h1>
        {session && (
          <div className="who">
            <span>Hi, {session.user.name}</span>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        )}
      </header>

      <main>
        {!session && <Login onLogin={login} />}
        {session && page === 'quiz' && <Quiz token={session.token} onFinish={finish} onAuthError={logout} />}
        {session && page === 'results' && (
          <Results token={session.token} result={result} onRetry={() => setPage('quiz')} onAuthError={logout} />
        )}
      </main>
    </div>
  );
}
