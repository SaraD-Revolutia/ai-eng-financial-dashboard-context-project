# Tooling and verification

## Scope

Applies to local development setup, tests, lint/build checks, and documentation changes across the repository.

## Rationale

`docker-compose.yml` defines frontend and backend services; `frontend/vite.config.ts` proxies `/api` to `http://backend:8000`. The README documents `docker compose up --build` and local service URLs. Frontend scripts in `frontend/package.json` include `test`, `lint`, and `build`; backend tests live in `backend/tests/`.

## Rules

- Keep `README.md`, `docker-compose.yml`, and `frontend/vite.config.ts` consistent when changing local ports, service names, proxy targets, or startup steps.
- Use the documented Compose flow for integrated local development: `docker compose up --build` from the repository root.
- Run the relevant checks from each package directory: `(cd frontend && npm test)`, `(cd frontend && npm run lint)`, and `(cd frontend && npm run build)`; use `(cd backend && pytest)` for backend changes. State clearly if checks could not be run, including missing dependencies or tooling.
- Add/update tests with behavior changes: backend endpoint tests belong in `backend/tests/test_routes.py`; frontend calculation tests are in `frontend/src/lib/financial-utils.test.ts`.
- Respect the `@/` alias and existing directory layout when documenting frontend imports or adding source files; the alias is configured in `frontend/vite.config.ts` and `frontend/tsconfig.app.json`.
