# Feature component plan

This document proposes frontend components for the three dashboard features. These are specifications only; no component implementation is included. Components should follow the current dashboard layout and use the existing `Card`, `Skeleton`, and financial-formatting utilities where appropriate.

## Shared integration

- Keep request orchestration and selected filter state in `App.tsx` or a dedicated dashboard container; keep feature presentation in focused components under `frontend/src/components/dashboard/`.
- Pass typed data, loading/error state, and callbacks through props rather than starting hidden requests inside presentational table components.
- Reuse the selected date range across the date-filtered metrics, alerts, and category comparison requests.
- Preserve accessible labels, semantic table headers, and distinct loading, error, and empty states.

## 1. Date range filter

### Proposed component: `DateRangeFilter`

**Responsibilities**

- Render start and end date controls using the facet response's `min_date` and `max_date` as limits.
- Initialize to the full available range. Keep date-only strings in `YYYY-MM-DD` form, and reject a reversed or incomplete range before applying it.
- Report an applied range to the dashboard container; the container requests `/api/metrics?start_date=...&end_date=...` and refreshes KPIs/charts.

**Suggested props**

- `facets`: `FacetsResponse`; read `min_date` and `max_date` for bounds.
- `value`: `DateRangeFilter`; while editing, either date may be absent, but Apply requires both.
- `onApply(range: DateRangeFilter)`: callback with both `start_date` and `end_date` populated.
- `disabled`: `boolean`; true until facets are loaded or while applying a range.

**States**

- Loading while `/api/metrics/facets` is unresolved; do not present guessed date bounds.
- Error if facets cannot load, with a retry path owned by the container.
- Validation if either date is missing, if the end precedes the start, or if either date is outside `facets.min_date`–`facets.max_date`.

## 2. Anomaly alerts table

### Proposed component: `AnomalyAlertsTable`

**Responsibilities**

- Render alert rows from `AlertEntry[]`; do not calculate alert candidates or alter baseline values in the component.
- Columns: Period, Outcome total, **Baseline average**, Increase (%). Format `increase_ratio` as a percentage only for display.
- Show exactly **“No anomalies found for the current filters and threshold.”** when the successful response is empty.

**Suggested props**

- `alerts`: `AlertsResponse`.
- `loading`: `boolean`.
- `error`: `string | null`.
- `params`: `AlertsParams`, including the active dates and threshold used for the request.
- `onParamsChange(params: AlertsParams)`: callback to update request parameters.
- `onRetry`: `() => void` callback for retrying the request.

**Threshold control behavior**

- UI-accepted values are `0.01`–`1.0`, inclusive; an out-of-range value blocks submission and displays inline validation. Do not clamp silently.
- Empty input falls back visibly to `0.3` before request. Send threshold as a ratio.
- Requests include selected `start_date`/`end_date` and threshold. Omit `group_by` and `business_type`; the endpoint defaults to monthly grouping and an unfiltered business type.
- The input may use a transient `number | ""` UI value while editing; convert it to a valid numeric `AlertsParams.threshold` (using `0.3` for empty input) before requesting. Never pass the empty-string state to the API.

**States**

- Distinguish loading, request failure, and successful empty response.
- Baseline heading remains “Baseline average”; the three-period rolling calculation in the PM brief is unverified in `/docs` and must not be asserted by the UI.

## 3. B2B vs B2C category comparison

### Proposed component: `BusinessCategoryComparisonTable`

**Responsibilities**

- Present a side-by-side category ranking for B2B and B2C using the top-categories API data. This is not the dashboard's adjacent-period `/api/metrics/comparison` endpoint.
- Render a row for each category returned by either request (union of category values). If a category appears in one response only, show `0` for the missing segment; do not infer an amount or category absent from both responses.
- Keep category names and totals from the API response; do not expect comparison/delta fields from the API.

**Data loading / requests**

- The dashboard container makes two requests to `GET /api/metrics/categories/top`, one with `TopCategoriesParams` containing `operation_type: "income"`, `limit: 5`, and `business_type: "B2B"`, and one with the same values except `business_type: "B2C"`.
- Include the same selected `start_date` and `end_date` in both `TopCategoriesParams` values. Do not include filters that differ between the two requests other than `business_type`.
- Each response is `TopCategoriesResponse` (`CategoryEntry[]`). Merge the arrays by `category` for display; the API does not return a comparison-specific model.

**Suggested props**

- `b2bCategories`, `b2cCategories`: `TopCategoriesResponse`.
- `loading`: `boolean`, true until both requests complete.
- `error`: `string | null`; do not display a complete comparison if either request fails.
- `onRetry`: `() => void` callback that retries both requests.

**States**

- Show loading until both requests complete.
- Show an error state if either request fails; never present the remaining response as a complete comparison.
- If both responses are empty, show exactly **“No category data available for the current filters.”** If only one segment lacks a category, show zero for that segment. An error response is not treated as empty data.
- Label the segment columns B2B and B2C and the value columns as income totals.

## Existing dashboard integration

The current `App.tsx` fetches only `/api/metrics` and renders the header, KPI row, and charts. The feature container will need to load facets and request alert/category data explicitly. Reuse the existing KPI/chart components for the selected date-filtered movement data; do not couple those components to the alert or top-category APIs. Import shared API/query types from the Phase 2 spec files (`api-types.ts` and `param-types.ts`) rather than redefining response or request shapes in component props.
