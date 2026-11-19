
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
  ReleaseForm,
  type ReleaseFormSubmit,
  toCreatePayload,
} from "@/components/forms/ReleaseForm";

import {
  useCreateMobileAppRelease,
  useUploadMobileAppApk,
} from "@/hooks/use-mobile-app-releases";

import { mobileAppReleasesService } from "@/services/mobile-app-releases-service";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateMobileAppReleasePage() {
  const router = useRouter();
  const locale = useLocale();

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadApk = useUploadMobileAppApk();
  const createRelease = useCreateMobileAppRelease();

  const isBusy =
    isSubmitting ||
    uploadApk.isPending ||
    createRelease.isPending;

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                    */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(values: ReleaseFormSubmit): Promise<void> {
    if (isBusy) {
      return;
    }

    /**
     * Validate and narrow the application type.
     *
     * ReleaseFormSubmit defines appType as MobileAppType | "",
     * while the upload service requires MobileAppType.
     */
    const appType = values.appType;

    if (!appType) {
      toast.error("Please select an application type.");
      return;
    }

    const apkFile = values.apkFile;

    if (!apkFile) {
      toast.error("Please select an APK file.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      /**
       * Step 1: Upload or resume the APK upload.
       *
       * The upload service resumes previously uploaded chunks
       * when the same file is selected again.
       */
      toast.info("Preparing APK upload...");

      const upload = await uploadApk.mutateAsync({
        appType,
        file: apkFile,
        onProgress: setUploadProgress,
      });

      /**
       * Step 2: Ensure the server completed APK verification.
       */
      if (upload.status !== "COMPLETED") {
        throw new Error(
          "The APK upload has not completed successfully. Please try again.",
        );
      }

      /**
       * Step 3: Create the release using the completed upload UUID.
       *
       * The APK binary is not sent again in this request.
       */
      const payload = toCreatePayload(values, upload.uuid);

      const release = await createRelease.mutateAsync(payload);

      /**
       * Step 4: Clear local upload session information only
       * after successful release creation.
       */
      mobileAppReleasesService.clearSavedUpload(appType, apkFile);

      toast.success(
        `${release.app_type.replaceAll("_", " ")} release v${release.version_name} created successfully as a draft.`,
      );

      router.push(basePath);
    } catch (error: unknown) {
      toast.error(getCreateReleaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      <Banner
        title="New Release"
        description="Select a mobile application, upload its APK, and configure the release. New releases start as drafts."
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

      <ReleaseForm
        mode="create"
        cancelHref={basePath}
        isSubmitting={isBusy}
        uploadProgress={uploadProgress}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error Handling                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Extract a readable message from Axios/Laravel errors.
 */
function getCreateReleaseError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[] | string>;
          };
        };
      }
    ).response;

    const data = response?.data;

    if (data?.errors) {
      const validationMessages = Object.values(data.errors)
        .flatMap((messages) =>
          Array.isArray(messages) ? messages : [messages],
        )
        .filter(
          (message): message is string =>
            typeof message === "string" &&
            message.trim().length > 0,
        );

      if (validationMessages.length > 0) {
        return validationMessages.join("\n");
      }
    }

    if (data?.message) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Couldn't create the release. Please check the details and try again.";
}
