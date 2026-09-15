// =====================================================
// ASSESSMENT CONFIGURATION
// =====================================================

import {
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  UserPlus,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type {
  PermissionAction,
  UserPermission,
} from "@/types/user";

import { AssessmentFilters } from "./AssessmentToolbar";

// =====================================================
// PERMISSION
// =====================================================

export interface AssessmentPermission {
  resource: string;
  action: PermissionAction;
}

// =====================================================
// HEADER ACTION
// =====================================================

export type AssessmentHeaderActionType =
  | "CREATE"
  | "REGISTER_TAXPAYER"
  | "REGISTER_EXISTING_AGREEMENT";

export interface AssessmentHeaderAction {
  key: string;
  label: string;
  icon: LucideIcon;
  action: AssessmentHeaderActionType;
  permission: AssessmentPermission;
}

// =====================================================
// STATUS
// =====================================================

export type AssessmentStatus =
  | "ALL"
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "RETURNED"
  | "CANCELLED";

// =====================================================
// CONFIG
// =====================================================

export interface AssessmentConfig {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  headerActions: AssessmentHeaderAction[];
  allowedStatuses: AssessmentStatus[];
  defaultStatus: AssessmentStatus;
  tableDescription: string;
  emptyDescription: string;
}

// =====================================================
// BASE HEADER ACTIONS
// =====================================================

const ASSESSMENT_HEADER_ACTIONS: AssessmentHeaderAction[] = [
  {
    key: "register-taxpayer",
    label: "Register Taxpayer",
    icon: UserPlus,
    action: "REGISTER_TAXPAYER",
    permission: {
      resource: "citizens",
      action: "create",
    },
  },

  {
    key: "register-existing-agreement",
    label: "Register Existing Agreement",
    icon: FilePlus2,
    action: "REGISTER_EXISTING_AGREEMENT",
    permission: {
      resource: "assessment",
      action: "create",
    },
  },

  {
    key: "create-assessment",
    label: "New Assessment",
    icon: ClipboardCheck,
    action: "CREATE",
    permission: {
      resource: "assessment",
      action: "create",
    },
  },
];

// =====================================================
// ASSESSMENT CONFIG
// =====================================================

export const ASSESSMENT_CONFIG: AssessmentConfig = {
  title: "Revenue Assessments",

  description:
    "Create, manage, and submit revenue assessments. Tariff resolution and assessment calculation are handled by the backend Decision Provider.",

  badge: "Revenue Assessment",

  icon: Calculator,

  headerActions: ASSESSMENT_HEADER_ACTIONS,

  allowedStatuses: [
    "ALL",
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "RETURNED",
    "CANCELLED",
  ],

  defaultStatus: "ALL",

  tableDescription:
    "Manage revenue assessments within your permitted scope.",

  emptyDescription:
    "No revenue assessments have been created yet.",
};

// =====================================================
// DECISION CONFIG
// =====================================================

export const ASSESSMENT_DECISION_CONFIG: AssessmentConfig = {
  title: "Assessment Decisions",

  description:
    "Review submitted revenue assessments, verify the assessment details, and make the appropriate revenue decision.",

  badge: "Revenue Decision",

  icon: CheckCircle2,

  headerActions: [],

  allowedStatuses: [
    "ALL",
    "PENDING_APPROVAL",
    "APPROVED",
    "RETURNED",
    "CANCELLED",
  ],

  defaultStatus: "PENDING_APPROVAL",

  tableDescription:
    "Review submitted assessments and make revenue decisions.",

  emptyDescription:
    "There are no assessments awaiting your decision.",
};

// =====================================================
// PERMISSION CHECK
// =====================================================

export function hasAssessmentPermission(
  permissions: UserPermission[] = [],
  requiredPermission?: AssessmentPermission,
): boolean {
  if (!requiredPermission) {
    return false;
  }

  return permissions.some(
    (permission) =>
      permission.resource === requiredPermission.resource &&
      permission.actions.includes(requiredPermission.action),
  );
}

// =====================================================
// HEADER ACTION RESOLUTION
// =====================================================

export function resolveAssessmentHeaderActions(
  config: AssessmentConfig,
  permissions: UserPermission[] = [],
): AssessmentHeaderAction[] {
  return config.headerActions.filter((action) =>
    hasAssessmentPermission(
      permissions,
      action.permission,
    ),
  );
}

// =====================================================
// ASSESSMENT UI CAPABILITIES
// =====================================================

export interface AssessmentCapabilities {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canVerify: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReturn: boolean;
  canExport: boolean;
}

// =====================================================
// CAPABILITY RESOLUTION
// =====================================================

export function resolveAssessmentCapabilities(
  permissions: UserPermission[] = [],
): AssessmentCapabilities {
  const has = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return hasAssessmentPermission(
      permissions,
      {
        resource,
        action,
      },
    );
  };

  return {
    /*
    |--------------------------------------------------------------------------
    | VIEW
    |--------------------------------------------------------------------------
    |
    | `view` controls UI access to the assessment record.
    | `read` is kept separate for data/read permissions.
    |
    */
    canView:
      has("assessment", "view"),

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    canCreate:
      has("assessment", "create"),

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    canEdit:
      has("assessment", "update"),

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    canDelete:
      has("assessment", "delete"),

    /*
    |--------------------------------------------------------------------------
    | WORKFLOW
    |--------------------------------------------------------------------------
    */
    canSubmit:
      has("assessment", "submit"),

    canVerify:
      has("assessment", "verify"),

    canApprove:
      has("assessment", "approve"),

    canReject:
      has("assessment", "reject"),

    canReturn:
      has("assessment", "return"),

    /*
    |--------------------------------------------------------------------------
    | EXPORT
    |--------------------------------------------------------------------------
    */
    canExport:
      has("assessment", "export"),
  };
}

// =====================================================
// CONFIGURATION RESOLUTION
// =====================================================

export function getAssessmentConfig(
  permissions: UserPermission[] = [],
): AssessmentConfig {
  const canMakeDecision =
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "approve",
      },
    ) ||
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "reject",
      },
    ) ||
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "return",
      },
    ) ||
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "verify",
      },
    );

  if (canMakeDecision) {
    return ASSESSMENT_DECISION_CONFIG;
  }

  return ASSESSMENT_CONFIG;
}

// =====================================================
// INITIAL FILTERS
// =====================================================

export const INITIAL_ASSESSMENT_FILTERS: AssessmentFilters = {
  status: "ALL",

  date: null,
};