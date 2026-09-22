"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  CollectionForm,
  type DirectCollectionFormData,
  type DirectCollectionResult,
} from "@/components/forms/CollectionForm"

import {
  useDirectCollection,
} from "@/hooks/revenue/use-direct-collection"

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook"
import { useCitizens } from "@/hooks/useCitizen.hook"

import type {
  DirectCollectionFields,
  DirectCollectionInvoice,
} from "@/types/revenue/direct-collection"

import type { RevenueService } from "@/types/revenue/assessment"
import { mapRevenueService } from "../../../assessments/create/page"


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract dynamic field values from the invoice item's
 * input snapshot.
 *
 * Backend:
 *
 * input_snapshot[field_uuid] = {
 *   field_id,
 *   field_code,
 *   field_label,
 *   data_type,
 *   input_type,
 *   value
 * }
 *
 * CollectionForm:
 *
 * fields = {
 *   [field_uuid]: value
 * }
 */
function extractServiceFieldValues(
  collection: DirectCollectionInvoice,
): DirectCollectionFields {
  const item =
    collection.items?.[0]

  const snapshot =
    item?.input_snapshot

  if (
    !snapshot ||
    typeof snapshot !== "object"
  ) {
    return {}
  }

  const values: DirectCollectionFields = {}

  Object.entries(snapshot).forEach(
    ([fieldId, field]) => {
      if (
        field &&
        typeof field === "object" &&
        "value" in field
      ) {
        values[fieldId] =
          field.value
      }
    },
  )

  return values
}

/**
 * Normalize backend invoice status.
 */
function normalizeStatus(
  status?: string | null,
): string {
  return (
    status
      ?.trim()
      .toUpperCase() ?? ""
  )
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function EditFieldCollectionPage() {
  const router = useRouter()
  const params = useParams()

  /*
  |--------------------------------------------------------------------------
  | Invoice ID
  |--------------------------------------------------------------------------
  */

  const collectionId =
    String(params.id)

  /*
  |--------------------------------------------------------------------------
  | Direct Collection
  |--------------------------------------------------------------------------
  */

  const {
    data: collection,
    isLoading: collectionLoading,
    isError: collectionError,
  } = useDirectCollection(
    collectionId,
  )

  /*
  |--------------------------------------------------------------------------
  | TAXPAYERS
  |--------------------------------------------------------------------------
  */

  const {
    data: taxpayersData,
    isLoading: taxpayersLoading,
    isError: taxpayersError,
  } = useCitizens()

  /*
  |--------------------------------------------------------------------------
  | REVENUE SERVICES
  |--------------------------------------------------------------------------
  */

  const {
    data: revenueServicesData,
    isLoading: servicesLoading,
    isError: servicesError,
  } = useRevenueServices({
    is_active: true,
    per_page: 100,
    page: 1,
  })

  /*
  |--------------------------------------------------------------------------
  | Normalize Revenue Services
  |--------------------------------------------------------------------------
  |
  | Keep this consistent with the create page.
  |
  | Only services configured for FIELD_COLLECTION
  | are available in the edit form.
  |
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

  /*
  |--------------------------------------------------------------------------
  | Taxpayer List
  |--------------------------------------------------------------------------
  */

  const taxpayers =
    taxpayersData?.data ?? []

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const status =
    normalizeStatus(
      collection?.invoice?.status,
    )

  /*
  |--------------------------------------------------------------------------
  | EDIT PROTECTION
  |--------------------------------------------------------------------------
  |
  | Direct collection can only be edited while:
  |
  | ISSUED
  |
  | This means:
  |
  | - invoice exists
  | - invoice has not been paid
  | - invoice is still pending payment
  |
  | The backend performs the authoritative check too.
  |
  */

  const canEdit =
    status === "ISSUED"

  /*
  |--------------------------------------------------------------------------
  | DYNAMIC FIELD VALUES
  |--------------------------------------------------------------------------
  */

  const fields =
    useMemo<DirectCollectionFields>(
      () => {
        if (!collection) {
          return {}
        }

        return extractServiceFieldValues(
          collection,
        )
      },
      [collection],
    )

  /*
  |--------------------------------------------------------------------------
  | INITIAL FORM DATA
  |--------------------------------------------------------------------------
  */

  const initialData =
    useMemo<
      DirectCollectionFormData | null
    >(
      () => {
        if (!collection) {
          return null
        }

        return {
          id:
            collection.id,

          taxpayerId:
            collection.taxpayer_id ??
            collection.taxpayer?.id ??
            "",

          revenueServiceId:
            collection.revenue_service_id ??
            collection.items?.[0]?.service_id ??
            "",

          fields,

          /*
          |--------------------------------------------------------------------------
          | Notes
          |--------------------------------------------------------------------------
          |
          | If DirectCollectionResource later exposes
          | invoice.notes, populate it here.
          |
          | For now, don't invent a value.
          |
          */

          notes: "",
        }
      },
      [
        collection,
        fields,
      ],
    )

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  function handleSuccess(
    updated: DirectCollectionResult,
  ) {
    toast.success(
      updated.invoiceNumber
        ? `Invoice ${updated.invoiceNumber} updated successfully.`
        : "Direct collection updated successfully.",
    )

    const invoiceId =
      updated.invoiceId

    if (invoiceId) {
      router.push(
        `/office/dashboard/field-collections/${invoiceId}`,
      )

      return
    }

    router.push(
      "/office/dashboard/field-collections",
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  function handleCancel() {
    router.push(
      `/office/dashboard/field-collections/${collectionId}`,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    collectionLoading ||
    taxpayersLoading ||
    servicesLoading
  ) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-5xl items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-medium">
            Loading collection...
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Loading collection, taxpayers,
            and revenue services.
          </p>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    collectionError ||
    taxpayersError ||
    servicesError
  ) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded-lg border p-6">
          <h1 className="text-sm font-semibold">
            Unable to load collection
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            We could not load the information
            required to update this field
            collection. Please try again.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/office/dashboard/field-collections",
              )
            }
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Back to Field Collection
          </button>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !collection ||
    !initialData
  ) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded-lg border p-6">
          <h1 className="text-sm font-semibold">
            Collection not found
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            The requested field collection
            could not be found.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/office/dashboard/field-collections",
              )
            }
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Back to Field Collection
          </button>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | PAYMENT / EDIT PROTECTION
  |--------------------------------------------------------------------------
  */

  if (!canEdit) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded-lg border p-6">
          <h1 className="text-sm font-semibold">
            Collection cannot be edited
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Only direct collections that are
            still pending payment can be edited.
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Current status:{" "}
            <span className="font-medium">
              {status || "UNKNOWN"}
            </span>
          </p>

          <button
            type="button"
            onClick={handleCancel}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Back to Collection
          </button>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | EDIT FORM
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <CollectionForm
        mode="edit"
        initialData={initialData}
        taxpayers={taxpayers}
        revenueServices={revenueServices}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}