# Project memory: Financial Metrics Dashboard

## Product overview

This repository implements a financial metrics dashboard. The frontend presents total income, total outcome, profit, profit margin, and monthly income/outcome and profit-margin charts (`frontend/src/App.tsx`, `frontend/src/components/dashboard/kpi-row.tsx`, `frontend/src/components/dashboard/income-outcome-chart.tsx`, `frontend/src/components/dashboard/profit-percent-chart.tsx`). It retrieves financial movements from `GET /api/metrics` (`frontend/src/App.tsx`). The backend currently generates seeded mock movements in code rather than reading from a database (`backend/app/routes.py`).

The API also exposes facets, grouped summaries, top categories, period comparisons, alerts, and B2B/B2C movement endpoints (`backend/app/routes.py`). The current dashboard fetches only `/api/metrics` (`frontend/src/App.tsx`).

## Tech stack

### Languages and frameworks

- TypeScript and React 19 for the frontend (`frontend/package.json`).
- Python and FastAPI for the backend (`backend/requirements.txt`, `backend/app/main.py`).

### Frontend dependencies and tooling

- Vite development/build tool (`frontend/package.json`, `frontend/vite.config.ts`).
- Recharts for charts, Lucide React for icons, and Tailwind CSS 4 via the Vite plugin (`frontend/package.json`, `frontend/vite.config.ts`).
- Vitest for frontend tests; ESLint for linting; TypeScript project build before Vite production build (`frontend/package.json`).

### Backend dependencies and tooling

- Uvicorn serves FastAPI; `debugpy` is enabled by the backend Docker command (`backend/requirements.txt`, `backend/Dockerfile`).
- Pytest and pytest-cov provide backend test tooling (`backend/requirements.txt`).

### Local infrastructure

- Docker Compose defines frontend and backend services, maps ports 5173, 8000, and 5678, and mounts source directories (`docker-compose.yml`).
- Vite proxies `/api` requests to `http://backend:8000` (`frontend/vite.config.ts`).

## Current status

### Implemented

- FastAPI app with health and financial metrics endpoints, request filtering, summary/grouping, top-category ranking, comparison, alert detection, and business-type-specific results (`backend/app/main.py`, `backend/app/routes.py`).
- Seeded mock movement generation and Pydantic response models (`backend/app/routes.py`).
- Dashboard data fetch, loading/error state, KPI calculation, and monthly chart aggregation (`frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`).
- KPI cards and two chart views (`frontend/src/components/dashboard/`).
- Backend route tests and frontend financial utility tests (`backend/tests/test_routes.py`, `frontend/src/lib/financial-utils.test.ts`).
- Docker Compose run instructions and test commands (`README.md`).

### Known gaps and risks

- There is no database integration in the inspected backend; metrics are generated mock data (`backend/app/routes.py`).
- The dashboard header is fixed to `2024 - Full Year`, but backend data years are determined using `date.today()` (`frontend/src/App.tsx`, `backend/app/routes.py`).
- Analytical API endpoints beyond `/api/metrics` are not currently consumed by the dashboard (`frontend/src/App.tsx`, `backend/app/routes.py`).
- CORS currently allows all origins, methods, and headers and enables credentials (`backend/app/main.py`); this should be reviewed before production deployment.
- Runtime test execution has not been confirmed in the current environment. Earlier attempts reported missing Vitest and FastAPI dependencies; the available result should be rechecked when the environment changes.

## Potential follow-up work (not a committed roadmap)

The following are observations and possible follow-ups inferred from the current code, not stated product commitments or an approved roadmap:

- The header uses a fixed `2024 - Full Year` label while backend-generated dates depend on `date.today()` (`frontend/src/App.tsx`, `backend/app/routes.py`).
- The API exposes analytical endpoints beyond `/api/metrics`, but the current dashboard only fetches `/api/metrics` (`backend/app/routes.py`, `frontend/src/App.tsx`).
- CORS allows all origins, methods, and headers and enables credentials (`backend/app/main.py`); review configuration against actual deployment requirements before deployment.
- Test execution should be repeated in an environment with dependencies installed; documented commands are in `README.md` and scripts/dependencies are listed in `frontend/package.json` and `backend/requirements.txt`.

## Useful commands

From repository root, start the stack:

```bash
docker compose up --build
```

Run tests from root:

```bash
(cd frontend && npm test)
(cd backend && pytest)
```

Frontend scripts also include `npm run lint` and `npm run build` (`frontend/package.json`). The README lists dashboard/API URLs and mentions `frontend/.env.example` for an alternate `VITE_API_BASE_URL` (`README.md`).
