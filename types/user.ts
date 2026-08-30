export type UserRole =
  
  | "SYSTEM_ADMIN"
  | "DATA_MANAGER"
  | "EXECUTIVE_VIEWER"
  | "SECTOR_OFFICER"
  | "REGISTRATION_OFFICER"
  | "REVENUE_DECISION_OFFICER"
  | "REVENUE_COMPLAINT_OFFICER"
  | "REVENUE_TAX_ADMINISTRATION_OFFICER"
  | "REVENUE_COLLECTOR";


export type AdministrativeLevel = "CITY" | "SUBCITY" | "WEREDA";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "update_password"
  | "activate"
  | "deactivate"
  | "assign_roles"
  | "view_history"
  | "assign_permissions"
  | "revoke_permissions"
  | "verify"
  | "import"
  | "submit"
  | "approve"
  | "reject"
  | "collect"
  | "issue"
  | "cancel"
  | "recalculate"
  | "calculate"
  | "apply"
  | "adjust"
  | "waive"
  | "remove"
  | "review"
  | "request_information"
  | "recommend"
  | "escalate"
  | "reverse"
  | "print"
  | "reprint"
  | "generate"
  | "export"
  | "manage"
  | "close"
  | "upload";

export interface UserPermission {
  resource: string;
  actions: PermissionAction[];
}

  export interface CitizenProfile {
    id: string;
    citizen_uid: string;
    full_name: string;
    national_id: string;
    address: string;
    gender: Gender;
    date_of_birth: string;
    registered_sector_id: string;
  }
  
  export interface AuthUser {
    id: string;
    name: string;
    label: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
  
    user_type: "employee" | "citizen";
    is_active: boolean;
    is_phone_verified: boolean;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
  
    administrative_unit: {
      id: string;
      name: string;
      code: string;
      level: AdministrativeLevel;
      context: {
        city: { id: string; name: string } | null;
        subcity: { id: string; name: string } | null;
        wereda: { id: string; name: string } | null;
      };
    };
  
    sector?: {
      id: string;
      name: string;
      code?: string | null;
    } | null;
  
    citizen?: CitizenProfile | null;
  
    emailVerifiedAt: boolean;
    lastLoginAt: string;
  
    createdAt: string;
    updatedAt: string;
  
    role?: {
      id: string;
      name: UserRole;
      label: string;
    } | null;
  
    roles?: string[];
  
    permissions?: UserPermission[];
  }

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  token_type: string;
}


















// for create and update
export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  avatar?: string;

  role: UserRole;
  level?: AdministrativeLevel;

  sector_id?: number;
  city_id?: number;
  subcity_id?: number;
  wereda_id?: number;

  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;

  role?: UserRole;
  level?: AdministrativeLevel;

  sector_id?: number | null;
  city_id?: number | null;
  subcity_id?: number | null;
  wereda_id?: number | null;

  is_active?: boolean;
}


export interface UserQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  level?: string;
  is_active?: boolean;
  city_id?: number;
  subcity_id?: number;
  wereda_id?: number;
}

export type UserFormData = {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;

  // Role database ID
  role_id: number | null;

  password?: string;

  level: AdministrativeLevel;

  is_active: boolean;

  sector_id?: string;

  administrative_unit_id: string;
};