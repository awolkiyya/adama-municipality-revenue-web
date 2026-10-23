
export interface Permission {
  id: string | number
  name: string
  guard_name?: string
  group?: string
  group_label?: string
  group_description?: string
  resource?: string
  label?: string
  description?: string
  action?: string
  action_label?: string
}

export interface PermissionGroupResponse {
  module: string
  key: string
  permissions: Permission[]
}
