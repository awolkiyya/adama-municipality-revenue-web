export interface Permission {
    id: string;
    name: string;
    guardName: string;
}


export interface Role {
    id: number;
    name: string;
    guardName: string;
    usersCount:number;
    permissionsCount:number;

    description?: string;
    

    is_active: boolean;

    permissions?: Permission[];

    createdAt:string;
}


export interface RolePermissionPayload {
    permissions: string[];
}


export interface UserRolePayload {
    role_id: string;
}