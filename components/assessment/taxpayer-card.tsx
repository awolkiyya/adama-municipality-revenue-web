import { useState } from "react";
import {
  Cake,
  ChevronDown,
  Fingerprint,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
  VenetianMask,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Assessment } from "@/types/revenue/assessment";

function getInitials(name?: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  const initials = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];

  return initials.toUpperCase();
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-medium">{value ?? "-"}</p>
      </div>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function TaxpayerCard({ assessment }: { assessment: Assessment }) {
  const taxpayer = assessment.taxpayer;

  // Open by default — this is core review info — but collapsible once checked.
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardHeader
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="cursor-pointer select-none pb-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(taxpayer?.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight">
              {taxpayer?.fullName ?? "Unknown Taxpayer"}
            </p>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Taxpayer Information
              </span>

              {/* Quick-glance contact info, visible even when collapsed */}
              {taxpayer?.phone && !open && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {taxpayer.phone}
                </span>
              )}

              {taxpayer?.email && !open && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {taxpayer.email}
                </span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-6 border-t pt-5">
          <FieldGroup title="Identification">
            <Field icon={IdCard} label="Citizen UID" value={taxpayer?.citizenUid} />
            <Field icon={Fingerprint} label="National ID" value={taxpayer?.nationalId} />
          </FieldGroup>

          <FieldGroup title="Contact">
            <Field icon={Phone} label="Phone" value={taxpayer?.phone} />
            <Field icon={Mail} label="Email" value={taxpayer?.email} />
          </FieldGroup>

          <FieldGroup title="Personal">
            <Field icon={VenetianMask} label="Gender" value={taxpayer?.gender} />
            <Field icon={Cake} label="Date of Birth" value={taxpayer?.dateOfBirth} />
            <div className="sm:col-span-2">
              <Field icon={MapPin} label="Address" value={taxpayer?.address} />
            </div>
          </FieldGroup>
        </CardContent>
      )}
    </Card>
  );
}