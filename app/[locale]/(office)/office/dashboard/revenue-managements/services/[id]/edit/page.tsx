
"use client";

import { useParams } from "next/navigation";
import {
    Loader2,
    Briefcase,
    AlertCircle,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
    RevenueServiceForm,
    type RevenueServiceFormValues,
} from "@/components/forms/RevenueServiceForm";

import type {
    UpdateRevenueServiceInput,
} from "@/lib/zod-forms/revenueService.schema";

import type {
    UpdateRevenueServicePayload,
} from "@/types/revenue/revenu-service";

import {
    useRevenueService,
    useUpdateRevenueService,
} from "@/hooks/revenue/revenueService.hook";

import {
    useBaseFields,
} from "@/hooks/revenue/revenueBaseField.hook";

/* =========================================================
   FORM DOMAIN TYPES
========================================================= */

type ServiceTypeValue =
    RevenueServiceFormValues["serviceType"];

type CollectionModeValue =
    RevenueServiceFormValues["collectionMode"];

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type RevenueServiceFieldResponse = {
    base_field_id?: string | null;
    baseFieldId?: string | null;
    label?: string | null;
    isRequired?: boolean | null;
    required?: boolean | null;
    help_text?: string | null;
    helpText?: string | null;
    validation_rules?: Record<string, unknown> | null;
    validationRules?: Record<string, unknown> | null;
    sort_order?: number | null;
    sortOrder?: number | null;
    base_field?: {
        name?: string | null;
    } | null;
};

type RevenueServiceResponse = {
    id: string;
    revenueCodeId?: string | null;
    revenue_code_id?: string | null;
    revenueCode?: {
        id?: string | null;
    } | null;
    name?: string | null;
    description?: string | null;

    // Use the same domain types as the form.
    serviceType?: ServiceTypeValue | null;
    service_type?: ServiceTypeValue | null;

    collectionMode?: CollectionModeValue | null;
    collection_mode?: CollectionModeValue | null;

    is_active?: boolean | null;
    isActive?: boolean | null;

    fields?: RevenueServiceFieldResponse[] | null;
    revenue_service_fields?: RevenueServiceFieldResponse[] | null;
};

type MappedRevenueServiceField = {
    baseFieldId: string;
    label: string;
    required: boolean;
    helpText: string;
    validationRules: Record<string, unknown>;
    sortOrder: number;
};

/* =========================================================
   API → FORM VALUES
========================================================= */

function toFormValues(
    service: RevenueServiceResponse,
): RevenueServiceFormValues {
    const serviceFields =
        service.fields ??
        service.revenue_service_fields ??
        [];

    return {
        id: service.id,

        /*
        |--------------------------------------------------------------------------
        | Revenue Code
        |--------------------------------------------------------------------------
        */

        revenueCodeId:
            service.revenueCodeId ??
            service.revenue_code_id ??
            service.revenueCode?.id ??
            "",

        /*
        |--------------------------------------------------------------------------
        | Service Details
        |--------------------------------------------------------------------------
        */

        name:
            service.name ??
            "",

        description:
            service.description ??
            "",

        serviceType:
            service.serviceType ??
            service.service_type ??
            "",

        collectionMode:
            service.collectionMode ??
            service.collection_mode ??
            "ASSESSMENT_ONLY",

        isActive:
            service.is_active ??
            service.isActive ??
            true,

        /*
        |--------------------------------------------------------------------------
        | Revenue Service Fields
        |--------------------------------------------------------------------------
        */

        fields: serviceFields
            .map(
                (
                    field: RevenueServiceFieldResponse,
                    index: number,
                ): MappedRevenueServiceField => ({
                    baseFieldId:
                        field.base_field_id ??
                        field.baseFieldId ??
                        "",

                    label:
                        field.label ??
                        field.base_field?.name ??
                        "",

                    required:
                        field.isRequired ??
                        field.required ??
                        false,

                    helpText:
                        field.help_text ??
                        field.helpText ??
                        "",

                    validationRules:
                        field.validation_rules ??
                        field.validationRules ??
                        {},

                    sortOrder:
                        field.sort_order ??
                        field.sortOrder ??
                        index,
                }),
            )
            .sort(
                (
                    a: MappedRevenueServiceField,
                    b: MappedRevenueServiceField,
                ) => a.sortOrder - b.sortOrder,
            )
            .map(
                (
                    field: MappedRevenueServiceField,
                    index: number,
                ) => ({
                    ...field,
                    sortOrder: index,
                }),
            ),
    };
}

/* =========================================================
   PAGE
========================================================= */

export default function EditRevenueServicePage() {
    const params = useParams<{ id: string }>();

    const serviceId = params.id;

    /*
    |--------------------------------------------------------------------------
    | Revenue Service
    |--------------------------------------------------------------------------
    */

    const {
        data: response,
        isLoading: isLoadingService,
        isError: isServiceError,
    } = useRevenueService(serviceId);

    /*
    |--------------------------------------------------------------------------
    | Canonical Base Fields
    |--------------------------------------------------------------------------
    */

    const {
        data: baseFieldsResponse,
        isLoading: isLoadingBaseFields,
        isError: isBaseFieldsError,
    } = useBaseFields({
        isActive: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Extract Data
    |--------------------------------------------------------------------------
    */

    const service =
        response?.data as RevenueServiceResponse | undefined;

    const baseFields =
        baseFieldsResponse?.data ?? [];

    /*
    |--------------------------------------------------------------------------
    | Update Mutation
    |--------------------------------------------------------------------------
    */

    const {
        mutateAsync: updateService,
    } = useUpdateRevenueService();

    /*
    |--------------------------------------------------------------------------
    | Initial Form Values
    |--------------------------------------------------------------------------
    */

    const initialValues =
        service
            ? toFormValues(service)
            : null;

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        values: UpdateRevenueServiceInput,
    ) => {
        /*
        |--------------------------------------------------------------------------
        | Validate Required Values
        |--------------------------------------------------------------------------
        */

        if (!values.revenueCodeId) {
            throw new Error(
                "Revenue code is required.",
            );
        }

        if (!values.name?.trim()) {
            throw new Error(
                "Service name is required.",
            );
        }

        if (!values.collectionMode) {
            throw new Error(
                "Collection mode is required.",
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Transform Form Model → API Model
        |--------------------------------------------------------------------------
        */

        const payload: UpdateRevenueServicePayload = {
            revenue_code_id:
                values.revenueCodeId,

            name:
                values.name.trim(),

            description:
                values.description?.trim() ||
                null,

            service_type:
                values.serviceType ??
                null,

            collection_mode:
                values.collectionMode,

            is_active:
                values.isActive ?? true,

            /*
            |--------------------------------------------------------------------------
            | Revenue Service Fields
            |--------------------------------------------------------------------------
            */

            fields:
                (values.fields ?? []).map(
                    (
                        field,
                        index,
                    ) => ({
                        base_field_id:
                            field.baseFieldId,

                        sort_order:
                            index,

                        is_required:
                            field.required,

                        label:
                            field.label?.trim() ||
                            null,

                        help_text:
                            field.helpText?.trim() ||
                            null,

                        validation_rules:
                            field.validationRules &&
                            Object.keys(
                                field.validationRules,
                            ).length > 0
                                ? field.validationRules
                                : null,
                    }),
                ),
        };

        /*
        |--------------------------------------------------------------------------
        | Update
        |--------------------------------------------------------------------------
        */

        await updateService({
            id: serviceId,
            data: payload,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (
        isLoadingService ||
        isLoadingBaseFields
    ) {
        return (
            <div className="space-y-6">
                <Banner
                    description="Update this service's details, collection mode, and required fields."
                    badge={
                        <IconBadge
                            className="gap-2 rounded-full p-3 text-xs"
                            icon={
                                <Briefcase className="h-4 w-4" />
                            }
                        >
                            Edit Revenue Service
                        </IconBadge>
                    }
                    background={
                        <FloatingParticles
                            color="#040404"
                            count={35}
                            speed={0.2}
                            connectDistance={100}
                            position="bottom-right"
                        />
                    }
                    overlayClassName="bg-transparent"
                />

                <div className="flex min-h-[300px] items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />

                    <span className="text-sm">
                        Loading revenue service...
                    </span>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error State
    |--------------------------------------------------------------------------
    */

    if (
        isServiceError ||
        isBaseFieldsError ||
        !initialValues
    ) {
        return (
            <div className="space-y-6">
                <Banner
                    description="Update this service's details, collection mode, and required fields."
                    badge={
                        <IconBadge
                            className="gap-2 rounded-full p-3 text-xs"
                            icon={
                                <Briefcase className="h-4 w-4" />
                            }
                        >
                            Edit Revenue Service
                        </IconBadge>
                    }
                    background={
                        <FloatingParticles
                            color="#040404"
                            count={35}
                            speed={0.2}
                            connectDistance={100}
                            position="bottom-right"
                        />
                    }
                    overlayClassName="bg-transparent"
                />

                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border text-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />

                    <p className="text-sm font-medium">
                        Failed to load this revenue service.
                    </p>

                    <p className="max-w-md text-xs text-muted-foreground">
                        {!initialValues
                            ? "The requested revenue service could not be found."
                            : isBaseFieldsError
                                ? "Canonical base fields could not be loaded."
                                : "Try refreshing the page, or go back and select the service again."
                        }
                    </p>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <Banner
                description="Update this service's details, collection mode, and required fields."
                badge={
                    <IconBadge
                        className="gap-2 rounded-full p-3 text-xs"
                        icon={
                            <Briefcase className="h-4 w-4" />
                        }
                    >
                        Edit Revenue Service
                    </IconBadge>
                }
                background={
                    <FloatingParticles
                        color="#040404"
                        count={35}
                        speed={0.2}
                        connectDistance={100}
                        position="bottom-right"
                    />
                }
                overlayClassName="bg-transparent"
            />

            <RevenueServiceForm
                mode="edit"
                initialValues={initialValues}
                onSubmit={handleSubmit}
                baseFields={baseFields}
            />
        </div>
    );
}
