
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
  ShieldCheck,
  ShieldAlert,
  Clock,
  Fingerprint,
} from "lucide-react";

import { formatEthiopianDate } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type VerificationStatus =
  | "VERIFIED"
  | "PENDING"
  | "UNVERIFIED";

type CitizenDetail = {
  id: string;
  full_name?: string | null;
  national_id?: string | null;
  citizen_uid?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  source?: string | null;
  registered_at?: string | null;

  is_national_id_verified?: boolean | null;
  national_id_verification_status?: string | null;

  administrative_unit?: {
    name?: string | null;
    level?: string | null;
    full_address?: string | null;
  } | null;
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

function TaxPayerDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const {
    data: citizen,
    isLoading,
    isError,
  } = useCitizen(id);

  /* ---------------------------------------------------------------------- */
  /* LOADING                                                                */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div
        className="flex min-h-[350px] flex-col items-center justify-center gap-3 p-6"
        aria-busy="true"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

        <p className="text-sm text-muted-foreground">
          Loading citizen information...
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* ERROR                                                                  */
  /* ---------------------------------------------------------------------- */

  if (isError || !citizen) {
    return (
      <div className="flex min-h-[350px] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <User className="size-6 text-destructive" />
            </div>

            <h2 className="font-semibold">
              Citizen not found
            </h2>

            <p className="text-sm text-muted-foreground">
              We could not retrieve this citizens information.
              The record may have been removed or you may not have permission to view it.
            </p>

            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 size-4" />
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive =
    citizen.status?.toUpperCase() === "ACTIVE";

  const nationalId = citizen.national_id?.trim() ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">

      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        {/* Citizen identity */}

        <div className="flex min-w-0 items-center gap-4">

          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border bg-muted">
            <User className="size-7 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">

              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {citizen.full_name || "Unnamed citizen"}
              </h1>

              <StatusBadge status={citizen.status} />

            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Citizen profile information
            </p>

            {citizen.citizen_uid && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Citizen No. {citizen.citizen_uid}
              </p>
            )}
          </div>

        </div>

        {/* Header actions */}

        <div className="flex flex-wrap items-center gap-2">

          <NationalIdVerificationAction
            citizen={citizen as CitizenDetail}
            onVerify={() =>
              router.push(
                `/office/dashboard/taxpayers/${id}/verify-national-id`
              )
            }
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>

          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/office/dashboard/taxpayers/${id}/edit`
              )
            }
          >
            <Edit className="mr-2 size-4" />
            Edit
          </Button>

        </div>

      </div>

      {/* ================================================================== */}
      {/* PERSONAL INFORMATION                                               */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-5 text-muted-foreground" />
            Personal Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2">

          <DetailItem
            icon={<User className="size-4" />}
            label="Full Name"
            value={citizen.full_name}
          />

          <DetailItem
            icon={<Hash className="size-4" />}
            label="National ID"
            value={nationalId || null}
          />

          <DetailItem
            icon={<CreditCard className="size-4" />}
            label="Citizen Number"
            value={citizen.citizen_uid}
          />

          <DetailItem
            icon={<VenusAndMars className="size-4" />}
            label="Gender"
            value={citizen.gender}
          />

          <DetailItem
            icon={<CalendarDays className="size-4" />}
            label="Date of Birth"
            value={
              citizen.date_of_birth
                ? formatEthiopianDate(citizen.date_of_birth)
                : null
            }
          />

          <DetailItem
            icon={<Phone className="size-4" />}
            label="Phone"
            value={citizen.phone}
          />

          <DetailItem
            icon={<Mail className="size-4" />}
            label="Email"
            value={citizen.email}
          />

          {/* National ID verification status */}

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" />
              National ID Verification
            </p>

            <NationalIdVerificationBadge
              citizen={citizen as CitizenDetail}
            />
          </div>

          {/* Citizen status */}

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {isActive ? (
                <BadgeCheck className="size-4" />
              ) : (
                <BadgeX className="size-4" />
              )}
              Account Status
            </p>

            <StatusBadge status={citizen.status} />
          </div>

        </CardContent>

      </Card>

      {/* ================================================================== */}
      {/* ADMINISTRATIVE LOCATION                                            */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-5 text-muted-foreground" />
            Administrative Location
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2">

          <DetailItem
            icon={<Building2 className="size-4" />}
            label="Administrative Unit"
            value={citizen.administrative_unit?.name}
          />

          <DetailItem
            icon={<MapPinned className="size-4" />}
            label="Administrative Level"
            value={citizen.administrative_unit?.level}
          />

          <DetailItem
            icon={<MapPin className="size-4" />}
            label="Full Address"
            value={citizen.administrative_unit?.full_address}
          />

        </CardContent>

      </Card>

      {/* ================================================================== */}
      {/* REGISTRATION INFORMATION                                           */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="size-5 text-muted-foreground" />
            Registration Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2">

          <DetailItem
            label="Registration Source"
            value={citizen.source}
          />

          <DetailItem
            label="Registered At"
            value={
              citizen.registered_at
                ? formatEthiopianDate(citizen.registered_at)
                : null
            }
          />

        </CardContent>

      </Card>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* NATIONAL ID VERIFICATION ACTION                                           */
/* -------------------------------------------------------------------------- */

function NationalIdVerificationAction({
  citizen,
  onVerify,
}: {
  citizen: CitizenDetail;
  onVerify: () => void;
}) {
  const nationalId = citizen.national_id?.trim();

  const status = getNationalIdVerificationStatus(citizen);

  if (!nationalId) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="gap-2"
      >
        <ShieldAlert className="size-4" />
        National ID Missing
      </Button>
    );
  }

  if (status === "VERIFIED") {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-4" />
        <span>National ID Verified</span>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Clock className="size-4" />
        <span>Verification Pending</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onVerify}
      className="gap-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5"
    >
      <ShieldCheck className="size-4" />
      Verify National ID
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* NATIONAL ID VERIFICATION BADGE                                            */
/* -------------------------------------------------------------------------- */

function NationalIdVerificationBadge({
  citizen,
}: {
  citizen: CitizenDetail;
}) {
  const nationalId = citizen.national_id?.trim();

  const status = getNationalIdVerificationStatus(citizen);

  if (!nationalId) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-muted bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
        <ShieldAlert className="size-3.5" />
        National ID not provided
      </span>
    );
  }

  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-3.5" />
        Verified
      </span>
    );
  }

  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Clock className="size-3.5" />
        Pending verification
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/5 px-2.5 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400">
      <ShieldAlert className="size-3.5" />
      Not verified
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* NATIONAL ID VERIFICATION STATUS                                            */
/* -------------------------------------------------------------------------- */

function getNationalIdVerificationStatus(
  citizen: CitizenDetail
): VerificationStatus {
  const apiStatus =
    citizen.national_id_verification_status?.toUpperCase();

  /*
   * An explicit backend boolean takes precedence.
   * Do not consider a non-empty National ID as verified.
   */

  if (citizen.is_national_id_verified === true) {
    return "VERIFIED";
  }

  if (citizen.is_national_id_verified === false) {
    return apiStatus === "PENDING" ? "PENDING" : "UNVERIFIED";
  }

  if (apiStatus === "VERIFIED") {
    return "VERIFIED";
  }

  if (apiStatus === "PENDING") {
    return "PENDING";
  }

  return "UNVERIFIED";
}

/* -------------------------------------------------------------------------- */
/* CITIZEN STATUS BADGE                                                       */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const normalizedStatus = status?.toUpperCase() ?? "UNKNOWN";

  if (normalizedStatus === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
        <BadgeCheck className="size-3.5" />
        Active
      </span>
    );
  }

  if (normalizedStatus === "INACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <BadgeX className="size-3.5" />
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

/* -------------------------------------------------------------------------- */
/* DETAIL ITEM                                                                */
/* -------------------------------------------------------------------------- */

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
    <div className="min-w-0 space-y-1.5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>

      <p className="break-words text-sm font-medium">
        {value || "-"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXPORT                                                                     */
/* -------------------------------------------------------------------------- */

export default TaxPayerDetailPage;
