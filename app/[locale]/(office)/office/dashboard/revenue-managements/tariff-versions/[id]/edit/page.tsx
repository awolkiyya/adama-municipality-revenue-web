"use client";

import {
  TariffVersionForm,
  type TariffVersionFormInitialValues,
  type TariffVersionFormValues,
} from "@/components/forms/TariffVersionForm";
import {
  useTariffVersion,
  useTariffVersions,
  useUpdateTariffVersion,
} from "@/hooks/revenue/revenueVersion.hook";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const TARIFF_VERSIONS_PATH =
  "/office/dashboard/revenue-managements/tariff-versions";

export default function EditTariffVersionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data: versionResponse,
    isLoading: isVersionLoading,
    isError,
  } = useTariffVersion(id);

  const {
    data: versionsResponse,
    isLoading: areVersionsLoading,
  } = useTariffVersions();

  const updateMutation = useUpdateTariffVersion();

  const version = versionResponse?.data;
  const versions = versionsResponse?.data ?? [];

  if (isVersionLoading || areVersionsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading tariff version...
        </p>
      </div>
    );
  }

  if (isError || !version) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <h1 className="text-lg font-semibold">
          Tariff version not found
        </h1>

        <p className="text-sm text-muted-foreground">
          The requested tariff version could not be loaded.
        </p>

        <button
          type="button"
          onClick={() => router.push(TARIFF_VERSIONS_PATH)}
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to tariff versions
        </button>
      </div>
    );
  }

  // Exclude the current version so its existing year remains valid.
  const existingYears = versions
    .filter((item) => String(item.id) !== String(version.id))
    .map((item) => item.year);

  // Only consider other versions when checking for an active version.
  const hasActiveVersion = versions.some(
    (item) =>
      item.isActive && String(item.id) !== String(version.id),
  );

  const initialValues: TariffVersionFormInitialValues = {
    year: String(version.year),
    name: version.name ?? "",
    description: version.description ?? "",
    effective_from: version.effectiveFrom?.slice(0, 10) ?? "",
    effective_to: version.effectiveTo?.slice(0, 10) ?? "",
    isActive: Boolean(version.isActive),
  };

  const handleSubmit = async (values: TariffVersionFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: version.id,
        data: {
          year: Number(values.year),
          name: values.name.trim(),
          description: values.description.trim() || null,
          effective_from: values.effective_from,
          effective_to: values.effective_to || null,
          isActive: values.isActive,
        },
      });

      toast.success("Tariff version updated successfully.");

      router.push(TARIFF_VERSIONS_PATH);
    } catch {
      toast.error("Failed to update tariff version. Please try again.");

      // Let the reusable form know the update failed.
      // This allows it to preserve the entered values.
      throw new Error("Failed to update tariff version.");
    }
  };

  return (
    <div className="container mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <TariffVersionForm
        existingYears={existingYears}
        hasActiveVersion={hasActiveVersion}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(TARIFF_VERSIONS_PATH)}
      />
    </div>
  );
}