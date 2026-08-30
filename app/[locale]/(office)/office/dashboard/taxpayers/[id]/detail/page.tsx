"use client";

import { useCitizen } from "@/hooks/useCitizen.hook";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  User,
  CreditCard,
  VenusAndMars,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Building2,
  BadgeCheck,
  BadgeX,
  MapPinned,
  Hash,
} from "lucide-react";
import { formatEthiopianDate } from "@/lib/utils";

function TaxPayerDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const {
    data: citizen,
    isLoading,
    isError,
  } = useCitizen(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">
          Loading citizen information...
        </div>
      </div>
    );
  }

  if (isError || !citizen) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6">
        <div className="text-sm text-red-500">
          Citizen not found.
        </div>
      </div>
    );
  }

  const isActive =
    citizen.status?.toUpperCase() === "ACTIVE";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-semibold">
                {citizen.full_name}
              </h1>

              {/* Status */}
              <StatusBadge status={citizen.status} />

            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Citizen profile information
            </p>

          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={() =>
              router.push(
                `/office/dashboard/taxpayers/${id}/edit`
              )
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

        </div>

      </div>

      {/* ======================================================
          PERSONAL INFORMATION
      ====================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">

          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Full Name"
            value={citizen.full_name}
          />

          <DetailItem
            icon={<Hash className="h-4 w-4" />}
            label="National ID"
            value={citizen.national_id}
          />

          <DetailItem
            icon={<CreditCard className="h-4 w-4" />}
            label="Citizen Number"
            value={citizen.citizen_uid}
          />

          <DetailItem
            icon={<VenusAndMars className="h-4 w-4" />}
            label="Gender"
            value={citizen.gender}
          />

          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date of Birth"
            value={
              citizen.date_of_birth
                ? formatEthiopianDate(citizen.date_of_birth
                  )
                : "-"
            }
          />

          <DetailItem
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={citizen.phone}
          />

          <DetailItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={citizen.email ?? "-"}
          />

          {/* Status */}
          <div className="space-y-2">

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {isActive ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <BadgeX className="h-4 w-4" />
              )}
              Status
            </p>

            <StatusBadge status={citizen.status} />

          </div>

        </CardContent>

      </Card>

      {/* ======================================================
          ADMINISTRATIVE LOCATION
      ====================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Administrative Location
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">

          <DetailItem
            icon={<Building2 className="h-4 w-4" />}
            label="Administrative Unit"
            value={
              citizen.administrative_unit?.name
            }
          />

          <DetailItem
            icon={<MapPinned className="h-4 w-4" />}
            label="Level"
            value={
              citizen.administrative_unit?.level
            }
          />

          <DetailItem
            icon={<MapPin className="h-4 w-4" />}
            label="Full Address"
            value={
              citizen.administrative_unit?.full_address
            }
          />

        </CardContent>

      </Card>

      {/* ======================================================
          REGISTRATION INFORMATION
      ====================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            Registration Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">

          <DetailItem
            label="Source"
            value={citizen.source}
          />

          <DetailItem
            label="Registered At"
            value={
              citizen.registered_at
                ? formatEthiopianDate(
                  citizen.registered_at                  )
                : "-"
            }
          />

        </CardContent>

      </Card>

    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const normalizedStatus =
    status?.toUpperCase() ?? "UNKNOWN";

  const isActive =
    normalizedStatus === "ACTIVE";

  const isInactive =
    normalizedStatus === "INACTIVE";

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
        <BadgeCheck className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }

  if (isInactive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <BadgeX className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {normalizedStatus}
    </span>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1.5">

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>

      <p className="font-medium">
        {value || "-"}
      </p>

    </div>
  );
}

export default TaxPayerDetailPage;
