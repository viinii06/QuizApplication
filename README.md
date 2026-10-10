# QuizPop — Quiz Application

A small full-stack quiz app. You log in with a one-time password (OTP) sent by [Minimoth](https://minimoth.dev), answer 8 multiple-choice questions, and see your score and recent attempts.

- **Frontend:** React and Vite (3 pages: Login, Quiz, Results)
- **Backend:** Node.js, Express and built-in SQLite (`node:sqlite`)
- **Database models:** `users`, `questions`, `attempts`

## API

| Method | Path                   | Auth | Purpose                                   |
| ------ | ---------------------- | ---- | ----------------------------------------- |
| POST   | `/api/auth/send-otp`   | –    | Send an OTP to `{ phone }`                |
| POST   | `/api/auth/verify-otp` | –    | Verify `{ phone, code, name? }`, returns a token |
| GET    | `/api/questions`       | ✓    | List questions (answers hidden)           |
| POST   | `/api/attempts`        | ✓    | Submit `{ answers: { questionId: optionIndex } }` |
| GET    | `/api/attempts`        | ✓    | Your last 10 attempts                     |

Authenticated routes need the `Authorization: Bearer <token>` header.

## Setup

Requirements: Node.js 22.13 or newer, and a Minimoth API key from [app.minimoth.dev](https://app.minimoth.dev/register).

```bash
# 1. Backend
cd backend
cp .env.example .env        # then put your MINIMOTH_API_KEY in .env
npm install
npm run dev                 # http://localhost:5001

# 2. Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 and enter your phone number with the country code, for example `+919876543210`.

## Notes

- New users enter their name on the OTP step. Returning users only need the code.
- The Vite dev server proxies `/api` to `BACKEND_URL`, so the backend needs no CORS setup.
- The backend creates `backend/quiz.db` and adds the sample questions the first time it starts.
- Node may print an `ExperimentalWarning` for `node:sqlite`. You can ignore it.
