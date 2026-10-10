# B2B vs B2C comparison

## Goal

Allow dashboard users to compare financial movements and derived KPI values for B2B and B2C over the same selected date range.

## API contract (verified in `/docs`)

The API exposes separate movement endpoints:

- `GET /api/metrics/b2b`
- `GET /api/metrics/b2c`

Each accepts optional `start_date` and `end_date` dates (`YYYY-MM-DD`), `category` (`suppliers`, `sales`, `operational`, `administrative`, or `others`), and `operation_type` (`income` or `outcome`). Each returns an array of `FinancialMovement` objects with `create_date`, `amount`, `operation_type`, `category`, and `business_type`.

There is also `GET /api/metrics/comparison`, which requires `start_date` and `end_date` and optionally accepts `business_type` (`B2B` or `B2C`). It returns one comparison object with `current_period`, `previous_period`, `delta_abs`, and nullable `delta_pct`. The API definition does not describe this endpoint as a direct B2B-versus-B2C comparison: its implementation computes a net value for the requested current date range versus the immediately preceding equal-length range, optionally filtered to one business type.

The current dashboard only fetches `/api/metrics` without query parameters (`frontend/src/App.tsx`).

## Behavior

1. For a direct B2B-versus-B2C comparison, request `/api/metrics/b2b` and `/api/metrics/b2c` with the same selected date range and the same optional category/operation filters.
2. Calculate the existing dashboard metrics independently from each response set; label each result explicitly as B2B or B2C. Compare like-for-like values over identical filters and dates.
3. Preserve the movement-level `business_type` in API data, but do not infer comparison dimensions from a response field that is not a comparison metric.
4. Handle the two requests as a comparison pair: show a loading state while either request is pending, and do not present a partial result as a complete comparison if either request fails.
5. For empty data in one segment, show that segment as having no records for the selected filters rather than substituting data from the other segment.

## PM wording / API mismatch resolution

- **“B2B vs B2C comparison” versus `/api/metrics/comparison`:** the similarly named endpoint compares the selected period with the previous equal-length period and optionally filters to one business type; it does not return B2B and B2C side by side. For the requested feature, use the two business-specific movement endpoints and calculate the existing comparable dashboard metrics from their responses. Do not use `/api/metrics/comparison` as the B2B/B2C data source.
- **No comparison-specific response model:** `/api/metrics/b2b` and `/api/metrics/b2c` return movement arrays, not aggregate totals/deltas. Aggregate in the frontend using the existing financial calculation utilities; do not expect fields such as `b2b_total`, `b2c_total`, or a direct difference from the API.
- **Business-type field versus endpoint identity:** both response objects include `business_type`. The endpoint provides segment scoping; use the explicit B2B/B2C labels in the UI and retain/validate response fields rather than adding another API contract assumption.
- The backend already exposes the required segment routes. The existing frontend does not call them; wiring both endpoints is in scope, while adding or changing backend routes is not.

## Acceptance criteria

- The feature fetches both business-specific endpoints with identical dates and active optional filters.
- B2B and B2C values are independently derived from their respective movement arrays and clearly labeled.
- A result from `/api/metrics/comparison` is not presented as a B2B-versus-B2C comparison.
- A failure from either segment request prevents presenting the pair as complete; empty segment data is handled explicitly.
- No new aggregate response fields or backend endpoint changes are assumed.
