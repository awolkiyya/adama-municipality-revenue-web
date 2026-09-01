// ============================================================
// BASE FIELD DATA TYPE
// ============================================================

export type BaseFieldDataType =
  | "NUMBER"
  | "DECIMAL"
  | "PERCENTAGE"
  | "TEXT"
  | "DATE"
  | "BOOLEAN"
  | "SELECT";

// ============================================================
// BASE FIELD
// ============================================================

export interface BaseField {
  id: string;

  name: string;

  code: string;

  data_type: BaseFieldDataType;
  measurement_unit_id?:string|null;

  unit_code?: string | null;

  description?: string | null;

  is_active: boolean;

  created_at?: string;

  updated_at?: string;
}

// ============================================================
// BASE FIELD FILTERS
// ============================================================

export interface BaseFieldFilters {
  page?: number;

  per_page?: number;

  search?: string;

  dataType?: BaseFieldDataType;

  isActive?: boolean;
}