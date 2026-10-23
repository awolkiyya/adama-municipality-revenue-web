
export type RoleType = "SYSTEM" | "CUSTOM";

export interface RolePermission {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  type?: RoleType;
  guard_name?: string;

  description: string | null;

  usersCount: number;
  permissionsCount: number;

  permissions: RolePermission[];

  createdAt: string;
  updatedAt?: string;
}

export interface RoleQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  type?: RoleType;

  sort_by?:
    | "name"
    | "type"
    | "created_at"
    | "updated_at"
    | "users_count"
    | "permissions_count";

  sort_direction?: "asc" | "desc";
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string | null;
  permissions: string[];
}
