
import type { PermissionAction } from "@/types/user";

/*
|--------------------------------------------------------------------------
| TABLE ACTION KEYS
|--------------------------------------------------------------------------
*/

export type TableActionKey =
  | "view"
  | "edit"
  | "delete"
  | "create"
  | "toggleStatus"
  | "manageAccess"
  | "updatePassword"
  | "updateRole"
  | "updateHierarchy"
  | "manageFormulaVariables"
  | "submit"
  | "return"
  | "approve"
  | "issue"
  | "applyDiscount"
  | "cancel"
  | "void"
  | "pay"
  | "print"
  | "download";

/*
|--------------------------------------------------------------------------
| ACTION PERMISSION
|--------------------------------------------------------------------------
*/

export interface TableActionPermission {
  resource: string;
  action: PermissionAction;
}

/*
|--------------------------------------------------------------------------
| TABLE ACTION CONFIG
|--------------------------------------------------------------------------
*/

export interface TableActionConfig {
  /**
   * Whether this action is supported/enabled
   * by this table configuration.
   */
  enabled?: boolean;

  /**
   * Permission required to perform this action.
   *
   * Example:
   *
   * {
   *   resource: "invoices",
   *   action: "issue"
   * }
   */
  permission?: TableActionPermission;
}

/*
|--------------------------------------------------------------------------
| TABLE CONFIG
|--------------------------------------------------------------------------
*/

export type CommentTableConfig = {
  columns: string[];

  actions: Partial<
    Record<TableActionKey, TableActionConfig>
  >;
};

/*
|--------------------------------------------------------------------------
| TABLE REGISTRY
|--------------------------------------------------------------------------
*/

export const CommentTableRegistry: Record<
  string,
  CommentTableConfig
> = {
  /*
  |--------------------------------------------------------------------------
  | ADMINISTRATIVE UNITS
  |--------------------------------------------------------------------------
  */

  administrativeUnit: {
    columns: ["name", "code", "level"],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "administrative_units",
          action: "read",
        },
      },

      edit: {
        enabled: false,
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | SECTORS
  |--------------------------------------------------------------------------
  */

  sector: {
    columns: ["name", "cluster_name", "code"],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "sectors",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "sectors",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "sectors",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | ROLES
  |--------------------------------------------------------------------------
  */

  role: {
    columns: [
      "name",
      "description",
      "usersCount",
      "permissionsCount",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "roles",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "roles",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "roles",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | USER MANAGEMENT
  |--------------------------------------------------------------------------
  */

  user: {
    columns: [
      "avatar",
      "name",
      "email",
      "phone",
      "role",
      "level",
      "is_active",
      "last_login_at",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "users",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "users",
          action: "update",
        },
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: true,
        permission: {
          resource: "users",
          action: "update",
        },
      },

      updatePassword: {
        enabled: true,
        permission: {
          resource: "users",
          action: "update_password",
        },
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | TAXPAYERS
  |--------------------------------------------------------------------------
  */

  taxpayer: {
    columns: [
      "citizen_uid",
      "full_name",
      "national_id",
      "phone",
      "gender",
      "source",
      "status",
      "last_login_at",
      "registered_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "citizens",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "citizens",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "citizens",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | REVENUE CATEGORIES
  |--------------------------------------------------------------------------
  */

  revenueCategory: {
    columns: [
      "name",
      "revenueDomain",
      "codeRange",
      "codesCount",
      "status",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "revenue_categorys",
          action: "view",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "revenue_categorys",
          action: "update",
        },
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | REVENUE SERVICES
  |--------------------------------------------------------------------------
  */

  revenueService: {
    columns: [
      "name",
      "revenueCode",
      "serviceType",
      "collectionMode",
      "requiredFields",
      "status",
      "createdAt",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "revenue_services",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "revenue_services",
          action: "update",
        },
      },

      delete: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      manageAccess: {
        enabled: true,
        permission: {
          resource: "revenue_services",
          action: "manage",
        },
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | BASE FIELDS
  |--------------------------------------------------------------------------
  */

  baseField: {
    columns: [
      "name",
      "code",
      "dataType",
      "unit_code",
      "status",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "base_fields",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "base_fields",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "base_fields",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: true,
        permission: {
          resource: "base_fields",
          action: "update",
        },
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | MEASUREMENT UNITS
  |--------------------------------------------------------------------------
  */

  measurementUnit: {
    columns: [
      "name",
      "symbol",
      "status",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "measurement_units",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "measurement_units",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "measurement_units",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: true,
        permission: {
          resource: "measurement_units",
          action: "update",
        },
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | TARIFF RULES
  |--------------------------------------------------------------------------
  */

  tariffRule: {
    columns: [
      "code",
      "name",
      "serviceName",
      "revenueCode",
      "calculationType",
      "amount",
      "status",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "tariff",
          action: "view",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "tariff",
          action: "update",
        },
      },

      delete: {
        enabled: true,
        permission: {
          resource: "tariff",
          action: "delete",
        },
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },

      manageFormulaVariables: {
        enabled: true,
        permission: {
          resource: "tariff_formula",
          action: "view",
        },
      },
    },
  },

 /*
|--------------------------------------------------------------------------
| ASSESSMENTS
|--------------------------------------------------------------------------
*/

assessment: {
  columns: [
    "assessment_number",
    "taxpayer_name",
    "taxpayer_no",
    "status",
    "created_at",
    "created_by",
  ],

  actions: {
    /*
    |--------------------------------------------------------------------------
    | CORE ACTIONS
    |--------------------------------------------------------------------------
    */

    view: {
      enabled: true,
      permission: {
        resource: "assessment",
        action: "view",
      },
    },

    edit: {
      enabled: true,
      permission: {
        resource: "assessment",
        action: "update",
      },
    },

    delete: {
      enabled: true,
      permission: {
        resource: "assessment",
        action: "delete",
      },
    },

    create: {
      enabled: false,
    },

    toggleStatus: {
      enabled: false,
    },

    /*
    |--------------------------------------------------------------------------
    | ACCESS / SECURITY
    |--------------------------------------------------------------------------
    */

    updatePassword: {
      enabled: false,
    },

    updateRole: {
      enabled: false,
    },

    updateHierarchy: {
      enabled: false,
    },

    manageAccess: {
      enabled: false,
    },

    manageFormulaVariables: {
      enabled: false,
    },

    /*
    |--------------------------------------------------------------------------
    | WORKFLOW ACTIONS
    |--------------------------------------------------------------------------
    */


    return: {
      enabled: true,
      permission: {
        resource: "assessment",
        action: "return",
      },
    },

    approve: {
      enabled: true,
      permission: {
        resource: "assessment",
        action: "approve",
      },
    },
  },
},

  /*
  |--------------------------------------------------------------------------
  | INVOICES
  |--------------------------------------------------------------------------
  */

  invoice: {
    columns: [
      "invoice_number",
      "citizen_name",
      "total_amount",
      "currency",
      "issued_at",
      "due_date",
      "status",
    ],

    actions: {
      /*
      |--------------------------------------------------------------------------
      | Basic Invoice Access
      |--------------------------------------------------------------------------
      */

      view: {
        enabled: true,
        permission: {
          resource: "invoices",
          action: "read",
        },
      },

      edit: {
        enabled: false,
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      /*
      |--------------------------------------------------------------------------
      | User Management Actions
      |--------------------------------------------------------------------------
      */

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },

      /*
      |--------------------------------------------------------------------------
      | Management Actions
      |--------------------------------------------------------------------------
      */

      manageAccess: {
        enabled: false,
      },

      manageFormulaVariables: {
        enabled: false,
      },

      /*
      |--------------------------------------------------------------------------
      | Assessment Workflow Actions
      |--------------------------------------------------------------------------
      */

      submit: {
        enabled: false,
      },

      return: {
        enabled: false,
      },

      approve: {
        enabled: false,
      },

      /*
      |--------------------------------------------------------------------------
      | Invoice Actions
      |--------------------------------------------------------------------------
      */
      
      
      
      applyDiscount: {
        enabled: true,
        permission: {
          resource: "penalty_discount_requests",
          action: "create",
        },
      },
      
      cancel: {
        enabled: true,
        permission: {
          resource: "invoices",
          action: "cancel",
        },
      },
      
      void: {
        enabled: true,
        permission: {
          resource: "invoices",
          action: "void",
        },
      },
      
      pay: {
        enabled: true,
        permission: {
          resource: "payments",
          action: "collect",
        },
      },
      
      print: {
        enabled: true,
        permission: {
          resource: "invoices",
          action: "read",
        },
      },
      
      download: {
        enabled: true,
        permission: {
          resource: "invoices",
          action: "read",
        },
      },
      
      
    },
  },

  /*
  |--------------------------------------------------------------------------
  | CLOSURES
  |--------------------------------------------------------------------------
  */

  closure: {
    columns: [
      "isn",
      "business_name",
      "requested_by",
      "status",
      "created_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "closures",
          action: "read",
        },
      },

      edit: {
        enabled: false,
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: true,
        permission: {
          resource: "closures",
          action: "update",
        },
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | RESOLUTIONS
  |--------------------------------------------------------------------------
  */

  resolution: {
    columns: [
      "isn",
      "business_name",
      "business_status",
      "status",
      "resolved_by",
      "resolved_at",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "resolutions",
          action: "read",
        },
      },

      edit: {
        enabled: true,
        permission: {
          resource: "resolutions",
          action: "update",
        },
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | BUSINESSES
  |--------------------------------------------------------------------------
  */

  business: {
    columns: [
      "business_name",
      "business_type",
      "status",
      "map_location_link",
    ],

    actions: {
      view: {
        enabled: true,
        permission: {
          resource: "businesses",
          action: "read",
        },
      },

      edit: {
        enabled: false,
      },

      delete: {
        enabled: false,
      },

      create: {
        enabled: false,
      },

      toggleStatus: {
        enabled: false,
      },

      updatePassword: {
        enabled: false,
      },

      updateRole: {
        enabled: false,
      },

      updateHierarchy: {
        enabled: false,
      },
    },
  },
};
