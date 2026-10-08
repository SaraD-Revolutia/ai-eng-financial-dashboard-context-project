# Repository findings and proposed rules

## Findings that passed review

### Architecture

- **A1 — Backend responsibilities are concentrated in one module.** `backend/app/routes.py` defines API routes, Pydantic response models, mock-data generation, filtering, and metric calculations.
- **A2 — The current dashboard consumes only the raw metrics endpoint.** `frontend/src/App.tsx` fetches `/api/metrics`; additional analytical routes are defined in `backend/app/routes.py`.
- **A3 — Frontend domain logic has a distinct home.** Types are defined in `frontend/src/lib/financial-types.ts` and calculations/formatters in `frontend/src/lib/financial-utils.ts`; dashboard components are in `frontend/src/components/dashboard/` and shared UI components in `frontend/src/components/ui/`.

### Naming

- **N1 — Frontend imports use the `@/` alias for `src`.** The alias is configured in `frontend/vite.config.ts` and `frontend/tsconfig.app.json`.
- **N2 — API movement fields use snake_case; derived frontend KPI fields use camelCase.** Both shapes are visible in `frontend/src/lib/financial-types.ts`.

### Testing

- **T1 — Backend route tests are in `backend/tests/test_routes.py`.** The frontend financial utility tests are in `frontend/src/lib/financial-utils.test.ts`.
- **T2 — Frontend test, lint, and build commands are declared in `frontend/package.json`** (`test`, `lint`, and `build` scripts).

### Documentation

- **D1 — Local Compose startup and service URLs are documented.** `README.md` gives `docker compose up --build` and URLs for ports 5173 and 8000, plus the API docs URL.
- **D2 — README documents the optional API base URL setup.** `README.md` names `frontend/.env.example` and `VITE_API_BASE_URL`. The example file is ignored by the file-reading tool in this workspace, so this finding is limited to what the README says; no claim is made here about the example file's contents.

### Developer experience

- **X1 — Compose maps the frontend and backend ports.** `docker-compose.yml` publishes 5173 for the frontend and 8000 (plus debug port 5678) for the backend.
- **X2 — Vite provides the local API proxy and source alias.** `frontend/vite.config.ts` proxies `/api` to `http://backend:8000` and maps `@` to `frontend/src`.

### Data and behavior

- **B1 — Mock movement generation depends on the current date.** `generate_mock_movements()` in `backend/app/routes.py` calls `date.today()` and assigns years based on it; `frontend/src/App.tsx` hard-codes the header period as `2024 - Full Year`.
- **B2 — Mock generation reseeds Python's process-global random generator.** `generate_mock_movements()` in `backend/app/routes.py` calls `random.seed(seed)`.
- **B3 — Date-only movement strings are parsed into JavaScript `Date` objects and grouped using local getters.** `computeMonthlyData()` in `frontend/src/lib/financial-utils.ts` calls `new Date(m.create_date)` and then `getFullYear()`/`getMonth()`; timezone differences can affect grouping.
- **B4 — CORS is configured permissively.** `backend/app/main.py` allows all origins, methods, and headers, and sets `allow_credentials=True`.

## Discarded

- **The finding that `frontend/.env.example` is missing is discarded.** It was based on a failed tool read, not evidence that the file is absent; the user confirmed it exists at the path named in `README.md`. No missing-file claim is retained.

## Proposed rules

1. **Keep backend response models and frontend data types aligned when changing API fields.** Cite finding **N2** (`frontend/src/lib/financial-types.ts`) and **A1** (`backend/app/routes.py`).
2. **When changing which metrics the dashboard displays, connect the relevant endpoint explicitly rather than assuming the dashboard already consumes all API routes.** Cite finding **A2** (`frontend/src/App.tsx`, `backend/app/routes.py`).
3. **If mock date generation or the dashboard header period changes, keep the displayed period consistent with the generated data.** Cite finding **B1** (`backend/app/routes.py`, `frontend/src/App.tsx`).
4. **Avoid seeding Python's process-global random generator for mock-data generation; use a local seeded generator if reproducibility is needed.** Cite finding **B2** (`backend/app/routes.py`).
5. **Handle date-only values with an explicit, consistent timezone strategy, and cover month-boundary cases in tests.** Cite finding **B3** (`frontend/src/lib/financial-utils.ts`) and **T1** (`frontend/src/lib/financial-utils.test.ts`).
6. **Restrict allowed CORS origins, methods, headers, and credential behavior for deployments that do not require unrestricted access.** Cite finding **B4** (`backend/app/main.py`).
7. **Use the configured `@/` alias for frontend imports from `src`, and preserve the existing source layout for shared logic and UI.** Cite finding **N1** (`frontend/vite.config.ts`, `frontend/tsconfig.app.json`) and **A3** (`frontend/src/lib/`, `frontend/src/components/`).
8. **Add or update tests when changing route behavior or financial calculations.** Cite finding **T1** (`backend/tests/test_routes.py`, `frontend/src/lib/financial-utils.test.ts`); use the declared frontend commands in **T2** (`frontend/package.json`).
9. **Keep setup documentation aligned with Compose ports and Vite proxy settings when changing local development configuration.** Cite finding **D1** (`README.md`), **X1** (`docker-compose.yml`), and **X2** (`frontend/vite.config.ts`).
