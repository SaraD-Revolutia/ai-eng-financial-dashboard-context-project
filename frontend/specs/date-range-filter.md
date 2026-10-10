# Date range filter

## Goal

Let dashboard users restrict financial movement data to a chosen inclusive date range, with available bounds discovered from the API rather than hard-coded in the UI.

## API contract (verified in `/docs`)

- `GET /api/metrics/facets` takes no query parameters. Its response includes `min_date` and `max_date` (`YYYY-MM-DD`), plus `operation_types`, `business_types`, and `categories`.
- `GET /api/metrics` accepts optional `start_date` and `end_date` date query parameters (`YYYY-MM-DD`). It also accepts optional `category` and `operation_type` filters. It returns an array of `FinancialMovement` objects with `create_date`, `amount`, `operation_type`, `category`, and `business_type`.
- The current frontend calls `/api/metrics` without query parameters and does not fetch `/api/metrics/facets` (`frontend/src/App.tsx`).

## Behavior

1. On dashboard load, request facets and use `min_date`/`max_date` as the selectable range bounds. Do not assume a calendar year or reuse the current hard-coded header period as the data range.
2. Initialize the selected range to the API-provided minimum and maximum dates.
3. When the user applies a range, request `/api/metrics?start_date=<YYYY-MM-DD>&end_date=<YYYY-MM-DD>` and use that response as the dashboard's filtered movement set. The date boundaries are inclusive.
4. Recompute the existing KPI and chart values from the returned movements. Keep the displayed range synchronized with the selected dates.
5. Prevent applying a range with an end date earlier than the start date. Restrict selectable dates to the facets' `min_date`–`max_date` bounds.
6. Show loading and request-error states consistent with the existing dashboard. An empty response for a valid range is an empty-data state, not a fabricated zero-movement record.

## PM wording / API mismatch resolution

- **“Available date range” versus API fields:** the facets endpoint calls the bounds `min_date` and `max_date`, not `start_date`/`end_date`. Treat these as selectable bounds; send the chosen values as `start_date` and `end_date` to `/api/metrics`.
- **Date-only values:** both contracts use date-only strings, not timestamps. Keep them as `YYYY-MM-DD` values when building query parameters; do not shift them through timezone conversion.
- **Frontend status:** date filtering is not implemented in the existing fetch; this spec calls for explicitly adding the facet request and date query parameters. It does not imply a backend contract change.

## Acceptance criteria

- The date selector's lower and upper bounds come from the facets response.
- Applying a valid range sends both `start_date` and `end_date` to `/api/metrics` in `YYYY-MM-DD` form.
- Displayed KPIs/charts are calculated only from returned movements, and the displayed range matches the applied dates.
- Invalid reversed ranges cannot be applied; empty results and request failures have distinct, understandable UI states.
- No backend endpoint or response-field changes are required.
