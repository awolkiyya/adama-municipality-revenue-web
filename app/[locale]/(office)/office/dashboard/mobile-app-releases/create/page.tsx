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
import { useCreateMobileAppRelease } from "@/hooks/use-mobile-app-releases";

export default function CreateMobileAppReleasePage() {
  const router = useRouter();
  const locale = useLocale();

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRelease = useCreateMobileAppRelease();

  async function handleSubmit(values: ReleaseFormSubmit) {
    if (isSubmitting || createRelease.isPending) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = toCreatePayload(values);

      const release = await createRelease.mutateAsync(payload);

      toast.success(
        `Release v${release.version_name} created successfully as a draft.`,
      );

      router.push(basePath);
    } catch (error: unknown) {
      const message = getCreateReleaseError(error);

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      <Banner
        title="New Release"
        description="Upload an APK and set the version details. Releases start as drafts."
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
        isSubmitting={isSubmitting || createRelease.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

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
            typeof message === "string" && message.trim().length > 0,
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