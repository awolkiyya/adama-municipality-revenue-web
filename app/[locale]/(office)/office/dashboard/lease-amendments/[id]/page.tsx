
"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Ellipsis,
  Eye,
  FileText,
  History,
  Landmark,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import Can from "@/components/access/Can";
import { useOpenFile } from "@/hooks/use-open-file";

import {
  useLeaseAmendment,
  useSubmitLeaseAmendment,
  useApproveLeaseAmendment,
  useRejectLeaseAmendment,
  useApplyLeaseAmendment,
  useCancelLeaseAmendment,
} from "@/hooks/revenue/use-lease-amendments";

import {
  AMENDMENT_TYPE_LABELS,
  LAND_AREA_FIELD_CODES,
  LAND_AREA_UNIT,
  MIN_REASON_LENGTH,
  type AmendmentType,
  type LeaseAmendmentStatus,
} from "@/types/assessment/lease-amendment";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const RESOURCE = "lease_amendments";

const STATUS: Record<
  LeaseAmendmentStatus,
  { label: string; badge: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    badge:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    dot: "bg-slate-500",
  },
  PENDING_APPROVAL: {
    label: "Pending approval",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  APPLIED: {
    label: "Applied",
    badge:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  REJECTED: {
    label: "Rejected",
    badge:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    badge:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

const DESTRUCTIVE_CLASS =
  "bg-destructive text-destructive-foreground hover:bg-destructive/90";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

type PersonRef =
  | {
      id?: string;
      name?: string;
      email?: string;
    }
  | null;

type AmendmentChange = {
  id: string | number;
  field_name: string;
  value_type: string;
  old_value: unknown;
  new_value: unknown;
  measurement_unit?: { name?: string; symbol?: string } | null;
  reason: string | null;
  change_order: number;
};

type AmendmentFile = {
  id: string;
  original_name?: string;
  mime_type?: string;
  extension?: string;
  size_bytes?: number;
  status?: string;
};

type AmendmentWorkflow = {
  created_by_user?: PersonRef;
  decided_by_user?: PersonRef;
  applied_by_user?: PersonRef;
  created_by?: PersonRef;
  decided_by?: PersonRef;
  applied_by?: PersonRef;
  decision_notes?: string | null;
  decided_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  applied_at?: string | null;
};

type AmendmentDetail = {
  id: string;
  amendment_number: string;
  amendment_type: AmendmentType;
  amendment_type_label?: string;
  status: LeaseAmendmentStatus;
  reason: string | null;
  other_amendment_description: string | null;
  previous_assessment_id: string | null;
  previous_assessment: UnknownRecord | null;
  new_assessment_id: string | null;
  new_assessment: UnknownRecord | null;
  changes?: AmendmentChange[];
  workflow?: AmendmentWorkflow | null;
  supporting_documents?: AmendmentFile[];
  created_at: string;
};

type DialogKey = "reject" | "apply" | "cancel";

type AssessmentLinkData = {
  label: string;
  id: string;
  number: string | null;
  status: string | null;
};

type DocumentItem = {
  file: AmendmentFile;
  name: string;
  meta: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function pick(record: UnknownRecord | null, keys: string[]): unknown {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(
  value: string | null | undefined,
  locale: string,
  withTime = false,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatBytes(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(formatValue).join(", ");

  const record = getRecord(value);

  if (record) {
    const display = pick(record, [
      "name",
      "full_name",
      "display_name",
      "title",
      "reference",
      "code",
      "id",
    ]);

    if (display !== undefined) return formatValue(display);

    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  return String(value);
}

function nameOf(value: unknown): string {
  if (typeof value === "string") {
    return value &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
      ? value
      : "—";
  }

  return formatValue(
    pick(getRecord(value), [
      "name",
      "full_name",
      "display_name",
      "username",
      "reference",
      "code",
    ]),
  );
}

function isLandArea(fieldName: string): boolean {
  return (LAND_AREA_FIELD_CODES as readonly string[]).includes(fieldName);
}

function unwrapValue(value: unknown): unknown {
  const record = getRecord(value);

  return record && "value" in record ? record.value : value;
}

function formatChangeValue(
  change: AmendmentChange,
  value: unknown,
  locale: string,
): string {
  const raw = unwrapValue(value);

  if (raw === null || raw === undefined || raw === "") return "—";

  switch (change.value_type?.toUpperCase()) {
    case "DATE":
      return formatDate(String(raw), locale);

    case "DATETIME":
      return formatDate(String(raw), locale, true);

    case "DECIMAL":
    case "INTEGER":
    case "NUMBER": {
      const number = Number(raw);

      if (!Number.isFinite(number)) return formatValue(raw);

      const unit =
        change.measurement_unit?.symbol ??
        (isLandArea(change.field_name) ? LAND_AREA_UNIT : "");

      return `${number.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    }

    default:
      return formatValue(raw);
  }
}

function getAssessmentField(
  assessment: UnknownRecord | null,
  fieldCode: string,
): string | null {
  const services = assessment?.services;

  if (!Array.isArray(services)) return null;

  for (const service of services) {
    const values = getRecord(service)?.values;

    if (!Array.isArray(values)) continue;

    for (const item of values) {
      const record = getRecord(item);

      const currentFieldCode = pick(record, [
        "fieldCode",
        "field_code",
        "code",
      ]);

      if (
        typeof currentFieldCode === "string" &&
        currentFieldCode.toUpperCase() === fieldCode.toUpperCase()
      ) {
        const display = pick(record, [
          "displayValue",
          "display_value",
          "value",
        ]);

        return display === undefined ? null : formatValue(display);
      }
    }
  }

  return null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const record = getRecord(error);

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const response = getRecord(record?.response);
  const responseData = getRecord(response?.data);

  const message = pick(responseData, ["message", "error"]);

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  const errors = getRecord(responseData?.errors);

  if (errors) {
    for (const value of Object.values(errors)) {
      if (typeof value === "string" && value.trim()) return value;

      if (Array.isArray(value)) {
        const firstMessage = value.find(
          (item) => typeof item === "string" && item.trim(),
        );

        if (typeof firstMessage === "string") return firstMessage;
      }
    }
  }

  return fallback;
}

function unwrapAmendment(value: unknown): AmendmentDetail | undefined {
  const outer = getRecord(value);

  if (!outer) return undefined;

  const nested = getRecord(outer.data);
  const candidate = nested && nested.id !== undefined ? nested : outer;

  return candidate.id === undefined || candidate.id === null
    ? undefined
    : (candidate as unknown as AmendmentDetail);
}

function toAssessmentLink(
  label: string,
  assessment: unknown,
  fallbackId?: string | null,
): AssessmentLinkData | null {
  const record = getRecord(assessment);
  const id = pick(record, ["id", "uuid"]) ?? fallbackId;

  if (id === undefined || id === null || id === "") return null;

  const number = pick(record, [
    "assessmentNumber",
    "assessment_number",
    "reference_number",
    "assessment_code",
    "invoice_number",
  ]);

  const status = pick(record, ["status"]);

  return {
    label,
    id: String(id),
    number: number === undefined ? null : String(number),
    status: typeof status === "string" ? status : null,
  };
}

function toDocument(file: AmendmentFile): DocumentItem {
  const type = (
    file.extension ?? file.mime_type?.split("/").pop()
  )?.toUpperCase();

  return {
    file,
    name: file.original_name ?? "Document",
    meta: [type, formatBytes(file.size_bytes)].filter(Boolean).join(" · "),
  };
}

/* -------------------------------------------------------------------------- */
/* Reusable UI                                                                */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const config = STATUS[status as LeaseAmendmentStatus];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        config?.badge ?? "border-border bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          config?.dot ?? "bg-current"
        }`}
      />
      {config?.label ?? formatLabel(status || "Unknown")}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-5 py-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function Fact({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 bg-card px-4 py-3.5 ${className}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className="mt-1 truncate text-sm font-medium text-foreground"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "muted",
  children,
}: {
  icon: ElementType;
  title: string;
  description?: string;
  tone?: "muted" | "destructive";
  children?: ReactNode;
}) {
  const destructive = tone === "destructive";

  return (
    <div className="mx-auto flex min-h-[320px] max-w-xl flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-8 text-center">
      <div
        className={`rounded-full p-3 ${
          destructive ? "bg-destructive/10" : "bg-muted"
        }`}
      >
        <Icon
          className={`h-6 w-6 ${
            destructive ? "text-destructive" : "text-muted-foreground"
          }`}
        />
      </div>

      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap justify-center gap-2">{children}</div>
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  pending,
  disabled,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  pending: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent className="shadow-none">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={pending || disabled}
            className={destructive ? DESTRUCTIVE_CLASS : undefined}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AssessmentLink({
  locale,
  data,
}: {
  locale: string;
  data: AssessmentLinkData;
}) {
  return (
    <Link
      href={`/${locale}/dashboard/assessments/${encodeURIComponent(data.id)}`}
      className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Landmark className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{data.label}</p>
        <p className="truncate text-sm font-semibold text-foreground">
          {data.number ?? "View assessment"}
        </p>

        {data.status && (
          <p className="text-xs text-muted-foreground">
            {formatLabel(data.status)}
          </p>
        )}
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

function TimelineItem({
  title,
  detail,
  actor,
  state,
  isLast,
}: {
  title: string;
  detail: string;
  actor?: string;
  state: "done" | "current" | "upcoming";
  isLast: boolean;
}) {
  const dot = {
    done: "border-emerald-500 bg-emerald-500",
    current: "border-amber-500 bg-amber-100 dark:bg-amber-950",
    upcoming: "border-border bg-background",
  }[state];

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
      )}

      <span
        className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${dot}`}
      />

      <div className="min-w-0">
        <p
          className={`text-sm font-medium ${
            state === "upcoming"
              ? "text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {title}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>

        {actor && (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
            <User className="h-3 w-3 text-muted-foreground" />
            {actor}
          </p>
        )}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LeaseAmendmentDetailPage() {
  const params = useParams();
  const locale = useLocale();

  const rawId = params?.id;

  const id = Array.isArray(rawId)
    ? typeof rawId[0] === "string"
      ? rawId[0]
      : ""
    : typeof rawId === "string"
      ? rawId
      : "";

  const { openFile, isOpening } = useOpenFile();

  const [dialog, setDialog] = useState<DialogKey | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLeaseAmendment(id);

  const submitMutation = useSubmitLeaseAmendment();
  const approveMutation = useApproveLeaseAmendment();
  const rejectMutation = useRejectLeaseAmendment();
  const applyMutation = useApplyLeaseAmendment();
  const cancelMutation = useCancelLeaseAmendment();

  const isWorkflowPending =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    applyMutation.isPending ||
    cancelMutation.isPending;

  const amendment = useMemo(() => unwrapAmendment(data), [data]);

  const changes = useMemo(
    () =>
      [...(amendment?.changes ?? [])].sort(
        (a, b) => a.change_order - b.change_order,
      ),
    [amendment],
  );

  const documents = useMemo(
    () => (amendment?.supporting_documents ?? []).map(toDocument),
    [amendment],
  );

  const backUrl = `/${locale}/dashboard/lease-amendments`;
  const editUrl = `${backUrl}/${encodeURIComponent(id)}/edit`;

  const backButton = (
    <Button variant="outline" asChild>
      <Link href={backUrl}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to amendments
      </Link>
    </Button>
  );

  if (!id) {
    return (
      <EmptyState
        icon={FileText}
        title="Amendment reference is missing"
        description="Open a lease amendment from the amendments list to view its details."
      >
        {backButton}
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-[320px] flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading lease amendment…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="destructive"
        title="Unable to load lease amendment"
        description={getErrorMessage(
          error,
          "An unexpected error occurred. Please try again.",
        )}
      >
        {backButton}

        <Button onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Try again
        </Button>
      </EmptyState>
    );
  }

  if (!amendment) {
    return (
      <EmptyState
        icon={FileText}
        title="Lease amendment not found"
        description="The amendment doesn't exist, or the server returned an unexpected response."
      >
        {backButton}
      </EmptyState>
    );
  }

  /* ----------------------------- Derived values ---------------------------- */

  const status = amendment.status;
  const isDraft = status === "DRAFT";
  const isPendingApproval = status === "PENDING_APPROVAL";
  const isApproved = status === "APPROVED";
  const isApplied = status === "APPLIED";
  const isRejected = status === "REJECTED";
  const isCancelled = status === "CANCELLED";

  const canCancel = isDraft || isPendingApproval || isApproved;

  const amendmentId = String(amendment.id);
  const reference = amendment.amendment_number || amendmentId;

  const typeLabel =
    amendment.amendment_type_label ??
    AMENDMENT_TYPE_LABELS[amendment.amendment_type] ??
    formatLabel(String(amendment.amendment_type ?? "Unknown"));

  const fmt = (
    value: string | null | undefined,
    withTime = false,
  ) => formatDate(value, locale, withTime);

  const workflow = amendment.workflow ?? {};

  const createdBy = nameOf(
    workflow.created_by_user ?? workflow.created_by,
  );

  const decidedBy = nameOf(
    workflow.decided_by_user ?? workflow.decided_by,
  );

  const appliedBy = nameOf(
    workflow.applied_by_user ?? workflow.applied_by,
  );

  const actor = (name: string) => (name === "—" ? undefined : name);
  const decisionNotes = workflow.decision_notes;
  const appliedAt = workflow.applied_at;

  const location = getAssessmentField(
    amendment.previous_assessment,
    "LOCATION",
  );

  const holdingNumber = getAssessmentField(
    amendment.previous_assessment,
    "LAND_HOLDING_NUMBER",
  );

  const facts = [
    { label: "Amendment type", value: typeLabel },
    { label: "Property location", value: location ?? "—" },
    { label: "Land holding number", value: holdingNumber ?? "—" },
    { label: "Created by", value: createdBy },
  ].filter((item) => item.value !== "—");

  const areaChange = changes.find((change) =>
    isLandArea(change.field_name),
  );

  const oldArea = areaChange
    ? Number(unwrapValue(areaChange.old_value))
    : NaN;

  const newArea = areaChange
    ? Number(unwrapValue(areaChange.new_value))
    : NaN;

  const areaDifference =
    Number.isFinite(oldArea) && Number.isFinite(newArea)
      ? newArea - oldArea
      : NaN;

  const assessmentLinks = [
    toAssessmentLink(
      "Original assessment",
      amendment.previous_assessment,
      amendment.previous_assessment_id,
    ),
    toAssessmentLink(
      "Resulting assessment",
      amendment.new_assessment,
      amendment.new_assessment_id,
    ),
  ].filter(
    (link): link is AssessmentLinkData => link !== null,
  );

  const decisionDate =
    workflow.decided_at ??
    workflow.approved_at ??
    workflow.rejected_at;

  const decided = isApproved || isApplied || isRejected;

  const steps = [
    {
      title: "Created",
      detail: fmt(amendment.created_at, true),
      actor: actor(createdBy),
      done: true,
    },
    {
      title: "Submitted",
      detail: isDraft
        ? "Not submitted yet"
        : "Submitted for approval",
      actor: undefined as string | undefined,
      done: !isDraft && !isCancelled,
    },
    {
      title: isRejected ? "Rejected" : "Approved",
      detail: decided
        ? fmt(decisionDate, true)
        : isCancelled
          ? "Cancelled"
          : "Awaiting decision",
      actor: decided ? actor(decidedBy) : undefined,
      done: decided,
    },
    ...(isRejected || isCancelled
      ? []
      : [
          {
            title: "Applied",
            detail: isApplied
              ? fmt(appliedAt, true)
              : "Not applied yet",
            actor: isApplied ? actor(appliedBy) : undefined,
            done: isApplied,
          },
        ]),
  ];

  const currentStep =
    isRejected || isCancelled
      ? -1
      : steps.findIndex((step) => !step.done);

  /* -------------------------------- Actions -------------------------------- */

  const run = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string,
    onDone?: () => void,
  ) => {
    if (isWorkflowPending) return;

    try {
      await action();
      toast.success(success);
      onDone?.();
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, failure));
    }
  };

  const closeDialog = () => setDialog(null);

  const dialogs: Record<
    DialogKey,
    {
      title: string;
      description: string;
      confirmLabel: string;
      cancelLabel: string;
      destructive?: boolean;
      pending: boolean;
      disabled?: boolean;
      onConfirm: () => void;
    }
  > = {
    reject: {
      title: "Reject lease amendment?",
      description:
        "Provide a clear reason. It will be recorded with your decision.",
      confirmLabel: "Confirm rejection",
      cancelLabel: "Keep request",
      destructive: true,
      pending: rejectMutation.isPending,
      disabled: rejectReason.trim().length < MIN_REASON_LENGTH,
      onConfirm: () =>
        void run(
          () =>
            rejectMutation.mutateAsync({
              id: amendmentId,
              payload: {
                decision_notes: rejectReason.trim(),
              },
            }),
          "Lease amendment rejected.",
          "Failed to reject the lease amendment.",
          () => {
            closeDialog();
            setRejectReason("");
          },
        ),
    },

    apply: {
      title: "Apply approved amendment?",
      description:
        "This will apply the approved lease changes and update the associated financial records. Existing payment obligations must satisfy the lease-amendment financial rules.",
      confirmLabel: "Apply amendment",
      cancelLabel: "Go back",
      pending: applyMutation.isPending,
      onConfirm: () =>
        void run(
          () => applyMutation.mutateAsync(amendmentId),
          "Lease amendment applied.",
          "Failed to apply the lease amendment.",
          closeDialog,
        ),
    },

    cancel: {
      title: "Cancel lease amendment?",
      description: `Amendment ${reference} will be cancelled and can't be resumed.`,
      confirmLabel: "Confirm cancellation",
      cancelLabel: "Keep amendment",
      destructive: true,
      pending: cancelMutation.isPending,
      onConfirm: () =>
        void run(
          () => cancelMutation.mutateAsync({ id: amendmentId }),
          "Lease amendment cancelled.",
          "Failed to cancel the lease amendment.",
          closeDialog,
        ),
    },
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
      <header className="space-y-4 border-b border-border pb-6">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Lease amendments
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {reference}
              </h1>

              <StatusBadge status={status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{typeLabel}</span>

              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Created {fmt(amendment.created_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 [&_*]:shadow-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching || isWorkflowPending}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isWorkflowPending}
                >
                  {isWorkflowPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Ellipsis className="mr-2 h-4 w-4" />
                  )}
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {isDraft && (
                  <>
                    <Can resource={RESOURCE} action="update">
                      <DropdownMenuItem asChild>
                        <Link href={editUrl}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit draft
                        </Link>
                      </DropdownMenuItem>
                    </Can>

                    <Can resource={RESOURCE} action="submit">
                      <DropdownMenuItem
                        disabled={
                          isWorkflowPending ||
                          changes.length === 0 ||
                          !amendment.reason?.trim() ||
                          amendment.reason.trim().length < MIN_REASON_LENGTH
                        }
                        onSelect={() =>
                          void run(
                            () => submitMutation.mutateAsync(amendmentId),
                            "Lease amendment submitted for approval.",
                            "Failed to submit the lease amendment.",
                          )
                        }
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Submit for approval
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}

                {isPendingApproval && (
                  <>
                    <Can resource={RESOURCE} action="approve">
                      <DropdownMenuItem
                        disabled={isWorkflowPending}
                        onSelect={() =>
                          void run(
                            () =>
                              approveMutation.mutateAsync({
                                id: amendmentId,
                              }),
                            "Lease amendment approved.",
                            "Failed to approve the lease amendment.",
                          )
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                    </Can>

                    <Can resource={RESOURCE} action="reject">
                      <DropdownMenuItem
                        disabled={isWorkflowPending}
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDialog("reject")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    </Can>
                  </>
                )}

                {isApproved && (
                  <Can resource={RESOURCE} action="apply">
                    <DropdownMenuItem
                      disabled={isWorkflowPending}
                      onSelect={() => setDialog("apply")}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Apply amendment
                    </DropdownMenuItem>
                  </Can>
                )}

                {canCancel && (
                  <Can resource={RESOURCE} action="cancel">
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      disabled={isWorkflowPending}
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDialog("cancel")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel amendment
                    </DropdownMenuItem>
                  </Can>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isDraft && changes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add at least one amendment change before submitting this draft for
            approval.
          </p>
        )}

        {isDraft &&
          (!amendment.reason?.trim() ||
            amendment.reason.trim().length < MIN_REASON_LENGTH) && (
            <p className="text-sm text-muted-foreground">
              The amendment reason must contain at least {MIN_REASON_LENGTH}{" "}
              characters before submission.
            </p>
          )}
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-flow-col lg:auto-cols-fr">
              {facts.map((fact, index) => (
                <Fact
                  key={fact.label}
                  {...fact}
                  className={
                    index === facts.length - 1 && facts.length % 2 === 1
                      ? "col-span-2 lg:col-span-1"
                      : ""
                  }
                />
              ))}
            </dl>
          )}

          <Section title="Requested changes" icon={ClipboardList}>
            {changes.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Field</th>
                        <th className="pb-3 pr-4 font-medium">Current</th>
                        <th className="pb-3 font-medium">Proposed</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {changes.map((change) => (
                        <tr key={change.id}>
                          <td className="py-3.5 pr-4 align-top">
                            <p className="font-medium text-foreground">
                              {formatLabel(change.field_name)}
                            </p>

                            {change.reason && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {change.reason}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 pr-4 align-top tabular-nums text-muted-foreground">
                            {formatChangeValue(
                              change,
                              change.old_value,
                              locale,
                            )}
                          </td>

                          <td className="py-3.5 align-top">
                            <span className="inline-flex items-center gap-2 font-medium tabular-nums text-foreground">
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatChangeValue(
                                change,
                                change.new_value,
                                locale,
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Number.isFinite(areaDifference) && areaDifference !== 0 && (
                  <p className="mt-4 rounded-md border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground">
                    Land area changes by{" "}
                    <span className="font-semibold">
                      {areaDifference > 0 ? "+" : ""}
                      {areaDifference.toLocaleString()} {LAND_AREA_UNIT}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No changes were recorded for this amendment.
              </p>
            )}
          </Section>

          <Section title="Reason for amendment" icon={ClipboardList}>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {amendment.reason || "No reason provided."}
            </p>

            {amendment.other_amendment_description && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Additional description
                </p>

                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {amendment.other_amendment_description}
                </p>
              </div>
            )}
          </Section>

          <Section
            title={`Supporting documents${
              documents.length ? ` (${documents.length})` : ""
            }`}
            icon={FileText}
          >
            {documents.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {documents.map(({ file, name, meta }) => (
                  <li key={file.id} className="flex items-center gap-3 p-3">
                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name}
                      </p>

                      {meta && (
                        <p className="text-xs text-muted-foreground">
                          {meta}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-none"
                      disabled={isOpening(file.id)}
                      onClick={() => void openFile(file)}
                      aria-label={`View ${name}`}
                    >
                      {isOpening(file.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No documents were attached to this request.
              </p>
            )}
          </Section>

          {decisionNotes && (
            <Section title="Decision notes" icon={ClipboardCheck}>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {decisionNotes}
              </p>
            </Section>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
          <Section title="Linked assessments" icon={Landmark}>
            {assessmentLinks.length > 0 ? (
              <div className="space-y-3">
                {assessmentLinks.map((link) => (
                  <AssessmentLink
                    key={link.label}
                    locale={locale}
                    data={link}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No assessment is linked to this amendment.
              </p>
            )}
          </Section>

          <Section title="Progress" icon={History}>
            <ol>
              {steps.map((step, index) => (
                <TimelineItem
                  key={step.title}
                  title={step.title}
                  detail={step.detail}
                  actor={step.actor}
                  state={
                    step.done
                      ? "done"
                      : index === currentStep
                        ? "current"
                        : "upcoming"
                  }
                  isLast={index === steps.length - 1}
                />
              ))}
            </ol>
          </Section>
        </aside>
      </div>

      {dialog && (
        <ConfirmDialog {...dialogs[dialog]} onClose={closeDialog}>
          {dialog === "reject" && (
            <div className="space-y-2 py-2">
              <label
                htmlFor="rejection-reason"
                className="text-sm font-medium"
              >
                Rejection reason
              </label>

              <Textarea
                id="rejection-reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Explain why this amendment is being rejected…"
                rows={4}
                maxLength={2000}
                disabled={rejectMutation.isPending}
              />

              <p className="text-xs text-muted-foreground">
                At least {MIN_REASON_LENGTH} characters, up to 2,000.
              </p>
            </div>
          )}
        </ConfirmDialog>
      )}
    </main>
  );
}