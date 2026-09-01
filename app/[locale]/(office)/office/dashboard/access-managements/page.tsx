"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2, Plus, Search, ShieldCheck } from "lucide-react";

import { RootState } from "@/lib/store/store";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Input } from "@/components/ui/input";
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

import { Toolbar } from "@/components/commen/Toolbar";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { CommentType } from "@/types/commen";

import {
  useDeleteRole,
  useRoles,
} from "@/hooks/useAccessManagement";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import { SearchInput } from "@/components/input/SearchInput";



/* ============================================================
   API ROLE SHAPE
============================================================ */

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  usersCount?: number;
  permissionsCount?: number;
  created_at: string;
}


/* ============================================================
   ROLE TABLE ROW
============================================================ */

interface RoleRow {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  usersCount: number;
  permissionsCount: number;
  createdAt: string;
}



/* ============================================================
   DEBOUNCED VALUE
============================================================ */

/**
 * Debounces a fast-changing value (e.g. a search input)
 * so downstream effects — like a network request — only
 * run after the value settles.
 */
function useDebouncedValue<T>(
  value: T,
  delayMs: number
): T {
  const [debounced, setDebounced] =
    useState(value);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebounced(value),
      delayMs
    );

    return () =>
      clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}


/* ============================================================
   PAGE
============================================================ */

export default function AccessManagementPage() {
  return (
    <ProtectedRoute
      resource="roles"
      action="view"
    >
      <AccessManagementPageContent />
    </ProtectedRoute>
  );
}


/* ============================================================
   ACCESS MANAGEMENT PAGE CONTENT
============================================================ */

function AccessManagementPageContent() {
  const router = useRouter();

  const user = useSelector(
    (state: RootState) =>
      state.auth.user
  );

  /* ----------------------------------------------------------
     Search
  ---------------------------------------------------------- */

  const [searchInput, setSearchInput] =
    useState("");

  const search =
    useDebouncedValue(
      searchInput,
      400
    );

  /* ----------------------------------------------------------
     Pagination
  ---------------------------------------------------------- */

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  /* ----------------------------------------------------------
     Delete
  ---------------------------------------------------------- */

  const [roleToDelete, setRoleToDelete] =
    useState<RoleRow | null>(null);

  /* ----------------------------------------------------------
     Roles query
  ---------------------------------------------------------- */

  const {
    data,
    isLoading,
    isError,
  } = useRoles({
    search,
    page,
    per_page: pageSize,
  });

  const deleteRole =
    useDeleteRole();

  /* ----------------------------------------------------------
     Reset page when search changes
  ---------------------------------------------------------- */

  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ----------------------------------------------------------
     Transform API roles
  ---------------------------------------------------------- */

  const roles: RoleRow[] =
    useMemo(() => {
      return (
        (
          data?.data as
            | ApiRole[]
            | undefined
        )?.map((role) => ({
          id: role.id,
          name: role.name,
          description:
            role.description ??
            "No description",
          isSystem:
            role.is_system,
          usersCount:
            role.usersCount ?? 0,
          permissionsCount:
            role.permissionsCount ??
            0,
          createdAt:
            role.created_at ?? "-",
        })) ?? []
      );
    }, [data]);

  /* ----------------------------------------------------------
     Delete request
  ---------------------------------------------------------- */

  function handleDeleteRequest(
    id: string
  ) {
    const role = roles.find(
      (r) => r.id === id
    );

    if (role) {
      setRoleToDelete(role);
    }
  }

  /* ----------------------------------------------------------
     Delete confirm
  ---------------------------------------------------------- */

  function handleDeleteConfirm() {
    if (!roleToDelete) {
      return;
    }

    deleteRole.mutate(
      roleToDelete.id,
      {
        onSettled: () =>
          setRoleToDelete(null),
      }
    );
  }

  /* ==========================================================
     AUTH STATE
  ========================================================== */

  /**
   * Still resolving the authenticated
   * user / role.
   */
  if (user === undefined) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />

        <div>
          <p className="text-sm font-medium">
            Checking permissions
          </p>

          <p className="text-xs text-muted-foreground">
            This will only take a moment
          </p>
        </div>
      </div>
    );
  }

  /**
   * Authenticated user exists but
   * does not have a role.
   */
  if (!user?.role) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium">
          No role assigned
        </p>

        <p className="text-xs text-muted-foreground">
          Contact an administrator to
          get access to this page.
        </p>
      </div>
    );
  }

  /* ----------------------------------------------------------
     Table actions
  ---------------------------------------------------------- */

  const actions =
    resolveActions(
      CommentTableRegistry.role,
      user.role.name
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Banner
        description="Manage system roles, assign permissions, and control user access across the municipality platform."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
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
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <Button
            onClick={() =>
              router.push(
                "/office/dashboard/access-managements/create"
              )
            }
            className="p-4"
          >
            <Plus className="mr-2 h-4 w-4" />

            Create Role
          </Button>
        }
      />

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search roles..."
            value={searchInput}
            onChange={(e) =>
              setSearchInput(
                e.target.value
              )
            }
          />
        }
      />

      {/* ======================================================
          ROLE TABLE
      ====================================================== */}

      <CommenTable
        type={
          "role" as CommentType
        }
        data={roles}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onView={(row) =>
          router.push(
            `/office/dashboard/access-managements/${row.id}`
          )
        }
        onEdit={(row) =>
          router.push(
            `/office/dashboard/access-managements/${row.id}/edit`
          )
        }
        onDelete={(id) =>
          handleDeleteRequest(
            id as string
          )
        }
        actions={actions}
      />

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={
          data?.meta?.total ?? 0
        }
        onPageChange={
          setPage
        }
        onPageSizeChange={(
          size
        ) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* ======================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) =>
          !open &&
          setRoleToDelete(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this role?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">
                {roleToDelete?.name}
              </span>
              .

              {roleToDelete &&
                roleToDelete.usersCount >
                  0 && (
                  <>
                    {" "}
                    It currently has{" "}
                    {
                      roleToDelete.usersCount
                    }{" "}
                    {roleToDelete.usersCount ===
                    1
                      ? "user"
                      : "users"}{" "}
                    assigned — they will
                    lose the permissions it
                    grants.
                  </>
                )}{" "}
              This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                deleteRole.isPending
              }
              onClick={
                handleDeleteConfirm
              }
            >
              {deleteRole.isPending
                ? "Deleting..."
                : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
