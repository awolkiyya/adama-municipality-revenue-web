"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import type { RootState } from "@/lib/store/store";
import type { CommentType } from "@/types/commen";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";
import { Toolbar } from "@/components/commen/Toolbar";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { SearchInput } from "@/components/input/SearchInput";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useDeleteRole,
  useRoles,
} from "@/hooks/useAccessManagement";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";
import ProtectedRoute from "@/components/access/ProtectedRoute";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ROLES_URL = "/office/dashboard/access-managements";

const CREATE_ROLE_URL = `${ROLES_URL}/create`;

const ROLE_DETAIL_URL = (roleId: string) =>
  `${ROLES_URL}/${encodeURIComponent(roleId)}`;

const ROLE_EDIT_URL = (roleId: string) =>
  `${ROLE_DETAIL_URL(roleId)}/edit`;

/*
|--------------------------------------------------------------------------
| API Role Shape
|--------------------------------------------------------------------------
*/

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  is_system?: boolean;
  usersCount?: number;
  permissionsCount?: number;
  createdAt?: string;
}

/*
|--------------------------------------------------------------------------
| Role Table Row
|--------------------------------------------------------------------------
*/

interface RoleRow {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  usersCount: number;
  permissionsCount: number;
  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| Debounced Value
|--------------------------------------------------------------------------
*/

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

/*
|--------------------------------------------------------------------------
| Protected Access Management Page
|--------------------------------------------------------------------------
*/

export default function AccessManagementPage() {
  return (
    <ProtectedRoute resource="roles" action="view">
      <AccessManagementPageContent />
    </ProtectedRoute>
  );
}

/*
|--------------------------------------------------------------------------
| Access Management Page Content
|--------------------------------------------------------------------------
*/

function AccessManagementPageContent() {
  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const [searchInput, setSearchInput] = useState("");

  const search = useDebouncedValue(searchInput, 400);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  /*
  |--------------------------------------------------------------------------
  | Delete Confirmation
  |--------------------------------------------------------------------------
  */

  const [roleToDelete, setRoleToDelete] =
    useState<RoleRow | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Roles Query
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useRoles({
    search,
    page,
    per_page: pageSize,
  });

  /*
  |--------------------------------------------------------------------------
  | Delete Mutation
  |--------------------------------------------------------------------------
  */

  const deleteRole = useDeleteRole();

  /*
  |--------------------------------------------------------------------------
  | Reset Pagination When Search Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setPage(1);
  }, [search]);

  /*
  |--------------------------------------------------------------------------
  | Transform API Roles
  |--------------------------------------------------------------------------
  */

  const roles: RoleRow[] = useMemo(() => {
    const apiRoles = data?.data as ApiRole[] | undefined;

    return (
      apiRoles?.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description ?? "No description",
        isSystem: role.is_system ?? false,
        usersCount: role.usersCount ?? 0,
        permissionsCount: role.permissionsCount ?? 0,
        createdAt: role.createdAt ?? "-",
      })) ?? []
    );
  }, [data]);

  /*
  |--------------------------------------------------------------------------
  | Table Actions
  |--------------------------------------------------------------------------
  */

  const actions = useMemo(
    () =>
      resolveActions(
        CommentTableRegistry.role,
        user?.permissions,
      ),
    [user?.permissions],
  );

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  function handleCreate() {
    router.push(CREATE_ROLE_URL);
  }

  function handleView(row: RoleRow) {
    router.push(ROLE_DETAIL_URL(row.id));
  }

  function handleEdit(row: RoleRow) {
    router.push(ROLE_EDIT_URL(row.id));
  }

  /*
  |--------------------------------------------------------------------------
  | Request Role Deletion
  |--------------------------------------------------------------------------
  */

  function handleDeleteRequest(id: string) {
    const selectedRole = roles.find((role) => role.id === id);

    if (!selectedRole) {
      toast.error("The selected role could not be found.");
      return;
    }

    setRoleToDelete(selectedRole);
  }

  /*
  |--------------------------------------------------------------------------
  | Confirm Role Deletion
  |--------------------------------------------------------------------------
  */

  async function handleDeleteConfirm() {
    if (!roleToDelete || deleteRole.isPending) {
      return;
    }

    try {
      await deleteRole.mutateAsync(roleToDelete.id);

      toast.success("Role deleted successfully.");

      setRoleToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete role.",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}

      <Banner
        description="Manage system roles, assign permissions, and control user access across the municipality platform."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-xs"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            Access Management
          </IconBadge>
        }
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-transparent"
        actions={
          <Button onClick={handleCreate} className="p-4">
            <Plus className="mr-2 size-4" />
            Create Role
          </Button>
        }
      />

      {/* Search Toolbar */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search roles..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
          />
        }
      />

      {/* Error State */}

      {isError && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div>
            <p className="text-sm font-medium">
              Unable to load roles
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred while retrieving roles."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Roles Table */}

      <CommenTable
        type={"role" as CommentType}
        data={roles}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(id) => handleDeleteRequest(String(id))}
        actions={actions}
      />

      {/* Pagination */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={data?.meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Delete Confirmation */}

      <AlertDialog
        open={Boolean(roleToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteRole.isPending) {
            setRoleToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this role?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {roleToDelete?.name}
              </span>
              .

              {roleToDelete && roleToDelete.usersCount > 0 && (
                <>
                  {" "}
                  It currently has {roleToDelete.usersCount}{" "}
                  {roleToDelete.usersCount === 1 ? "user" : "users"}{" "}
                  assigned. Those users may lose the permissions this
                  role grants.
                </>
              )}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRole.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRole.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteConfirm();
              }}
            >
              {deleteRole.isPending ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}