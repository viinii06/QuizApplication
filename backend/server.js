import express from 'express';
import crypto from 'node:crypto';
import db from './db.js';

const { MINIMOTH_API_KEY, MINIMOTH_BASE_URL = 'https://api.minimoth.dev', PORT = 5001 } = process.env;

if (!MINIMOTH_API_KEY) {
  console.error('Missing MINIMOTH_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const CODE_RE = /^\d{4,8}$/;

const app = express();
app.use(express.json());

// Small helper so route handlers can throw errors with a status code.
function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

// Calls the Minimoth API and turns its error responses into our errors.
async function minimoth(path, body) {
  const res = await fetch(`${MINIMOTH_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'X-Api-Key': MINIMOTH_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(res.status >= 500 ? 502 : 400, data.error || 'OTP service error');
  return data;
}

// Reads "Authorization: Bearer <token>" and loads the user.
function requireUser(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = token && db.prepare('SELECT id, phone, name FROM users WHERE token = ?').get(token);
  if (!user) return res.status(401).json({ error: 'Please log in again' });
  req.user = user;
  next();
}

// 1. Send an OTP. Also tells the frontend whether this is a new user (needs a name).
app.post('/api/auth/send-otp', async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  if (!PHONE_RE.test(phone)) fail(400, 'Enter a phone number with country code, e.g. +919876543210');

  await minimoth('/v1/otp/send', { phone });
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  res.json({ message: 'OTP sent', isNewUser: !existing });
});

// 2. Verify the OTP, register the user if needed, and return a session token.
app.post('/api/auth/verify-otp', async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  const code = String(req.body?.code || '').trim();
  const name = String(req.body?.name || '').trim();
  if (!PHONE_RE.test(phone)) fail(400, 'Invalid phone number');
  if (!CODE_RE.test(code)) fail(400, 'Enter the numeric code you received');

  let user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (!user && (name.length < 2 || name.length > 40)) fail(400, 'Name must be 2–40 characters');

  await minimoth('/v1/otp/verify', { phone, code });

  if (!user) user = { id: db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(phone, name).lastInsertRowid };
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, user.id);

  const profile = db.prepare('SELECT id, phone, name FROM users WHERE id = ?').get(user.id);
  res.json({ token, user: profile });
});

// 3. List quiz questions (without the correct answers).
app.get('/api/questions', requireUser, (req, res) => {
  const rows = db.prepare('SELECT id, text, options FROM questions').all();
  res.json(rows.map((q) => ({ ...q, options: JSON.parse(q.options) })));
});

// 4. Submit answers ({ answers: { [questionId]: optionIndex } }) and get a score.
app.post('/api/attempts', requireUser, (req, res) => {
  const answers = req.body?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail(400, 'Answers are required');

  const questions = db.prepare('SELECT id, answer FROM questions').all();
  const score = questions.filter((q) => Number(answers[q.id]) === q.answer).length;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO attempts (user_id, score, total) VALUES (?, ?, ?)')
    .run(req.user.id, score, questions.length);

  const correct = Object.fromEntries(questions.map((q) => [q.id, q.answer]));
  res.status(201).json({ id: Number(lastInsertRowid), score, total: questions.length, correct });
});

// 5. The logged-in user's past attempts, newest first.
app.get('/api/attempts', requireUser, (req, res) => {
  const rows = db
    .prepare('SELECT id, score, total, created_at FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT 10')
    .all(req.user.id);
  res.json(rows);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler (Express 5 forwards async errors here).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong' });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
