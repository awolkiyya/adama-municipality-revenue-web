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
  
  export type TableActionConfig = {
    enabled: boolean;
  };
  
  export type CommentTableConfig = {
    columns: string[];
  
    actions: Partial<Record<TableActionKey, TableActionConfig>>;
  };

export const CommentTableRegistry: Record<string, CommentTableConfig> = {
  administrativeUnit:{
    columns: ["name", "code","level"],
    actions: {
      view: { enabled: true },
      edit: { enabled: false },
      delete: { enabled: false },
      create: { enabled: false },
      toggleStatus: {
        enabled: false
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },
    },

  },
  sector: {
    columns: ["name", "cluster_name", "code"],
    actions: {
      view: { enabled: true },
      edit: { enabled: true },
      delete: { enabled: true },
      create: { enabled: false },
      toggleStatus: {
        enabled: false
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },
    },
  },

  role: {
    columns: [
        "name",
        "description",
        "usersCount",
        "permissionsCount",
        "created_at",
    ],
    actions: {
        view: { enabled: true },
        edit: { enabled: true },
        delete: { enabled: true },
        create: { enabled: false },
        toggleStatus: { enabled: false },
        updatePassword: { enabled: false },
        updateRole: { enabled: false },
        updateHierarchy: { enabled: false },
    },
},

 /**
 * =========================
 * USER MANAGEMENT MODULE
 * =========================
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

  /**
   * =========================
   * ACTIONS (ALL IN ONE)
   * =========================
   */
  actions: {
    view: { enabled: true },
    edit: { enabled: true },
    delete: { enabled: false }, // SYSTEM_ADMIN only (policy controlled)
    create: { enabled: false },

    // Account actions
    toggleStatus: { enabled: true },
    updatePassword: { enabled: true },
    updateRole: { enabled: false }, // SYSTEM_ADMIN only
    updateHierarchy: { enabled: false },
  },
},
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
      view: { enabled: true },


      edit: { enabled: true },
      delete: {
        enabled: true
      },
      create: {
        enabled: false
      },
      toggleStatus: {
        enabled: false
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },

    },
  },


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
      },
  
  
      edit: {
        enabled: true,
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
      },
  
      edit: {
        enabled: true,
      },
  
      delete: {
        enabled: false,
      },
  
      toggleStatus: {
        enabled: false,
      },
  
      manageAccess: {
        enabled: true,
      },
    },
  },

  baseField: {
    columns: ["name", "code", "dataType", "unit_code", "status", "created_at"],
    actions: {
      view: { enabled: true },
      edit: { enabled: true },
      delete: { enabled: true },
      create: { enabled: false },
      toggleStatus: { enabled: true },
      updatePassword: { enabled: false },
      updateRole: { enabled: false },
      updateHierarchy: { enabled: false },
    },
  },

  measurementUnit: {
    columns: [
      "name",
      "symbol",
      "status",
      "created_at",
    ],
 
    actions: {
      view: { enabled: true },
      edit: { enabled: true },
      delete: { enabled: true },
      create: { enabled: false },
      toggleStatus: { enabled: true },
      updatePassword: { enabled: false },
      updateRole: { enabled: false },
      updateHierarchy: { enabled: false },
    },
  },
  tariffRule: {
    columns: [
      "code",
      "name",
      "serviceName",
      "serviceCode",
      "calculationType",
      "amount",
      "status",
    ],

    actions: {
      view: { enabled: true },
      edit: { enabled: true },
      delete: { enabled: true },
      create: { enabled: false },
      toggleStatus: { enabled: false },
      updatePassword: { enabled: false },
      updateRole: { enabled: false },
      updateHierarchy: { enabled: false },
      manageFormulaVariables: {
        enabled: true,
      },
    },
  },


  assessment: {
    columns: [
      "assessment_number",
      "taxpayer_name",
      "taxpayer_no",
      "status",
      "created_at",
      "created_by"
    ],
  
    actions: {
      // Always allow opening the assessment details.
      view: {
        enabled: true,
      },
  
      // Useful for DRAFT and RETURNED assessments.
      // Actual availability should still be controlled
      // by backend permissions/status rules.
      edit: {
        enabled: true,
      },
  
      // Do not physically delete assessments in normal
      // production workflow.
      delete: {
        enabled: false,
      },
  
      // Creation is normally handled by the
      // "New Assessment" page action.
      create: {
        enabled: false,
      },
  
      // Status changes happen through workflow,
      // not a generic status toggle.
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
  
      manageAccess: {
        enabled: false,
      },
  
      manageFormulaVariables: {
        enabled: false,
      },
  
      // Workflow actions
      submit: {
        enabled: true,
      },
  
      return: {
        enabled: true,
      },
  
      approve: {
        enabled: false,
      },
    },
  },

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
      view: {
        enabled: true,
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
  
      manageAccess: {
        enabled: false,
      },
  
      manageFormulaVariables: {
        enabled: false,
      },
  
      submit: {
        enabled: false,
      },
  
      return: {
        enabled: false,
      },
  
      approve: {
        enabled: false,
      },
  
      issue: {
        enabled: false,
      },
  
      applyDiscount: {
        enabled: true,
      },
  
      cancel: {
        enabled: true,
      },
  
      void: {
        enabled: true,
      },
  
      pay: {
        enabled: true,
      },
  
      print: {
        enabled: true,
      },
  
      download: {
        enabled: true,
      },
    },
  },

  closure: {
    columns: [
      "isn",
      "business_name",
      "requested_by",
      "status",
      "created_at",
    ],

    actions: {
      view: { enabled: true },


      edit: { enabled: false },
      delete: {
        enabled: false
      },
      create: {
        enabled: false
      },
      
      toggleStatus: {
        enabled: true
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },

    },
  },

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
      view: { enabled: true },


      edit: { enabled: true },
      delete: {
        enabled: false
      },
      create: {
        enabled: false
      },
      
      toggleStatus: {
        enabled: false
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },

    },
  },

  business: {
    columns: [
      "business_name",
      "business_type",
      "status",
      "map_location_link",
    ],

    actions: {
      view: { enabled: true },


      edit: { enabled: false },
      delete: {
        enabled: false
      },
      create: {
        enabled: false
      },
      
      toggleStatus: {
        enabled: false
      },
      updatePassword: {
        enabled: false
      },
      updateRole: {
        enabled: false
      },
      updateHierarchy: {
        enabled: false
      },

    },
  },
};