"use client";

import { CollectionForm, CollectionResult } from "@/components/forms/CollectionForm";
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import { useCitizens } from "@/hooks/useCitizen.hook";
import { useRouter } from "next/navigation";


export default function CreateFieldCollectionPage() {
  const router = useRouter();

  // =========================================================
  // TAXPAYERS
  // =========================================================

  const {
    data: taxpayers,
    isLoading: taxpayersLoading,
    isError: taxpayersError,
  } = useCitizens();

  // =========================================================
  // REVENUE SERVICES
  // =========================================================

  const {
    data: revenueServices,
    isLoading: servicesLoading,
    isError: servicesError,
  } = useRevenueServices();

  // =========================================================
  // SUCCESS
  // =========================================================

  function handleSuccess(
    collection: CollectionResult
  ) {
    router.push(
      `/field-collection/${collection.id}`
    );
  }

  // =========================================================
  // CANCEL
  // =========================================================

  function handleCancel() {
    router.push("/field-collection");
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    taxpayersLoading ||
    servicesLoading
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
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (
    taxpayersError ||
    servicesError
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
            onClick={() =>
              router.refresh()
            }
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <CollectionForm
        mode="create"
        taxpayers={taxpayers?.data!}
        revenueServices={[]}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}