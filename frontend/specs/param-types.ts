import type { BusinessType, OperationType } from "../src/lib/financial-types";

/** Date-only query values use YYYY-MM-DD format (no timezone). */
type ApiDate = string;

/** Optional inclusive date filters shared by metrics feature requests. */
export interface DateRangeFilter {
  /** Inclusive lower date bound, formatted YYYY-MM-DD. */
  start_date?: ApiDate;
  /** Inclusive upper date bound, formatted YYYY-MM-DD. */
  end_date?: ApiDate;
}

/** Query parameters for GET /api/metrics/alerts. */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Relative increase threshold as a ratio. API accepts numbers >= 0 (default 0.3);
   * the alert-table UI narrows valid user input to 0.01–1.0.
   */
  threshold?: number;
}

/** Query parameters for GET /api/metrics/categories/top. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Movement kind to rank: "income" or "outcome" (API default: "outcome"). */
  operation_type?: OperationType;
  /** Maximum number of ranked categories; integer 1–20 (API default: 5). */
  limit?: number;
  /**
   * Optional business segment filter: "B2B" or "B2C". The B2B vs B2C view calls
   * this endpoint once with "B2B" and once with "B2C" to obtain each segment's categories.
   */
  business_type?: BusinessType;
}
