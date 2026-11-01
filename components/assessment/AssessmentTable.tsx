"use client";

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

/**
 * Assessment table row.
 *
 * Extend this type with your assessment resource fields
 * if you want stronger typing for individual columns.
 */
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
  // ASSESSMENT CAPABILITIES
  // ===================================================

  const capabilities = resolveAssessmentCapabilities(permissions);

  // ===================================================
  // TABLE ACTION PERMISSIONS
  // ===================================================

  const actions = resolveActions(
    CommentTableRegistry.assessment,
    permissions,
  );

  // ===================================================
  // FINAL ACTION VISIBILITY
  // ===================================================

  /**
   * An action is available only when:
   *
   * 1. The assessment capability allows it.
   * 2. The table registry allows it.
   * 3. A corresponding handler is provided.
   *
   * resolveActions() evaluates the registry permissions.
   */

  const canView =
    capabilities.canView &&
    actions.view &&
    Boolean(onView);

  const canEdit =
    capabilities.canEdit &&
    actions.edit &&
    Boolean(onEdit);

  const canDelete =
    capabilities.canDelete &&
    actions.delete &&
    Boolean(onDelete);

  const canApprove =
    capabilities.canApprove &&
    actions.approve &&
    Boolean(onApprove);

  const canReject =
    capabilities.canReject &&
    Boolean(onReject);

  const canReturn =
    capabilities.canReturn &&
    actions.return &&
    Boolean(onReturn);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* TABLE HEADER */}

      <div className="flex flex-col gap-1 border-b p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {config.title}
        </h2>

        <p className="text-sm text-muted-foreground">
          {config.tableDescription}
        </p>
      </div>

      {/* TABLE */}

      <CommenTable
        type={"assessment" as CommentType}
        data={data}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onView={canView ? onView : undefined}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canDelete ? onDelete : undefined}
        onApprove={canApprove ? onApprove : undefined}
        onReturn={canReturn ? onReturn : undefined}
        actions={{
          ...actions,
          view: canView,
          edit: canEdit,
          delete: canDelete,
          approve: canApprove,
          return: canReturn,
        }}
      />

      {/* ERROR STATE */}

      {error && (
        <div className="flex items-center justify-between border-t bg-destructive/5 px-5 py-4">
          <p className="text-sm text-destructive">
            Failed to load assessments.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      )}

      {/* PAGINATION */}

      <div className="border-t p-4 sm:p-5">
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
