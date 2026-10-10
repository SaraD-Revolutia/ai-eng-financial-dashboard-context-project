# Dashboard feature API and UI contracts

This index consolidates the API and UI contracts for the three proposed dashboard features. Contracts below were checked against the FastAPI `/docs` OpenAPI schema and `backend/app/routes.py`. These are specifications only; the features are not yet implemented in the frontend.

Shared TypeScript request and response models are defined in [`param-types.ts`](./param-types.ts) and [`api-types.ts`](./api-types.ts). Date query values are date-only `YYYY-MM-DD` strings; preserve them as strings and do not timezone-convert them.

## 1. Date range filter

### Endpoints and types

- `GET /api/metrics/facets` — no query parameters. Response: [`FacetsResponse`](./api-types.ts), including `min_date` and `max_date` bounds and the available filter values.
- `GET /api/metrics` — response is `FinancialMovement[]` from [`frontend/src/lib/financial-types.ts`](../src/lib/financial-types.ts). Request query type: [`DateRangeFilter`](./param-types.ts) for the date range (the endpoint also supports optional `category` and `operation_type`, which this feature does not require).

### Parameters and constraints

| Request | Parameter | Type | Valid values / constraints | Default / behavior |
|---|---|---|---|---|
| `/api/metrics/facets` | — | — | No query parameters | Supplies available date bounds and facets. |
| `/api/metrics` | `start_date` | `ApiDate` (`string`) | Optional date in `YYYY-MM-DD`; selected date must be within the returned `min_date`–`max_date` range. | Omitted means no lower date bound at the API level; feature requests should send the selected lower bound. |
| `/api/metrics` | `end_date` | `ApiDate` (`string`) | Optional date in `YYYY-MM-DD`; selected date must be within the returned `min_date`–`max_date` range and must not precede `start_date`. | Omitted means no upper date bound at the API level; feature requests should send the selected upper bound. |

Both date inputs are optional and initialize empty. Apply only populated dates inclusively: start only filters from that date through the latest data, end only filters from the earliest data through that date, and both empty sends no date parameters and shows all data. Reject only the case where both are populated and `start_date` is later than `end_date`; keep selected dates within the facet bounds.

### Edge cases and required UI

- **Facet request is loading or fails:** do not display guessed date bounds or enable Apply. Show a loading state; on failure show a clear error and retry action.
- **Only one date is populated, or both are empty:** these are valid selections. Send only the populated parameter, or neither when both are empty; show all data in the latter case.
- **Both dates are populated and start follows end (or a populated date is outside facet bounds):** show inline validation, prevent Apply, and do not send `/api/metrics` with the invalid selection.
- **Valid range returns no movements:** show the dashboard's explicit empty-data state; do not fabricate a movement or conflate empty data with a request error. KPIs/charts must use only the returned movement array.

## 2. Anomaly alerts table

### Endpoint and types

- `GET /api/metrics/alerts` — request query type: [`AlertsParams`](./param-types.ts); response type: [`AlertsResponse`](./api-types.ts), an array of [`AlertEntry`](./api-types.ts) (`period`, `outcome_total`, `baseline_average`, `increase_ratio`).
- Send the selected date range along with the numeric threshold. The feature intentionally omits `group_by` and `business_type`.

### Parameters and constraints

| Parameter | Type | Valid values / constraints | Default / feature behavior |
|---|---|---|---|
| `start_date` | `ApiDate` (`string`) | Optional `YYYY-MM-DD`; use selected date within facet bounds when date filter is active. | The API permits omission; the feature sends the selected date range. |
| `end_date` | `ApiDate` (`string`) | Optional `YYYY-MM-DD`; use selected date within facet bounds, not earlier than `start_date`. | The API permits omission; the feature sends the selected date range. |
| `threshold` | `number` | API accepts any number `>= 0`. UI-approved input is narrower: `0.01`–`1.0`, inclusive; send as a ratio, not percentage points. | API default is `0.3`; if UI input is empty, visibly use/send `0.3`. Out-of-range input blocks submission rather than being clamped. |
| `group_by` | Not sent | API supports `day`, `week`, or `month`. | Omit; API default is `month`. |
| `business_type` | Not sent | API supports `B2B` or `B2C`. | Omit; alerts are not filtered by business type in this feature. |

`baseline_average` is documented as a number, but its calculation/window is not specified by `/docs`. Display the column label **Baseline average**; do not claim it is a three-period rolling average.

### Edge cases and required UI

- **Threshold is below `0.01`, above `1.0`, or otherwise invalid:** show inline validation and do not issue the request. Do not silently clamp. An empty input is the documented UI exception: show that `0.3` (30%) is being used and send numeric `0.3`.
- **Successful response is empty:** show exactly **“No anomalies found for the current filters and threshold.”** Do not render fabricated rows.
- **Request fails:** show a distinct error state and retry action, not the empty-state copy. For successful rows, show `increase_ratio` multiplied by 100 as a percentage, while preserving the API ratio as the value used in logic.

## 3. B2B vs B2C category comparison

### Endpoint and types

- Call `GET /api/metrics/categories/top` **twice**. Each request uses [`TopCategoriesParams`](./param-types.ts), and each response is [`TopCategoriesResponse`](./api-types.ts), an array of [`CategoryEntry`](./api-types.ts) (`category`, `operation_type`, `total_amount`).
- The B2B request uses `business_type: "B2B"`; the B2C request uses `business_type: "B2C"`. Both requests use the same selected date range and the same remaining parameters. Do not use `/api/metrics/b2b`, `/api/metrics/b2c`, or `/api/metrics/comparison` for this feature; the specified feature is a category ranking comparison from the top-categories route.

### Parameters and constraints

| Parameter | Type | Valid values / constraints | Default / feature behavior |
|---|---|---|---|
| `start_date` | `ApiDate` (`string`) | Optional `YYYY-MM-DD`; use selected date within facet bounds. | Send the same selected start date in both requests. |
| `end_date` | `ApiDate` (`string`) | Optional `YYYY-MM-DD`; use selected date within facet bounds, not earlier than `start_date`. | Send the same selected end date in both requests. |
| `operation_type` | `OperationType` (`"income" \| "outcome"`) | Either enum value. | Send `"income"` for both requests. |
| `limit` | `number` | Integer from `1` through `20`, inclusive. | Send `5` for both requests. API default is also `5`. |
| `business_type` | `BusinessType` (`"B2B" \| "B2C"`) | Exactly `"B2B"` or `"B2C"`. | Send `"B2B"` on one request and `"B2C"` on the other. |

### Edge cases and required UI

- **One request fails while the other succeeds:** show a comparison error state and retry both requests; do not show a successful-looking partial comparison.
- **Both requests succeed with empty arrays:** show exactly **“No category data available for the current filters.”** Do not infer categories or amounts.
- **Only one business-type response is empty:** show **“No income categories for this period.”** in that empty panel and continue rendering the other panel's returned top-five data.
- **A category appears in only one response:** retain the category row and show `0` for its missing segment, as specified in `components.md`. Keep the B2B and B2C labels explicit. If both requests are pending, show loading until both complete.

## Related specifications

- [Date range filter](./date-range-filter.md)
- [Anomaly alerts table](./anomaly-alerts-table.md)
- [B2B vs B2C comparison](./b2b-vs-b2c-comparison.md) — this earlier feature document contains a superseded endpoint proposal; the contract in this README and `components.md` is authoritative: use two calls to `/api/metrics/categories/top`.
- [Feature component plan](./components.md)

## Type-checking the specs

`tsconfig.app.json` includes only `src/`, so the regular app type-check does not cover `frontend/specs/*.ts`. Check the spec types directly from `frontend/` with:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target ES2023 --module ESNext --moduleResolution bundler specs/api-types.ts specs/param-types.ts
```

This strict direct check passes with no TypeScript errors.
