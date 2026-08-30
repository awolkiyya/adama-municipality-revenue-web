import { UserRole } from "@/types/user";
import { TableActionKey } from "../registry";

export const ActionPermissions: Record<TableActionKey, UserRole[]> = {
    view: [
      "SYSTEM_ADMIN",
      "REVENUE_DECISION_OFFICER",
      "SECTOR_OFFICER",
      "REGISTRATION_OFFICER",
      "REVENUE_COLLECTOR",
      "DATA_MANAGER",
    ],
  
    create: [
      "SYSTEM_ADMIN",
      "SECTOR_OFFICER",
      "REGISTRATION_OFFICER",
      "REVENUE_COLLECTOR",
      "DATA_MANAGER",
    ],
  
    edit: [
      "SYSTEM_ADMIN",
      "DATA_MANAGER",
      "SECTOR_OFFICER",

    ],
  
    delete: [
      "SYSTEM_ADMIN",
      "DATA_MANAGER",
    ],
  
    toggleStatus: [
      "SYSTEM_ADMIN",
      "DATA_MANAGER",
    ],
  
    updatePassword: [
      "SYSTEM_ADMIN",
    ],
  
    updateRole: [
      "SYSTEM_ADMIN",
    ],
  
    updateHierarchy: [],
  
    manageAccess: [
      "SYSTEM_ADMIN",
      "DATA_MANAGER",
    ],
  
    manageFormulaVariables: [
      "SYSTEM_ADMIN",
      "DATA_MANAGER",
    ],
  
    submit: [],
  
    return: [],
  
    approve: [],
  
    /*
    |--------------------------------------------------------------------------
    | INVOICE ACTIONS
    |--------------------------------------------------------------------------
    */
  
    issue: [
      "SYSTEM_ADMIN",
      "REVENUE_COLLECTOR",
    ],
  
    applyDiscount: [
      "SYSTEM_ADMIN",
      "REVENUE_DECISION_OFFICER",
      "REVENUE_COLLECTOR",
      "SECTOR_OFFICER"
    ],
  

  
    cancel: [
      "SYSTEM_ADMIN",
      "REVENUE_DECISION_OFFICER",
      "SECTOR_OFFICER"

    ],
  
    void: [
      "SYSTEM_ADMIN",
    ],
  
    pay: [
      "SYSTEM_ADMIN",
      "REVENUE_COLLECTOR",
    ],
  
    print: [
      "SYSTEM_ADMIN",
      "REVENUE_COLLECTOR",
      "REVENUE_DECISION_OFFICER",
      "SECTOR_OFFICER",
    ],
  
    download: [
      "SYSTEM_ADMIN",
      "REVENUE_COLLECTOR",
      "REVENUE_DECISION_OFFICER",
      "SECTOR_OFFICER",
    ],
  };