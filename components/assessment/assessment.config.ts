// =====================================================
// ASSESSMENT CONFIGURATION
// =====================================================

import {
    Calculator,
    CheckCircle2,
    ClipboardCheck,
    UserPlus,
  } from "lucide-react";
  
  import type { LucideIcon } from "lucide-react";
  import type { UserRole } from "@/types/user";
import { AssessmentFilters } from "./AssessmentToolbar";
  
  
  // =====================================================
  // ROLE
  // =====================================================
  
  export type AssessmentRole =
    | "SECTOR_OFFICER"
    | "REVENUE_DECISION_OFFICER";
  
  
  // =====================================================
  // HEADER ACTION
  // =====================================================
  
  export type AssessmentHeaderAction = {
    key: string;
    label: string;
    icon: LucideIcon;
    action:
      | "CREATE"
      | "REGISTER_TAXPAYER";
  };
  
  
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
  
  export type AssessmentConfig = {
    role: AssessmentRole;
  
    title: string;
    description: string;
    badge: string;
  
    icon: LucideIcon;
  
    headerActions: AssessmentHeaderAction[];
  
    allowedStatuses: AssessmentStatus[];
  
    defaultStatus: AssessmentStatus;
  
    canCreate: boolean;
    canRegisterTaxpayer: boolean;
  
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  
    canApprove: boolean;
    canReject: boolean;
    canReturn: boolean;
    canSubmit: boolean;
    canView: boolean;
  
    tableDescription: string;
    emptyDescription: string;
  };
  
  
  // =====================================================
  // SECTOR OFFICER
  // =====================================================
  
  const SECTOR_OFFICER_CONFIG: AssessmentConfig = {
    role: "SECTOR_OFFICER",
  
    title: "Revenue Assessments",
  
    description:
      "Create, manage, and submit revenue assessments for your assigned sector. Tariff resolution and assessment calculation are handled by the backend Decision Provider.",
  
    badge: "Revenue Assessment",
  
    icon: Calculator,
  
    headerActions: [
      {
        key: "register-taxpayer",
        label: "Register Taxpayer",
        icon: UserPlus,
        action: "REGISTER_TAXPAYER",
      },
      {
        key: "create-assessment",
        label: "New Assessment",
        icon: ClipboardCheck,
        action: "CREATE",
      },
    ],
  
    allowedStatuses: [
      "ALL",
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "RETURNED",
      "CANCELLED",
    ],
  
    defaultStatus: "ALL",
  
    canCreate: true,
    canRegisterTaxpayer: true,
  
    canEdit: true,
    canDelete: true,
    canExport: true,
  
    canApprove: false,
    canReject: false,
    canReturn: false,
    canSubmit: true,
  
    canView: true,
  
    tableDescription:
      "Manage assessments created within your assigned sector.",
  
    emptyDescription:
      "No revenue assessments have been created yet.",
  };
  
  
  // =====================================================
  // REVENUE DECISION OFFICER
  // =====================================================
  
  const REVENUE_DECISION_OFFICER_CONFIG: AssessmentConfig = {
    role: "REVENUE_DECISION_OFFICER",
  
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
  
    canCreate: false,
    canRegisterTaxpayer: false,
  
    canEdit: false,
    canDelete: false,
    canExport: true,
  
    canApprove: true,
    canReject: true,
    canReturn: true,
    canSubmit: false,
  
    canView: true,
  
    tableDescription:
      "Review assessments submitted by sector officers and make revenue decisions.",
  
    emptyDescription:
      "There are no assessments awaiting your decision.",
  };
  
  
  // =====================================================
  // CONFIG MAP
  // =====================================================
  
  export const ASSESSMENT_CONFIG: Record<
    AssessmentRole,
    AssessmentConfig
  > = {
    SECTOR_OFFICER:
      SECTOR_OFFICER_CONFIG,
  
    REVENUE_DECISION_OFFICER:
      REVENUE_DECISION_OFFICER_CONFIG,
  };
  
  
  // =====================================================
  // ROLE RESOLUTION
  // =====================================================
  
  export function resolveAssessmentRole(
    role: UserRole | string | undefined,
  ): AssessmentRole | null {
  
    switch (role) {
  
      case "SECTOR_OFFICER":
        return "SECTOR_OFFICER";
  
      case "REVENUE_DECISION_OFFICER":
        return "REVENUE_DECISION_OFFICER";
  
      default:
        return null;
    }
  }
  
  
  // =====================================================
  // CONFIG RESOLUTION
  // =====================================================
  
  export function getAssessmentConfig(
    role: UserRole | string | undefined,
  ): AssessmentConfig | null {
  
    const resolvedRole =
      resolveAssessmentRole(role);
  
    if (!resolvedRole) {
      return null;
    }
  
    return ASSESSMENT_CONFIG[
      resolvedRole
    ];
  }
// =====================================================
// INITIAL FILTERS
// =====================================================

  export const INITIAL_ASSESSMENT_FILTERS: AssessmentFilters = {
    status: "ALL",
    date: null,
  };