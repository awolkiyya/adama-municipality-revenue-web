
"use client";

import React from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type Column,
  type ColumnDef,
  type SortingState,
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
  type TableActionKey,
} from "./registry";

import type { CommentType } from "@/types/commen";
import { usePermission } from "@/hooks/usePermission";

/* =====================================================
   TYPES
===================================================== */

/**
 * Every table record must have a stable ID.
 *
 * The index signature supports dynamic fields configured
 * through CommentTableRegistry.
 */
export type TableRecord = Record<string, unknown> & {
  id: string | number;
};

export interface TableProps<
  TData extends TableRecord = TableRecord,
> {
  type: CommentType;

  data: TData[];

  page?: number;

  pageSize?: number;

  isLoading?: boolean;

  /**
   * An action is visible only when:
   * 1. The current page enables it.
   * 2. The registry enables it.
   * 3. The user has the required permission, if configured.
   */
  actions: Partial<Record<TableActionKey, boolean>>;

  /* CORE ACTIONS */

  onView?: (row: TData) => void;

  onEdit?: (row: TData) => void;

  onDelete?: (id: string) => void;

  onCreate?: () => void;

  /* USER / GOVERNANCE ACTIONS */

  onUpdatePassword?: (row: TData) => void;

  onUpdateRole?: (row: TData) => void;

  onUpdateHierarchy?: (row: TData) => void;

  onManageAccess?: (row: TData) => void;

  onToggleStatus?: (row: TData) => void;

  /* TARIFF RULE ACTIONS */

  onManageFormulaVariables?: (row: TData) => void;

  onCopyFormula?: (row: TData) => void;

  /* WORKFLOW ACTIONS */

  onSubmit?: (row: TData) => void;

  onReturn?: (row: TData) => void;

  onApprove?: (row: TData) => void;

  /* INVOICE ACTIONS */

  onIssue?: (row: TData) => void;

  onApplyDiscount?: (row: TData) => void;

  onApplyPenalty?: (row: TData) => void;

  onCancel?: (row: TData) => void;

  onVoid?: (row: TData) => void;

  onPay?: (row: TData) => void;

  onPrint?: (row: TData) => void;

  onDownload?: (row: TData) => void;
}

/* =====================================================
   COMPONENT
===================================================== */

export function CommenTable<
  TData extends TableRecord = TableRecord,
>({
  type,
  data,
  page,
  pageSize,
  isLoading,
  actions,

  /* CORE */
  onView,
  onEdit,
  onDelete,
  onCreate,

  /* USER / GOVERNANCE */
  onUpdatePassword,
  onUpdateRole,
  onUpdateHierarchy,
  onManageAccess,
  onToggleStatus,

  /* TARIFF RULE */
  onManageFormulaVariables,
  onCopyFormula,

  /* WORKFLOW */
  onSubmit,
  onReturn,
  onApprove,

  /* INVOICE */
  onIssue,
  onApplyDiscount,
  onApplyPenalty,
  onCancel,
  onVoid,
  onPay,
  onPrint,
  onDownload,
}: TableProps<TData>) {
  /* ===================================================
     TABLE CONFIG
  =================================================== */

  const config = CommentTableRegistry[type];

  /* ===================================================
     PERMISSIONS
  =================================================== */

  const { can } = usePermission();

  /**
   * Resolve whether an action is available.
   *
   * Page configuration can restrict an action, but cannot
   * bypass registry configuration or user permissions.
   */
  const resolveActionVisibility = React.useCallback(
    (key: TableActionKey): boolean => {
      if (actions[key] !== true) {
        return false;
      }

      const actionConfig = config.actions[key];

      if (!actionConfig?.enabled) {
        return false;
      }

      if (!actionConfig.permission) {
        return true;
      }

      return can(
        actionConfig.permission.resource,
        actionConfig.permission.action,
      );
    },
    [actions, can, config.actions],
  );

  /**
   * Resolve visibility for all registered actions.
   */
  const visibleActions = React.useMemo(
    () =>
      Object.fromEntries(
        (
          Object.keys(config.actions) as TableActionKey[]
        ).map((key) => [
          key,
          resolveActionVisibility(key),
        ]),
      ) as Partial<Record<TableActionKey, boolean>>,
    [config.actions, resolveActionVisibility],
  );

  /* ===================================================
     SORTING
  =================================================== */

  const [sorting, setSorting] =
    React.useState<SortingState>([]);

  /* ===================================================
     COLUMN CONFIG
  =================================================== */

  const columns = React.useMemo<ColumnDef<TData, unknown>[]>(
    () => {
      /* ROW NUMBER */

      const rowNumberColumn: ColumnDef<TData, unknown> = {
        id: "no",
        header: "#",
        enableSorting: false,

        cell: ({ row }) => {
          const pageIndex = page ?? 1;
          const size = pageSize ?? 10;

          return (
            (pageIndex - 1) * size +
            row.index +
            1
          );
        },
      };

      /* DYNAMIC COLUMNS */

      const dynamicColumns: ColumnDef<TData, unknown>[] =
        config.columns.map((key) => ({
          accessorKey: key,
          header: key.toUpperCase(),
          enableSorting: true,

          cell: ({ row }) => {
            const original = row.original;

            const renderer = columnRenderers[key];

            if (renderer) {
              return renderer(original);
            }

            return original[key] as React.ReactNode;
          },
        }));

      /* ACTIONS */

      const actionsColumn: ColumnDef<TData, unknown> = {
        id: "actions",
        header: "ACTIONS",
        enableSorting: false,

        cell: ({ row }) => {
          const original = row.original;

          return (
            <RowActions
              actions={visibleActions}
              row={original}

              /* CORE */
              onView={() => onView?.(original)}
              onEdit={() => onEdit?.(original)}
              onDelete={() =>
                onDelete?.(String(original.id))
              }
              onCreate={onCreate}

              /* STATUS */
              onToggleStatus={() =>
                onToggleStatus?.(original)
              }

              /* USER / GOVERNANCE */
              onUpdatePassword={() =>
                onUpdatePassword?.(original)
              }
              onUpdateRole={() =>
                onUpdateRole?.(original)
              }
              onUpdateHierarchy={() =>
                onUpdateHierarchy?.(original)
              }
              onManageAccess={() =>
                onManageAccess?.(original)
              }

              /* TARIFF RULE */
              onManageFormulaVariables={() =>
                onManageFormulaVariables?.(original)
              }
              onCopyFormula={() =>
                onCopyFormula?.(original)
              }

              /* WORKFLOW */
              onSubmit={() => onSubmit?.(original)}
              onReturn={() => onReturn?.(original)}
              onApprove={() => onApprove?.(original)}

              /* INVOICE */
              onIssue={() => onIssue?.(original)}
              onApplyDiscount={() =>
                onApplyDiscount?.(original)
              }
              onApplyPenalty={() =>
                onApplyPenalty?.(original)
              }
              onCancel={() => onCancel?.(original)}
              onVoid={() => onVoid?.(original)}
              onPay={() => onPay?.(original)}
              onPrint={() => onPrint?.(original)}
              onDownload={() => onDownload?.(original)}
            />
          );
        },
      };

      return [
        rowNumberColumn,
        ...dynamicColumns,
        actionsColumn,
      ];
    },
    [
      config.columns,
      page,
      pageSize,
      visibleActions,

      /* CORE */
      onView,
      onEdit,
      onDelete,
      onCreate,

      /* STATUS */
      onToggleStatus,

      /* USER / GOVERNANCE */
      onUpdatePassword,
      onUpdateRole,
      onUpdateHierarchy,
      onManageAccess,

      /* TARIFF RULE */
      onManageFormulaVariables,
      onCopyFormula,

      /* WORKFLOW */
      onSubmit,
      onReturn,
      onApprove,

      /* INVOICE */
      onIssue,
      onApplyDiscount,
      onApplyPenalty,
      onCancel,
      onVoid,
      onPay,
      onPrint,
      onDownload,
    ],
  );

  /* ===================================================
     TABLE INSTANCE
  =================================================== */

  // TanStack Table returns a mutable table instance.
  // Keep this API call outside React.useMemo.
  // The targeted suppression prevents React Compiler from
  // attempting to memoize this incompatible library API.

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,

    state: {
      sorting,
    },

    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel: getSortedRowModel(),

    getRowId: (originalRow) => String(originalRow.id),
  });

  /* ===================================================
     ROWS
  =================================================== */

  const rows = table.getRowModel().rows;

  /* ===================================================
     DRAG AND DROP
  =================================================== */

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  /* ===================================================
     COLUMN SPAN
  =================================================== */

  const colSpan = config.columns.length + 2;

  /* ===================================================
     SORT ICON
  =================================================== */

  const renderSortIcon = (
    column: Column<TData, unknown>,
  ) => {
    const sorted = column.getIsSorted();

    if (sorted === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    }

    if (sorted === "desc") {
      return <ArrowDown className="h-3 w-3" />;
    }

    return (
      <ArrowUpDown className="h-3 w-3 opacity-40" />
    );
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="overflow-x-auto rounded-lg border-none">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <SortableContext
          items={rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <Table>
            {/* HEADER */}

            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={
                        header.column.getToggleSortingHandler()
                      }
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "select-none"
                      }
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        {header.column.getCanSort() &&
                          renderSortIcon(header.column)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* BODY */}

            <TableBody>
              {isLoading ? (
                <TableLoading
                  colSpan={colSpan}
                  message={`Loading ${type} data...`}
                />
              ) : rows.length === 0 ? (
                <TableEmptyState
                  colSpan={colSpan}
                  title={`No ${type} found`}
                  description={`Start by creating a new ${type} record`}
                  action={
                    visibleActions.create && onCreate ? (
                      <button
                        type="button"
                        onClick={onCreate}
                        className="rounded-md bg-primary px-3 py-2 text-sm text-white"
                      >
                        Create {type}
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                rows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </SortableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
    </div>
  );
}
