
"use client";

import { RefreshCw, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommenTable } from "@/components/table/CommenTable";
import { CommentTableRegistry } from "@/components/table/registry";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import type { UserPermission } from "@/types/user";
import type { CommentType } from "@/types/commen";
import type { AssessmentConfig } from "./assessment.config";
import { resolveAssessmentCapabilities } from "./assessment.config";
import { DataTablePagination } from "../table/data-pagination";

// =====================================================
// ROW TYPE
// =====================================================

export type AssessmentTableRow = {
  id: string;
  [key: string]: unknown;
};

// =====================================================
// PROPS
// =====================================================

type AssessmentTableProps<TRow extends AssessmentTableRow> = {
  config: AssessmentConfig;
  permissions: UserPermission[];

  data: TRow[];

  page: number;
  pageSize: number;
  total: number;

  isLoading: boolean;
  error: boolean;

  onView?: (row: TRow) => void;
  onEdit?: (row: TRow) => void;
  onDelete?: (id: string) => void;
  onApprove?: (row: TRow) => void;
  onReject?: (row: TRow) => void;
  onReturn?: (row: TRow) => void;

  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

// =====================================================
// COMPONENT
// =====================================================

export function AssessmentTable<TRow extends AssessmentTableRow>({
  config,
  permissions,
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onReturn,
  onRetry,
  onPageChange,
  onPageSizeChange,
}: AssessmentTableProps<TRow>) {
  // ===================================================
  // PERMISSION CAPABILITIES
  // ===================================================

  const capabilities = resolveAssessmentCapabilities(permissions);

  const registryActions = resolveActions(
    CommentTableRegistry.assessment,
    permissions,
  );

  // ===================================================
  // ACTION VISIBILITY
  // ===================================================

  const canView =
    capabilities.canView &&
    registryActions.view &&
    Boolean(onView);

  const canEdit =
    capabilities.canEdit &&
    registryActions.edit &&
    Boolean(onEdit);

  const canDelete =
    capabilities.canDelete &&
    registryActions.delete &&
    Boolean(onDelete);

  const canApprove =
    capabilities.canApprove &&
    registryActions.approve &&
    Boolean(onApprove);

  const canReject =
    capabilities.canReject &&
    Boolean(onReject);

  const canReturn =
    capabilities.canReturn &&
    registryActions.return &&
    Boolean(onReturn);

  const actions = {
    ...registryActions,
    view: canView,
    edit: canEdit,
    delete: canDelete,
    approve: canApprove,
    reject: canReject,
    return: canReturn,
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      aria-label="Assessment records"
      className="min-w-0 overflow-hidden rounded-sm border border-border/70 "
    >
      {/* =================================================
          TABLE HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {config.title}
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {config.tableDescription}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            {total.toLocaleString()}{" "}
            {total === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      {/* =================================================
          TABLE CONTENT
      ================================================= */}

      <div className="min-w-0">
        <CommenTable
          type={"assessment" as CommentType}
          data={data}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onView={canView ? onView : undefined}
          onEdit={canEdit ? onEdit : undefined}
          // onDelete={canDelete ? onDelete : undefined}
          // onApprove={canApprove ? onApprove : undefined}
          // onReject={canReject ? onReject : undefined}
          // onReturn={canReturn ? onReturn : undefined}
          actions={actions}
        />
      </div>

      {/* =================================================
          ERROR STATE
      ================================================= */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 border-t border-destructive/20 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              Unable to load assessments
            </p>

            <p className="text-xs text-muted-foreground">
              Something went wrong while retrieving assessment records.
              Please try again.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-full shrink-0 gap-2 sm:w-auto"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </div>
      )}

      {/* =================================================
          PAGINATION
      ================================================= */}

      <div className="border-t border-border/70 px-3 py-3 sm:px-5 sm:py-4">
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </section>
  );
}
