
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { PermissionAction } from "./user";

export interface NavPermission {
  resource: string;
  action: PermissionAction;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  permission?: NavPermission;
  items?: NavItem[];
}

export type ThemeMode = "light" | "dark";

export type Frequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half_year"
  | "yearly";

export interface FrequencyConfig {
  size: number;
  labels: string[];
}

export type FrequencyConfigMap = Record<Frequency, FrequencyConfig>;

export type GovernanceType =
  | "city"
  | "subcity"
  | "wereda"
  | "sector"
  | "user"
  | "unit"
  | "frequency"
  | "aggregation_type"
  | "plan_template"
  | "report_template"
  | "main_objective"
  | "activity"
  | "kpi"
  | "report";

export type CommentType =
  | "administrativeUnit"
  | "sector"
  | "user"
  | "role"
  | "taxpayer"
  | "aggregation_type"
  | "plan_template"
  | "report_template"
  | "main_objective"
  | "activity"
  | "kpi"
  | "inspection"
  | "closure"
  | "resolution"
  | "business"
  | "revenueCategory"
  | "revenueService"
  | "baseField"
  | "measurementUnit"
  | "tariffRule"
  | "assessment"
  | "invoice";

// Table props
// Pass a specific row type when the table uses a known data structure.
export type TableProps<TRow = Record<string, unknown>> = {
  type: GovernanceType;
  data: TRow[];
  isLoading?: boolean;

  page?: number;
  pageSize?: number;

  onView?: (row: TRow) => void;
  onEdit?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;

  onCreate?: () => void;

  onCreateActivity?: (row: TRow) => void;
  onCreateKpi?: (row: TRow) => void;

  onUpdatePassword?: (row: TRow) => void;
  onToggleStatus?: (row: TRow) => void;
  onTargetPlanning?: (row: TRow) => void;
  onGenerateDocument?: (row: TRow) => void;
  onStatusUpdate?: (row: TRow) => void;
};

export type TemplateMode = "create" | "edit";

export type TemplateKind = "PLAN" | "REPORT";

export type ReportType =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"
  | "CUSTOM";

export type PlanTemplatePayload = {
  kind: "PLAN";
  title: string;
  sector_id?: string;
  level: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  sections: SectionData[];
};

export type ReportTemplatePayload = {
  kind: "REPORT";
  title: string;
  sector_id?: string;
  level: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  reportType: ReportType;
  sections: SectionData[];
};

export type TemplatePayload = PlanTemplatePayload | ReportTemplatePayload;

export type SectionType =
  | "TEXT"
  | "RICH_TEXT"
  | "KPI_TABLE"
  | "BUDGET_TABLE";

export type SectionData = {
  uuid: string;
  title: string;
  description: string;
  field_key: string;
  type: SectionType;
  order: number;
  required: boolean;
  repeatable: boolean;
  active: boolean;
  help_text: string;
};

export type Status = "draft" | "active" | "inactive" | "complate";

export type StatusOption = {
  label: string;
  value: string;
};

export type FormValues = {
  status: string;
  comment: string;
};

export interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  currentStatus?: string;
  statusOptions: StatusOption[];
  loading?: boolean;
  onSubmit: (data: FormValues) => Promise<void> | void;
}

export type SummaryKey<T extends string> = T | "total";

export type SummaryItem<T extends string> = {
  label: string;
  key: SummaryKey<T>;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

export type SummaryData<T extends string> = Record<T, number> & {
  total: number;
};

export type PlanFilters = {
  page?: number;
  per_page?: number;
  sector_id?: number;
  level?: string;
  status?: string;
};

export type DocumentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "verified";

export type UpdateStatusPayload = {
  status: DocumentStatus;
  reason?: string;
};

export type KpiDirection = "increase" | "decrease";

export type KpiValueType =
  | "CUMULATIVE"
  | "STATE"
  | "PROGRESS";

export type FilterType =
  | "select"
  | "multi-select"
  | "text"
  | "dateRange";

export type FilterOption = {
  label: string;
  value: string;
};

// Value shape used by dateRange filter fields.
export type DateRangeValue = {
  from?: string;
  to?: string;
};

export type FilterField = {
  key: string;
  label: string;
  type: "select" | "text" | "dateRange";
  options?: { label: string; value: string }[];
  defaultValue?: string | DateRangeValue | null;
  icon?: LucideIcon;
};
