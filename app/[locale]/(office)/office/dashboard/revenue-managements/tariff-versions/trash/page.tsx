
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, Inbox } from "lucide-react";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import Can from "@/components/access/Can";

const TARIFF_VERSIONS_ROUTE =
  "/office/dashboard/revenue-managements/tariff-versions";

function TrashPageContent() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Banner
        description="Review deleted tariff versions and prepare to restore or permanently remove eligible records."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-xs"
            icon={<Archive className="h-4 w-4" />}
          >
            Tariff Version Trash
          </IconBadge>
        }
        overlayClassName="bg-transparent"
        background={
          <FloatingParticles
            color="#040404"
            count={25}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        actions={
          <Button
            variant="outline"
            onClick={() => router.push(TARIFF_VERSIONS_ROUTE)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Versions
          </Button>
        }
      />

      {/* Placeholder empty state */}

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            Trash is not implemented yet
          </h2>

          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Deleted tariff versions will appear here when trash management
            is implemented. You will be able to review and restore eligible
            records.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push(TARIFF_VERSIONS_ROUTE)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Tariff Versions
        </Button>
      </div>
    </div>
  );
}

export default function TrashPage() {
  return (
    <ProtectedRoute resource="tariff_version" action="delete">
      <Can resource="tariff_version" action="delete">
        <TrashPageContent />
      </Can>
    </ProtectedRoute>
  );
}
