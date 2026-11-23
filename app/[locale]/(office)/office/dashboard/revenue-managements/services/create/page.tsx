
"use client";

import {
    AlertCircle,
    Briefcase,
    Loader2,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { RevenueServiceForm } from "@/components/forms/RevenueServiceForm";

import type {
    CreateRevenueServiceInput,
} from "@/lib/zod-forms/revenueService.schema";

import {
    useCreateRevenueService,
} from "@/hooks/revenue/revenueService.hook";

import {
    useBaseFields,
} from "@/hooks/revenue/revenueBaseField.hook";

import type {
    CreateRevenueServicePayload,
} from "@/types/revenue/revenu-service";

import { toast } from "sonner";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeId = (value: unknown): string =>
    String(value ?? "").trim();

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function CreateRevenueServicePage() {

    /*
    |--------------------------------------------------------------------------
    | Canonical Base Fields
    |--------------------------------------------------------------------------
    |
    | Explicitly request 100 records to avoid the previous default
    | pagination issue where only 8 records were loaded.
    |
    */

    const {
        data: baseFieldsResponse,
        isLoading: isLoadingBaseFields,
        isFetching: isFetchingBaseFields,
        isPlaceholderData,
        isError: isBaseFieldsError,
        refetch: refetchBaseFields,
    } = useBaseFields({
        page: 1,
        per_page: 100,
        isActive: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Canonical Dataset
    |--------------------------------------------------------------------------
    */

    const baseFields = baseFieldsResponse?.data ?? [];

    /*
    |--------------------------------------------------------------------------
    | Create Revenue Service Mutation
    |--------------------------------------------------------------------------
    */

    const {
        mutateAsync: createService,
    } = useCreateRevenueService();

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        values: CreateRevenueServiceInput
    ) => {

        let consoleGroupOpen = false;

        try {

            console.group("Create Revenue Service");
            consoleGroupOpen = true;

            console.log(
                "1. Submitted form values:",
                values
            );

            /*
            |--------------------------------------------------------------------------
            | Ensure Canonical Data Is Ready
            |--------------------------------------------------------------------------
            */

            if (
                isPlaceholderData ||
                isFetchingBaseFields
            ) {
                toast.error(
                    "Base fields are still loading. Please wait and try again."
                );

                return;
            }

            if (
                !Array.isArray(baseFields) ||
                baseFields.length === 0
            ) {
                console.error(
                    "Canonical base fields are unavailable.",
                    {
                        baseFieldsResponse,
                        baseFields,
                    }
                );

                toast.error(
                    "No canonical base fields are available. Please refresh and try again."
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Selected Form Fields
            |--------------------------------------------------------------------------
            */

            const selectedFields = values.fields ?? [];

            console.log(
                "2. Selected form fields:",
                selectedFields
            );

            /*
            |--------------------------------------------------------------------------
            | Canonical Base Field Diagnostics
            |--------------------------------------------------------------------------
            */

            console.log(
                "3. Available canonical base fields:"
            );

            console.table(
                baseFields.map((field) => ({
                    id: normalizeId(field.id),
                    code: field.code,
                    name: field.name,
                }))
            );

            console.log(
                "Total canonical base fields:",
                baseFields.length
            );

            console.log(
                "API pagination metadata:",
                baseFieldsResponse?.meta
            );

            /*
            |--------------------------------------------------------------------------
            | Build Canonical Lookup
            |--------------------------------------------------------------------------
            |
            | The backend ID is the only authoritative identifier.
            |
            */

            const baseFieldMap = new Map(
                baseFields.map((field) => [
                    normalizeId(field.id),
                    field,
                ])
            );

            /*
            |--------------------------------------------------------------------------
            | Validate Selected IDs
            |--------------------------------------------------------------------------
            */

            const selectedBaseFieldIds =
                selectedFields.map((field) =>
                    normalizeId(field.baseFieldId)
                );

            console.log(
                "4. Selected base field diagnostics:"
            );

            console.table(
                selectedFields.map((field, index) => {

                    const selectedId =
                        selectedBaseFieldIds[index];

                    const canonicalField =
                        baseFieldMap.get(selectedId);

                    return {
                        index,
                        selectedBaseFieldId: selectedId,
                        canonicalMatch: Boolean(
                            canonicalField
                        ),
                        canonicalId:
                            canonicalField?.id ?? null,
                        canonicalCode:
                            canonicalField?.code ?? null,
                        canonicalName:
                            canonicalField?.name ?? null,
                        label: field.label,
                        required: field.required,
                        sortOrder: field.sortOrder,
                    };
                })
            );

            /*
            |--------------------------------------------------------------------------
            | Identify Invalid Selections
            |--------------------------------------------------------------------------
            */

            const missingFields = selectedFields
                .map((field, index) => ({
                    index,
                    label: field.label,
                    baseFieldId:
                        selectedBaseFieldIds[index],
                }))
                .filter(
                    ({ baseFieldId }) =>
                        !baseFieldId ||
                        !baseFieldMap.has(baseFieldId)
                );

            if (missingFields.length > 0) {

                console.error(
                    "Invalid base field selections:",
                    {
                        missingFields,
                        selectedBaseFieldIds,
                        availableBaseFieldIds:
                            Array.from(baseFieldMap.keys()),
                    }
                );

                toast.error(
                    "One or more selected fields do not match the canonical base fields. Please remove and select them again."
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Detect Duplicate Selections
            |--------------------------------------------------------------------------
            */

            const uniqueBaseFieldIds = new Set(
                selectedBaseFieldIds
            );

            if (
                uniqueBaseFieldIds.size !==
                selectedBaseFieldIds.length
            ) {

                const duplicateIds =
                    selectedBaseFieldIds.filter(
                        (id, index, array) =>
                            array.indexOf(id) !== index
                    );

                console.error(
                    "Duplicate base field selections:",
                    duplicateIds
                );

                toast.error(
                    "A base field cannot be selected more than once."
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Resolve Canonical Fields
            |--------------------------------------------------------------------------
            */

            const resolvedFields = selectedFields.map(
                (field, index) => {

                    const baseFieldId =
                        selectedBaseFieldIds[index];

                    const canonicalBaseField =
                        baseFieldMap.get(baseFieldId);

                    if (!canonicalBaseField) {
                        throw new Error(
                            `Canonical base field not found: ${baseFieldId}`
                        );
                    }

                    return {
                        field,
                        baseField: canonicalBaseField,
                        index,
                    };
                }
            );

            console.log(
                "5. Resolved canonical base fields:"
            );

            console.table(
                resolvedFields.map(
                    ({ field, baseField, index }) => ({
                        index,
                        submittedId:
                            field.baseFieldId,
                        canonicalId:
                            baseField.id,
                        code:
                            baseField.code,
                        name:
                            baseField.name,
                    })
                )
            );

            /*
            |--------------------------------------------------------------------------
            | Build API Payload
            |--------------------------------------------------------------------------
            */

            const payload: CreateRevenueServicePayload = {

                revenue_code_id:
                    values.revenueCodeId,

                name:
                    values.name.trim(),

                description:
                    values.description?.trim() || null,

                service_type:
                    values.serviceType || null,

                collection_mode:
                    values.collectionMode,

                allow_multiple:
                    values.allowMultiple ?? false,

                is_active:
                    values.isActive,

                fields: resolvedFields.map(
                    ({ field, baseField, index }) => ({

                        // Always use the canonical backend ID.
                        base_field_id:
                            baseField.id,

                        sort_order:
                            field.sortOrder ?? index,

                        is_required:
                            field.required,

                        label:
                            field.label?.trim() || null,

                        help_text:
                            field.helpText?.trim() || null,

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
                "6. Constructed API payload:",
                payload
            );

           /*
            |--------------------------------------------------------------------------
            | Final Payload Validation
            |--------------------------------------------------------------------------
            */

            const payloadFields = payload.fields ?? [];

            const invalidPayloadFields = payloadFields.filter(
                (field) =>
                    !field.base_field_id ||
                    !baseFieldMap.has(
                        normalizeId(field.base_field_id)
                    )
            );

            if (invalidPayloadFields.length > 0) {
                console.error(
                    "Payload contains invalid base field IDs:",
                    invalidPayloadFields
                );

                toast.error(
                    "The submitted payload contains invalid base fields."
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Submit API Request
            |--------------------------------------------------------------------------
            */

            console.log(
                "7. Calling createService API..."
            );

            const response =
                await createService(payload);

            console.log(
                "8. API response:",
                response
            );

            toast.success(
                "Revenue service created successfully."
            );

        } catch (error: unknown) {

            console.error(
                "Revenue service submission failed:",
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while creating the revenue service.";

            toast.error(message);

        } finally {

            if (consoleGroupOpen) {
                console.groupEnd();
            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (
        isLoadingBaseFields ||
        isPlaceholderData
    ) {

        return (
            <div className="mx-auto flex min-h-[400px] max-w-5xl items-center justify-center">

                <div className="flex items-center gap-2 text-sm text-muted-foreground">

                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading canonical base fields...

                </div>

            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error State
    |--------------------------------------------------------------------------
    */

    if (isBaseFieldsError) {

        return (
            <div className="mx-auto max-w-5xl">

                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/30">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div className="flex-1">

                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            Unable to load base fields
                        </p>

                        <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/70">
                            The revenue service form cannot be
                            configured until the canonical base
                            fields are available.
                        </p>

                        <button
                            type="button"
                            onClick={() => refetchBaseFields()}
                            className="mt-3 text-xs font-medium text-red-700 underline underline-offset-4 dark:text-red-400"
                        >
                            Try again
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Empty State
    |--------------------------------------------------------------------------
    */

    if (baseFields.length === 0) {

        return (
            <div className="mx-auto max-w-5xl">

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div>

                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            No active base fields found
                        </p>

                        <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/70">
                            Create or activate base fields before
                            configuring a revenue service.
                        </p>

                    </div>

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
                description="Define a billable service under a revenue code, including how it's collected and what data it requires."
                badge={
                    <IconBadge
                        className="gap-2 rounded-full p-3 text-xs"
                        icon={
                            <Briefcase className="h-4 w-4" />
                        }
                    >
                        New Revenue Service
                    </IconBadge>
                }
                overlayClassName="bg-transparent"
                background={
                    <FloatingParticles
                        color="#040404"
                        count={35}
                        speed={0.2}
                        connectDistance={100}
                        position="bottom-right"
                    />
                }
            />

            <RevenueServiceForm
                mode="create"
                onSubmit={handleSubmit}
                baseFields={baseFields}
            />

        </div>
    );
}
