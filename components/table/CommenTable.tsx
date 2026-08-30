"use client";

import React from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { SortableRow } from "./SortableRow";
import { columnRenderers } from "./renderers";

import { TableEmptyState } from "./table-empty";
import { TableLoading } from "./TableLoading";
import { RowActions } from "./RowActions";

import {
  CommentTableRegistry,
  TableActionKey,
} from "./registry";

import { CommentType } from "@/types/commen";

/* =====================================================
   TYPES
===================================================== */

export interface TableProps {
  type: CommentType;

  data: any[];

  page?: number;

  pageSize?: number;

  isLoading?: boolean;

  /*
  |--------------------------------------------------------------------------
  | RESOLVED ACTION PERMISSIONS
  |--------------------------------------------------------------------------
  |
  | Each page only needs to provide the actions it uses.
  | Unspecified actions are treated as unavailable.
  |
  */

  actions: Partial<Record<TableActionKey, boolean>>;

  /*
  |--------------------------------------------------------------------------
  | CORE ACTIONS
  |--------------------------------------------------------------------------
  */

  onView?: (row: any) => void;

  onEdit?: (row: any) => void;

  onDelete?: (id: string) => void;

  onCreate?: () => void;

  /*
  |--------------------------------------------------------------------------
  | USER / GOVERNANCE ACTIONS
  |--------------------------------------------------------------------------
  */

  onUpdatePassword?: (row: any) => void;

  onUpdateRole?: (row: any) => void;

  onUpdateHierarchy?: (row: any) => void;

  onManageAccess?: (row: any) => void;

  onToggleStatus?: (row: any) => void;

  /*
  |--------------------------------------------------------------------------
  | TARIFF RULE
  |--------------------------------------------------------------------------
  */

  onManageFormulaVariables?: (row: any) => void;

  /*
  |--------------------------------------------------------------------------
  | WORKFLOW ACTIONS
  |--------------------------------------------------------------------------
  */

  onSubmit?: (row: any) => void;

  onReturn?: (row: any) => void;

  onApprove?: (row: any) => void;

  /*
  |--------------------------------------------------------------------------
  | INVOICE ACTIONS
  |--------------------------------------------------------------------------
  */

  onIssue?: (row: any) => void;

  onApplyDiscount?: (row: any) => void;

  onApplyPenalty?: (row: any) => void;

  onCancel?: (row: any) => void;

  onVoid?: (row: any) => void;

  onPay?: (row: any) => void;

  onPrint?: (row: any) => void;

  onDownload?: (row: any) => void;
}

/* =====================================================
   COMPONENT
===================================================== */

export function CommenTable({
  type,

  data,

  page,

  pageSize,

  isLoading,

  actions,

  onView,

  onEdit,

  onDelete,

  onCreate,

  onUpdatePassword,

  onUpdateRole,

  onUpdateHierarchy,

  onManageAccess,

  onToggleStatus,

  onManageFormulaVariables,

  onSubmit,

  onReturn,

  onApprove,

  onIssue,

  onApplyDiscount,

  onApplyPenalty,

  onCancel,

  onVoid,

  onPay,

  onPrint,

  onDownload,
}: TableProps) {
  /* ===================================================
     TABLE CONFIG
  =================================================== */

  const config = CommentTableRegistry[type];

  /* ===================================================
     SORTING
  =================================================== */

  const [sorting, setSorting] =
    React.useState<SortingState>([]);

  /* ===================================================
     COLUMN CONFIG
  =================================================== */

  const columns =
    React.useMemo<ColumnDef<any>[]>(() => {
      return [
        /*
        |--------------------------------------------------------------------------
        | ROW NUMBER
        |--------------------------------------------------------------------------
        */

        {
          id: "no",

          header: "#",

          enableSorting: false,

          cell: ({ row }) => {
            const pageIndex = page ?? 1;

            const size = pageSize ?? 10;

            return (
              (pageIndex - 1) *
                size +
              row.index +
              1
            );
          },
        },

        /*
        |--------------------------------------------------------------------------
        | DYNAMIC COLUMNS
        |--------------------------------------------------------------------------
        */

        ...config.columns.map(
          (key) => ({
            accessorKey: key,

            header:
              key.toUpperCase(),

            enableSorting: true,

            cell: ({
              row,
            }: any) =>
              columnRenderers[key]?.(
                row.original,
              ) ??
              row.original[key],
          }),
        ),

        /*
        |--------------------------------------------------------------------------
        | ACTIONS
        |--------------------------------------------------------------------------
        */

        {
          id: "actions",

          header: "ACTIONS",

          enableSorting: false,

          cell: ({
            row,
          }: any) => (
            <RowActions
              /*
              |--------------------------------------------------------------------------
              | ACTION PERMISSIONS
              |--------------------------------------------------------------------------
              |
              | RowActions should accept:
              |
              | Partial<Record<TableActionKey, boolean>>
              |
              */

              actions={actions}

              /*
              |--------------------------------------------------------------------------
              | ROW
              |--------------------------------------------------------------------------
              */

              row={row.original}

              /*
              |--------------------------------------------------------------------------
              | CORE
              |--------------------------------------------------------------------------
              */

              onView={() =>
                onView?.(
                  row.original,
                )
              }

              onEdit={() =>
                onEdit?.(
                  row.original,
                )
              }

              onDelete={() =>
                onDelete?.(
                  row.original.id,
                )
              }

              onCreate={onCreate}

              /*
              |--------------------------------------------------------------------------
              | STATUS
              |--------------------------------------------------------------------------
              */

              onToggleStatus={() =>
                onToggleStatus?.(
                  row.original,
                )
              }

              /*
              |--------------------------------------------------------------------------
              | USER / GOVERNANCE
              |--------------------------------------------------------------------------
              */

              onUpdatePassword={() =>
                onUpdatePassword?.(
                  row.original,
                )
              }

              onUpdateRole={() =>
                onUpdateRole?.(
                  row.original,
                )
              }

              onUpdateHierarchy={() =>
                onUpdateHierarchy?.(
                  row.original,
                )
              }

              onManageAccess={() =>
                onManageAccess?.(
                  row.original,
                )
              }

              /*
              |--------------------------------------------------------------------------
              | FORMULA VARIABLES
              |--------------------------------------------------------------------------
              */

              onManageFormulaVariables={() =>
                onManageFormulaVariables?.(
                  row.original,
                )
              }

              /*
              |--------------------------------------------------------------------------
              | WORKFLOW
              |--------------------------------------------------------------------------
              */

              onSubmit={() =>
                onSubmit?.(
                  row.original,
                )
              }

              onReturn={() =>
                onReturn?.(
                  row.original,
                )
              }

              onApprove={() =>
                onApprove?.(
                  row.original,
                )
              }

              /*
              |--------------------------------------------------------------------------
              | INVOICE
              |--------------------------------------------------------------------------
              */

              onIssue={() =>
                onIssue?.(
                  row.original,
                )
              }

              onApplyDiscount={() =>
                onApplyDiscount?.(
                  row.original,
                )
              }

              onApplyPenalty={() =>
                onApplyPenalty?.(
                  row.original,
                )
              }

              onCancel={() =>
                onCancel?.(
                  row.original,
                )
              }

              onVoid={() =>
                onVoid?.(
                  row.original,
                )
              }

              onPay={() =>
                onPay?.(
                  row.original,
                )
              }

              onPrint={() =>
                onPrint?.(
                  row.original,
                )
              }

              onDownload={() =>
                onDownload?.(
                  row.original,
                )
              }
            />
          ),
        },
      ];
    }, [
      config.columns,

      page,

      pageSize,

      actions,

      onView,

      onEdit,

      onDelete,

      onCreate,

      onToggleStatus,

      onUpdatePassword,

      onUpdateRole,

      onUpdateHierarchy,

      onManageAccess,

      onManageFormulaVariables,

      onSubmit,

      onReturn,

      onApprove,

      onIssue,

      onApplyDiscount,

      onApplyPenalty,

      onCancel,

      onVoid,

      onPay,

      onPrint,

      onDownload,
    ]);

  /* ===================================================
     TABLE INSTANCE
  =================================================== */

  const table = useReactTable({
    data,

    columns,

    state: {
      sorting,
    },

    onSortingChange:
      setSorting,

    getCoreRowModel:
      getCoreRowModel(),

    getSortedRowModel:
      getSortedRowModel(),
  });

  /* ===================================================
     ROWS
  =================================================== */

  const rows =
    table.getRowModel().rows;

  /* ===================================================
     DND
  =================================================== */

  const sensors = useSensors(
    useSensor(MouseSensor),

    useSensor(TouchSensor),

    useSensor(KeyboardSensor),
  );

  /* ===================================================
     COLUMN SPAN
  =================================================== */

  const colSpan =
    config.columns.length + 2;

  /* ===================================================
     SORT ICON
  =================================================== */

  const renderSortIcon = (
    column: any,
  ) => {
    const sorted =
      column.getIsSorted();

    if (sorted === "asc") {
      return (
        <ArrowUp
          className="h-3 w-3"
        />
      );
    }

    if (sorted === "desc") {
      return (
        <ArrowDown
          className="h-3 w-3"
        />
      );
    }

    return (
      <ArrowUpDown
        className="
          h-3
          w-3
          opacity-40
        "
      />
    );
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div
      className="
        overflow-x-auto
        rounded-lg
        border-none
      "
    >
      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCenter
        }
      >
        <SortableContext
          items={data.map(
            (item) => item.id,
          )}
          strategy={
            verticalListSortingStrategy
          }
        >
          <Table>
            {/* =================================================
                HEADER
            ================================================= */}

            <TableHeader>
              {table
                .getHeaderGroups()
                .map(
                  (
                    headerGroup,
                  ) => (
                    <TableRow
                      key={
                        headerGroup.id
                      }
                    >
                      {headerGroup.headers.map(
                        (
                          header,
                        ) => (
                          <TableHead
                            key={
                              header.id
                            }
                            onClick={
                              header.column
                                .getToggleSortingHandler()
                            }
                            className={
                              header.column
                                .getCanSort()
                                ? `
                                  cursor-pointer
                                  select-none
                                `
                                : `
                                  select-none
                                `
                            }
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >
                              {flexRender(
                                header
                                  .column
                                  .columnDef
                                  .header,

                                header.getContext(),
                              )}

                              {header
                                .column
                                .getCanSort() &&
                                renderSortIcon(
                                  header.column,
                                )}
                            </div>
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  ),
                )}
            </TableHeader>

            {/* =================================================
                BODY
            ================================================= */}

            <TableBody>
              {/* ===============================================
                  LOADING
              =============================================== */}

              {isLoading ? (
                <TableLoading
                  colSpan={
                    colSpan
                  }
                  message={`Loading ${type} data...`}
                />
              ) : rows.length ===
                0 ? (
                /* =============================================
                   EMPTY
                ============================================= */

                <TableEmptyState
                  colSpan={
                    colSpan
                  }
                  title={`No ${type} found`}
                  description={`Start by creating a new ${type} record`}
                  action={
                    onCreate && (
                      <button
                        type="button"
                        onClick={
                          onCreate
                        }
                        className="
                          rounded-md
                          bg-primary
                          px-3
                          py-2
                          text-sm
                          text-white
                        "
                      >
                        Create{" "}
                        {type}
                      </button>
                    )
                  }
                />
              ) : (
                /* =============================================
                   DATA
                ============================================= */

                rows.map(
                  (row) => (
                    <SortableRow
                      key={
                        row.id
                      }
                      row={row}
                    >
                      {row
                        .getVisibleCells()
                        .map(
                          (
                            cell,
                          ) => (
                            <TableCell
                              key={
                                cell.id
                              }
                            >
                              {flexRender(
                                cell.column
                                  .columnDef
                                  .cell,

                                cell.getContext(),
                              )}
                            </TableCell>
                          ),
                        )}
                    </SortableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}