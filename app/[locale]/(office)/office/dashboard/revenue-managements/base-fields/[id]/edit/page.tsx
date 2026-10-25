"use client";

import { useParams, useRouter } from "next/navigation";

import BaseFieldForm from "@/components/revenue/base-fields/BaseFieldForm";
import {
  useBaseField,
  useUpdateBaseField,
} from "@/hooks/revenue/revenueBaseField.hook";

export default function EditBaseFieldPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const fieldQuery = useBaseField(id);
  const updateMutation = useUpdateBaseField();

  // Extract the BaseField from the API response.
  const field = fieldQuery.data?.data;

  if (fieldQuery.isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border bg-card" />
      </div>
    );
  }

  if (fieldQuery.isError || !field) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div
          role="alert"
          className="rounded-xl border bg-card p-6"
        >
          <h1 className="text-lg font-semibold">
            Unable to load base field
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The field may not exist, or the request may have failed.
            Try loading it again.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fieldQuery.refetch()}
              disabled={fieldQuery.isFetching}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {fieldQuery.isFetching ? "Retrying..." : "Try again"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit base field
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update the configuration for{" "}
          <span className="font-medium text-foreground">
            {field.name}
          </span>
          .
        </p>
      </header>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <BaseFieldForm
          key={field.id}
          initialField={field}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({
              id: field.id,
              data: payload,
            });
          
            router.push("/en/office/dashboard/revenue-managements/base-fields");
          }}
          onCancel={() => router.back()}
          loading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
