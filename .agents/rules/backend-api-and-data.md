# Backend API and data

## Scope

Applies to the FastAPI app, route handlers, API models, and data/metric behavior in `backend/`.

## Rationale

`backend/app/main.py` creates the FastAPI application and includes the router from `backend/app/routes.py`. That routes module currently contains Pydantic models, mock-data generation, filtering, calculations, and endpoint handlers. It generates deterministic mock movements using `random.seed(seed)` and dates based on `date.today()`.

## Rules

- Keep endpoint query parameters and response models explicit. Update corresponding frontend types and tests when the API contract changes.
- Preserve current mock generation reproducibility without unnecessarily mutating global random state. `generate_mock_movements()` currently calls `random.seed(seed)`; prefer a local seeded random generator if changing its implementation.
- Consider date-range behavior whenever changing mock-data generation: movement years derive from the current date, and the frontend currently displays a fixed 2024 period (`frontend/src/App.tsx`).
- Keep filtering, grouping, and comparison behavior covered by backend tests in `backend/tests/test_routes.py` when changed.
- Review CORS before deployment. `backend/app/main.py` currently allows all origins, methods, and headers and enables credentials; narrow these settings to the required deployment origins and behavior where appropriate.
- The route module combines API and domain responsibilities. If adding substantial features, separate concerns while preserving endpoint contracts and existing tests.
