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
   API → FORM VALUES
========================================================= */

function toFormValues(
    service: any
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
            service.revenue_code?.id ??
            service.revenue_code_id ??
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
            service.service_type ??
            "",

        collectionMode:
            service.collection_mode ??
            "ASSESSMENT_ONLY",

        isActive:
            service.is_active ??
            true,

        /*
        |--------------------------------------------------------------------------
        | Revenue Service Fields
        |--------------------------------------------------------------------------
        |
        | Each service field references a canonical BaseField.
        |
        */

        fields:
            serviceFields
                .map(
                    (
                        field: any,
                        index: number
                    ) => ({
                        /*
                        |--------------------------------------------------------------------------
                        | Canonical BaseField ID
                        |--------------------------------------------------------------------------
                        */

                        baseFieldId:
                            field.base_field_id ??
                            field.baseFieldId ??
                            "",

                        /*
                        |--------------------------------------------------------------------------
                        | Service-specific label
                        |--------------------------------------------------------------------------
                        */

                        label:
                            field.label ??
                            field.base_field?.name ??
                            "",

                        /*
                        |--------------------------------------------------------------------------
                        | Required
                        |--------------------------------------------------------------------------
                        */

                        required:
                            field.is_required ??
                            field.required ??
                            false,

                        /*
                        |--------------------------------------------------------------------------
                        | Help text
                        |--------------------------------------------------------------------------
                        */

                        helpText:
                            field.help_text ??
                            field.helpText ??
                            "",

                        /*
                        |--------------------------------------------------------------------------
                        | Validation rules
                        |--------------------------------------------------------------------------
                        */

                        validationRules:
                            field.validation_rules ??
                            field.validationRules ??
                            {},

                        /*
                        |--------------------------------------------------------------------------
                        | Sort order
                        |--------------------------------------------------------------------------
                        */

                        sortOrder:
                            field.sort_order ??
                            field.sortOrder ??
                            index,
                    })
                )

                /*
                |--------------------------------------------------------------------------
                | Preserve API order
                |--------------------------------------------------------------------------
                */

                .sort(
                    (
                        a: { sortOrder: number },
                        b: { sortOrder: number }
                    ) =>
                        a.sortOrder -
                        b.sortOrder
                )

                /*
                |--------------------------------------------------------------------------
                | Normalize sort order
                |--------------------------------------------------------------------------
                |
                | Form always works with 0,1,2,3...
                |
                */

                .map(
                    (
                        field: any,
                        index: number
                    ) => ({
                        ...field,
                        sortOrder: index,
                    })
                ),
    };
}

/* =========================================================
   PAGE
========================================================= */

export default function EditRevenueServicePage() {
    const params =
        useParams<{ id: string }>();

    const serviceId =
        params.id;

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
        response?.data;

    const baseFields =
        baseFieldsResponse?.data ??
        [];

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
        values: UpdateRevenueServiceInput
    ) => {
        console.log(
            "EDIT FORM VALUES:",
            values
        );

        /*
        |--------------------------------------------------------------------------
        | Validate required update values
        |--------------------------------------------------------------------------
        |
        | The update Zod schema uses .partial(), so TypeScript correctly
        | considers these properties optional.
        |
        | The edit form, however, must provide these values before sending
        | the request.
        |--------------------------------------------------------------------------
        */

        if (!values.revenueCodeId) {
            throw new Error(
                "Revenue code is required."
            );
        }

        if (!values.name?.trim()) {
            throw new Error(
                "Service name is required."
            );
        }

        if (!values.collectionMode) {
            throw new Error(
                "Collection mode is required."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Transform Form Model → API Model
        |--------------------------------------------------------------------------
        */

        const payload:
            UpdateRevenueServicePayload = {
            /*
            |--------------------------------------------------------------------------
            | Revenue Code
            |--------------------------------------------------------------------------
            */

            revenue_code_id:
                values.revenueCodeId,

            /*
            |--------------------------------------------------------------------------
            | Name
            |--------------------------------------------------------------------------
            */

            name:
                values.name.trim(),

            /*
            |--------------------------------------------------------------------------
            | Description
            |--------------------------------------------------------------------------
            */

            description:
                values.description?.trim() ||
                null,

            /*
            |--------------------------------------------------------------------------
            | Service Type
            |--------------------------------------------------------------------------
            */

            service_type:
                values.serviceType ??
                null,

            /*
            |--------------------------------------------------------------------------
            | Collection Mode
            |--------------------------------------------------------------------------
            */

            collection_mode:
                values.collectionMode,

            /*
            |--------------------------------------------------------------------------
            | Active Status
            |--------------------------------------------------------------------------
            */

            is_active:
                values.isActive ?? true,

            /*
            |--------------------------------------------------------------------------
            | Revenue Service Fields
            |--------------------------------------------------------------------------
            |
            | These reference canonical BaseFields.
            |
            */

            fields:
                (values.fields ?? []).map(
                    (
                        field,
                        index
                    ) => ({
                        /*
                        |--------------------------------------------------------------------------
                        | Canonical BaseField
                        |--------------------------------------------------------------------------
                        */

                        base_field_id:
                            field.baseFieldId,

                        /*
                        |--------------------------------------------------------------------------
                        | Order
                        |--------------------------------------------------------------------------
                        */

                        sort_order:
                            index,

                        /*
                        |--------------------------------------------------------------------------
                        | Required
                        |--------------------------------------------------------------------------
                        */

                        is_required:
                            field.required,

                        /*
                        |--------------------------------------------------------------------------
                        | Service Label
                        |--------------------------------------------------------------------------
                        */

                        label:
                            field.label?.trim() ||
                            null,

                        /*
                        |--------------------------------------------------------------------------
                        | Help Text
                        |--------------------------------------------------------------------------
                        */

                        help_text:
                            field.helpText?.trim() ||
                            null,

                        /*
                        |--------------------------------------------------------------------------
                        | Validation Rules
                        |--------------------------------------------------------------------------
                        */

                        validation_rules:
                            field.validationRules &&
                            Object.keys(
                                field.validationRules
                            ).length > 0
                                ? field.validationRules
                                : null,
                    })
                ),
        };

        console.log(
            "UPDATE REVENUE SERVICE PAYLOAD:",
            payload
        );

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
                            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
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
                    overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
                    className="text-white"
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
                            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
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
                    overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
                    className="text-white"
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
                        className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
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
                overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
                className="text-white"
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