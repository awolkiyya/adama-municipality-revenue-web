"use client";

import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLogout } from "@/hooks/auth/useLogout";
import type { RootState } from "@/lib/store/store";
import { cn } from "@/lib/utils";

// Change these to your real routes.
const VERIFY_PHONE_HREF = "/citizen/dashboard/profile/verify-phone";
const NOTIFICATIONS_HREF = "/citizen/dashboard/notifications";

// Keep in sync with your next-intl locales. Names are shown in their own language.
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
  { value: "or", label: "Afaan Oromoo" },
];

export function ProfilePanel() {
  const user = useSelector((state: RootState) => state.auth.user);
  const logout = useLogout();

  const handleLogout = () => {
    if (logout.isPending) return;
    logout.mutate();
  };

  /* Loading: the user is not available yet */
  if (!user) return <ProfileSkeleton />;

  /* The backend returned a user without a citizen profile */
  const citizen = user.citizen;
  if (!citizen) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium">Profile unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account has no citizen profile yet. Contact support if this
              is unexpected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fullName = citizen.full_name || user.name || "Citizen";
  const registered = user.createdAt ?? user.created_at;

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-16 shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={fullName} />}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Registered citizen
                </span>
                <StatusPill active={Boolean(user.is_active)} />
              </div>
            </div>
          </div>

          <div className="min-w-0 sm:text-right">
            <p className="text-xs text-muted-foreground">Citizen ID</p>
            <div className="mt-1 flex items-center gap-1.5 sm:justify-end">
              <span className="truncate font-mono text-sm font-medium">
                {citizen.citizen_uid || "Not available"}
              </span>
              {citizen.citizen_uid && (
                <CopyButton value={citizen.citizen_uid} label="citizen ID" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Only shown when action is needed */}
      {user.phone && !user.is_phone_verified && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium">Verify your phone number</p>
              <p className="text-sm text-muted-foreground">
                Verified numbers receive payment confirmations and due-date
                reminders.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href={VERIFY_PHONE_HREF}>Verify phone</Link>
          </Button>
        </div>
      )}

      <Section title="Personal information">
        <Row label="Full name" value={fullName} />
        <Row
          label="National ID"
          value={
            citizen.national_id ? (
              <SensitiveValue value={citizen.national_id} label="national ID" />
            ) : null
          }
        />
        <Row label="Gender" value={titleCase(citizen.gender)} />
        <Row
          label="Date of birth"
          value={citizen.date_of_birth ? formatDate(citizen.date_of_birth) : null}
        />
        <Row label="Address" value={citizen.address} />
      </Section>

      <Section title="Contact">
        <Row
          label="Phone"
          value={
            user.phone ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="tabular-nums">{user.phone}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    user.is_phone_verified
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-500"
                  )}
                >
                  {user.is_phone_verified ? "Verified" : "Not verified"}
                </span>
              </span>
            ) : null
          }
        />
        <Row label="Email" value={user.email} />
        <Row
          label="Administrative unit"
          value={user.administrative_unit?.name}
        />
      </Section>

      <Section title="Account">
        <Row
          label="Status"
          value={<StatusPill active={Boolean(user.is_active)} />}
        />
        <Row label="Registered" value={registered ? formatDate(registered) : null} />
        <Row
          label="Last sign-in"
          value={user.lastLoginAt ? formatDate(user.lastLoginAt) : null}
        />
      </Section>

      <Section title="Preferences">
        <Row label="Theme" value={<ThemeToggle />} />
        <Row label="Language" value={<LanguageToggle />} />
      </Section>

      {/* Actions */}
      <Card>
        <CardContent className="divide-y p-0">
          <Link
            href={NOTIFICATIONS_HREF}
            className="flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/40"
          >
            <Bell className="size-4 text-muted-foreground" />
            <span className="flex-1">Notification preferences</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------
   PARTS
--------------------------------------------------------------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <Card>
        <CardContent className="p-0">
          <dl className="divide-y px-5">{children}</dl>
        </CardContent>
      </Card>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  const empty = value === null || value === undefined || value === "";

  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "break-words text-sm sm:col-span-2",
          empty ? "text-muted-foreground" : "font-medium"
        )}
      >
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** Hides all but the last 4 characters until the user asks to see them. */
function SensitiveValue({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const masked = "•".repeat(Math.max(0, value.length - 4)) + value.slice(-4);

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono tabular-nums">{visible ? value : masked}</span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={`${visible ? "Hide" : "Show"} ${label}`}
        className="rounded p-1 text-muted-foreground hover:bg-muted"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <CopyButton value={value} label={label} />
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
    >
      {copied ? (
        <Check className="size-4 text-emerald-600" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}

/** Small pill-style single choice control (radio group semantics). */
function Segmented({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Light / Dark / System. Needs next-themes' ThemeProvider in your layout. */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The saved theme is only known in the browser. Wait to avoid a flash
  // of the wrong selection and a hydration mismatch.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <Segmented
      label="Theme"
      value={theme ?? "system"}
      onChange={setTheme}
      options={[
        { value: "light", label: "Light", icon: <Sun className="size-4" /> },
        { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
        { value: "system", label: "System", icon: <Monitor className="size-4" /> },
      ]}
    />
  );
}

/** Switches the locale segment of the URL and keeps the user on the same page. */
function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale) return;

    const segments = pathname.split("/"); // ["", "en", "citizen", ...]
    if (segments[1] === locale) segments[1] = next;
    else segments.splice(1, 0, next); // default locale had no prefix

    const query = window.location.search;
    startTransition(() => {
      router.replace(segments.join("/") + query);
    });
  };

  return (
    <Segmented
      label="Language"
      value={locale}
      onChange={change}
      options={LANGUAGES}
      disabled={pending}
    />
  );
}

function ProfileSkeleton() {
  const bar = "animate-pulse rounded bg-muted";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="size-16 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className={cn(bar, "h-5 w-40")} />
            <div className={cn(bar, "h-4 w-28")} />
          </div>
        </CardContent>
      </Card>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-4 p-5">
            <div className={cn(bar, "h-4 w-full")} />
            <div className={cn(bar, "h-4 w-4/5")} />
            <div className={cn(bar, "h-4 w-3/5")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase();
}

function titleCase(value?: string | null): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(value: string): string {
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}