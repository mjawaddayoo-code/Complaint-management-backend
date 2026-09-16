# Complaint Management System — Backend (API)

Express + MongoDB REST API. The React frontend lives in `../frontend` and
talks to this over HTTP with session cookies (`credentials: include`).

## Setup

```
npm install
cp .env.example .env   # then fill in real values
npm run dev             # or: npm start
```

The API listens on `http://localhost:3000` by default. Set `FRONTEND_URL`
in `.env` to wherever the React app runs (`http://localhost:5173` in dev)
so CORS + cookies work.

## ⚠️ Rotate your credentials

If you're migrating from the original EJS project, its `db.js` and
`index.js` had a live MongoDB connection string, an SMTP password, and the
admin password (`jawad123`) hardcoded directly in source. None of that is
in this codebase — everything comes from `.env` — but if those files were
ever committed or shared, treat those credentials as compromised and
rotate them (MongoDB Atlas user password, SMTP password, and pick a new
`ADMIN_PASSWORD`).

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, auto-login |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | — | Destroy session |
| GET | `/api/auth/me` | — | Current user (or `null`) |
| POST | `/api/complaints` | user | Submit a complaint (save-first, email-second) |
| GET | `/api/complaints/:id` | user | Fetch one of your own complaints |
| POST | `/api/admin/login` | — | Admin password login |
| POST | `/api/admin/logout` | — | Clear admin session |
| GET | `/api/admin/me` | — | `{ isAdmin }` |
| GET | `/api/admin/stats` | admin | Dashboard counts |
| GET | `/api/admin/complaints` | admin | List, `?search=&from=&to=&page=` |
| GET | `/api/admin/complaints/:id` | admin | Complaint details |

Every response is JSON. Validation errors come back as `{ errors: {...} }`
(field-keyed) or `{ error: "..." }` (general), with the matching 4xx status.

## Key behaviors (unchanged from the original spec)

- **Save-first, email-second:** a complaint is written to MongoDB before any
  email is attempted. A failed email never loses the complaint or fails the
  request — the failure is logged and recorded on the complaint
  (`emailSent`/`emailError`) for the admin details view.
- **User identity from session only:** `userId`/`userName`/`userEmail` on a
  complaint always come from `req.session.user`, never from the request body.
- **Admin is not a database user:** it's a session flag (`req.session.isAdmin`)
  set after checking the password against `ADMIN_PASSWORD`. Every `/api/admin/*`
  route (after login/logout) requires it server-side — the frontend's route
  guard is just UX, not the actual protection.
