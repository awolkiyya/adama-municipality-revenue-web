"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AlertCircle, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";


import {
  useMobileAppRelease,
  useUpdateMobileAppRelease,
} from "@/hooks/use-mobile-app-releases";
import { ReleaseForm, ReleaseFormSubmit, toUpdatePayload } from "@/components/forms/ReleaseForm";

/** apk_size is assumed to be in bytes; small values are treated as MB. */
function formatApkSize(size: number | null): string | undefined {
  if (!size || size <= 0) return undefined;
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${size.toFixed(1)} MB`;
}

export default function EditMobileAppReleasePage() {
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;

  const { data, isLoading, isError, error, refetch } = useMobileAppRelease(id);
  const updateMutation = useUpdateMobileAppRelease();

  const release = data;

  function handleSubmit(values: ReleaseFormSubmit) {
    updateMutation.mutate(
      { id, payload: toUpdatePayload(values) },
      {
        onSuccess: () => {
          toast.success(`Saved changes to v${values.versionName.trim()}.`);
          router.push(basePath);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn't save changes. Try again."),
      },
    );
  }

  const banner = (
    <Banner
      title="Edit Release"
      description="Update the version details or replace the APK."
      icon={<Smartphone className="h-4 w-4" />}
      background={
        <FloatingParticles
          color="#0B3784"
          count={35}
          speed={0.2}
          connectDistance={100}
          position="bottom-right"
        />
      }
      overlayClassName="bg-transparent"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={basePath}>Cancel</Link>
        </Button>
      }
    />
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      {banner}

      {isLoading && (
        <div
          className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading release…
        </div>
      )}

      {isError && (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Couldn't load this release."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}

      {release && (
        <ReleaseForm
          mode="edit"
          cancelHref={basePath}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit}
          initialValues={{
            versionName: release.version_name,
            versionCode: String(release.version_code),
            releaseNotes: release.release_notes ?? "",
            isMandatory: release.is_mandatory,
          }}
          existingApk={
            release.apk_path
              ? {
                  name: release.apk_path.split("/").pop() ?? "APK file",
                  sizeLabel: formatApkSize(release.apk_size),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}