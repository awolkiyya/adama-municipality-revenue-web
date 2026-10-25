"use client";

import { useRouter } from "next/navigation";

import BaseFieldForm from "@/components/revenue/base-fields/BaseFieldForm";
import { useCreateBaseField } from "@/hooks/revenue/revenueBaseField.hook";

export default function CreateBaseFieldPage() {
  const router = useRouter();
  const createMutation = useCreateBaseField();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create base field
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a reusable data field for municipal revenue services.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <BaseFieldForm
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
            router.push("/en/office/dashboard/revenue-managements/base-fields");
          }}
          onCancel={() => router.back()}
          loading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
