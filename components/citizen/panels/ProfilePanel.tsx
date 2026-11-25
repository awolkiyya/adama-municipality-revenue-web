
"use client";

import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import {
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useSelector } from "react-redux";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useLogout } from "@/hooks/auth/useLogout";
import type { RootState } from "@/lib/store/store";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */

const PORTAL_ROUTES = {
  citizen: {
    notifications: "/citizen/dashboard/notifications",
    verifyPhone: "/citizen/dashboard/profile/verify-phone",
  },
  employee: {
    notifications: "/office/dashboard/notifications",
    verifyPhone: "/office/dashboard/profile/verify-phone",
  },
} as const;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
  { value: "or", label: "Afaan Oromoo" },
];

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type AccountType = "citizen" | "employee";

type ProfileRecord = Record<string, unknown>;

type AdministrativeUnit = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  level?: string | null;
  context?: {
    city?: { name?: string | null } | null;
    subcity?: { name?: string | null } | null;
    wereda?: { name?: string | null } | null;
  } | null;
};

type ProfileUser = {
  id?: string | number;
  name?: string | null;
  label?: string | null;
  user_type?: string | null;

  email?: string | null;
  phone?: string | null;
  avatar?: string | null;

  is_active?: boolean | null;
  is_phone_verified?: boolean | null;

  created_at?: string | null;
  createdAt?: string | null;

  last_login_at?: string | null;
  lastLoginAt?: string | null;

  administrative_unit?: AdministrativeUnit | null;

  role?: {
    id?: number | string;
    name?: string | null;
    label?: string | null;
  } | null;

  citizen?: ProfileRecord | null;
  employee?: ProfileRecord | null;
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export function ProfilePanel() {
  const reduxUser = useSelector(
    (state: RootState) => state.auth.user
  );

  const logout = useLogout();

  if (!reduxUser) {
    return <ProfileSkeleton />;
  }

  const user = reduxUser as unknown as ProfileUser;
  const accountType = getAccountType(user.user_type);

  if (!accountType) {
    return (
      <ProfileUnavailable
        message="Your account type could not be identified. Please contact support."
      />
    );
  }

  const profile =
    accountType === "citizen"
      ? user.citizen
      : user.employee;

  /*
   * Prefer an actual profile name when available.
   * For employees without an employee profile, use the API label.
   * The API's label is the role/designation label, not necessarily
   * the employee's personal name.
   */
  const fullName =
    getString(profile, "full_name") ||
    getString(profile, "name") ||
    user.label ||
    user.name ||
    (accountType === "citizen" ? "Citizen" : "Employee");

  const registered = user.createdAt ?? user.created_at;
  const routes = PORTAL_ROUTES[accountType];

  const handleLogout = () => {
    if (logout.isPending) return;
    logout.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Identity */}
      <IdentityCard
        user={user}
        profile={profile}
        accountType={accountType}
        fullName={fullName}
      />

      {/* Profile-specific information */}
      {accountType === "citizen" ? (
        <CitizenInformation
          citizen={profile}
          fullName={fullName}
        />
      ) : (
        <EmployeeInformation
          user={user}
          employee={profile}
          fullName={fullName}
        />
      )}

      {/* Phone verification */}
      {user.phone && !user.is_phone_verified && (
        <PhoneVerificationNotice href={routes.verifyPhone} />
      )}

      {/* Shared contact information */}
      <ContactInformation user={user} />

      {/* Account information */}
      <AccountInformation
        user={user}
        registered={registered}
      />

      {/* Preferences */}
      <Section title="Preferences" icon={<Monitor className="size-4" />}>
        <Row label="Theme" value={<ThemeToggle />} />
        <Row label="Language" value={<LanguageToggle />} />
      </Section>

      {/* Account actions */}
      <Card>
        <CardContent className="divide-y p-0">
          <Link
            href={routes.notifications}
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
            className={cn(
              "flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium",
              "text-destructive transition-colors hover:bg-destructive/5",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            <LogOut className="size-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* IDENTITY CARD                                                              */
/* -------------------------------------------------------------------------- */

function IdentityCard({
  user,
  profile,
  accountType,
  fullName,
}: {
  user: ProfileUser;
  profile: ProfileRecord | null | undefined;
  accountType: AccountType;
  fullName: string;
}) {
  const identifier =
    accountType === "citizen"
      ? getString(profile, "citizen_uid")
      : getFirstString(profile, [
          "employee_uid",
          "employee_id",
          "staff_id",
          "employee_code",
        ]);

  const identifierLabel =
    accountType === "citizen" ? "Citizen ID" : "Employee ID";

  const nationalId = getString(profile, "national_id");

  // Replace this field with your actual API verification property.
  const isNationalIdVerified =
    profile?.is_national_id_verified === true;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16 shrink-0">
            {user.avatar && (
              <AvatarImage src={user.avatar} alt={fullName} />
            )}

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
                {accountType === "citizen"
                  ? "Registered citizen"
                  : user.role?.label || "Registered employee"}
              </span>

              <StatusPill active={Boolean(user.is_active)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {identifier && (
            <div className="min-w-0 sm:text-right">
              <p className="text-xs text-muted-foreground">
                {identifierLabel}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="truncate font-mono text-sm font-medium">
                  {identifier}
                </span>

                <CopyButton
                  value={identifier}
                  label={identifierLabel.toLowerCase()}
                />
              </div>
            </div>
          )}

          {accountType === "citizen" && nationalId && (
            isNationalIdVerified ? (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                National ID verified
              </div>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Link href="/citizen/dashboard/profile/verify-national-id">
                  <ShieldCheck className="size-4" />
                  Verify National ID
                </Link>
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* CITIZEN INFORMATION                                                        */
/* -------------------------------------------------------------------------- */

function CitizenInformation({
  citizen,
  fullName,
}: {
  citizen: ProfileRecord | null | undefined;
  fullName: string;
}) {
  if (!citizen) {
    return (
      <ProfileUnavailable
        message="Your account does not have an associated citizen profile yet. Contact support if this is unexpected."
      />
    );
  }

  const nationalId = getString(citizen, "national_id");
  const gender = getString(citizen, "gender");
  const dateOfBirth = getString(citizen, "date_of_birth");
  const address = getString(citizen, "address");

  return (
    <Section
      title="Personal information"
      icon={<UserRound className="size-4" />}
    >
      <Row label="Full name" value={fullName} />

      <Row
        label="National ID"
        value={
          nationalId ? (
            <SensitiveValue value={nationalId} label="national ID" />
          ) : null
        }
      />

      <Row label="Gender" value={titleCase(gender)} />

      <Row
        label="Date of birth"
        value={dateOfBirth ? formatDate(dateOfBirth) : null}
      />

      <Row label="Address" value={address} />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPLOYEE INFORMATION                                                       */
/* -------------------------------------------------------------------------- */

function EmployeeInformation({
  user,
  employee,
  fullName,
}: {
  user: ProfileUser;
  employee: ProfileRecord | null | undefined;
  fullName: string;
}) {
  /*
   * The current employee API response does not include an employee object.
   * Therefore, use the fields actually available from the user response:
   * role, label, username and administrative unit.
   *
   * If the backend later returns an employee object, the optional fields
   * below will automatically be displayed.
   */

  const employeeId = getFirstString(employee, [
    "employee_uid",
    "employee_id",
    "staff_id",
    "employee_code",
  ]);

  const jobTitle =
    getFirstString(employee, [
      "job_title",
      "position",
      "designation",
      "title",
    ]) ||
    user.role?.label ||
    user.label;

  const department = getFirstString(employee, [
    "department_name",
    "department",
  ]);

  const employmentType = getFirstString(employee, [
    "employment_type",
    "employee_type",
  ]);

  const hireDate = getFirstString(employee, [
    "hire_date",
    "employment_date",
    "date_joined",
  ]);

  const gender = getString(employee, "gender");
  const dateOfBirth = getString(employee, "date_of_birth");
  const address = getString(employee, "address");

  return (
    <>
      <Section
        title="Employment information"
        icon={<BriefcaseBusiness className="size-4" />}
      >
        <Row label="Display name" value={fullName} />

        <Row label="Username" value={user.name} />

        <Row label="Employee ID" value={employeeId} />

        <Row label="Role" value={user.role?.label || user.role?.name} />

        <Row label="Job title" value={jobTitle} />

        <Row label="Department" value={department} />

        <Row
          label="Employment type"
          value={titleCase(employmentType)}
        />

        <Row
          label="Hire date"
          value={hireDate ? formatDate(hireDate) : null}
        />
      </Section>

      <AdministrativeUnitInformation
        unit={user.administrative_unit}
      />

      {(gender || dateOfBirth || address) && (
        <Section
          title="Personal information"
          icon={<UserRound className="size-4" />}
        >
          <Row label="Gender" value={titleCase(gender)} />

          <Row
            label="Date of birth"
            value={dateOfBirth ? formatDate(dateOfBirth) : null}
          />

          <Row label="Address" value={address} />
        </Section>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* ADMINISTRATIVE UNIT                                                        */
/* -------------------------------------------------------------------------- */

function AdministrativeUnitInformation({
  unit,
}: {
  unit?: AdministrativeUnit | null;
}) {
  if (!unit) return null;

  const context = unit.context;

  const locationParts = [
    context?.city?.name,
    context?.subcity?.name,
    context?.wereda?.name,
  ].filter((value): value is string => Boolean(value));

  return (
    <Section
      title="Administrative assignment"
      icon={<MapPin className="size-4" />}
    >
      <Row label="Administrative unit" value={unit.name} />
      <Row label="Unit code" value={unit.code} />
      <Row label="Administrative level" value={titleCase(unit.level)} />

      <Row
        label="Location"
        value={locationParts.length ? locationParts.join(" / ") : null}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* PHONE VERIFICATION                                                         */
/* -------------------------------------------------------------------------- */

function PhoneVerificationNotice({ href }: { href: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-amber-500/30",
        "bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div>
          <p className="text-sm font-medium">
            Verify your phone number
          </p>

          <p className="text-sm text-muted-foreground">
            Verify your phone number to receive important account notifications.
          </p>
        </div>
      </div>

      <Button asChild size="sm" className="shrink-0">
        <Link href={href}>Verify phone</Link>
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CONTACT INFORMATION                                                        */
/* -------------------------------------------------------------------------- */

function ContactInformation({ user }: { user: ProfileUser }) {
  return (
    <Section title="Contact" icon={<Bell className="size-4" />}>
      <Row
        label="Phone"
        value={
          user.phone ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{user.phone}</span>
              <PhoneVerificationStatus
                verified={Boolean(user.is_phone_verified)}
              />
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
  );
}

function PhoneVerificationStatus({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        verified
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-500"
      )}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ACCOUNT INFORMATION                                                        */
/* -------------------------------------------------------------------------- */

function AccountInformation({
  user,
  registered,
}: {
  user: ProfileUser;
  registered?: string | null;
}) {
  const lastLogin = user.lastLoginAt ?? user.last_login_at;

  return (
    <Section title="Account" icon={<UserRound className="size-4" />}>
      <Row
        label="Account type"
        value={titleCase(user.user_type)}
      />

      <Row
        label="Status"
        value={<StatusPill active={Boolean(user.is_active)} />}
      />

      <Row
        label="Registered"
        value={registered ? formatDate(registered) : null}
      />

      <Row
        label="Last sign-in"
        value={lastLogin ? formatDate(lastLogin) : null}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION AND ROW                                                            */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}

        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
      </div>

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
  const empty =
    value === null ||
    value === undefined ||
    value === "";

  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd
        className={cn(
          "min-w-0 break-words text-sm sm:col-span-2",
          empty ? "text-muted-foreground" : "font-medium"
        )}
      >
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* SENSITIVE INFORMATION                                                      */
/* -------------------------------------------------------------------------- */

function SensitiveValue({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  const masked =
    "•".repeat(Math.max(0, value.length - 4)) + value.slice(-4);

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono tabular-nums">
        {visible ? value : masked}
      </span>

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={`${visible ? "Hide" : "Show"} ${label}`}
        className="rounded p-1 text-muted-foreground hover:bg-muted"
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>

      <CopyButton value={value} label={label} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* COPY BUTTON                                                                */
/* -------------------------------------------------------------------------- */

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access may be unavailable.
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

/* -------------------------------------------------------------------------- */
/* SEGMENTED CONTROL                                                          */
/* -------------------------------------------------------------------------- */

function Segmented({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
    icon?: ReactNode;
  }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* THEME TOGGLE                                                               */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Segmented
      label="Theme"
      value={theme ?? "system"}
      onChange={setTheme}
      options={[
        {
          value: "light",
          label: "Light",
          icon: <Sun className="size-4" />,
        },
        {
          value: "dark",
          label: "Dark",
          icon: <Moon className="size-4" />,
        },
        {
          value: "system",
          label: "System",
          icon: <Monitor className="size-4" />,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* LANGUAGE TOGGLE                                                            */
/* -------------------------------------------------------------------------- */

function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [pending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale || pending) return;

    const segments = pathname.split("/");

    if (segments[1] === locale) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }

    const query =
      typeof window !== "undefined" ? window.location.search : "";

    const hash =
      typeof window !== "undefined" ? window.location.hash : "";

    startTransition(() => {
      router.replace(`${segments.join("/")}${query}${hash}`);
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

/* -------------------------------------------------------------------------- */
/* PROFILE UNAVAILABLE                                                        */
/* -------------------------------------------------------------------------- */

function ProfileUnavailable({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-6">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

        <div>
          <p className="text-sm font-medium">Profile unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING SKELETON                                                           */
/* -------------------------------------------------------------------------- */

function ProfileSkeleton() {
  const bar = "animate-pulse rounded bg-muted";

  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="size-16 animate-pulse rounded-full bg-muted" />

          <div className="space-y-2">
            <div className={cn(bar, "h-5 w-40")} />
            <div className={cn(bar, "h-4 w-28")} />
          </div>
        </CardContent>
      </Card>

      {[0, 1, 2].map((index) => (
        <Card key={index}>
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

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getAccountType(
  value?: string | null
): AccountType | null {
  const normalized = value?.toLowerCase().trim();

  if (normalized === "citizen") return "citizen";

  if (
    normalized === "employee" ||
    normalized === "staff"
  ) {
    return "employee";
  }

  return null;
}

function getString(
  record: ProfileRecord | null | undefined,
  key: string
): string | null {
  if (!record) return null;

  const value = record[key];

  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function getFirstString(
  record: ProfileRecord | null | undefined,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = getString(record, key);
    if (value) return value;
  }

  return null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  return (
    parts[0][0] +
    (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function titleCase(value?: string | null): string | null {
  if (!value) return null;

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
