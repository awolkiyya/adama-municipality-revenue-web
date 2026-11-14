
"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Clock,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Monitor,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type SecuritySettingsResource = {
  mfa_enabled: boolean;
  mfa_required_for_admins: boolean;
  mfa_required_for_finance: boolean;
  mfa_required_for_approvers: boolean;
  mfa_required_for_employees: boolean;
  mfa_trusted_devices_enabled: boolean;
  mfa_reauthentication_required: boolean;

  password_min_length: number;
  password_history_count: number;
  password_block_common: boolean;
  password_block_compromised: boolean;
  password_expiration_enabled: boolean;
  password_expiration_days: number;
  password_require_change_after_compromise: boolean;

  session_idle_timeout_minutes: number;
  session_absolute_timeout_hours: number;
  session_max_concurrent: number;
  session_revoke_after_password_change: boolean;

  login_max_attempts: number;
  login_lockout_minutes: number;
  login_progressive_lockout: boolean;
  login_max_lockout_minutes: number;
  login_suspicious_alerts: boolean;
};

type SecuritySession = {
  id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  device_name: string;
  browser: string;
  operating_system: string;
  ip_address: string;
  location: string;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
};

type SecurityAuditLog = {
  id: string;
  event: string;
  description: string;
  actor_name: string;
  actor_role: string;
  ip_address: string;
  device: string;
  created_at: string;
  status: "SUCCESS" | "FAILED" | "WARNING";
};

type SecurityTab =
  | "authentication"
  | "password"
  | "sessions"
  | "protection"
  | "activity";

/*
|--------------------------------------------------------------------------
| Default System Policy
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS: SecuritySettingsResource = {
  mfa_enabled: true,
  mfa_required_for_admins: true,
  mfa_required_for_finance: true,
  mfa_required_for_approvers: true,
  mfa_required_for_employees: false,
  mfa_trusted_devices_enabled: false,
  mfa_reauthentication_required: true,

  password_min_length: 12,
  password_history_count: 5,
  password_block_common: true,
  password_block_compromised: true,
  password_expiration_enabled: false,
  password_expiration_days: 90,
  password_require_change_after_compromise: true,

  session_idle_timeout_minutes: 15,
  session_absolute_timeout_hours: 8,
  session_max_concurrent: 2,
  session_revoke_after_password_change: true,

  login_max_attempts: 5,
  login_lockout_minutes: 10,
  login_progressive_lockout: true,
  login_max_lockout_minutes: 120,
  login_suspicious_alerts: true,
};

/*
|--------------------------------------------------------------------------
| Mock Active Sessions
|--------------------------------------------------------------------------
*/

const MOCK_SESSIONS: SecuritySession[] = [
  {
    id: "session-001",
    user_name: "System Administrator",
    user_email: "admin@adama.gov.et",
    user_role: "SYSTEM_ADMIN",
    device_name: "MacBook Pro",
    browser: "Chrome 157",
    operating_system: "macOS",
    ip_address: "196.190.216.41",
    location: "Adama, Ethiopia",
    last_activity_at: "2026-11-14T08:30:00",
    created_at: "2026-11-14T06:00:00",
    is_current: true,
  },
  {
    id: "session-002",
    user_name: "Finance Administrator",
    user_email: "finance@adama.gov.et",
    user_role: "FINANCE_ADMIN",
    device_name: "Windows Desktop",
    browser: "Microsoft Edge",
    operating_system: "Windows 11",
    ip_address: "196.190.216.52",
    location: "Adama, Ethiopia",
    last_activity_at: "2026-11-14T07:20:00",
    created_at: "2026-11-14T05:10:00",
    is_current: false,
  },
  {
    id: "session-003",
    user_name: "Revenue Supervisor",
    user_email: "supervisor@adama.gov.et",
    user_role: "REVENUE_SUPERVISOR",
    device_name: "Android Mobile",
    browser: "Chrome Mobile",
    operating_system: "Android",
    ip_address: "196.190.216.60",
    location: "Adama, Ethiopia",
    last_activity_at: "2026-11-13T18:45:00",
    created_at: "2026-11-13T09:00:00",
    is_current: false,
  },
  {
    id: "session-004",
    user_name: "Assessment Approver",
    user_email: "approver@adama.gov.et",
    user_role: "ASSESSMENT_APPROVER",
    device_name: "Office Desktop",
    browser: "Chrome",
    operating_system: "Windows 11",
    ip_address: "196.190.216.75",
    location: "Adama, Ethiopia",
    last_activity_at: "2026-11-13T16:10:00",
    created_at: "2026-11-13T08:30:00",
    is_current: false,
  },
];

/*
|--------------------------------------------------------------------------
| Mock Security Audit Trail
|--------------------------------------------------------------------------
*/

const MOCK_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: "audit-001",
    event: "Successful login",
    description: "Administrator authenticated successfully.",
    actor_name: "System Administrator",
    actor_role: "SYSTEM_ADMIN",
    ip_address: "196.190.216.41",
    device: "Chrome / macOS",
    created_at: "2026-11-14T06:00:00",
    status: "SUCCESS",
  },
  {
    id: "audit-002",
    event: "Security policy updated",
    description: "Authentication and password policies were modified.",
    actor_name: "System Administrator",
    actor_role: "SYSTEM_ADMIN",
    ip_address: "196.190.216.41",
    device: "Chrome / macOS",
    created_at: "2026-11-13T14:30:00",
    status: "SUCCESS",
  },
  {
    id: "audit-003",
    event: "Failed login attempt",
    description: "Authentication failed because of an incorrect password.",
    actor_name: "Unknown user",
    actor_role: "UNKNOWN",
    ip_address: "196.190.216.90",
    device: "Unknown device",
    created_at: "2026-11-13T10:15:00",
    status: "FAILED",
  },
  {
    id: "audit-004",
    event: "Session revoked",
    description: "An inactive user session was terminated.",
    actor_name: "System Administrator",
    actor_role: "SYSTEM_ADMIN",
    ip_address: "196.190.216.41",
    device: "Chrome / macOS",
    created_at: "2026-11-12T16:20:00",
    status: "SUCCESS",
  },
  {
    id: "audit-005",
    event: "Suspicious login activity",
    description: "Multiple unsuccessful authentication attempts detected.",
    actor_name: "Security Monitor",
    actor_role: "SYSTEM",
    ip_address: "196.190.216.90",
    device: "Unknown device",
    created_at: "2026-11-12T09:10:00",
    status: "WARNING",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function cloneSettings(
  settings: SecuritySettingsResource,
): SecuritySettingsResource {
  return { ...settings };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getAuditVariant(status: string) {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "default" as const;
    case "FAILED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function getRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}

/*
|--------------------------------------------------------------------------
| Reusable UI Components
|--------------------------------------------------------------------------
*/

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-base font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberSetting({
  label,
  description,
  value,
  min = 1,
  max = 1000,
  suffix,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_180px] sm:items-center">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="relative">
        <Input
          type="number"
          min={min}
          max={max}
          disabled={disabled}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? 0 : Number(next));
          }}
          className={suffix ? "pr-16" : ""}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ElementType;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-lg font-semibold tracking-tight">
          {value}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettingsResource>(
    () => cloneSettings(DEFAULT_SETTINGS),
  );

  const [savedSettings, setSavedSettings] =
    useState<SecuritySettingsResource>(
      () => cloneSettings(DEFAULT_SETTINGS),
    );

  const [sessions, setSessions] =
    useState<SecuritySession[]>(() =>
      MOCK_SESSIONS.map((session) => ({ ...session })),
    );

  const [auditLogs, setAuditLogs] =
    useState<SecurityAuditLog[]>(() =>
      MOCK_AUDIT_LOGS.map((log) => ({ ...log })),
    );

  const [activeTab, setActiveTab] =
    useState<SecurityTab>("authentication");

  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokingSessionId, setRevokingSessionId] =
    useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatus, setAuditStatus] = useState("ALL");

  /*
  |--------------------------------------------------------------------------
  | Derived State
  |--------------------------------------------------------------------------
  */

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const currentSession = sessions.find(
    (session) => session.is_current,
  );

  const otherSessions = sessions.filter(
    (session) => !session.is_current,
  );

  const failedEvents = auditLogs.filter(
    (log) => log.status === "FAILED",
  ).length;

  const warningEvents = auditLogs.filter(
    (log) => log.status === "WARNING",
  ).length;

  const filteredAuditLogs = useMemo(() => {
    const search = auditSearch.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const matchesStatus =
        auditStatus === "ALL" || log.status === auditStatus;

      const matchesSearch =
        !search ||
        [
          log.event,
          log.description,
          log.actor_name,
          log.actor_role,
          log.ip_address,
          log.device,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [auditLogs, auditSearch, auditStatus]);

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (
      !Number.isInteger(settings.password_min_length) ||
      settings.password_min_length < 8 ||
      settings.password_min_length > 128
    ) {
      errors.push(
        "Minimum password length must be between 8 and 128 characters.",
      );
    }

    if (
      !Number.isInteger(settings.password_history_count) ||
      settings.password_history_count < 0 ||
      settings.password_history_count > 24
    ) {
      errors.push("Password history must be between 0 and 24.");
    }

    if (
      !Number.isInteger(settings.session_idle_timeout_minutes) ||
      settings.session_idle_timeout_minutes < 1 ||
      settings.session_idle_timeout_minutes > 1440
    ) {
      errors.push("Idle timeout must be between 1 and 1440 minutes.");
    }

    if (
      !Number.isInteger(settings.session_absolute_timeout_hours) ||
      settings.session_absolute_timeout_hours < 1 ||
      settings.session_absolute_timeout_hours > 168
    ) {
      errors.push("Session lifetime must be between 1 and 168 hours.");
    }

    if (
      !Number.isInteger(settings.session_max_concurrent) ||
      settings.session_max_concurrent < 1 ||
      settings.session_max_concurrent > 20
    ) {
      errors.push("Concurrent sessions must be between 1 and 20.");
    }

    if (
      !Number.isInteger(settings.login_max_attempts) ||
      settings.login_max_attempts < 1 ||
      settings.login_max_attempts > 20
    ) {
      errors.push("Maximum login attempts must be between 1 and 20.");
    }

    if (
      !Number.isInteger(settings.login_lockout_minutes) ||
      settings.login_lockout_minutes < 1 ||
      settings.login_lockout_minutes > 1440
    ) {
      errors.push("Initial lockout must be between 1 and 1440 minutes.");
    }

    if (
      !Number.isInteger(settings.login_max_lockout_minutes) ||
      settings.login_max_lockout_minutes <
        settings.login_lockout_minutes ||
      settings.login_max_lockout_minutes > 10080
    ) {
      errors.push(
        "Maximum lockout must be at least the initial lockout and no more than 10080 minutes.",
      );
    }

    if (
      settings.password_expiration_enabled &&
      (!Number.isInteger(settings.password_expiration_days) ||
        settings.password_expiration_days < 30 ||
        settings.password_expiration_days > 365)
    ) {
      errors.push("Password expiration must be between 30 and 365 days.");
    }

    return errors;
  }, [settings]);

  /*
  |--------------------------------------------------------------------------
  | Settings Updates
  |--------------------------------------------------------------------------
  */

  function update<K extends keyof SecuritySettingsResource>(
    key: K,
    value: SecuritySettingsResource[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Mock Audit Event
  |--------------------------------------------------------------------------
  */

  function addMockAuditLog(
    event: string,
    description: string,
    status: SecurityAuditLog["status"] = "SUCCESS",
  ) {
    const newLog: SecurityAuditLog = {
      id: `audit-${Date.now()}`,
      event,
      description,
      actor_name: "System Administrator",
      actor_role: "SYSTEM_ADMIN",
      ip_address: "196.190.216.41",
      device: "Chrome / macOS",
      created_at: new Date().toISOString(),
      status,
    };

    setAuditLogs((current) => [newLog, ...current]);
  }

  /*
  |--------------------------------------------------------------------------
  | Save Policy
  |--------------------------------------------------------------------------
  */

  async function saveSettings() {
    if (!isDirty || validationErrors.length > 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 500),
    );

    const nextSettings = cloneSettings(settings);

    setSavedSettings(nextSettings);
    setSettings(nextSettings);

    addMockAuditLog(
      "Security policy updated",
      "The system administrator updated the global security policy.",
    );

    setIsSaving(false);

    toast.success("Mock security policy saved.");
  }

  function resetSettings() {
    setSettings(cloneSettings(savedSettings));
    toast.info("Unsaved changes discarded.");
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh Mock Data
  |--------------------------------------------------------------------------
  */

  async function refreshAll() {
    if (isRefreshing) return;

    setIsRefreshing(true);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 400),
    );

    setSettings(cloneSettings(savedSettings));
    setSessions(
      MOCK_SESSIONS.map((session) => ({ ...session })),
    );
    setAuditLogs(
      MOCK_AUDIT_LOGS.map((log) => ({ ...log })),
    );

    setIsRefreshing(false);

    toast.success("Mock security information refreshed.");
  }

  /*
  |--------------------------------------------------------------------------
  | Revoke One Session
  |--------------------------------------------------------------------------
  */

  async function revokeSession(session: SecuritySession) {
    if (session.is_current) {
      toast.error("You cannot revoke the current session here.");
      return;
    }

    if (revokingSessionId) return;

    const confirmed = window.confirm(
      `Revoke the session for ${session.user_name} on ${session.device_name}?`,
    );

    if (!confirmed) return;

    setRevokingSessionId(session.id);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 400),
    );

    setSessions((current) =>
      current.filter((item) => item.id !== session.id),
    );

    addMockAuditLog(
      "User session revoked",
      `The administrator revoked the session belonging to ${session.user_name} (${session.user_email}).`,
    );

    setRevokingSessionId(null);

    toast.success("Mock session revoked.");
  }

  /*
  |--------------------------------------------------------------------------
  | Revoke All Other Sessions
  |--------------------------------------------------------------------------
  */

  async function revokeOtherSessions() {
    if (revokingOthers || otherSessions.length === 0) return;

    const confirmed = window.confirm(
      `This will terminate ${otherSessions.length} other active session(s). The current session will remain active. Continue?`,
    );

    if (!confirmed) return;

    setRevokingOthers(true);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 400),
    );

    setSessions((current) =>
      current.filter((session) => session.is_current),
    );

    addMockAuditLog(
      "All other sessions revoked",
      "The administrator terminated all other active sessions.",
    );

    setRevokingOthers(false);

    toast.success("All other mock sessions have been revoked.");
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />

            <h2 className="text-base font-semibold">
              Security & Access Control
            </h2>

            <Badge variant="outline" className="font-normal">
              System administration
            </Badge>

            <Badge variant="secondary" className="font-normal">
              Mock mode
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization-wide authentication, credential policies,
            active sessions, and security monitoring.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshAll()}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Mock Notice */}

      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

        <div>
          <p className="text-sm font-medium">
            Demonstration mode — no live security enforcement
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            This interface uses frontend sample data. Saving policies,
            refreshing data, and revoking sessions only change local
            component state. No backend requests are made. These settings
            do not change authentication, permissions, or active sessions
            in the real system.
          </p>
        </div>
      </div>

      {/* Overview */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Fingerprint}
          label="MFA policy"
          value={settings.mfa_enabled ? "Enabled" : "Disabled"}
          description="Organization-wide MFA setting"
        />

        <SummaryCard
          icon={KeyRound}
          label="Password minimum"
          value={`${settings.password_min_length} characters`}
          description="Minimum credential length"
        />

        <SummaryCard
          icon={Monitor}
          label="Active sessions"
          value={String(sessions.length)}
          description={`${otherSessions.length} other active session(s)`}
        />

        <SummaryCard
          icon={ShieldAlert}
          label="Security events"
          value={String(failedEvents + warningEvents)}
          description={`${failedEvents} failed · ${warningEvents} warnings`}
        />
      </div>

      {/* Main Tabs */}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SecurityTab)}
        className="space-y-5"
      >
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-background p-1">
          <TabsTrigger value="authentication" className="gap-2">
            <Fingerprint className="h-4 w-4" />
            <span className="hidden sm:inline">Authentication</span>
            <span className="sm:hidden">MFA</span>
          </TabsTrigger>

          <TabsTrigger value="password" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Password
          </TabsTrigger>

          <TabsTrigger value="sessions" className="gap-2">
            <Monitor className="h-4 w-4" />
            Sessions
            <span className="text-xs text-muted-foreground">
              ({sessions.length})
            </span>
          </TabsTrigger>

          <TabsTrigger value="protection" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Protection
          </TabsTrigger>

          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Authentication */}

        <TabsContent value="authentication" className="space-y-5">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Fingerprint}
                eyebrow="Identity verification"
                title="Multi-factor authentication"
                description="Define which account groups must verify their identity using an additional authentication factor."
              />
            </CardHeader>

            <CardContent>
              <SettingRow
                title="Enable MFA policy"
                description="Enable MFA as an organization-wide authentication requirement."
              >
                <Switch
                  checked={settings.mfa_enabled}
                  onCheckedChange={(value) =>
                    update("mfa_enabled", value)
                  }
                />
              </SettingRow>

              <Separator />

              <div className="py-5">
                <p className="text-sm font-medium">
                  Enforcement by user group
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Select the user groups that must enroll and use MFA.
                  These are system-wide policy groups, not individual account permissions.
                </p>

                <div className="mt-5 space-y-5">
                  {[
                    {
                      key: "mfa_required_for_admins" as const,
                      label: "System administrators",
                      description:
                        "Administrators managing system configuration, users, roles, and security.",
                      recommended: true,
                    },
                    {
                      key: "mfa_required_for_finance" as const,
                      label: "Finance officers",
                      description:
                        "Users managing payments, collections, financial reports, and reconciliation.",
                      recommended: true,
                    },
                    {
                      key: "mfa_required_for_approvers" as const,
                      label: "Assessment approvers",
                      description:
                        "Users approving assessments, invoices, and other controlled operations.",
                      recommended: true,
                    },
                    {
                      key: "mfa_required_for_employees" as const,
                      label: "All employees",
                      description:
                        "Extend mandatory MFA to all employee accounts.",
                      recommended: false,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={item.key}
                        checked={settings[item.key]}
                        disabled={!settings.mfa_enabled}
                        onCheckedChange={(checked) =>
                          update(item.key, checked === true)
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label
                            htmlFor={item.key}
                            className="cursor-pointer text-sm font-medium"
                          >
                            {item.label}
                          </Label>

                          {item.recommended && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-normal"
                            >
                              Recommended
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <SettingRow
                title="Trusted devices"
                description="Allow users to remember verified devices and reduce repeated MFA challenges."
              >
                <Switch
                  checked={settings.mfa_trusted_devices_enabled}
                  disabled={!settings.mfa_enabled}
                  onCheckedChange={(value) =>
                    update("mfa_trusted_devices_enabled", value)
                  }
                />
              </SettingRow>

              <Separator />

              <SettingRow
                title="Step-up authentication"
                description="Require additional identity verification before sensitive administrative or financial operations."
              >
                <Switch
                  checked={settings.mfa_reauthentication_required}
                  disabled={!settings.mfa_enabled}
                  onCheckedChange={(value) =>
                    update("mfa_reauthentication_required", value)
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>

          <InfoNotice>
            For a production deployment, MFA should be enforced server-side.
            Sensitive operations should use step-up authentication, and trusted
            devices should have a limited lifetime and a revocation mechanism.
          </InfoNotice>
        </TabsContent>

        {/* Password */}

        <TabsContent value="password" className="space-y-5">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={KeyRound}
                eyebrow="Credential governance"
                title="Password policy"
                description="Set organization-wide password requirements and compromised credential response rules."
              />
            </CardHeader>

            <CardContent>
              <NumberSetting
                label="Minimum password length"
                description="Minimum number of characters required for new passwords."
                value={settings.password_min_length}
                min={8}
                max={128}
                suffix="characters"
                onChange={(value) =>
                  update("password_min_length", value)
                }
              />

              <Separator />

              <NumberSetting
                label="Password history"
                description="Prevent reuse of recently used passwords. Set to zero to disable history."
                value={settings.password_history_count}
                min={0}
                max={24}
                suffix="passwords"
                onChange={(value) =>
                  update("password_history_count", value)
                }
              />

              <Separator />

              <SettingRow
                title="Block common passwords"
                description="Reject commonly used and easily guessed passwords."
              >
                <Switch
                  checked={settings.password_block_common}
                  onCheckedChange={(value) =>
                    update("password_block_common", value)
                  }
                />
              </SettingRow>

              <Separator />

              <SettingRow
                title="Block compromised passwords"
                description="Reject passwords identified in known compromised-password datasets."
              >
                <Switch
                  checked={settings.password_block_compromised}
                  onCheckedChange={(value) =>
                    update("password_block_compromised", value)
                  }
                />
              </SettingRow>

              <Separator />

              <SettingRow
                title="Require change after compromise"
                description="Require a password reset when an account is confirmed to have been compromised."
              >
                <Switch
                  checked={settings.password_require_change_after_compromise}
                  onCheckedChange={(value) =>
                    update(
                      "password_require_change_after_compromise",
                      value,
                    )
                  }
                />
              </SettingRow>

              <Separator />

              <SettingRow
                title="Password expiration"
                description="Require password changes after a configured number of days."
              >
                <Switch
                  checked={settings.password_expiration_enabled}
                  onCheckedChange={(value) =>
                    update("password_expiration_enabled", value)
                  }
                />
              </SettingRow>

              {settings.password_expiration_enabled && (
                <>
                  <Separator />

                  <NumberSetting
                    label="Expiration period"
                    description="Number of days before a password expires."
                    value={settings.password_expiration_days}
                    min={30}
                    max={365}
                    suffix="days"
                    onChange={(value) =>
                      update("password_expiration_days", value)
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          <InfoNotice>
            Use strong password screening, compromised-password checks, and
            secure password hashing. Avoid routine password expiration unless
            there is a defined security or regulatory reason.
          </InfoNotice>
        </TabsContent>

        {/* Sessions */}

        <TabsContent value="sessions" className="space-y-5">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={Clock}
                eyebrow="Session lifecycle"
                title="Session policies"
                description="Control authenticated session duration, inactivity limits, and concurrent sessions."
              />
            </CardHeader>

            <CardContent>
              <NumberSetting
                label="Idle timeout"
                description="Terminate a session after a period of inactivity."
                value={settings.session_idle_timeout_minutes}
                min={1}
                max={1440}
                suffix="minutes"
                onChange={(value) =>
                  update("session_idle_timeout_minutes", value)
                }
              />

              <Separator />

              <NumberSetting
                label="Maximum session lifetime"
                description="Maximum session duration regardless of user activity."
                value={settings.session_absolute_timeout_hours}
                min={1}
                max={168}
                suffix="hours"
                onChange={(value) =>
                  update("session_absolute_timeout_hours", value)
                }
              />

              <Separator />

              <NumberSetting
                label="Concurrent sessions"
                description="Maximum number of active sessions permitted per account."
                value={settings.session_max_concurrent}
                min={1}
                max={20}
                suffix="sessions"
                onChange={(value) =>
                  update("session_max_concurrent", value)
                }
              />

              <Separator />

              <SettingRow
                title="Revoke sessions after password change"
                description="Invalidate existing sessions when a user changes or resets their password."
              >
                <Switch
                  checked={settings.session_revoke_after_password_change}
                  onCheckedChange={(value) =>
                    update(
                      "session_revoke_after_password_change",
                      value,
                    )
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Session Overview */}

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  Active user sessions
                </CardTitle>
                <CardDescription>
                  Review signed-in devices and terminate sessions when necessary.
                </CardDescription>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => void revokeOtherSessions()}
                disabled={
                  revokingOthers || otherSessions.length === 0
                }
              >
                {revokingOthers ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Revoke other sessions
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {currentSession && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                        <Laptop className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">
                            {currentSession.device_name}
                          </p>

                          <Badge variant="default">
                            Current session
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {currentSession.user_name} · {currentSession.user_email}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {currentSession.browser} · {currentSession.operating_system}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>IP address: {currentSession.ip_address}</p>
                    <p>Location: {currentSession.location}</p>
                    <p>Started: {formatDate(currentSession.created_at)}</p>
                    <p>Last activity: {formatDate(currentSession.last_activity_at)}</p>
                  </div>
                </div>
              )}

              {otherSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    No other active sessions
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All other user sessions have been terminated.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {otherSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                            {session.operating_system.toLowerCase().includes("android") ? (
                              <Smartphone className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Monitor className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {session.user_name}
                            </p>

                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {session.user_email}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {getRoleLabel(session.user_role)}
                              </Badge>
                              <Badge variant="secondary">
                                Active session
                              </Badge>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground">
                              {session.device_name} · {session.browser} · {session.operating_system}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          disabled={revokingSessionId === session.id}
                          onClick={() => void revokeSession(session)}
                        >
                          {revokingSessionId === session.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Revoke
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>IP address: {session.ip_address}</p>
                        <p>Location: {session.location}</p>
                        <p>Started: {formatDate(session.created_at)}</p>
                        <p>Last activity: {formatDate(session.last_activity_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <InfoNotice>
            A production session-management service should store session
            identifiers server-side, support per-user revocation, record
            revocation events, and enforce idle and absolute expiration.
            Never rely on the browser alone to terminate authenticated sessions.
          </InfoNotice>
        </TabsContent>

        {/* Login Protection */}

        <TabsContent value="protection" className="space-y-5">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={ShieldAlert}
                eyebrow="Threat prevention"
                title="Login protection"
                description="Configure failed-login thresholds, progressive account lockout, and suspicious authentication monitoring."
              />
            </CardHeader>

            <CardContent>
              <NumberSetting
                label="Maximum failed attempts"
                description="Number of consecutive failed login attempts before account lockout."
                value={settings.login_max_attempts}
                min={1}
                max={20}
                suffix="attempts"
                onChange={(value) =>
                  update("login_max_attempts", value)
                }
              />

              <Separator />

              <NumberSetting
                label="Initial lockout duration"
                description="Duration of the first account lockout."
                value={settings.login_lockout_minutes}
                min={1}
                max={1440}
                suffix="minutes"
                onChange={(value) =>
                  update("login_lockout_minutes", value)
                }
              />

              <Separator />

              <SettingRow
                title="Progressive lockout"
                description="Increase lockout duration after repeated lockout events."
              >
                <Switch
                  checked={settings.login_progressive_lockout}
                  onCheckedChange={(value) =>
                    update("login_progressive_lockout", value)
                  }
                />
              </SettingRow>

              {settings.login_progressive_lockout && (
                <>
                  <Separator />

                  <NumberSetting
                    label="Maximum lockout duration"
                    description="Upper limit for progressive account lockout."
                    value={settings.login_max_lockout_minutes}
                    min={settings.login_lockout_minutes}
                    max={10080}
                    suffix="minutes"
                    onChange={(value) =>
                      update("login_max_lockout_minutes", value)
                    }
                  />
                </>
              )}

              <Separator />

              <SettingRow
                title="Suspicious login alerts"
                description="Generate security events for suspicious authentication behavior."
              >
                <Switch
                  checked={settings.login_suspicious_alerts}
                  onCheckedChange={(value) =>
                    update("login_suspicious_alerts", value)
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader
                icon={Shield}
                eyebrow="Operational recommendations"
                title="Additional protection controls"
                description="Security controls that should be implemented alongside account lockout."
              />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Authentication rate limiting
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Apply limits using both account identifiers and source IP addresses.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Suspicious activity detection
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Detect unusual login patterns, repeated failures, and unexpected access locations.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Administrative access monitoring
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Record changes to users, roles, permissions, and security configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <InfoNotice>
            Account lockout and request throttling should both be enforced by
            Laravel. Keep authentication error messages generic, and consider
            monitoring account and IP-based activity independently.
          </InfoNotice>
        </TabsContent>

        {/* Audit Activity */}

        <TabsContent value="activity" className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={Activity}
              label="Total events"
              value={String(auditLogs.length)}
              description="Recorded security events"
            />

            <SummaryCard
              icon={AlertCircle}
              label="Failed events"
              value={String(failedEvents)}
              description="Unsuccessful security operations"
            />

            <SummaryCard
              icon={AlertTriangle}
              label="Warnings"
              value={String(warningEvents)}
              description="Events requiring attention"
            />
          </div>

          <Card>
            <CardHeader>
              <SectionHeader
                icon={Activity}
                eyebrow="Security monitoring"
                title="Security audit trail"
                description="Review authentication events, administrative changes, and session-management activity."
              />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={auditSearch}
                    onChange={(event) =>
                      setAuditSearch(event.target.value)
                    }
                    placeholder="Search event, user, IP address..."
                    className="pl-9"
                  />
                </div>

                <select
                  value={auditStatus}
                  onChange={(event) =>
                    setAuditStatus(event.target.value)
                  }
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="ALL">All events</option>
                  <option value="SUCCESS">Successful</option>
                  <option value="FAILED">Failed</option>
                  <option value="WARNING">Warnings</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Showing {filteredAuditLogs.length} of {auditLogs.length} events
                </p>

                <Badge variant="outline">
                  Mock audit data
                </Badge>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Search className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    No matching security events
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try changing your search or status filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {log.event}
                            </p>

                            <Badge variant={getAuditVariant(log.status)}>
                              {log.status}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {log.description}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>Actor: {log.actor_name}</p>
                        <p>Role: {getRoleLabel(log.actor_role)}</p>
                        <p>IP address: {log.ip_address}</p>
                        <p>Device: {log.device}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <InfoNotice>
            A production audit trail should be stored server-side, include
            actor identity and timestamps, and be protected against unauthorized
            modification or deletion. Sensitive audit records should have a
            defined retention policy and export capability.
          </InfoNotice>
        </TabsContent>
      </Tabs>

      {/* Validation */}

      {isDirty && validationErrors.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

              <div>
                <p className="text-sm font-medium">
                  Review security configuration
                </p>

                <ul className="mt-2 space-y-1">
                  {validationErrors.map((error) => (
                    <li
                      key={error}
                      className="ml-4 list-disc text-xs text-muted-foreground"
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Bar */}

      {isDirty && (
        <div className="sticky bottom-0 z-30 rounded-xl border bg-background/95 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <p className="text-sm font-medium">
                  Unsaved security policy changes
                </p>

                <p className="text-xs text-muted-foreground">
                  Review and save your changes to update the mock policy.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={resetSettings}
              >
                Discard
              </Button>

              <Button
                size="sm"
                disabled={isSaving || validationErrors.length > 0}
                onClick={() => void saveSettings()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save security policy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
