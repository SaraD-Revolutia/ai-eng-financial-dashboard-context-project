# Anomaly alerts table

## Goal

Show users periods with unusually high outcomes in a readable, filterable table.

## API contract (verified in `/docs`)

`GET /api/metrics/alerts` accepts:

| Query parameter | Contract |
|---|---|
| `threshold` | Optional number, minimum `0`, default `0.3` |
| `group_by` | Optional `day`, `week`, or `month`, default `month` |
| `start_date`, `end_date` | Optional dates (`YYYY-MM-DD`) |
| `business_type` | Optional `B2B` or `B2C` |

Response is an array of objects with required fields:

- `period`: string (formatted according to `group_by`, e.g. `2025-12` for a month)
- `outcome_total`: number
- `baseline_average`: number
- `increase_ratio`: number

The `/docs` response schema identifies `baseline_average` as a number but does not specify how it is calculated or define a rolling window.

## Behavior

1. Fetch alerts from the endpoint using the selected date range and threshold. Omit `group_by` and `business_type` from requests; the endpoint's documented `group_by` default is `month`.
2. Provide a configurable threshold from `0.01` through `1.0`, inclusive. Send the numeric ratio, not a percentage-point value (for example, `0.3` represents 30%).
3. If the threshold is outside the allowed UI range, show an inline validation message and do not send the request. Do not silently clamp the value. If the input is empty, use `0.3` (30%), the endpoint's documented default, and make the fallback clear in the UI.
4. Present one table row per returned alert, with period, outcome total, **Baseline average**, and increase ratio. Format `increase_ratio` as a percentage for display without changing the API value.
5. Keep the table's loading, empty, and error states distinct. For an empty response, show exactly: **“No anomalies found for the current filters and threshold.”**
6. Do not create rows for periods not returned by the API or calculate alternate alert values in the client.

## Out of scope

- A `group_by` control. The request omits this query parameter and uses the API default of `month`.
- A `business_type` control. The request omits this query parameter and does not filter alerts by business type.

## PM wording / API mismatch resolution

- **“Anomaly” versus API's exact criteria:** the response contains no anomaly flag, severity, or explanation. Use a returned row as the signal that the API's strict threshold condition was met. Do not invent a severity classification or a different statistical test.
- **“Increase percent” versus `increase_ratio`:** the API returns a ratio (e.g. `0.3`), not a percent number (e.g. `30`). Keep the ratio as the source value and multiply by 100 only for display.
- **“Period/date” versus `period`:** the field is a string whose format depends on grouping, not necessarily a full date. Display it as returned or format only with an explicit grouping-aware presentation; do not parse every value as `YYYY-MM-DD`.
- **“Rolling average of the previous 3 periods” versus `baseline_average`:** the PM brief requests a three-period rolling window, but `/docs` only defines `baseline_average` as a number and does not document its calculation. This behavior is **unverified in `/docs`**. Label the column **“Baseline average”** and do not describe or assume a three-period rolling calculation until it is verified and approved.
- **PM threshold range versus API constraint:** the PM UI range is `0.01`–`1.0`, while `/docs` permits any threshold number greater than or equal to `0`. Enforce the stricter PM range in the UI without changing the API contract; empty input falls back to `0.3`, and an out-of-range value blocks submission.
- **Optional API filters versus requested controls:** `/docs` exposes `group_by` and `business_type`, but they are not requested UI controls. Omit both parameters; use the documented `month` default and unfiltered business-type behavior.
- The current dashboard does not call this endpoint. Implementing consumption is in scope; changing the API response is not.

## Acceptance criteria

- Requests use the documented query names; `group_by` and `business_type` are omitted, so monthly grouping and no business-type filter apply.
- UI threshold values from `0.01` through `1.0` are accepted; out-of-range values are blocked, and an empty input falls back visibly to `0.3`.
- Each table row is mapped from the four exact response fields above.
- The baseline column is labeled **“Baseline average”**; no three-period rolling-window claim is made because `/docs` does not verify it.
- The percentage display is consistent with `increase_ratio` (ratio × 100), while thresholds are sent as ratios.
- Empty response displays exactly **“No anomalies found for the current filters and threshold.”** Loading and request failure are represented distinctly.
- No unsupported severity, anomaly cause, or additional response fields are assumed.
