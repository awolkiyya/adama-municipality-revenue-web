export type BaseFieldDataType =
    | "NUMBER"
    | "DECIMAL"
    | "TEXT"
    | "BOOLEAN"
    | "DATE"
    | "SELECT"
    | "RADIO"
    | "CHECKBOX"
    | "FILE";

export interface BaseFieldOption {
    id: string;
    base_field_id: string;

    value: string;
    label: string;
    description: string | null;

    sort_order: number;

    is_default: boolean;
    is_active: boolean;

    status: "ACTIVE" | "INACTIVE";

    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface BaseFieldMeasurementUnit {
    id: string;
    code: string;
    name: string;
    symbol: string | null;
    description: string | null;

    is_active: boolean;
    sort_order: number;

    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface BaseField {
    id: string;

    code: string;
    name: string;
    description: string | null;

    measurement_unit_id: string | null;

    measurement_unit: BaseFieldMeasurementUnit | null;

    unit: string | null;
    unit_name: string | null;
    unit_code: string | null;

    data_type: BaseFieldDataType;

    is_active: boolean;
    status: "ACTIVE" | "INACTIVE";

    sort_order: number;

    options: BaseFieldOption[];

    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface BaseFieldFilters {
    search?: string;
    page?: number;
    per_page?: number;
    isActive?: boolean;
    dataType?: string;
    ids?: string[];

  }