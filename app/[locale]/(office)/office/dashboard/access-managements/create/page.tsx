"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Save, ShieldCheck, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { PermissionGroup } from "@/types/permission.types";
import { PermissionSelector } from "@/components/input/PermissionSelector";
import { useCreateRole, usePermissions } from "@/hooks/useAccessManagement";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/forms/UserForm";

export default function RoleCreatePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [permissions, setPermissions] = useState<string[]>([]);

  // Load available permissions
  const { data: permissionResponse, isLoading: permissionsLoading } =
    usePermissions({ per_page: 100 });

  // Create role mutation
  const createRole = useCreateRole();



  const isNameValid = name.trim().length > 0;


  function handleSubmit() {
    if (!isNameValid) return;

    createRole.mutate(
      {
        name: name.trim(),
        description:description,
        permissions,
      },
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
            <h1 className="text-xl font-semibold">Create Role</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Define role access and permissions
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

        <CardContent className="space-y-4">
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
          </div>

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
        </CardContent>
      </Card>

     

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4" />
            Assign Permissions
          </CardTitle>
        </CardHeader>

        <CardContent>
          {permissionsLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading permissions...
            </p>
          ) : (
            <PermissionSelector
              groups={permissionResponse?.data||[]}
              value={permissions}
              onChange={setPermissions}
            />
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="fixed  bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div
          className="
            max-w-6xl mx-auto flex flex-col gap-3 px-4 py-3
            sm:flex-row sm:items-end sm:justify-end sm:gap-2
          "
        >
          

          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>

            <Button
              disabled={createRole.isPending || !isNameValid}
              onClick={handleSubmit}
              className="flex-1 sm:flex-none gap-2"
            >
              <Save className="size-4" />
              {createRole.isPending ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}