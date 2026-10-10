import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

/** Date-only values returned by the API use YYYY-MM-DD (no timezone). */
type ApiDate = string;

/** GET /api/metrics/facets: option lists and available date bounds. */
export interface FacetsResponse {
  /** Available movement kinds: "income" or "outcome". */
  operation_types: OperationType[];
  /** Available business segments: "B2B" or "B2C". */
  business_types: BusinessType[];
  /** Available categories: suppliers, sales, operational, administrative, or others. */
  categories: Category[];
  /** Earliest available movement date, formatted YYYY-MM-DD. */
  min_date: ApiDate;
  /** Latest available movement date, formatted YYYY-MM-DD. */
  max_date: ApiDate;
}

/** One row returned by GET /api/metrics/alerts. */
export interface AlertEntry {
  /** Reporting period label; its format depends on the endpoint grouping. */
  period: string;
  /** Total outcome amount for this period, in the API's numeric currency units. */
  outcome_total: number;
  /** Baseline outcome average reported by the API; calculation window is undocumented. */
  baseline_average: number;
  /** Relative increase over baseline as a ratio (for example, 0.3 means 30%). */
  increase_ratio: number;
}

/** GET /api/metrics/alerts returns a JSON array (possibly empty). */
export type AlertsResponse = AlertEntry[];

/** One item returned by GET /api/metrics/categories/top. */
export interface CategoryEntry {
  /** Category identifier: suppliers, sales, operational, administrative, or others. */
  category: Category;
  /** Movement kind used for this ranking: "income" or "outcome". */
  operation_type: OperationType;
  /** Sum of amounts for this category and operation type, in API currency units. */
  total_amount: number;
}

/** GET /api/metrics/categories/top returns a JSON array (possibly empty). */
export type TopCategoriesResponse = CategoryEntry[];
