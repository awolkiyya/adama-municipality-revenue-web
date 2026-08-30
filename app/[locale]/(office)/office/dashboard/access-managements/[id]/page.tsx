"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import type { Permission, PermissionGroup } from "@/types/permission.types";
import {
  useDeleteRole,
  usePermissions,
  useRole,
  useRolePermissions,
} from "@/hooks/useAccessManagement";
import { PermissionModuleCard } from "@/components/cards/PermissionModuleCard";


export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roleId = params.id;

  const [openModules, setOpenModules] = useState<string[]>([]);

  const {
    data: roleResponse,
    isLoading: roleLoading,
    isError: roleError,
  } = useRole(roleId);

  const {
    data: rolePermissionsResponse,
    isLoading: rolePermissionsLoading,
  } = useRolePermissions(roleId);

  const {
    data: allPermissionsResponse,
    isLoading: allPermissionsLoading,
  } = usePermissions({ per_page: 100 });

  const deleteRoleMutation = useDeleteRole();

  const role = roleResponse?.data;

  const assignedPermissionNames = useMemo(
    () => (rolePermissionsResponse?.data ?? []).map((permission) => permission.name),
    [rolePermissionsResponse]
  );
  const selectedSet = useMemo(
    () => new Set(assignedPermissionNames),
    [assignedPermissionNames]
  );



  const pageLoading = roleLoading || rolePermissionsLoading;

  async function handleDelete() {
    if (!roleId) return;

    try {
      await deleteRoleMutation.mutateAsync(roleId);
      router.push("/access-management/roles");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete role"
      );
    }
  }

  // ---- Error state ----

  if (roleError) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this role. It may have been deleted, or you
          may not have access to it.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <UserCog className="size-5" />
              {roleLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                <h1 className="text-xl font-semibold">{role?.name}</h1>
              )}

              {role && (
                <Badge variant="secondary">
                  {role.usersCount ?? 0} {role.usersCount === 1 ? "user" : "users"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Role details and assigned permissions
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/access-management/roles/${roleId}/edit`)}
          >
            <Pencil className="size-4" />
            Edit Role
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <span className="font-medium">{role?.name}</span>. Users
                  currently assigned to this role will lose the permissions
                  it grants. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteRoleMutation.isPending}
                  onClick={handleDelete}
                >
                  {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      {/* Role information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserCog className="size-4" />
            Role Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {roleLoading ? (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </>
          ) : (
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium mt-0.5">{role?.name}</dd>
              </div>

              {role?.description && (
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-medium mt-0.5">{role.description}</dd>
                </div>
              )}

              <div>
                <dt className="text-muted-foreground">Users assigned</dt>
                <dd className="font-medium mt-0.5">{role?.usersCount ?? 0}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Permissions granted</dt>
                <dd className="font-medium mt-0.5">
                  {allPermissionsLoading || rolePermissionsLoading
                    ? "—"
                    : ` ${role?.permissionsCount}`}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" />
            Permissions
          </CardTitle>
        </CardHeader>

        <CardContent>
          {allPermissionsLoading || rolePermissionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : allPermissionsResponse?.data!.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              No permissions available.
            </p>
          ) : (
            <Accordion
              type="multiple"
              value={openModules}
              onValueChange={setOpenModules}
              className="space-y-2"
            >
              {allPermissionsResponse?.data!.map((group) => (
                <PermissionModuleCard
                  key={group.key}
                  value={group.key}
                  group={group}
                  selected={selectedSet}
                  onChange={() => {
                    // Read-only view — permission changes happen on the Edit Role page.
                  }}
                  disabled
                />
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}