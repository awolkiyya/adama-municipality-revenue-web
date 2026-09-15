import { TableActionKey } from "../registry";
import type { PermissionAction } from "@/types/user";

export interface RequiredPermission {
  resource: string;
  action: PermissionAction;
}

export const ActionPermissions: Partial<
  Record<TableActionKey, RequiredPermission>
> = {
  /*
  |--------------------------------------------------------------------------
  | Common Actions
  |--------------------------------------------------------------------------
  */

  view: {
    resource: "RESOURCE",
    action: "view",
  },

  create: {
    resource: "RESOURCE",
    action: "create",
  },

  edit: {
    resource: "RESOURCE",
    action: "update",
  },

  delete: {
    resource: "RESOURCE",
    action: "delete",
  },

  toggleStatus: {
    resource: "RESOURCE",
    action: "update",
  },

  /*
  |--------------------------------------------------------------------------
  | User / Access Actions
  |--------------------------------------------------------------------------
  */

  updatePassword: {
    resource: "users",
    action: "update_password",
  },

  updateRole: {
    resource: "users",
    action: "assign_roles",
  },

  updateHierarchy: {
    resource: "users",
    action: "update",
  },

  manageAccess: {
    resource: "access_management",
    action: "update",
  },

  /*
  |--------------------------------------------------------------------------
  | Tariff / Formula Actions
  |--------------------------------------------------------------------------
  */

  manageFormulaVariables: {
    resource: "formula_variables",
    action: "update",
  },

  /*
  |--------------------------------------------------------------------------
  | Assessment Actions
  |--------------------------------------------------------------------------
  */

  submit: {
    resource: "assessment",
    action: "submit",
  },

  return: {
    resource: "assessment",
    action: "return",
  },

  approve: {
    resource: "assessment",
    action: "approve",
  },

  /*
  |--------------------------------------------------------------------------
  | Invoice Actions
  |--------------------------------------------------------------------------
  */

  issue: {
    resource: "invoices",
    action: "issue",
  },

  applyDiscount: {
    resource: "penalty_discount_requests",
    action: "create",
  },

  cancel: {
    resource: "invoices",
    action: "cancel",
  },

  void: {
    resource: "invoices",
    action: "void",
  },

  pay: {
    resource: "payments",
    action: "create",
  },

  print: {
    resource: "invoices",
    action: "read",
  },

  download: {
    resource: "invoices",
    action: "read",
  },
};