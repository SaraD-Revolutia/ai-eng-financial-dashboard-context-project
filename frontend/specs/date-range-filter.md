# Date range filter

## Goal

Let dashboard users optionally restrict financial movement data by either or both inclusive date bounds, with available bounds discovered from the API rather than hard-coded in the UI. Leaving both inputs empty means no date filtering (show all available data).

## API contract (verified in `/docs`)

- `GET /api/metrics/facets` takes no query parameters. Its response includes `min_date` and `max_date` (`YYYY-MM-DD`), plus `operation_types`, `business_types`, and `categories`.
- `GET /api/metrics` accepts optional `start_date` and `end_date` date query parameters (`YYYY-MM-DD`). It also accepts optional `category` and `operation_type` filters. It returns an array of `FinancialMovement` objects with `create_date`, `amount`, `operation_type`, `category`, and `business_type`.
- The current frontend calls `/api/metrics` without query parameters and does not fetch `/api/metrics/facets` (`frontend/src/App.tsx`).

## Behavior

1. On dashboard load, request facets and use `min_date`/`max_date` as the selectable input bounds. Do not assume a calendar year or reuse the current hard-coded header period as the data range.
2. Both date inputs are optional and initially empty, so the initial metrics request has no date parameters and shows all available data. Do not populate either input automatically with facet bounds.
3. On Apply, include only populated dates in the `/api/metrics` query. With only `start_date`, show movements from that inclusive date through the latest available data; with only `end_date`, show movements from the earliest available data through that inclusive date; with both empty, send neither parameter and show all available data. When both are populated, send both as `YYYY-MM-DD` and apply both inclusively.
4. Recompute the existing KPI and chart values from the returned movements. Keep the displayed controls synchronized with the applied optional date filters.
5. If both dates are populated and `start_date` is later than `end_date`, show an inline validation error and do not send a request. Restrict any selected date to the facets' `min_date`–`max_date` bounds.
6. Show loading and request-error states consistent with the existing dashboard. An empty response is an empty-data state, not a fabricated zero-movement record.

## PM wording / API mismatch resolution

- **“Available date range” versus API fields:** the facets endpoint calls the bounds `min_date` and `max_date`, not `start_date`/`end_date`. Treat these as selectable bounds only; send populated values as `start_date` and/or `end_date` to `/api/metrics`.
- **Optional date inputs:** the API supports either date parameter independently. Do not require both dates or expand an omitted bound to a date in the request. Both empty means no date filter.
- **Date-only values:** both contracts use date-only strings, not timestamps. Keep them as `YYYY-MM-DD` values when building query parameters; do not shift them through timezone conversion.
- **Frontend status:** date filtering is not implemented in the existing fetch; this spec calls for explicitly adding the facet request and date query parameters. It does not imply a backend contract change.

## Acceptance criteria

- The date selector's lower and upper bounds come from the facets response.
- Applying valid optional date filters sends only the populated `start_date` and/or `end_date` to `/api/metrics` in `YYYY-MM-DD` form; both empty sends neither.
- Displayed KPIs/charts are calculated only from returned movements, and the displayed range matches the applied dates.
- A single populated date filters inclusively from/to that date as appropriate; both empty shows all data. A reversed two-date range cannot be applied; empty results and request failures have distinct, understandable UI states.
- No backend endpoint or response-field changes are required.
