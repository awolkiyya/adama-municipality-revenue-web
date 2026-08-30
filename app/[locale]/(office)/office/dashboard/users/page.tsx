"use client";

import { useEffect, useMemo, useState } from "react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Plus,
  Users,
  Search,
  CircleDot,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import { CommentType } from "@/types/commen";
import { FilterField } from "@/types/commen";
import { DataTablePagination } from "@/components/table/data-pagination";

import { useRouter } from "next/navigation";

import {
  useToggleUserStatus,
  useUpdateUserPassword,
  useUsers,
} from "@/hooks/useUser.hook";

import { AuthUser } from "@/types/user";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { UserDetailModal } from "@/components/dialogs/UserDetailModal";
import { ResetPasswordModal } from "@/components/dialogs/ResetPasswordModal";
import ProtectedRoute from "@/components/access/ProtectedRoute";

import { RoleDropdown } from "@/components/input/RoleDropDown";
import { Role } from "@/types/access-management";
import { Label } from "@/components/ui/label";

/* =====================================================
   FILTERS
===================================================== */

export const userFilters: FilterField[] = [
  {
    key: "level",
    label: "Level",
    type: "select",
    icon: CircleDot,
    defaultValue: "ALL",

    options: [
      {
        label: "All",
        value: "ALL",
      },
      {
        label: "City",
        value: "CITY",
      },
      {
        label: "Subcity",
        value: "SUBCITY",
      },
      {
        label: "Wereda",
        value: "WEREDA",
      },
    ],
  },

  {
    key: "status",
    label: "Status",
    type: "select",
    icon: CircleDot,
    defaultValue: "ALL",

    options: [
      {
        label: "All",
        value: "ALL",
      },
      {
        label: "Active",
        value: "ACTIVE",
      },
      {
        label: "Inactive",
        value: "INACTIVE",
      },
    ],
  },
];

/* =====================================================
   INITIAL FILTERS
===================================================== */

const INITIAL_FILTERS = {
  role: "ALL",
  level: "ALL",
  status: "ALL",
};

/* =====================================================
   SEARCH INPUT
===================================================== */

function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="
          pointer-events-none
          absolute
          left-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        className={`w-full py-4 pl-9 ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}

/* =====================================================
   DEBOUNCE
===================================================== */

function useDebounce(
  value: string,
  delay = 500,
) {
  const [debounced, setDebounced] =
    useState(value);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebounced(value),
      delay,
    );

    return () =>
      clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

/* =====================================================
   ACTUAL USERS PAGE
===================================================== */

function UsersPageContent() {
  const router = useRouter();

  /* ===================================================
     APPLIED FILTERS
  =================================================== */

  const [filters, setFilters] =
    useState<Record<string, any>>(
      INITIAL_FILTERS,
    );

  /* ===================================================
     DRAFT FILTERS
     
     These are changed inside the Sheet.
     They are only applied to the API after
     clicking "Apply Filters".
  =================================================== */

  const [draftFilters, setDraftFilters] =
    useState<Record<string, any>>(
      INITIAL_FILTERS,
    );

  /* ===================================================
     FILTER SHEET
  =================================================== */

  const [filterOpen, setFilterOpen] =
    useState(false);

  /* ===================================================
     PAGINATION
  =================================================== */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  /* ===================================================
     SEARCH
  =================================================== */

  const [search, setSearch] =
    useState("");

  const debouncedSearch =
    useDebounce(search);

  /* ===================================================
     MODALS
  =================================================== */

  const [open, setOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<AuthUser | null>(null);

  const [openReset, setOpenReset] =
    useState(false);

  /* ===================================================
     USERS
  =================================================== */

  const {
    data,
    isLoading,
    refetch,
  } = useUsers({
    page,
    per_page: pageSize,

    search: debouncedSearch,

    is_active:
      filters.status === "ACTIVE"
        ? true
        : filters.status === "INACTIVE"
        ? false
        : undefined,

    role:
      filters.role !== "ALL"
        ? filters.role
        : undefined,

    level:
      filters.level !== "ALL"
        ? filters.level
        : undefined,
  });

  /* ===================================================
     MUTATIONS
  =================================================== */

  const updatePassword =
    useUpdateUserPassword();

  const toggleStatus =
    useToggleUserStatus();

  /* ===================================================
     DATA
  =================================================== */

  const users: AuthUser[] =
    data?.data ?? [];

  const meta = data?.meta;

  /* ===================================================
     TABLE DATA
  =================================================== */

  const tableData = useMemo(() => {
    return users.map((user) => ({
      ...user,

      id: user.id,

      avatar: user.avatar,

      level:
        user.administrative_unit?.level,

      name: user.name,

      email: user.email,

      phone: user.phone,

      role: user.role?.name,

      created_at: user.created_at,

      is_active: user.is_active,
    }));
  }, [users]);

  /* ===================================================
     TABLE ACTIONS
  =================================================== */

  const actions = resolveActions(
    CommentTableRegistry.user,
    "SYSTEM_ADMIN",
  );

  /* ===================================================
     OPEN FILTER SHEET
     
     Always start with the currently applied filters.
  =================================================== */

  const handleFilterOpenChange = (
    open: boolean,
  ) => {
    if (open) {
      setDraftFilters(filters);
    }

    setFilterOpen(open);
  };

  /* ===================================================
     ROLE CHANGE
     
     Role options are loaded from the server
     by RoleDropdown.
  =================================================== */

  const handleRoleChange = (
    value: string | number,
    _item: Role,
  ) => {
    setDraftFilters((previous) => ({
      ...previous,
      role: String(_item.name),
    }));
  };

  /* ===================================================
     APPLY FILTERS
  =================================================== */

  const handleApplyFilters = () => {
    setFilters({
      ...draftFilters,
    });

    setPage(1);

    setFilterOpen(false);
  };

  /* ===================================================
     RESET FILTERS
  =================================================== */

  const handleResetFilters = () => {
    setDraftFilters({
      ...INITIAL_FILTERS,
    });

    setFilters({
      ...INITIAL_FILTERS,
    });

    setPage(1);

    setFilterOpen(false);
  };

  /* ===================================================
     FILTER COUNT
     
     Used to show how many filters are currently active.
  =================================================== */

  const activeFilterCount =
    Object.entries(filters).filter(
      ([key, value]) => {
        if (key === "role") {
          return value !== "ALL";
        }

        if (key === "level") {
          return value !== "ALL";
        }

        if (key === "status") {
          return value !== "ALL";
        }

        return (
          value !== undefined &&
          value !== null &&
          value !== ""
        );
      },
    ).length;

  /* ===================================================
     RESET PASSWORD
  =================================================== */

  const handleOpenReset = (
    user: AuthUser,
  ) => {
    setSelectedUser(user);
    setOpenReset(true);
  };

  /* ===================================================
     EDIT
  =================================================== */

  const handleEdit = (
    row: AuthUser,
  ) => {
    router.push(
      `/office/dashboard/users/${row.id}/edit`,
    );
  };

  /* ===================================================
     CREATE
  =================================================== */

  const handleCreate = () => {
    router.push(
      "/office/dashboard/users/create",
    );
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <Banner
        description="
          Manage staff accounts, roles, and permissions
          in the revenue system
        "
        badge={
          <IconBadge
            className="
              gap-2
              rounded-full
              bg-black/20
              p-3
              text-[10px]
              text-white
            "
            icon={
              <Users className="h-3 w-3" />
            }
          >
            Manage User & Access
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
        overlayClassName="
          bg-gradient-to-r
          from-primary/95
          via-primary/80
          to-primary/50
        "
        actions={
          <Button
            variant="outline"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        }
        className="text-white"
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }

        right={
          <div
            className="
              flex
              w-full
              flex-wrap
              items-center
              justify-end
              gap-2
            "
          >

            {/* =========================================
                FILTER BUTTON
            ========================================= */}

            <Button
              variant="outline"
              onClick={() => {
                setDraftFilters(filters);
                setFilterOpen(true);
              }}
              className="relative"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />

              Filters

              {activeFilterCount > 0 && (
                <span
                  className="
                    ml-2
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-primary
                    px-1.5
                    text-[10px]
                    font-semibold
                    text-primary-foreground
                  "
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* =========================================
                EXPORT
            ========================================= */}

            <ExportDropdown />

          </div>
        }
      />

<Sheet
  open={filterOpen}
  onOpenChange={handleFilterOpenChange}
>
  <SheetContent
    side="right"
    className="
      flex
      h-full
      w-full
      flex-col
      p-0
      sm:max-w-md
    "
  >

    {/* HEADER */}
    <SheetHeader
      className="
        shrink-0
        border-b
        px-5
        py-5
        sm:px-6
      "
    >
      <SheetTitle>
        Filter Users
      </SheetTitle>

      <SheetDescription>
        Filter users by role, organizational
        level, and account status.
      </SheetDescription>
    </SheetHeader>


    {/* CONTENT */}
    <div
      className="
        min-h-0
        flex-1
        overflow-y-auto
        px-5
        py-6
        sm:px-6
      "
    >

      <div className="space-y-6">

        {/* ROLE */}
        <div className="space-y-2">

          <Label className="text-sm font-medium">
            Role
          </Label>

          <RoleDropdown
            value={
              draftFilters.role === "ALL"
                ? null
                : draftFilters.role
            }
            onChange={(value,item)=>
              handleRoleChange(value,item)
            }
          />

        </div>


        {/* DIVIDER */}
        <div className="border-t" />


        {/* OTHER FILTERS */}
        <div className="space-y-4">

          <div>
            <h3 className="text-sm font-semibold">
              Account & Organization
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Narrow users by organizational
              level and account status.
            </p>
          </div>

          <Filters
            schema={userFilters}
            value={draftFilters}
            onChange={(
              value,
            ) => {
              setDraftFilters(
                value,
              );
            }}
          />

        </div>

      </div>

    </div>


    {/* FOOTER */}
    <SheetFooter
      className="
        shrink-0
        border-t
        px-5
        py-4
        sm:px-6
      "
    >

      <div
        className="
          flex
          w-full
          items-center
          gap-3
        "
      >

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraftFilters({
              ...INITIAL_FILTERS,
            });
          }}
          className="
            flex-1
          "
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>


        <Button
          type="button"
          onClick={
            handleApplyFilters
          }
          className="
            flex-1
          "
        >
          Apply Filters
        </Button>

      </div>

    </SheetFooter>

  </SheetContent>
</Sheet>

      {/* =================================================
          TABLE
      ================================================= */}

      <CommenTable
        type={"user" as CommentType}
        data={tableData}

        page={
          meta?.current_page ??
          page
        }

        pageSize={
          meta?.per_page ??
          pageSize
        }

        isLoading={isLoading}

        actions={actions}

        onView={(row) => {
          setSelectedUser(row);
          setOpen(true);
        }}

        onEdit={handleEdit}

        onDelete={(id) => {
          console.log(
            "delete",
            id,
          );
        }}

        onUpdatePassword={
          handleOpenReset
        }

        onToggleStatus={async (
          user: AuthUser,
        ) => {
          await toggleStatus.mutateAsync(
            user.id,
          );

          await refetch();
        }}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      <DataTablePagination
        page={
          meta?.current_page ??
          page
        }

        pageSize={
          meta?.per_page ??
          pageSize
        }

        total={
          meta?.total ?? 0
        }

        onPageChange={(newPage) => {
          setPage(newPage);
        }}

        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* =================================================
          RESET PASSWORD
      ================================================= */}

      <ResetPasswordModal
        open={openReset}
        user={selectedUser}
        onClose={() =>
          setOpenReset(false)
        }
        onSubmit={async (
          userId: string,
          password: string,
        ) => {
          await updatePassword.mutateAsync({
            id: userId,
            data: {
              password,
            },
          });

          setOpenReset(false);
        }}
      />

      {/* =================================================
          USER DETAILS
      ================================================= */}

      <UserDetailModal
        open={open}
        onOpenChange={setOpen}
        user={selectedUser}
      />

    </div>
  );
}

/* =====================================================
   PROTECTED USERS PAGE
===================================================== */

export default function Page() {
  return (
    <ProtectedRoute
      resource="users"
      action="view"
    >
      <UsersPageContent />
    </ProtectedRoute>
  );
}