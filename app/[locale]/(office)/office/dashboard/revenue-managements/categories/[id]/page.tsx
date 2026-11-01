"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft,
    Layers,
    TriangleAlert,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
    RevenueCategoryForm,
    type RevenueCategoryFormValues,
} from "@/components/forms/RevenueCategoryForm";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
    useRevenueCategory,
    useUpdateRevenueCategory,
} from "@/hooks/revenue/revenueCategory.hook";

import type {
    RevenueDomain,
    UpdateRevenueCategoryPayload,
} from "@/types/revenue/revenue-category";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface RevenueCategoryCodeRecord {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
}

interface RevenueCategoryRecord {
    id: string;
    revenueDomain: RevenueDomain;
    name: string;
    startCode: number | null;
    endCode: number | null;
    description: string | null;
    sortOrder: number | null;
    isActive: boolean;
    codes: RevenueCategoryCodeRecord[] | null;
}

/*
|--------------------------------------------------------------------------
| API Response Type
|--------------------------------------------------------------------------
*/

interface RevenueCategoryResponse {
    data: RevenueCategoryRecord;
}

/*
|--------------------------------------------------------------------------
| Map API Response to Form Values
|--------------------------------------------------------------------------
*/

function mapToFormValues(
    record: RevenueCategoryRecord
): RevenueCategoryFormValues {
    return {
        id: record.id,

        revenueDomain: record.revenueDomain,

        name: record.name,

        startCode: record.startCode?.toString() ?? "",

        endCode: record.endCode?.toString() ?? "",

        description: record.description ?? "",

        sortOrder: record.sortOrder?.toString() ?? "0",

        isActive: record.isActive,

        codes: (record.codes ?? []).map((item) => ({
            id: item.id,

            code: item.code,

            name: item.name,

            description: item.description ?? "",

            isActive: item.isActive,
        })),
    };
}

/*
|--------------------------------------------------------------------------
| Edit Revenue Category Page
|--------------------------------------------------------------------------
*/

export default function EditRevenueCategoryPage() {
    const router = useRouter();

    const params = useParams<{ id: string }>();

    const id = params.id;

    /*
    |--------------------------------------------------------------------------
    | Fetch Revenue Category
    |--------------------------------------------------------------------------
    */

    const {
        data: category,
        isLoading,
        isError,
    } = useRevenueCategory(id);

    /*
    |--------------------------------------------------------------------------
    | Update Revenue Category Mutation
    |--------------------------------------------------------------------------
    */

    const {
        mutateAsync: updateCategory,
        isPending,
    } = useUpdateRevenueCategory();

    /*
    |--------------------------------------------------------------------------
    | Submit Handler
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        values: RevenueCategoryFormValues
    ): Promise<void> => {
        try {
            const payload: UpdateRevenueCategoryPayload = {
                revenue_domain: values.revenueDomain,

                name: values.name,

                start_code: values.startCode
                    ? Number(values.startCode)
                    : null,

                end_code: values.endCode
                    ? Number(values.endCode)
                    : null,

                description: values.description || null,

                sortOrder: Number(values.sortOrder) || 0,

                is_active: values.isActive,

                codes: values.codes.map((item) => ({
                    ...(item.id ? { id: item.id } : {}),

                    code: item.code,

                    name: item.name,

                    description: item.description || null,

                    is_active: item.isActive,
                })),
            };

            await updateCategory({
                id,
                data: payload,
            });

            toast.success(
                "Revenue category updated successfully"
            );

            router.push(
                "/office/dashboard/revenue-managements/categories"
            );
        } catch (error: unknown) {
            console.error(
                "Failed to update revenue category:",
                error
            );

            toast.error(
                "Failed to update revenue category"
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Page Banner */}

            <Banner
                description="Update this revenue category and its associated revenue codes."
                badge={
                    <IconBadge
                        className="gap-2 rounded-full p-3 text-xs"
                        icon={
                            <Layers className="size-4" />
                        }
                    >
                        Edit Revenue Category
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

            {/* Loading State */}

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />

                    <Skeleton className="h-10 w-full" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Skeleton className="h-10 w-full" />

                        <Skeleton className="h-10 w-full" />
                    </div>

                    <Skeleton className="h-24 w-full" />

                    <Skeleton className="h-40 w-full" />
                </div>
            )}

            {/* Error State */}

            {(isError || !category) && !isLoading && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <TriangleAlert className="size-6 text-muted-foreground" />
                    </div>

                    <div>
                        <p className="text-sm font-medium">
                            Category not found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            This revenue category may have been deleted.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() =>
                            router.push(
                                "/office/dashboard/revenue-managements/categories"
                            )
                        }
                    >
                        <ArrowLeft className="mr-2 size-4" />

                        Back to Revenue Categories
                    </Button>
                </div>
            )}

            {/* Edit Form */}

            {category && !isLoading && (
                <RevenueCategoryForm
                    mode="edit"
                    initialValues={mapToFormValues(
                        (category as RevenueCategoryResponse).data
                    )}
                    onSubmit={handleSubmit}
                    isSubmitting={isPending}
                />
            )}
        </div>
    );
}