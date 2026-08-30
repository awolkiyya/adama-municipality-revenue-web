import type { RevenueCode } from "./revenue-code";
import type { BaseField } from "./revenue-baseField";

/*
|--------------------------------------------------------------------------
| ENUMS
|--------------------------------------------------------------------------
*/

export type ServiceType =
    | "REGISTRATION"
    | "ASSESSMENT"
    | "PERMIT"
    | "RENEWAL"
    | "COLLECTION"
    | "PENALTY";

export type CollectionMode =
    | "ASSESSMENT_ONLY"
    | "FIELD_COLLECTION"
    | "BOTH";

export type RevenueStatus =
    | "ACTIVE"
    | "INACTIVE";

/*
|--------------------------------------------------------------------------
| SERVICE FIELD VALIDATION RULES
|--------------------------------------------------------------------------
*/

export interface RevenueServiceFieldValidationRules {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
}

/*
|--------------------------------------------------------------------------
| BASE FIELD OPTION
|--------------------------------------------------------------------------
*/

export interface BaseFieldOption {
    id: string;

    baseFieldId: string;

    value: string;

    label: string;

    sortOrder: number;

    isActive: boolean;

    status?: RevenueStatus;
}

/*
|--------------------------------------------------------------------------
| REVENUE SERVICE FIELD
|--------------------------------------------------------------------------
*/

export interface RevenueServiceField {
    id: string;

    revenueServiceId: string;

    baseFieldId: string;

    baseField?: BaseField | null;

    label?: string | null;

    helpText?: string | null;

    validationRules?:
        | RevenueServiceFieldValidationRules
        | null;

    isRequired: boolean;

    sortOrder: number;

    isActive: boolean;

    status: RevenueStatus;
}

/*
|--------------------------------------------------------------------------
| SERVICE FIELD PAYLOAD
|--------------------------------------------------------------------------
*/

export interface RevenueServiceFieldPayload {
    base_field_id: string;

    sort_order: number;

    is_required: boolean;

    label?: string | null;

    help_text?: string | null;

    validation_rules?:
        | RevenueServiceFieldValidationRules
        | null;
}

/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

export interface RevenueServiceFilters {
    revenue_code_id?: string;

    service_type?: ServiceType | "ALL";

    collection_mode?: CollectionMode | "ALL";

    is_active?: boolean;

    search?: string;

    page?: number;

    per_page?: number;
}

/*
|--------------------------------------------------------------------------
| REVENUE SERVICE
|--------------------------------------------------------------------------
*/

export interface RevenueService {
    id: string;

    /*
     * Parent Revenue Code
     */
    revenueCodeId: string;

    revenueCode?: RevenueCode | null;

    /*
     * Basic Information
     */
    name: string;

    description?: string | null;

    /*
     * Service Configuration
     */
    serviceType?: ServiceType | null;

    collectionMode: CollectionMode;

    /*
     * Status
     */
    isActive: boolean;

    status: RevenueStatus;

    /*
     * Configured Fields
     */
    fields: RevenueServiceField[];

    fieldsCount?: number;

    /*
     * Audit
     */
    createdBy?: string | null;

    updatedBy?: string | null;

    createdAt?: string | null;

    updatedAt?: string | null;

    deletedAt?: string | null;
}

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

export interface CreateRevenueServicePayload {
    revenue_code_id: string;

    name: string;

    description?: string | null;

    service_type?: ServiceType | null;

    collection_mode: CollectionMode;

    is_active?: boolean;

    fields?: RevenueServiceFieldPayload[];
}

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

export interface UpdateRevenueServicePayload {
    revenue_code_id?: string;

    name?: string;

    description?: string | null;

    service_type?: ServiceType | null;

    collection_mode?: CollectionMode;

    is_active?: boolean;

    fields?: RevenueServiceFieldPayload[];
}

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

export interface RevenueServiceSummary {
    total: number;

    active: number;

    inactive: number;
}