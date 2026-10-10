import { DatabaseSync } from 'node:sqlite';

// Three tables: users, questions, attempts. Stored in a local SQLite file.
const db = new DatabaseSync('quiz.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    token TEXT
  );
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    answer INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const seed = [
  ['Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 1],
  ['What does HTML stand for?', ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Mode Language'], 0],
  ['What is 9 × 7?', ['56', '72', '63', '49'], 2],
  ['Which language runs natively in web browsers?', ['Python', 'C++', 'Java', 'JavaScript'], 3],
  ['What is the largest ocean on Earth?', ['Atlantic', 'Indian', 'Pacific', 'Arctic'], 2],
  ['Which gas do plants absorb from the air?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1],
  ['How many bits are in a byte?', ['8', '4', '16', '32'], 0],
  ['Who wrote "Romeo and Juliet"?', ['Charles Dickens', 'Jane Austen', 'William Shakespeare', 'Mark Twain'], 2],
];

const { n } = db.prepare('SELECT COUNT(*) AS n FROM questions').get();
if (n === 0) {
  const insert = db.prepare('INSERT INTO questions (text, options, answer) VALUES (?, ?, ?)');
  for (const [text, options, answer] of seed) insert.run(text, JSON.stringify(options), answer);
}

export default db;
