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

import type {
    CreateRevenueServicePayload,
} from "@/types/revenue/revenu-service";

import {
    useBaseFields,
} from "@/hooks/revenue/revenueBaseField.hook";

export default function CreateRevenueServicePage() {
    /*
    |--------------------------------------------------------------------------
    | Base Fields
    |--------------------------------------------------------------------------
    |
    | Base fields are canonical municipality-defined fields.
    |
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
    | Extract Base Fields
    |--------------------------------------------------------------------------
    */

    const baseFields =
        baseFieldsResponse?.data ?? [];

    /*
    |--------------------------------------------------------------------------
    | Create Revenue Service
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
        console.log(
            "FORM VALUES:",
            values
        );

        /*
        |--------------------------------------------------------------------------
        | Transform frontend model → API model
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

            is_active:
                values.isActive,

            fields:
                (values.fields ?? []).map(
                    (field, index) => {
                        /*
                        |--------------------------------------------------------------------------
                        | Verify Base Field
                        |--------------------------------------------------------------------------
                        */

                        const baseField =
                            baseFields.find(
                                (item) =>
                                    item.id ===
                                    field.baseFieldId
                            );

                        if (!baseField) {
                            throw new Error(
                                `Invalid base field: ${field.baseFieldId}`
                            );
                        }

                        return {
                            base_field_id:
                                baseField.id,

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
                                    field.validationRules
                                ).length > 0
                                    ? field.validationRules
                                    : null,
                        };
                    }
                ),
        };

        console.log(
            "CREATE REVENUE SERVICE PAYLOAD:",
            payload
        );

        await createService(payload);
    };

    /*
    |--------------------------------------------------------------------------
    | Base Fields Loading State
    |--------------------------------------------------------------------------
    */

    if (isLoadingBaseFields) {
        return (
            <div className="mx-auto flex min-h-[400px] max-w-5xl items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading base fields...
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Base Fields Error
    |--------------------------------------------------------------------------
    */

    if (isBaseFieldsError) {
        return (
            <div className="mx-auto max-w-5xl">
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/30">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            Unable to load base fields
                        </p>

                        <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/70">
                            The revenue service form cannot be
                            configured until the canonical base
                            fields are available.
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
                        className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
                        icon={
                            <Briefcase className="h-4 w-4" />
                        }
                    >
                        New Revenue Service
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
                mode="create"
                onSubmit={handleSubmit}
                baseFields={baseFields}
            />

        </div>
    );
}