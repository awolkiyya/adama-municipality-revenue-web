"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PermissionSelector } from "@/components/input/PermissionSelector";
import type { Permission, PermissionGroup } from "@/types/permission.types";
import {
  useAssignRolePermissions,
  useRole,
  useRolePermissions,
  useUpdateRole,
  usePermissions,
} from "@/hooks/useAccessManagement";
import { Label } from "@/components/forms/UserForm";
import { Textarea } from "@/components/ui/textarea";


function setsAreEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export default function RoleEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roleId = params.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [originalName, setOriginalName] = useState("");

  const [permissions, setPermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);

  // ---- Data fetching ----

  const {
    data: rolePermissionsResponse,
    isLoading: rolePermissionsLoading,
    isError: roleError,
  } = useRole(roleId);

//   const {
//     data: rolePermissionsResponse,
//     isLoading: rolePermissionsLoading,
//   } = useRolePermissions(roleId);

  const {
    data: allPermissionsResponse,
    isLoading: allPermissionsLoading,
  } = usePermissions({ per_page: 100 });

  const updateRoleMutation = useUpdateRole();
  const assignPermissionsMutation = useAssignRolePermissions();

  const role = rolePermissionsResponse?.data;

  const isNameValid = name.trim().length > 0;



  // ---- Seed local form state once the role loads ----

  useEffect(() => {
    if (!role) return;
    setName(role.name);
    setDescription(role.description||"")
    setOriginalName(role.name);
  }, [role]);

  useEffect(() => {
    const assigned = role;
    console.log(assigned);
    if (!assigned) return;

    const names = assigned.permissions!.map((permission) => permission.name);
    setPermissions(names);
    setOriginalPermissions(names);
  }, [rolePermissionsResponse]);

  // ---- Dirty tracking ----

  const isNameDirty = name !== originalName;
  const isPermissionsDirty = useMemo(
    () => !setsAreEqual(new Set(permissions), new Set(originalPermissions)),
    [permissions, originalPermissions]
  );
  const isDirty = isNameDirty || isPermissionsDirty;

  const saving = updateRoleMutation.isPending || assignPermissionsMutation.isPending;
  const pageLoading =  rolePermissionsLoading;

  // ---- Actions ----

  async function handleSave() {
    if (!roleId || !isDirty) return;

    try {
      const tasks: Promise<unknown>[] = [];

      if (isNameDirty) {
        tasks.push(
          updateRoleMutation.mutateAsync({ id: roleId, data: { name } })
        );
      }

      if (isPermissionsDirty) {
        tasks.push(
          assignPermissionsMutation.mutateAsync({
            roleId,
            data: { permissions },
          })
        );
      }

      await Promise.all(tasks);

      setOriginalName(name);
      setOriginalPermissions(permissions);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save role changes"
      );
    }
  }

  function handleDiscard() {
    setName(originalName);
    setPermissions(originalPermissions);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>

        <div>
          <div className="flex items-center gap-2">
            <UserCog className="size-5" />
            <h1 className="text-xl font-semibold">Edit Role</h1>

            {role && (
              <Badge variant="secondary">
                {role.usersCount ?? 0}{" "}
                {role.usersCount === 1 ? "user" : "users"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Update role access permissions
          </p>
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

        <CardContent>
          {rolePermissionsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-2">
            <Label required>
              Role Name
            </Label>

            <Input
              id="role-name"
              placeholder="Example: REVENUE_MANAGER"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
               {!isNameValid && (
              <p className="text-sm text-destructive">
                Role name is required.
              </p>
            )}

          <div className="space-y-2">
            <Label>
              Description (optional)
            </Label>

            <Textarea
              id="role-description"
              placeholder="Briefly describe the responsibilities and purpose of this role."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <p className="text-xs text-muted-foreground">
              This description helps administrators understand the role's purpose.
            </p>
          </div>
          </div>
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
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <PermissionSelector
              groups={allPermissionsResponse?.data||[]}
              value={permissions}
              onChange={setPermissions}
            />
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-2 px-4 py-3">
          <Button
            variant="outline"
            disabled={!isDirty || saving}
            onClick={handleDiscard}
          >
            Discard
          </Button>

          <Button
            disabled={!isDirty || saving || pageLoading}
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}