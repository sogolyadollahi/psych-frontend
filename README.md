# Psych Frontend

A separate Next.js frontend for the [Psych FastAPI backend](https://github.com/sogolyadollahi/psych).

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- TanStack Query for server state
- Lucide React icons
- Dark charcoal UI with lime accents
- English as the default interface language

## Requirements

- Node.js 20.9+
- npm
- Psych API running locally

## Getting started (PowerShell)

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

The API base URL defaults to `http://localhost:9000/api/v1`, matching the host port documented in the backend repository's Docker Compose instructions. If you run Uvicorn directly on port 8000, change `NEXT_PUBLIC_API_BASE_URL` to `http://localhost:8000/api/v1`.

## API contract notes from the backend source

- API prefix: `/api/v1`
- Health check: `GET /health` (outside the `/api/v1` prefix)
- Registration: `POST /auth/register` with `{ "email": "...", "password": "..." }`
- Login: `POST /auth/login` with `{ "email": "...", "password": "..." }`; returns `{ "access_token": "...", "token_type": "bearer" }`
- Current auth user: `GET /auth/me`
- Current profile: `GET /users/me`
- Dashboard: `GET /dashboard/today`, `GET /dashboard/summary`
- Workouts: `/workouts`
- Meals: `/meals`, including nested meal items and food search/nutrition endpoints
- Supplements: `/supplements`
- Progress: `/progress` and `/progress/analytics`
- Statistics: `GET /statistics`
- Food scanner: `POST /food-scanner/scan` multipart field `image`; `GET /food-scanner/candidates`; `POST /food-scanner/items`

Authenticated endpoints expect `Authorization: Bearer <access_token>`. The login and registration pages are connected to the backend. The current frontend stores the access token in `sessionStorage` so a session survives a page refresh within the same browser tab, then validates it with `GET /auth/me`. This is an interim MVP strategy: JavaScript can access sessionStorage, so before public production deployment, prefer a backend-supported `HttpOnly`, `Secure`, `SameSite` cookie session or another carefully reviewed token architecture.

## CORS

The backend's default `CORS_ORIGINS` includes `http://localhost:3000` and `http://127.0.0.1:3000`. For deployment, configure the backend allowlist to the deployed frontend origin.

## Current scope

The dashboard is still a visual prototype: its metric values and activity chart are sample data and are not fetched from the API yet. Login, registration, session restoration, sign-out, and dashboard route protection are implemented. Run `npm run typecheck`, `npm run lint`, and `npm run build` locally before merging or deploying changes.
