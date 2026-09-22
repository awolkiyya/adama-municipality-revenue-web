"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook"
import { useCitizens } from "@/hooks/useCitizen.hook"

import type { RevenueService } from "@/types/revenue/assessment"

import { mapRevenueService } from "../../assessments/create/page"
import { CollectionForm, DirectCollectionResult } from "@/components/forms/CollectionForm"

export default function CreateFieldCollectionPage() {
  const router = useRouter()

  // =========================================================
  // TAXPAYERS
  // =========================================================

  const {
    data: taxpayers,
    isLoading: taxpayersLoading,
    isError: taxpayersError,
  } = useCitizens()

  // =========================================================
  // REVENUE SERVICES
  // =========================================================

  const {
    data: revenueServicesData,
    isLoading: revenueServicesLoading,
    isError: revenueServicesError,
  } = useRevenueServices({
    is_active: true,
    per_page: 100,
    page: 1,
  })

  /*
   * Only revenue services configured for
   * FIELD_COLLECTION are available to this workflow.
   *
   * The API revenue-service model is normalized
   * into the assessment/workflow RevenueService model.
   */
  const revenueServices =
    useMemo<RevenueService[]>(
      () =>
        (revenueServicesData?.data ?? [])
          .filter(
            (service) =>
              service.collectionMode ===
              "FIELD_COLLECTION",
          )
          .map(mapRevenueService),
      [revenueServicesData],
    )

  // =========================================================
  // SUCCESS
  // =========================================================

  function handleSuccess(
    collection: DirectCollectionResult,
  ) {
    toast.success(
      collection.invoiceNumber
        ? `Invoice ${collection.invoiceNumber} created successfully.`
        : "Direct collection created successfully.",
    )

    /*
     * Navigate to the invoice/direct collection
     * details page when that page is ready.
     */
    if (collection.invoiceId) {
      router.push(
        `/field-collection/${collection.invoiceId}`,
      )
    }
  }

  // =========================================================
  // CANCEL
  // =========================================================

  function handleCancel() {
    router.push("/field-collection")
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    taxpayersLoading ||
    revenueServicesLoading
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-medium">
            Loading collection form...
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Loading taxpayers and revenue services.
          </p>
        </div>
      </div>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (
    taxpayersError ||
    revenueServicesError
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-destructive">
            Unable to load collection data
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Taxpayers or revenue services could not
            be loaded. Please try again.
          </p>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <CollectionForm
        mode="create"
        taxpayers={taxpayers?.data ?? []}
        revenueServices={revenueServices}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}