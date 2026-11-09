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

import {
  ReleaseForm,
  type ReleaseFormSubmit,
  toUpdatePayload,
} from "@/components/forms/ReleaseForm";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Convert APK size from bytes to MB.
 */
function formatApkSize(
  size: number | null | undefined,
): string | undefined {
  if (size == null || size <= 0) {
    return undefined;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function EditMobileAppReleasePage() {
  const router = useRouter();
  const locale = useLocale();

  const params = useParams<{ id: string }>();

  // Release ID is a UUID string.
  const id = params.id;

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;

  const {
    data: release,
    isLoading,
    isError,
    error,
    refetch,
  } = useMobileAppRelease(id);

  const updateMutation = useUpdateMobileAppRelease();

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                    */
  /* ------------------------------------------------------------------------ */

  function handleSubmit(values: ReleaseFormSubmit) {
    if (updateMutation.isPending) {
      return;
    }

    updateMutation.mutate(
      {
        id,
        // app_type is intentionally excluded from the update payload.
        payload: toUpdatePayload(values),
      },
      {
        onSuccess: () => {
          toast.success(
            `Saved changes to v${values.versionName.trim()}.`,
          );

          router.push(basePath);
        },

        onError: (e) => {
          toast.error(
            e instanceof Error
              ? e.message
              : "Couldn't save changes. Try again.",
          );
        },
      },
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Banner                                                                    */
  /* ------------------------------------------------------------------------ */

  const banner = (
    <Banner
      title="Edit Release"
      description="Update the version details or replace the APK. The application type cannot be changed."
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

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      {banner}

      {/* Loading */}
      {isLoading && (
        <div
          className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading release…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />

          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Couldn't load this release."}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Release form */}
      {release && (
        <ReleaseForm
          mode="edit"
          cancelHref={basePath}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit}
          initialValues={{
            // Application type is displayed but disabled in edit mode.
            appType: release.app_type,

            versionName: release.version_name,
            versionCode: String(release.version_code),
            releaseNotes: release.release_notes ?? "",
            isMandatory: release.is_mandatory,
          }}
          existingApk={
            release.apk
              ? {
                  name: release.apk.original_name || "APK file",
                  sizeLabel: formatApkSize(release.apk.size_bytes),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}