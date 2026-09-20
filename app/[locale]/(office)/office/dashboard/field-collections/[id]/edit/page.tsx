"use client"

import { CollectionForm, CollectionFormData, CollectionResult } from "@/components/forms/CollectionForm"
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook"
import { useCitizen, useCitizens } from "@/hooks/useCitizen.hook"
import { useParams, useRouter } from "next/navigation"



export default function EditFieldCollectionPage() {
  const router = useRouter()
  const params = useParams()

  const collectionId = String(params.id)

  // =========================================================
  // COLLECTION
  // =========================================================

  const {
    data: collection,
    isLoading: collectionLoading,
    isError: collectionError,
  } = useFieldCollection(collectionId)

  // =========================================================
  // TAXPAYERS
  // =========================================================

  const {
    data: taxpayers = [],
    isLoading: taxpayersLoading,
    isError: taxpayersError,
  } = useCitizens()

  // =========================================================
  // REVENUE SERVICES
  // =========================================================

  const {
    data: revenueServices = [],
    isLoading: servicesLoading,
    isError: servicesError,
  } = useRevenueServices()

  // =========================================================
  // HANDLERS
  // =========================================================

  function handleSuccess(updated: CollectionResult) {
    router.push(`/field-collection/${updated.id}`)
  }

  function handleCancel() {
    router.push(`/field-collection/${collectionId}`)
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    collectionLoading ||
    taxpayersLoading ||
    servicesLoading
  ) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-5xl items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">
          Loading collection...
        </p>
      </div>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

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
            We could not load the information required to
            update this field collection. Please try again.
          </p>

          <button
            type="button"
            onClick={() => router.push("/field-collection")}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Back to Field Collection
          </button>
        </div>
      </div>
    )
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!collection) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded-lg border p-6">
          <h1 className="text-sm font-semibold">
            Collection not found
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            The requested field collection could not be found.
          </p>

          <button
            type="button"
            onClick={() => router.push("/field-collection")}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Back to Field Collection
          </button>
        </div>
      </div>
    )
  }

  // =========================================================
  // INITIAL FORM DATA
  // =========================================================

  const initialData: CollectionFormData = {
    id: collection.id,

    taxpayerId:
      collection.taxpayerId ?? "",

    revenueServiceId:
      collection.revenueServiceId ?? "",

    serviceFieldValues:
      collection.serviceFields ?? {},

    collectionDate:
      collection.collectionDate ?? "",

    notes:
      collection.notes ?? "",
  }

  // =========================================================
  // PAGE
  // =========================================================

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
