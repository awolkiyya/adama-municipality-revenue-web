"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Shield,
  MapPin,
  Key,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { usePrivateImage } from "@/hooks/usePrivateImage";
import { BaseModal } from "./BaseModal";
import { AuthUser } from "@/types/user";
import { formatEthiopianDateWithTime } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import { getInitials } from "@/utils/getInitials";
import { useUser } from "@/hooks/user/useUser.hook";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AuthUser | null;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>

      <div className="max-w-[60%] break-words text-right text-sm font-medium">
        {value ?? "-"}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
        <h3>{title}</h3>
      </div>

      <div>{children}</div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return formatEthiopianDateWithTime(value);
}

export function UserDetailModal({
  open,
  onOpenChange,
  user,
}: Props) {
  // Fetch the full, current user details only while the modal is open.
  const userQuery = useUser(open ? user?.id : undefined);

  // Use the fetched record when available; otherwise show the selected list record.
  const selectedUser = userQuery.data;

  const avatarImage = usePrivateImage(
    selectedUser?.avatar ?? null,
  );

  const roleHref = selectedUser?.role?.id
    ? `/or/office/dashboard/access-managements/${selectedUser.role.id}`
    : null;

  const isLoading =
    open && !!user?.id && userQuery.isLoading;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="User Details"
    >
      <div className="max-h-[80vh] space-y-5 overflow-y-auto pr-2">
        {!user ? (
          <div className="py-12 text-center">
            <Shield className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />

            <p className="text-sm font-medium">
              No user selected
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Select a user to view their details.
            </p>
          </div>
        ) : isLoading && !selectedUser ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />

            <p className="text-sm text-muted-foreground">
              Loading user details...
            </p>
          </div>
        ) : userQuery.isError && !selectedUser ? (
          <div className="py-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-6 w-6 text-destructive" />

            <p className="text-sm font-medium">
              Unable to load user details
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={() => userQuery.refetch()}
              className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Try again
            </button>
          </div>
        ) : selectedUser ? (
          <>
            {/* USER SUMMARY */}
            <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
              <Avatar className="h-14 w-14 shrink-0 rounded-xl">
                <AvatarImage
                  src={avatarImage.url || undefined}
                  alt={selectedUser.name}
                />

                <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(selectedUser.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold">
                  {selectedUser.name}
                </h2>

                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {selectedUser.email || "No email address"}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      selectedUser.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedUser.is_active
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    />

                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </span>

                  {selectedUser.label && (
                    <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      {selectedUser.label}
                    </span>
                  )}
                </div>
              </div>

              {userQuery.isFetching && (
                <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* INFORMATION GRID */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* CONTACT */}
              <Section
                title="Contact Information"
                icon={<Mail className="h-4 w-4" />}
              >
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={selectedUser.email}
                />

                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={selectedUser.phone}
                />
              </Section>

              {/* ACCESS CONTROL */}
              <Section
                title="Access Control"
                icon={<Shield className="h-4 w-4" />}
              >
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Assigned role
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold">
                      {selectedUser.role?.name ?? "No role assigned"}
                    </p>

                    {selectedUser.role?.name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selectedUser.role.name}
                      </p>
                    )}
                  </div>

                  {roleHref ? (
                    <Link
                      href={roleHref}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`View role ${selectedUser.role?.name ?? ""}`}
                    >
                      View role
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No role
                    </span>
                  )}
                </div>
              </Section>

              {/* ORGANIZATIONAL STRUCTURE */}
              <Section
                title="Administrative Structure"
                icon={<MapPin className="h-4 w-4" />}
              >
                <InfoRow
                  label="Administrative level"
                  value={selectedUser.administrative_unit?.level}
                />

                <InfoRow
                  label="Administrative unit"
                  value={selectedUser.administrative_unit?.name}
                />

                <InfoRow
                  label="Sector"
                  value={selectedUser.sector?.name}
                />
              </Section>

              {/* ACCOUNT DETAILS */}
              <Section
                title="Account Details"
                icon={<Key className="h-4 w-4" />}
              >
                <InfoRow
                  label="Email verified"
                  value={
                    selectedUser.email_verified_at
                      ? "Verified"
                      : "Not verified"
                  }
                />

                <InfoRow
                  label="Phone verified"
                  value={
                    selectedUser.is_phone_verified
                      ? "Verified"
                      : "Not verified"
                  }
                />

                <InfoRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Last login"
                  value={formatDate(selectedUser.lastLoginAt)}
                />

                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Created"
                  value={formatDate(selectedUser.created_at)}
                />

                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Last updated"
                  value={formatDate(selectedUser.updated_at)}
                />
              </Section>
            </div>
          </>
        ) : null}
      </div>
    </BaseModal>
  );
}