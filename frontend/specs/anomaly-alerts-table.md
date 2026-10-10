# Anomaly alerts table

## Goal

Show periods whose outcome exceeds the endpoint's baseline threshold in a readable table. This feature consumes API-generated alerts; the frontend does not detect anomalies itself.

The proposed presentation component is `AnomalyAlertsTable` under `frontend/src/components/dashboard/`. The dashboard container owns the request, applied date range, threshold submission, loading/error state, and retry; the table receives typed data and state through props. See [`components.md`](./components.md) for the proposed component interface.

## Endpoint and types

Call `GET /api/metrics/alerts` and deserialize the JSON array as [`AlertsResponse`](./api-types.ts), an array of [`AlertEntry`](./api-types.ts). Query parameters are modeled by [`AlertsParams`](./param-types.ts). No request body is used.

The response fields are:

| Field | Type | UI use |
|---|---|---|
| `period` | `string` | Display as the period label. It is not guaranteed to be a full date. |
| `outcome_total` | `number` | Display as a currency amount. |
| `baseline_average` | `number` | Display as a currency amount under the heading **Baseline average**. |
| `increase_ratio` | `number` | Display as a percentage by multiplying by 100; retain the raw ratio for logic. |

### Query parameters and constraints

| Query parameter | Contract |
|---|---|
| `threshold` | Optional number; API accepts values `>= 0`; default `0.3`. UI accepts `0.01`–`1.0`, inclusive. No additional decimal precision/step restriction is specified. It is a ratio (`0.3` means 30%), not percentage points. |
| `start_date` | Optional date string `YYYY-MM-DD`; inclusive. Send the currently applied shared start date. |
| `end_date` | Optional date string `YYYY-MM-DD`; inclusive and must not precede `start_date`. Send the currently applied shared end date. |
| `group_by` | API accepts `day`, `week`, or `month`; default `month`. Always omit it for this feature. |
| `business_type` | API accepts `B2B` or `B2C`. Always omit it; this feature is not filtered by business type. |

The date strings are date-only values. Preserve `YYYY-MM-DD` as strings and do not convert them through a timezone.

## Behavior

1. Wait for the facets-backed date range to initialize. The initial applied range is the full available range (`min_date` through `max_date`); then load alerts with both dates and threshold `0.3`. Never issue a request with an incomplete or invalid range.
2. Provide a numeric threshold control and an explicit submit/apply action. Keep the editable threshold draft separate from the applied threshold: editing alone does not fetch; submitting a valid value updates the applied threshold and fetches. If a new date range is applied while a valid threshold draft is unsubmitted, keep using the last applied threshold. UI-accepted submitted values are `0.01` through `1.0`, inclusive. Validate before requesting; if invalid, show inline validation and do not send a request. Never silently clamp.
3. If the threshold control is empty when submitted, visibly explain that `0.3` (30%) will be used and send numeric `0.3`. Never send an empty string, `NaN`, or a percentage-point value.
4. Omit `group_by` and `business_type`. The API therefore uses its `month` default and includes all business types.
5. Render one row per returned item, preserving API response order. Use columns **Period**, **Outcome total**, **Baseline average**, and **Increase (%)**. Use the existing financial formatters: `formatCurrency` for amounts and `formatPercent(increase_ratio * 100)` for the ratio. Do not parse `period` as a date; its format depends on grouping.
6. Do not create rows for periods not returned by the API, recompute alert values, or infer severity/cause on the client.
7. During a request, show a loading state and do not present rows from an older filter as if they belong to the new request. On failure, show a distinct error and retry action; retry the same applied date range and threshold that failed. Do not show the empty state for a failure. On a successful empty array, show exactly **“No anomalies found for the current filters and threshold.”**

The effective request is equivalent to `GET /api/metrics/alerts?start_date=<applied-start>&end_date=<applied-end>&threshold=<applied-ratio>`. Serialize the dates as `YYYY-MM-DD` and threshold as a number; omit `group_by` and `business_type` entirely.

## Out of scope

- A `group_by` control. The request omits this query parameter and uses the API default of `month`.
- A `business_type` control. The request omits this query parameter and does not filter alerts by business type.

## PM wording / API mismatch resolution

- **“Anomaly” versus API's exact criteria:** the response contains no anomaly flag, severity, or explanation. Use a returned row as the signal that the API's strict threshold condition was met. The inspected implementation emits a row only when the baseline is positive and `increase_ratio > threshold` (strictly greater, not equal). Do not invent a severity classification or a different statistical test.
- **“Increase percent” versus `increase_ratio`:** the API returns a ratio (e.g. `0.3`), not a percent number (e.g. `30`). Keep the ratio as the source value and multiply by 100 only for display.
- **“Period/date” versus `period`:** the field is a string whose format depends on grouping, not necessarily a full date. Display it as returned or format only with an explicit grouping-aware presentation; do not parse every value as `YYYY-MM-DD`.
- **“Rolling average of the previous 3 periods” versus `baseline_average`:** `/docs` only defines `baseline_average` as a number and does not document its calculation. Inspection of the current backend implementation shows it uses the average of all prior grouped outcome periods in the filtered result (not only the previous three); the first period has no baseline, and a zero baseline produces no alert. This implementation detail is not part of the documented response schema and may change. Label the column **“Baseline average”** and do not claim a three-period rolling calculation.
- **PM threshold range versus API constraint:** the PM UI range is `0.01`–`1.0`, while `/docs` permits any threshold number greater than or equal to `0`. Enforce the stricter PM range in the UI without changing the API contract; empty input falls back to `0.3`, and an out-of-range value blocks submission.
- **Optional API filters versus requested controls:** `/docs` exposes `group_by` and `business_type`, but they are not requested UI controls. Omit both parameters; use the documented `month` default and unfiltered business-type behavior.
- **Shared date-range relationship:** use the applied date filter, not an uncommitted date-control edit. If the selected date range is invalid or unavailable, do not issue the alerts request. Date range control behavior is specified in [`date-range-filter.md`](./date-range-filter.md).
- The current dashboard does not call this endpoint. Implementing consumption is in scope; changing the API response is not.

## Acceptance criteria

- Requests use the documented query names; `group_by` and `business_type` are omitted, so monthly grouping and no business-type filter apply.
- On initial load, the feature requests alerts for the applied date range using threshold `0.3`; applying a new date range or submitting a valid threshold triggers a new request.
- UI threshold values from `0.01` through `1.0` are accepted, with no extra precision/step restriction specified; out-of-range values are blocked, and an empty input falls back visibly to `0.3`. The request contains a number, never an empty value.
- Each table row is mapped from the four exact response fields above.
- The baseline column is labeled **“Baseline average”**; no three-period rolling-window claim is made because `/docs` does not verify it.
- Amounts use the existing currency formatter; the percentage display is consistent with `increase_ratio` (ratio × 100), while thresholds are sent as ratios. Periods are not assumed to be date strings, and API response order is preserved.
- Loading does not misrepresent old rows as results for new filters; request failure is distinct from a successful empty response and provides retry. Empty response displays exactly **“No anomalies found for the current filters and threshold.”**
- No unsupported severity, anomaly cause, or additional response fields are assumed.
