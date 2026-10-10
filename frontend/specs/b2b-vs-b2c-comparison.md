# B2B vs B2C category comparison

## Goal

Compare the five highest-income categories for B2B and B2C over the same optional date filters. This feature presents category rankings from the top-categories endpoint; it does not calculate or display movement-level metrics or adjacent-period deltas.

## API contract and types

Call `GET /api/metrics/categories/top` twice. Each request uses [`TopCategoriesParams`](./param-types.ts) and returns [`TopCategoriesResponse`](./api-types.ts), an array of [`CategoryEntry`](./api-types.ts) values containing `category`, `operation_type`, and `total_amount`.

Both requests use `operation_type: "income"` and `limit: 5`. The first uses `business_type: "B2B"`; the second uses `business_type: "B2C"`. Apply the same optional date filters to both requests: include `start_date` and/or `end_date` only when populated, and omit either absent date. A single date is valid; with neither date, request all available data. If both dates are populated and start is after end, show inline validation and issue neither request.

Example request shapes (include only populated dates):

```text
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C
```

## Behavior

1. Treat the two requests as one comparison pair. Show loading until both responses complete. If either request fails, show an error and retry both; do not present a partial response as a complete comparison.
2. Keep B2B and B2C panels independently labeled and render each successful response's category ranking and income totals. Do not calculate additional movement metrics or expect comparison/delta fields from the API.
3. If one response is empty, show exactly **“No income categories for this period.”** in that panel and continue rendering the other panel's returned data.
4. If both responses are empty, show exactly **“No category data available for the current filters.”** as the shared comparison empty state rather than showing per-panel messages.
5. Preserve the API's returned categories and totals; do not infer categories or amounts absent from a response.

## PM wording / API mismatch resolution

- **B2B vs B2C feature definition:** this feature compares the top income categories returned by the same endpoint for two business-type filters. It is not a comparison of financial movement arrays or an adjacent-period analysis.
- **No comparison-specific response model:** each response is a `CategoryEntry[]`; the endpoint provides no B2B/B2C aggregate or delta fields. Display each segment's returned category totals as-is.
- **Shared date filter:** date fields are optional and are identical across the pair when populated. A start-only or end-only filter is valid; no dates means all data. A reversed fully populated range blocks both requests.
- **Existing dashboard:** the current dashboard does not call this endpoint. Implementing the feature is in scope; changing the backend contract is not.

## Acceptance criteria

- The feature issues two `GET /api/metrics/categories/top` requests with `operation_type=income` and `limit=5`, differing only in `business_type` (`B2B` versus `B2C`) and using the same optional date filters.
- A one-sided date filter is valid, missing date parameters are omitted, and an invalid reversed two-date range causes neither request to be sent.
- Loading and errors apply to the pair; failure of either request prevents showing a complete-looking comparison and retry repeats both requests.
- An individually empty panel shows **“No income categories for this period.”** while the nonempty panel remains rendered. If both are empty, show **“No category data available for the current filters.”**
- The UI displays the API category entries and income totals without assuming unsupported aggregate or delta fields.
