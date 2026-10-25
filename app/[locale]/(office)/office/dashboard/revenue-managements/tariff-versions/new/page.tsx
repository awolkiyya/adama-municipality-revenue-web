"use client";

import {
  TariffVersionForm,
  type TariffVersionFormValues,
} from "@/components/forms/TariffVersionForm";
import {
  useCreateTariffVersion,
  useTariffVersions,
} from "@/hooks/revenue/revenueVersion.hook";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TARIFF_VERSIONS_PATH =
  "/office/dashboard/revenue-managements/tariff-versions";

export default function CreateTariffVersionPage() {
  const router = useRouter();

  const { data: versionsResponse, isLoading } = useTariffVersions();
  const createMutation = useCreateTariffVersion();

  const versions = versionsResponse?.data ?? [];

  const existingYears = versions.map((version) => version.year);

  const hasActiveVersion = versions.some(
    (version) => version.isActive,
  );

  const handleSubmit = async (values: TariffVersionFormValues) => {
    try {
      await createMutation.mutateAsync({
        year: Number(values.year),
        version: 1,
        name: values.name.trim(),
        description: values.description.trim() || null,
        effective_from: values.effective_from,
        effective_to: values.effective_to || null,
        isActive: values.isActive,
      });

      toast.success("Tariff version created successfully.");

      router.push(TARIFF_VERSIONS_PATH);
    } catch {
      toast.error("Failed to create tariff version. Please try again.");

      // Re-throw so the reusable form knows submission failed
      // and preserves the user's entered values.
      throw new Error("Failed to create tariff version.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading tariff versions...
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <TariffVersionForm
        existingYears={existingYears}
        hasActiveVersion={hasActiveVersion}
        onSubmit={handleSubmit}
        onCancel={() => router.push(TARIFF_VERSIONS_PATH)}
      />
    </div>
  );
}