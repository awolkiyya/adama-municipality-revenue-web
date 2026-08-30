"use client";

import React from "react";
import { BaseModal } from "./BaseModal";
import { AuthUser } from "@/types/user";
import {
  Mail,
  Phone,
  Shield,
  MapPin,
  Key,
} from "lucide-react";
import { Label } from "../forms/UserForm";
import { formatEthiopianDateWithTime } from "@/lib/utils";

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
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>

      <div className="text-sm font-medium text-right max-w-[60%] break-words">
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
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function UserDetailModal({ open, onOpenChange, user }: Props) {
  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="User Details">
      
      {/* =========================
          SCROLL WRAPPER (IMPORTANT)
      ========================= */}
      <div className="max-h-[80vh] overflow-y-auto  pr-2 space-y-6">

        {!user ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            No user data available
          </div>
        ) : (
          <>
            {/* =========================
                HEADER SUMMARY (STICKY FEEL)
            ========================= */}
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 ">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold truncate">
                  {user.name}
                </h2>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  user.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            {/* =========================
                RESPONSIVE GRID
                (1 col mobile, 2 col desktop)
            ========================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* CONTACT */}
              <Section title="Contact Information" icon={<Mail className="w-4 h-4" />}>
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Phone" value={user.phone} icon={<Phone className="w-4 h-4" />} />
              </Section>

              {/* ACCESS */}
              <Section title="Access Control" icon={<Shield className="w-4 h-4" />}>
                <InfoRow label="Role" value={user.role?.label} />
              </Section>

              {/* STRUCTURE */}
              <Section title="Administrative Structure" icon={<MapPin className="w-4 h-4" />}>
                <InfoRow label="Level" value={user.administrative_unit?.level} />
                <InfoRow label="Sector" value={user.sector?.name} />
                <InfoRow label="Adminstrative Unit" value={user.administrative_unit?.name} />
              </Section>

              {/* SYSTEM */}
              <Section title="System Info" icon={<Key className="w-4 h-4" />}>
                <InfoRow
                  label="Email Verified"
                  value={user.emailVerifiedAt ? "Yes" : "No"}
                />
                <div>
                  <Label children={<span className="text-sm">
                    Last Login :
                    {user.lastLoginAt? formatEthiopianDateWithTime(user.lastLoginAt) : "-"}
                  </span>}/>
                </div>
                {/* <InfoRow label="Last Login" value={user.lastLoginAt} /> */}
                <InfoRow label="Created" value={user.createdAt} />
                <InfoRow label="Updated" value={user.updatedAt} />
              </Section>
            </div>

            {/* =========================
                PERMISSIONS (FULL WIDTH)
            ========================= */}
            <Section title="Permissions">
              {user.permissions?.length ? (
                <div className="space-y-2">
                  {user.permissions.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-xs border-b pb-1"
                    >
                      <span className="font-medium">{p.resource}</span>
                      <span className="text-muted-foreground">
                        {p.actions.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No permissions assigned
                </p>
              )}
            </Section>

          </>
        )}
      </div>
    </BaseModal>
  );
}