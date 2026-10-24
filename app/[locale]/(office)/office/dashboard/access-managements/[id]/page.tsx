"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  KeyRound,
  LoaderCircle,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { PermissionGroup } from "@/types/permission.types";
import {
  useDeleteRole,
  usePermissions,
  useRole,
} from "@/hooks/useAccessManagement";
import { PermissionModuleCard } from "@/components/cards/PermissionModuleCard";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ROLES_URL = "/en/office/dashboard/access-managements";

const EDIT_ROLE_URL = (roleId: string) =>
  `${ROLES_URL}/${encodeURIComponent(roleId)}/edit`;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatRoleName(value?: string | null): string {
  if (!value?.trim()) {
    return "Unnamed Role";
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPermissionSearchText(permission: unknown): string {
  if (!permission || typeof permission !== "object") {
    return "";
  }

  const item = permission as Record<string, unknown>;

  return [
    item.name,
    item.label,
    item.description,
    item.action,
    item.action_label,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| Reusable Page State
|--------------------------------------------------------------------------
*/

function PageState({
  title,
  description,
  onBack,
  actionLabel = "Back to Roles",
}: {
  title: string;
  description: string;
  onBack: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <ShieldCheck className="size-9 text-muted-foreground" />

      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 size-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

function RoleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-md" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <Skeleton className="h-40 rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();

  const roleId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;

  const [openModules, setOpenModules] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Queries
  |--------------------------------------------------------------------------
  */

  const {
    data: roleResponse,
    isLoading: roleLoading,
    isError: roleError,
    error: roleErrorDetails,
    refetch: refetchRole,
  } = useRole(roleId);

  const {
    data: permissionsResponse,
    isLoading: permissionsLoading,
    isError: permissionsError,
    error: permissionsErrorDetails,
    refetch: refetchPermissions,
  } = usePermissions({ per_page: 100 });

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const deleteRoleMutation = useDeleteRole();

  /*
  |--------------------------------------------------------------------------
  | Derived Data
  |--------------------------------------------------------------------------
  */

  const role = roleResponse?.data;
  const assignedPermissions = role?.permissions ?? [];
  const permissionGroups = permissionsResponse?.data ?? [];

  const assignedPermissionNames = useMemo(
    () =>
      Array.from(
        new Set(
          assignedPermissions
            .map((permission) => permission.name)
            .filter(
              (name): name is string =>
                typeof name === "string" && name.trim().length > 0,
            ),
        ),
      ),
    [assignedPermissions],
  );

  const selectedSet = useMemo(
    () => new Set(assignedPermissionNames),
    [assignedPermissionNames],
  );

  const normalizedSearch = search.trim().toLowerCase();

  /*
   * Filter the permission catalog twice:
   * 1. Keep only permissions assigned to this role.
   * 2. Apply the search to the remaining assigned permissions.
   *
   * Empty modules are removed automatically.
   */
  const filteredGroups = useMemo(() => {
    return permissionGroups
      .map((group) => {
        const groupMetadata = group as typeof group & {
          module?: string;
          label?: string;
        };

        const groupLabel =
          groupMetadata.module ??
          groupMetadata.label ??
          group.key;

        const groupMatches =
          normalizedSearch.length > 0 &&
          groupLabel.toLowerCase().includes(normalizedSearch);

        const assigned = group.permissions.filter((permission) => {
          if (!selectedSet.has(permission.name)) {
            return false;
          }

          if (!normalizedSearch || groupMatches) {
            return true;
          }

          return getPermissionSearchText(permission).includes(
            normalizedSearch,
          );
        });

        return {
          ...group,
          permissions: assigned,
        };
      })
      .filter((group) => group.permissions.length > 0);
  }, [permissionGroups, selectedSet, normalizedSearch]);

  const assignedCount = assignedPermissionNames.length;
  const pageLoading = roleLoading;

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    if (!roleId || deleteRoleMutation.isPending) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(roleId);

      toast.success("Role deleted successfully.");
      router.push(ROLES_URL);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete role.",
      );
    }
  }

  function handleRetry() {
    if (roleError) {
      void refetchRole();
    }

    if (permissionsError) {
      void refetchPermissions();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Missing Route Parameter
  |--------------------------------------------------------------------------
  */

  if (!roleId) {
    return (
      <PageState
        title="Invalid role"
        description="A valid role ID was not provided in the URL."
        onBack={() => router.push(ROLES_URL)}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Role Error State
  |--------------------------------------------------------------------------
  */

  if (roleError || (!roleLoading && !role)) {
    return (
      <PageState
        title="Unable to load role"
        description={
          roleErrorDetails instanceof Error
            ? roleErrorDetails.message
            : "The role may have been deleted, or you may not have permission to view it."
        }
        onBack={() => router.push(ROLES_URL)}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (pageLoading || !role) {
    return <RoleDetailSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Permission Catalog Error State
  |--------------------------------------------------------------------------
  */

  if (permissionsError) {
    return (
      <PageState
        title="Unable to load permissions"
        description={
          permissionsErrorDetails instanceof Error
            ? permissionsErrorDetails.message
            : "We couldn't load the permissions catalog."
        }
        onBack={handleRetry}
        actionLabel="Retry"
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      {/* Header */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => router.push(ROLES_URL)}
            aria-label="Back to roles"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">
            <nav
              aria-label="Breadcrumb"
              className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                href={ROLES_URL}
                className="transition-colors hover:text-foreground"
              >
                Roles
              </Link>

              <span aria-hidden="true">/</span>

              <span className="text-foreground">Details</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />

              <h1 className="break-words text-2xl font-semibold tracking-tight">
                {formatRoleName(role.name)}
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Review role information and its assigned permissions.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 pl-[52px] sm:pl-0">
          <Button variant="outline" asChild>
            <Link href={EDIT_ROLE_URL(roleId)}>
              <Pencil className="mr-2 size-4" />
              Edit Role
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleteRoleMutation.isPending}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete this role?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  You are about to delete{" "}
                  <span className="font-semibold text-foreground">
                    {role.name}
                  </span>
                  . Users assigned to this role may lose the permissions
                  it grants. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleteRoleMutation.isPending}
                >
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteRoleMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDelete();
                  }}
                >
                  {deleteRoleMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 size-4" />
                      Delete Role
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Separator />

      {/* Overview */}

      <section
        aria-label="Role overview"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Role</p>

              <p className="mt-1 truncate text-lg font-semibold">
                {formatRoleName(role.name)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Assigned users
              </p>

              <p className="mt-1 text-lg font-semibold tabular-nums">
                {role.usersCount ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Assigned permissions
              </p>

              <p className="mt-1 text-lg font-semibold tabular-nums">
                {assignedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Role Information */}

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-base">Role Information</CardTitle>

          <CardDescription>
            Basic information about this access role.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Role name</p>

            <p className="mt-1 break-words text-sm font-semibold">
              {role.name ?? "-"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Display name</p>

            <p className="mt-1 break-words text-sm font-medium">
              {formatRoleName(role.name)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Description</p>

            <p className="mt-1 break-words text-sm font-medium">
              {role.description?.trim() || "No description provided."}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Users assigned
            </p>

            <p className="mt-1 text-sm font-medium tabular-nums">
              {role.usersCount ?? 0}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Permissions granted
            </p>

            <p className="mt-1 text-sm font-medium tabular-nums">
              {assignedCount}
            </p>
          </div>

          {role.createdAt && (
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Created</p>

              <p className="mt-1 text-sm font-medium">
                {role.createdAt}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Permissions Only */}

      <Card className="gap-0 py-0">
        <CardHeader className="gap-4 border-b px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4 text-muted-foreground" />
                Assigned Permissions
              </CardTitle>

              <CardDescription className="mt-1">
                Only permissions assigned to this role are displayed.
                Use Edit Role to change assignments.
              </CardDescription>
            </div>

            <Badge variant="secondary" className="w-fit tabular-nums">
              {assignedCount} assigned
            </Badge>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assigned permissions..."
              aria-label="Search assigned permissions"
              className="pl-9 pr-9"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear permission search"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {permissionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : assignedCount === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center">
              <KeyRound className="mx-auto size-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                No permissions assigned
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                This role does not have any assigned permissions.
              </p>

              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={EDIT_ROLE_URL(roleId)}>
                  <Pencil className="mr-2 size-4" />
                  Assign Permissions
                </Link>
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                No matching assigned permissions
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try another search term.
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {filteredGroups.length}{" "}
                  {filteredGroups.length === 1 ? "module" : "modules"}
                  {normalizedSearch ? " matching your search" : ""}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOpenModules(
                        filteredGroups.map((group) => group.key),
                      )
                    }
                  >
                    Expand all
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenModules([])}
                  >
                    Collapse all
                  </Button>
                </div>
              </div>

              <Accordion
                type="multiple"
                value={openModules}
                onValueChange={setOpenModules}
                className="space-y-2"
              >
                {filteredGroups.map((group) => (
                  <PermissionModuleCard
                    key={group.key}
                    value={group.key}
                    group={group as PermissionGroup}
                    selected={selectedSet}
                    onChange={() => {
                      // Read-only: change assignments on the Edit Role page.
                    }}
                    disabled
                  />
                ))}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer Actions */}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild>
          <Link href={ROLES_URL}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Roles
          </Link>
        </Button>

        <Button asChild>
          <Link href={EDIT_ROLE_URL(roleId)}>
            Edit Role
            <ArrowUpRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}