"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type {
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role"
import type {
  Permission,
  PermissionGroupResponse,
} from "@/types/permission"

import {
  useCreateRole,
  useRole,
  useUpdateRole,
} from "@/hooks/role/role.hooks"
import { usePermissions } from "@/hooks/permission/use-permissions"

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface PermissionGroup {
  key: string
  label: string
  description?: string
  permissions: Permission[]
}

/** A group as shown on screen: filtered permissions plus the full total. */
interface VisiblePermissionGroup extends PermissionGroup {
  totalCount: number
}

interface RoleFormState {
  key: string
  name: string
  selectedPermissions: string[]
}

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const ROLES_URL = "/en/office/dashboard/access-managements"

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatRoleName(value?: string | null): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Unnamed Role"
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function normalizeRoleName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function getRolePermissionNames(
  rolePermissions:
    | Array<{
        id?: string | number
        name?: string | null
      }>
    | null
    | undefined,
): string[] {
  if (!Array.isArray(rolePermissions)) {
    return []
  }

  return Array.from(
    new Set(
      rolePermissions
        .map((permission) => permission?.name)
        .filter(
          (name): name is string =>
            typeof name === "string" && name.trim().length > 0,
        )
        .map((name) => name.trim()),
    ),
  )
}

/**
 * Convert the grouped permissions API response into UI groups.
 * The backend module and key determine each group.
 */
function buildPermissionGroups(
  groups: PermissionGroupResponse[],
): PermissionGroup[] {
  if (!Array.isArray(groups)) {
    return []
  }

  return groups
    .filter(
      (group) =>
        group &&
        typeof group.key === "string" &&
        Array.isArray(group.permissions),
    )
    .map((group) => ({
      key: group.key,
      label: group.module || group.key,
      permissions: group.permissions,
    }))
}

/**
 * Keep selected permission names valid against the current
 * permissions catalog. Do not discard permissions merely because
 * their catalog data has not loaded yet.
 */
function getValidSelectedPermissions(
  selected: string[],
  availableNames: Set<string>,
): string[] {
  return Array.from(
    new Set(
      selected.filter(
        (name) =>
          typeof name === "string" &&
          name.trim().length > 0 &&
          availableNames.has(name),
      ),
    ),
  )
}

function hasSameItems(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false
  }

  const setB = new Set(b)

  return a.every((item) => setB.has(item))
}

function permissionMatchesQuery(
  permission: Permission,
  query: string,
): boolean {
  return [
    permission.label,
    permission.name,
    permission.description,
    permission.action_label,
    permission.action,
  ].some(
    (value) =>
      typeof value === "string" &&
      value.toLowerCase().includes(query),
  )
}

/*
|--------------------------------------------------------------------------
| Small building blocks
|--------------------------------------------------------------------------
*/

/** Full-area message used for loading and error states. */
function PageState({
  icon: Icon,
  title,
  message,
  loading = false,
  showBackLink = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  message?: string
  loading?: boolean
  showBackLink?: boolean
}) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center"
      role={loading ? "status" : undefined}
      aria-live={loading ? "polite" : undefined}
    >
      <Icon
        className={cn(
          "size-10 text-muted-foreground",
          loading && "animate-pulse",
        )}
      />

      <div>
        <h2 className="font-semibold">{title}</h2>

        {message && (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>

      {showBackLink && (
        <Button variant="outline" asChild>
          <Link href={ROLES_URL}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Roles
          </Link>
        </Button>
      )}
    </div>
  )
}

/** One selectable permission row. The whole row is clickable. */
function PermissionRow({
  permission,
  selected,
  disabled,
  onToggle,
}: {
  permission: Permission
  selected: boolean
  disabled: boolean
  onToggle: (permissionName: string, checked: boolean) => void
}) {
  const actionLabel =
    permission.action_label || permission.action || null

  return (
    <label
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:bg-muted/50",
        selected && "bg-primary/5",
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={selected}
        disabled={disabled}
        onCheckedChange={(checked) => {
          if (checked === true || checked === false) {
            onToggle(permission.name, checked)
          }
        }}
        aria-label={`Grant ${permission.name}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium">
            {permission.label || permission.name}
          </p>

          {actionLabel && (
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[11px] font-normal"
            >
              {actionLabel}
            </Badge>
          )}
        </div>

        {permission.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {permission.description}
          </p>
        )}

        <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
          {permission.name}
        </p>
      </div>
    </label>
  )
}

/** A collapsible group of permissions with a tri-state select-all. */
function PermissionGroupCard({
  group,
  selectedSet,
  isOpen,
  canCollapse,
  disabled,
  onToggleOpen,
  onToggleAll,
  onTogglePermission,
}: {
  group: VisiblePermissionGroup
  selectedSet: Set<string>
  isOpen: boolean
  canCollapse: boolean
  disabled: boolean
  onToggleOpen: (groupKey: string) => void
  onToggleAll: (group: VisiblePermissionGroup) => void
  onTogglePermission: (
    permissionName: string,
    checked: boolean,
  ) => void
}) {
  const visibleSelected = group.permissions.filter((permission) =>
    selectedSet.has(permission.name),
  ).length

  // Count against the whole group, not only what the filter shows.
  const allSelectedInGroup = group.permissions.length
    ? visibleSelected === group.permissions.length
    : false

  const checkState: boolean | "indeterminate" = allSelectedInGroup
    ? true
    : visibleSelected > 0
      ? "indeterminate"
      : false

  const panelId = `permission-group-${group.key}`

  return (
    <div
      id={`permission-group-card-${group.key}`}
      className="scroll-mt-24 overflow-hidden rounded-lg border bg-card"
    >
      <div className="flex items-center gap-3 bg-muted/30 px-4 py-2.5">
        <Checkbox
          checked={checkState}
          disabled={disabled || group.permissions.length === 0}
          onCheckedChange={() => onToggleAll(group)}
          aria-label={`Select all ${group.label} permissions`}
        />

        <button
          type="button"
          onClick={() => onToggleOpen(group.key)}
          disabled={!canCollapse}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left disabled:cursor-default"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {group.label}
            </span>

            {group.description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {group.description}
              </span>
            )}
          </span>

          <Badge
            variant={visibleSelected > 0 ? "secondary" : "outline"}
            className="shrink-0 tabular-nums"
          >
            {visibleSelected}/{group.totalCount}
          </Badge>

          {canCollapse && (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !isOpen && "-rotate-90",
              )}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {isOpen && (
        <div id={panelId} className="divide-y border-t">
          {group.permissions.map((permission) => (
            <PermissionRow
              key={permission.id}
              permission={permission}
              selected={selectedSet.has(permission.name)}
              disabled={disabled}
              onToggle={onTogglePermission}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Sidebar summary: type, progress, users and a jump list of groups. */
function OverviewCard({
  isSystemRole,
  selectedCount,
  totalCount,
  usersCount,
  groups,
  selectedSet,
  onJumpToGroup,
}: {
  isSystemRole: boolean
  selectedCount: number
  totalCount: number
  usersCount: number
  groups: PermissionGroup[]
  selectedSet: Set<string>
  onJumpToGroup: (groupKey: string) => void
}) {
  const percent =
    totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Overview</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-4">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Role type
            </dt>
            <dd className="font-medium">
              {isSystemRole ? "System" : "Custom"}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" aria-hidden="true" />
              Assigned users
            </dt>
            <dd className="font-medium tabular-nums">{usersCount}</dd>
          </div>
        </dl>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <KeyRound className="size-4" aria-hidden="true" />
              Permissions
            </span>
            <span className="font-medium tabular-nums">
              {selectedCount} / {totalCount}
            </span>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={selectedCount}
            aria-label="Selected permissions"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {groups.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Jump to module
            </p>

            <ul className="flex flex-col gap-0.5">
              {groups.map((group) => {
                const selectedInGroup = group.permissions.filter(
                  (permission) => selectedSet.has(permission.name),
                ).length

                return (
                  <li key={group.key}>
                    <button
                      type="button"
                      onClick={() => onJumpToGroup(group.key)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0 truncate">
                        {group.label}
                      </span>

                      <span
                        className={cn(
                          "shrink-0 text-xs tabular-nums",
                          selectedInGroup > 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {selectedInGroup}/{group.permissions.length}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function RoleFormPage() {
  const router = useRouter()
  const params = useParams<{ id?: string | string[] }>()

  /*
  |--------------------------------------------------------------------------
  | Route
  |--------------------------------------------------------------------------
  */

  const roleId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined

  const isEditMode = Boolean(roleId)

  /*
  |--------------------------------------------------------------------------
  | Queries
  |--------------------------------------------------------------------------
  */

  const {
    data: role,
    isLoading: isRoleLoading,
    isError: isRoleError,
    error: roleError,
  } = useRole(roleId)

  const {
    data: permissionResponses = [],
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
    error: permissionsError,
  } = usePermissions()

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()

  /*
  |--------------------------------------------------------------------------
  | Permission Groups
  |--------------------------------------------------------------------------
  */

  const permissionGroups = React.useMemo(
    () => buildPermissionGroups(permissionResponses),
    [permissionResponses],
  )

  const permissionList = React.useMemo(
    () => permissionGroups.flatMap((group) => group.permissions),
    [permissionGroups],
  )

  const availablePermissionNames = React.useMemo(
    () =>
      new Set(
        permissionList
          .map((permission) => permission.name)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          ),
      ),
    [permissionList],
  )

  /*
  |--------------------------------------------------------------------------
  | Initial Form Values
  |--------------------------------------------------------------------------
  */

  const formKey = roleId ?? "create-role"

  const initialName =
    isEditMode && role && typeof role.name === "string"
      ? role.name
      : ""

  const initialSelectedPermissions = React.useMemo(
    () =>
      isEditMode && role
        ? getRolePermissionNames(role.permissions)
        : [],
    [isEditMode, role],
  )

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  |
  | The key prevents state from a previously viewed role being reused
  | when navigating directly between role edit pages.
  |
  */

  const [formState, setFormState] =
    React.useState<RoleFormState>({
      key: "create-role",
      name: "",
      selectedPermissions: [],
    })

  const isCurrentForm = formState.key === formKey

  const name = isCurrentForm ? formState.name : initialName

  const selectedPermissions = isCurrentForm
    ? formState.selectedPermissions
    : initialSelectedPermissions

  const selectedSet = React.useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions],
  )

  /*
  |--------------------------------------------------------------------------
  | Permission Group Expansion
  |--------------------------------------------------------------------------
  */

  const [openGroups, setOpenGroups] =
    React.useState<string[] | null>(null)

  const visibleOpenGroups = React.useMemo(
    () =>
      openGroups ??
      permissionGroups.map((group) => group.key),
    [openGroups, permissionGroups],
  )

  /*
  |--------------------------------------------------------------------------
  | Permission Search and Filters
  |--------------------------------------------------------------------------
  */

  const [permissionQuery, setPermissionQuery] = React.useState("")
  const [selectedOnly, setSelectedOnly] = React.useState(false)

  const normalizedQuery = permissionQuery.trim().toLowerCase()
  const isFiltering = normalizedQuery.length > 0 || selectedOnly

  const visibleGroups = React.useMemo<VisiblePermissionGroup[]>(
    () =>
      permissionGroups
        .map((group) => {
          const groupMatches =
            normalizedQuery.length > 0 &&
            group.label.toLowerCase().includes(normalizedQuery)

          const permissions = group.permissions.filter(
            (permission) => {
              if (selectedOnly && !selectedSet.has(permission.name)) {
                return false
              }

              if (normalizedQuery.length === 0 || groupMatches) {
                return true
              }

              return permissionMatchesQuery(
                permission,
                normalizedQuery,
              )
            },
          )

          return {
            ...group,
            permissions,
            totalCount: group.permissions.length,
          }
        })
        .filter((group) => group.permissions.length > 0),
    [permissionGroups, normalizedQuery, selectedOnly, selectedSet],
  )

  /*
  |--------------------------------------------------------------------------
  | Role State
  |--------------------------------------------------------------------------
  */

  const isSystemRole =
    isEditMode && role?.type === "SYSTEM"

  const normalizedName = normalizeRoleName(name)

  const validSelectedCount = React.useMemo(
    () =>
      selectedPermissions.filter((permissionName) =>
        availablePermissionNames.has(permissionName),
      ).length,
    [selectedPermissions, availablePermissionNames],
  )

  const isSubmitting =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending

  const isDirty =
    name !== initialName ||
    !hasSameItems(selectedPermissions, initialSelectedPermissions)

  // Warn before the tab closes while there are unsaved changes.
  React.useEffect(() => {
    if (!isDirty || isSubmitting) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty, isSubmitting])

  /*
  |--------------------------------------------------------------------------
  | Form Field Actions
  |--------------------------------------------------------------------------
  */

  const handleNameChange = React.useCallback(
    (value: string) => {
      setFormState({
        key: formKey,
        name: normalizeRoleName(value),
        selectedPermissions,
      })
    },
    [formKey, selectedPermissions],
  )

  const togglePermission = React.useCallback(
    (permissionName: string, checked: boolean) => {
      if (isSystemRole) {
        return
      }

      setFormState((current) => {
        const currentPermissions =
          current.key === formKey
            ? current.selectedPermissions
            : initialSelectedPermissions

        const currentName =
          current.key === formKey
            ? current.name
            : initialName

        const nextPermissions = checked
          ? Array.from(
              new Set([
                ...currentPermissions,
                permissionName,
              ]),
            )
          : currentPermissions.filter(
              (permission) => permission !== permissionName,
            )

        return {
          key: formKey,
          name: currentName,
          selectedPermissions: nextPermissions,
        }
      })
    },
    [
      formKey,
      initialName,
      initialSelectedPermissions,
      isSystemRole,
    ],
  )

  const toggleGroup = React.useCallback(
    (groupKey: string) => {
      setOpenGroups((current) => {
        const currentGroups =
          current ?? permissionGroups.map((group) => group.key)

        return currentGroups.includes(groupKey)
          ? currentGroups.filter((key) => key !== groupKey)
          : [...currentGroups, groupKey]
      })
    },
    [permissionGroups],
  )

  const expandAllGroups = React.useCallback(() => {
    setOpenGroups(permissionGroups.map((group) => group.key))
  }, [permissionGroups])

  const collapseAllGroups = React.useCallback(() => {
    setOpenGroups([])
  }, [])

  const jumpToGroup = React.useCallback(
    (groupKey: string) => {
      setPermissionQuery("")
      setSelectedOnly(false)

      setOpenGroups((current) => {
        const currentGroups =
          current ?? permissionGroups.map((group) => group.key)

        return currentGroups.includes(groupKey)
          ? currentGroups
          : [...currentGroups, groupKey]
      })

      window.requestAnimationFrame(() => {
        document
          .getElementById(`permission-group-card-${groupKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    },
    [permissionGroups],
  )

  /**
   * Select or clear the permissions a group currently shows.
   * While a search is active this only affects the matching rows.
   */
  const toggleGroupPermissions = React.useCallback(
    (group: PermissionGroup) => {
      if (isSystemRole) {
        return
      }

      const permissionNames = group.permissions
        .map((permission) => permission.name)
        .filter(
          (permissionName): permissionName is string =>
            typeof permissionName === "string" &&
            permissionName.trim().length > 0,
        )

      if (permissionNames.length === 0) {
        return
      }

      const fullySelected = permissionNames.every(
        (permissionName) => selectedSet.has(permissionName),
      )

      setFormState((current) => {
        const currentPermissions =
          current.key === formKey
            ? current.selectedPermissions
            : initialSelectedPermissions

        const currentName =
          current.key === formKey
            ? current.name
            : initialName

        const nextPermissions = fullySelected
          ? currentPermissions.filter(
              (permission) =>
                !permissionNames.includes(permission),
            )
          : Array.from(
              new Set([
                ...currentPermissions,
                ...permissionNames,
              ]),
            )

        return {
          key: formKey,
          name: currentName,
          selectedPermissions: nextPermissions,
        }
      })
    },
    [
      formKey,
      initialName,
      initialSelectedPermissions,
      isSystemRole,
      selectedSet,
    ],
  )

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSystemRole || isSubmitting) {
      return
    }

    const finalName = normalizeRoleName(name)

    if (!finalName) {
      return
    }

    const validSelectedPermissions =
      getValidSelectedPermissions(
        selectedPermissions,
        availablePermissionNames,
      )

    try {
      if (!isEditMode) {
        const payload: CreateRoleRequest = {
          name: finalName,
          permissions: validSelectedPermissions,
        }

        await createRoleMutation.mutateAsync(payload)
        router.push(ROLES_URL)
        return
      }

      if (!roleId) {
        return
      }

      const payload: UpdateRoleRequest = {
        name: finalName,
        permissions: validSelectedPermissions,
      }

      await updateRoleMutation.mutateAsync({
        roleId,
        data: payload,
      })

      router.push(ROLES_URL)
    } catch {
      // Stay on the page so the user keeps their changes.
      // Error feedback is handled by the mutation hooks.
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading and error states
  |--------------------------------------------------------------------------
  */

  if (
    (isEditMode && isRoleLoading) ||
    isPermissionsLoading
  ) {
    return (
      <PageState
        icon={KeyRound}
        title="Loading role permissions..."
        loading
      />
    )
  }

  if (isEditMode && (isRoleError || !role)) {
    return (
      <PageState
        icon={ShieldCheck}
        title="Unable to load role"
        message={
          roleError?.message ??
          "The requested role could not be loaded."
        }
        showBackLink
      />
    )
  }

  if (isPermissionsError) {
    return (
      <PageState
        icon={KeyRound}
        title="Unable to load permissions"
        message={
          permissionsError?.message ??
          "Available permissions could not be loaded."
        }
        showBackLink
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  const submitDisabled =
    isSubmitting ||
    Boolean(isSystemRole) ||
    !normalizedName ||
    (isEditMode && !isDirty)

  const statusText = isSystemRole
    ? "System roles are read-only"
    : isDirty
      ? "You have unsaved changes"
      : isEditMode
        ? "No changes yet"
        : "Fill in the role name to continue"

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-4 sm:px-6 sm:pt-6">
      {/* Header */}

      <header className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          asChild
        >
          <Link href={ROLES_URL}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to roles</span>
          </Link>
        </Button>

        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              href={ROLES_URL}
              className="transition-colors hover:text-foreground"
            >
              Roles
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">
              {isEditMode ? "Update" : "Create"}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEditMode ? "Update Role" : "Create Role"}
            </h1>

            {isEditMode && role && (
              <>
                <Badge variant="outline">
                  {formatRoleName(role.name)}
                </Badge>

                {role.type && (
                  <Badge
                    variant={isSystemRole ? "default" : "secondary"}
                  >
                    {role.type}
                  </Badge>
                )}
              </>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {isEditMode
              ? "Update the role name and assigned permissions."
              : "Create a role and assign permissions to control system access."}
          </p>
        </div>
      </header>

      {/* System Role Notice */}

      {isSystemRole && (
        <div
          className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4"
          role="note"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="text-sm font-medium">System Role</p>

            <p className="mt-0.5 text-sm text-muted-foreground">
              This role is managed by the system. Its name and
              permissions cannot be modified.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* ------------------------------------------------------------ */}
          {/* Main column                                                  */}
          {/* ------------------------------------------------------------ */}

          <div className="flex min-w-0 flex-col gap-6">
            {/* Basic Information */}

            <Card className="gap-0 py-0">
              <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-base">
                  Basic information
                </CardTitle>

                <CardDescription>
                  Define the role name used by the authorization
                  system.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5">
                <div className="flex max-w-xl flex-col gap-2">
                  <Label htmlFor="role-name">Role name</Label>

                  <Input
                    id="role-name"
                    value={name}
                    disabled={isSystemRole}
                    onChange={(event) =>
                      handleNameChange(event.target.value)
                    }
                    placeholder="e.g. ANALYTICS_OFFICER"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    required
                  />

                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters, numbers, and underscores.
                  </p>

                  {name.trim() && normalizedName !== name && (
                    <p className="text-xs text-muted-foreground">
                      Will be saved as:{" "}
                      <span className="font-mono font-medium">
                        {normalizedName}
                      </span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}

            <Card className="gap-0 py-0">
              <CardHeader className="gap-3 border-b px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Permissions
                    </CardTitle>

                    <CardDescription>
                      Select the permissions this role should have.
                    </CardDescription>
                  </div>

                  <Badge variant="secondary" className="w-fit tabular-nums">
                    {validSelectedCount} selected
                  </Badge>
                </div>

                {/* Toolbar */}

                {permissionGroups.length > 0 && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />

                      <Input
                        type="search"
                        value={permissionQuery}
                        onChange={(event) =>
                          setPermissionQuery(event.target.value)
                        }
                        placeholder="Search permissions..."
                        aria-label="Search permissions"
                        className="h-9 pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
                      />

                      {permissionQuery && (
                        <button
                          type="button"
                          onClick={() => setPermissionQuery("")}
                          aria-label="Clear search"
                          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={selectedOnly ? "secondary" : "outline"}
                        size="sm"
                        aria-pressed={selectedOnly}
                        onClick={() => setSelectedOnly((value) => !value)}
                      >
                        Selected only
                      </Button>

                      {!isFiltering && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={expandAllGroups}
                          >
                            Expand all
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={collapseAllGroups}
                          >
                            Collapse all
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-5">
                {visibleGroups.map((group) => (
                  <PermissionGroupCard
                    key={group.key}
                    group={group}
                    selectedSet={selectedSet}
                    isOpen={
                      isFiltering ||
                      visibleOpenGroups.includes(group.key)
                    }
                    canCollapse={!isFiltering}
                    disabled={Boolean(isSystemRole)}
                    onToggleOpen={toggleGroup}
                    onToggleAll={toggleGroupPermissions}
                    onTogglePermission={togglePermission}
                  />
                ))}

                {/* Empty: nothing matches the filters */}

                {visibleGroups.length === 0 &&
                  permissionGroups.length > 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <Search className="mx-auto size-8 text-muted-foreground" />

                      <p className="mt-3 font-medium">
                        No permissions match
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try a different search or turn off the
                        filters.
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setPermissionQuery("")
                          setSelectedOnly(false)
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}

                {/* Empty: no catalog at all */}

                {permissionGroups.length === 0 && (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <KeyRound className="mx-auto size-8 text-muted-foreground" />

                    <p className="mt-3 font-medium">
                      No permissions available
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      No API permissions are currently available for
                      role assignment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Sidebar                                                      */}
          {/* ------------------------------------------------------------ */}

          <aside className="lg:sticky lg:top-6">
            <OverviewCard
              isSystemRole={Boolean(isSystemRole)}
              selectedCount={validSelectedCount}
              totalCount={permissionList.length}
              usersCount={isEditMode ? (role?.usersCount ?? 0) : 0}
              groups={permissionGroups}
              selectedSet={selectedSet}
              onJumpToGroup={jumpToGroup}
            />
          </aside>
        </div>

        {/* Sticky action bar */}

        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {isDirty && !isSystemRole && (
                <span
                  className="size-2 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
              )}
              {statusText}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" asChild>
                <Link href={ROLES_URL}>Cancel</Link>
              </Button>

              <Button type="submit" disabled={submitDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    {isEditMode ? "Update Role" : "Create Role"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default RoleFormPage