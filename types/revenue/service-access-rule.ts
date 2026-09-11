import { LucideIcon } from "lucide-react";

/* =========================================================
   RELATIONS
========================================================= */

export interface ServiceAccessRuleRelation {
  id: string;
  name: string;
}

/* =========================================================
   SERVICE ACCESS RULE
========================================================= */

export interface ServiceAccessRule {
  id: string;

  service: ServiceAccessRuleRelation;

  sector: ServiceAccessRuleRelation;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   CREATE RULE PAYLOAD
========================================================= */

/**
 * Used only if the individual create endpoint is still kept.
 *
 * POST /revenue/services/{serviceId}/access-rules
 *
 * Note:
 * The current recommended frontend flow uses the bulk
 * sync endpoint instead of creating individual rules.
 */
export interface CreateServiceAccessRulePayload {
  sector_id: string;

  is_active?: boolean;
}

/* =========================================================
   UPDATE SINGLE RULE PAYLOAD
========================================================= */

/**
 * Used by:
 *
 * PATCH /revenue/services/{serviceId}/access-rules/{ruleId}
 */
export interface UpdateServiceAccessRulePayload {
  sector_id?: string;

  is_active?: boolean;
}

/* =========================================================
   BULK SYNC PAYLOAD
========================================================= */

/**
 * Used by:
 *
 * PUT /revenue/services/{serviceId}/access-rules
 *
 * Example:
 *
 * {
 *   sectors: [
 *     {
 *       sectorId: "uuid",
 *       sectorName: "Finance",
 *       isActive: true
 *     },
 *     {
 *       sectorId: "uuid",
 *       sectorName: "Revenue",
 *       isActive: false
 *     }
 *   ]
 * }
 */

export interface ServiceAccessSectorPayload {
  sectorId: string;

  /**
   * Display-only value.
   *
   * The backend does not persist this field.
   */
  sectorName?: string;

  /**
   * true  = sector is allowed
   * false = sector is not allowed
   */
  isActive: boolean;
}

export interface UpdateServiceAccessRequestPayload {
  sectors: ServiceAccessSectorPayload[];
}

/* =========================================================
   DIALOG ACCESS TYPES
========================================================= */

/**
 * Existing access information passed to
 * ServiceAccessDialog.
 */
export interface ServiceAccessDialogAccess {
  id: string;

  sectorId: string;

  isActive: boolean;
}

/**
 * Sector access row used by the dialog.
 */
export interface SectorAccess {
  sectorId: string;

  sectorName: string;

  isActive: boolean;
}

/**
 * Dialog form values.
 */
export interface ServiceAccessFormValues {
  sectors: SectorAccess[];
}

/* =========================================================
   SUMMARY
========================================================= */

export interface ServiceAccessRuleSummary {
  /**
   * Total configured service-sector rules.
   */
  total: number;

  /**
   * Number of unique sectors represented
   * in the access rules.
   */
  sectors: number;

  /**
   * Number of allowed sectors.
   */
  active: number;

  /**
   * Number of sectors that are not allowed.
   */
  inactive: number;
}