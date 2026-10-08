# Rule validation — Phase 3 changes

Phase 3 files reviewed: `backend/app/routes.py`, `frontend/src/lib/financial-utils.ts`, `backend/tests/test_routes.py`, `frontend/src/lib/financial-utils.test.ts`, and `README.md`.

## `backend/app/routes.py`

- **Rule:** `.agents/rules/backend-api-and-data.md` — preserve seeded mock-data reproducibility without mutating global random state.
- **Change:** `generate_mock_movements()` now creates a local `random.Random(seed)` and passes it into `_build_movement()`; random draws use that instance.
- **Actual test result:** `docker compose exec backend pytest` — **16 passed, 1 warning**. The warning is a Starlette deprecation warning concerning `httpx` with `starlette.testclient`.

## `frontend/src/lib/financial-utils.ts`

- **Rule:** `.agents/rules/frontend-data-and-ui.md` — handle ISO date-only values consistently and preserve calendar-month grouping.
- **Change:** Monthly aggregation extracts the year and month directly from the ISO date string rather than parsing it as a JavaScript `Date` and using local getters.
- **Actual test result:** `docker compose exec frontend npm test` — **1 test file passed, 6 tests passed**.

## `backend/tests/test_routes.py`

- **Rule:** `.agents/rules/backend-api-and-data.md` — cover changed mock-generation behavior with a backend regression test.
- **Change:** Added a test verifying seeded movement generation does not change Python's global random state.
- **Actual test result:** `docker compose exec backend pytest` — **16 passed, 1 warning** (same Starlette deprecation warning).

## `frontend/src/lib/financial-utils.test.ts`

- **Rule:** `.agents/rules/frontend-data-and-ui.md` — add regression coverage for date-only month-boundary behavior.
- **Change:** Added a test verifying `2024-01-01` is grouped under January 2024.
- **Actual test result:** `docker compose exec frontend npm test` — **1 test file passed, 6 tests passed**.

## `README.md`

- **Rule:** `.agents/rules/tooling-and-verification.md` — document project test commands and keep developer instructions actionable.
- **Change:** Added frontend and backend test commands, using package-specific working directories from the repository root.
- **Actual test result:** README change has no separate automated test. The documented suites were run in containers: backend **16 passed, 1 warning**; frontend **6 passed**. Both Compose services built and started successfully with `docker compose up --build -d`.

## Execution notes

- Project startup: `docker compose up --build -d` — **successful**.
- Backend: `docker compose exec backend pytest` — **16 passed, 1 warning**.
- Frontend: `docker compose exec frontend npm test` — **6 passed**.
- No failures were observed in the requested startup or test commands.