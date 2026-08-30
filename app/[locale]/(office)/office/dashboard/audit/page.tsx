"use client";

import { useState } from "react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Plus, Users, Search } from "lucide-react";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { DataTablePagination } from "@/components/table/data-pagination";

// =====================================================
// TYPES
// =====================================================

type UserStatus = "ACTIVE" | "INACTIVE";

type UserRole =
  | "REVENUE_COLLECTOR"
  | "FIELD_ENFORCEMENT_OFFICER";

type UserLevel =
  | "CITY"
  | "SUBCITY"
  | "WEREDA";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  level: UserLevel;
  created_at: number;
}


// =====================================================
// FILTERS
// =====================================================

export const userFilters: FilterField[] = [
  {
    key: "role",
    label: "Role",
    type: "select",
    options: [
      {
        label: "Collector",
        value: "REVENUE_COLLECTOR",
      },
      {
        label: "Inspector",
        value: "FIELD_ENFORCEMENT_OFFICER",
      },
    ],
  },

  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
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


// =====================================================
// MOCK USERS DATA
// =====================================================

const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "Abebe Kebede",
    email: "abebe@example.com",
    role: "REVENUE_COLLECTOR",
    status: "ACTIVE",
    level: "CITY",
    created_at: Date.now(),
  },

  {
    id: "2",
    name: "Sara Mohamed",
    email: "sara@example.com",
    role: "FIELD_ENFORCEMENT_OFFICER",
    status: "ACTIVE",
    level: "CITY",
    created_at: Date.now(),
  },

  {
    id: "3",
    name: "Dawit Tesfaye",
    email: "dawit@example.com",
    role: "REVENUE_COLLECTOR",
    status: "INACTIVE",
    level: "CITY",
    created_at: Date.now(),
  },

  {
    id: "4",
    name: "Hana Ali",
    email: "hana@example.com",
    role: "FIELD_ENFORCEMENT_OFFICER",
    status: "ACTIVE",
    level: "SUBCITY",
    created_at: Date.now(),
  },
];


// =====================================================
// SEARCH INPUT
// =====================================================

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


// =====================================================
// PAGE
// =====================================================

export default function Page() {
  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");


  // ===================================================
  // FILTERS
  // ===================================================

  const [filters, setFilters] = useState<
    Record<string, string>
  >({});


  // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = mockUsers.filter(
    (user) => {
      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const matchSearch =
        normalizedSearch === "" ||
        user.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.email
          .toLowerCase()
          .includes(normalizedSearch);


      // -----------------------------------------------
      // ROLE
      // -----------------------------------------------

      const matchRole =
        !filters.role ||
        user.role === filters.role;


      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      const matchStatus =
        !filters.status ||
        user.status === filters.status;


      // -----------------------------------------------
      // RESULT
      // -----------------------------------------------

      return (
        matchSearch &&
        matchRole &&
        matchStatus
      );
    },
  );


  // ===================================================
  // HANDLERS
  // ===================================================

  const handleAddUser = () => {
    console.log("Add new user");
  };


  const handleViewUser = (
    row: MockUser,
  ) => {
    console.log(
      "view",
      row,
    );
  };


  const handleEditUser = (
    row: MockUser,
  ) => {
    console.log(
      "edit",
      row,
    );
  };


  const handleDeleteUser = (
    id: string,
  ) => {
    console.log(
      "delete",
      id,
    );
  };


  const handlePageChange = (
    page: number,
  ) => {
    console.log(
      "page",
      page,
    );
  };


  const handlePageSizeChange = (
    size: number,
  ) => {
    console.log(
      "pageSize",
      size,
    );
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <Banner
        description={
          "Manage staff accounts, roles, and permissions in the revenue system"
        }

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
            type="button"
            className="
              bg-white
              p-4
              text-sm
              text-black
              hover:bg-white/90
            "
            onClick={
              handleAddUser
            }
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
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />
        }

        right={
          <>
            <Filters
              schema={userFilters}
              value={filters}
              onChange={setFilters}
              onReset={() =>
                setFilters({})
              }
            />

            <ExportDropdown />
          </>
        }
      />


      {/* =================================================
          TABLE
      ================================================= */}

      <CommenTable
        type={
          "user" as CommentType
        }

        data={
          filteredUsers
        }

        page={1}

        pageSize={10}

        isLoading={false}

        /*
         * Only actions relevant to the User table
         * are specified here.
         *
         * CommenTable should define this prop as:
         *
         * Partial<Record<TableActionKey, boolean>>
         *
         * so unspecified actions automatically behave
         * as disabled/undefined.
         */

        actions={{
          view: true,
          edit: true,
          delete: true,
          create: false,
          toggleStatus: true,

          updatePassword: false,
          updateRole: false,
          updateHierarchy: false,
        }}

        onView={
          handleViewUser
        }

        onEdit={
          handleEditUser
        }

        onDelete={
          handleDeleteUser
        }
      />


      {/* =================================================
          PAGINATION
      ================================================= */}

      <DataTablePagination
        page={1}

        pageSize={10}

        total={
          filteredUsers.length
        }

        onPageChange={
          handlePageChange
        }

        onPageSizeChange={
          handlePageSizeChange
        }
      />

    </div>
  );
}