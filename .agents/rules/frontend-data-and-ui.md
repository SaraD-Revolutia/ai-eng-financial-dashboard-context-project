# Frontend data and UI

## Scope

Applies to changes under `frontend/src/`, including API consumption, financial types/calculations, and dashboard components.

## Rationale

`frontend/src/App.tsx` fetches `/api/metrics` and calculates dashboard values through `frontend/src/lib/financial-utils.ts`. The shared financial contracts are in `frontend/src/lib/financial-types.ts`; dashboard components live in `frontend/src/components/dashboard/`, with shared primitives in `frontend/src/components/ui/`.

## Rules

- Keep API movement fields in sync with the backend contract. Movement properties are currently `snake_case`; derived frontend KPI properties use `camelCase` (`frontend/src/lib/financial-types.ts`).
- Put reusable financial types, calculations, and formatters in `frontend/src/lib/`; keep presentation in components.
- Use the configured `@/` alias for imports from `src` (`frontend/vite.config.ts`, `frontend/tsconfig.app.json`).
- Keep displayed period labels consistent with the data returned. The backend generates dates relative to `date.today()`, while `frontend/src/App.tsx` currently supplies a fixed `2024 - Full Year` label.
- Treat date-only strings consistently across time zones. `computeMonthlyData()` currently parses them with `new Date(...)` and groups by local getters; add/maintain coverage for month boundaries when changing this logic.
- The dashboard currently requests only `/api/metrics`; do not assume other backend analytical endpoints are already used by the UI. Wire them explicitly before relying on them in dashboard behavior.
- Add or update utility tests in `frontend/src/lib/financial-utils.test.ts` when changing financial calculations. Run `npm test` and `npm run build` from `frontend/` when practical.
