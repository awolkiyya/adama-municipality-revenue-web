// =====================================================
// ASSESSMENT TABLE
// =====================================================

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
// PROPS
// =====================================================

type AssessmentTableProps = {
  config: AssessmentConfig;

  permissions: UserPermission[];

  data: any[];

  page: number;

  pageSize: number;

  total: number;

  isLoading: boolean;

  error: boolean;

  onView: (row: any) => void;

  onEdit: (row: any) => void;

  onDelete: (id: string) => void;

  onApprove: (row: any) => void;

  onReject: (row: any) => void;

  onReturn: (row: any) => void;

  onRetry: () => void;

  onPageChange: (page: number) => void;

  onPageSizeChange: (size: number) => void;
};


// =====================================================
// COMPONENT
// =====================================================

export function AssessmentTable({
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
}: AssessmentTableProps) {

  // ===================================================
  // ASSESSMENT CAPABILITIES
  // ===================================================

  const capabilities = resolveAssessmentCapabilities(
    permissions,
  );


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
   * 3. The required permission exists.
   *
   * `resolveActions()` already evaluates the registry
   * permission, so these checks combine both layers.
   */

  const canView =
    capabilities.canView &&
    actions.view &&
    !!onView;

  const canEdit =
    capabilities.canEdit &&
    actions.edit &&
    !!onEdit;

  const canDelete =
    capabilities.canDelete &&
    actions.delete &&
    !!onDelete;

  const canApprove =
    capabilities.canApprove &&
    actions.approve &&
    !!onApprove;

  const canReturn =
    capabilities.canReturn &&
    actions.return &&
    !!onReturn;


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "========== ASSESSMENT TABLE DEBUG ==========",
  );

  console.log(
    "Permissions:",
    permissions,
  );

  console.log(
    "Assessment capabilities:",
    capabilities,
  );

  console.log(
    "Resolved table actions:",
    actions,
  );

  console.log(
    "Final action visibility:",
    {
      view: canView,
      edit: canEdit,
      delete: canDelete,
      approve: canApprove,
      return: canReturn,
    },
  );

  console.log(
    "============================================",
  );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="
        rounded-xl
        border
        bg-card
        shadow-sm
      "
    >

      {/* =============================================
          TABLE HEADER
      ============================================= */}

      <div
        className="
          flex
          flex-col
          gap-1
          border-b
          p-5
          sm:p-6
        "
      >

        <h2
          className="
            text-lg
            font-semibold
            tracking-tight
          "
        >
          {config.title}
        </h2>

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {config.tableDescription}
        </p>

      </div>


      {/* =============================================
          TABLE
      ============================================= */}

      <CommenTable
        type={"assessment" as CommentType}

        data={data}

        page={page}

        pageSize={pageSize}

        isLoading={isLoading}

        // -------------------------------------------
        // VIEW
        // -------------------------------------------

        onView={
          canView
            ? onView
            : undefined
        }

        // -------------------------------------------
        // EDIT
        // -------------------------------------------

        onEdit={
          canEdit
            ? onEdit
            : undefined
        }

        // -------------------------------------------
        // DELETE
        // -------------------------------------------

        onDelete={
          canDelete
            ? onDelete
            : undefined
        }

        // -------------------------------------------
        // APPROVE
        // -------------------------------------------

        onApprove={
          canApprove
            ? onApprove
            : undefined
        }

        // -------------------------------------------
        // RETURN
        // -------------------------------------------

        onReturn={
          canReturn
            ? onReturn
            : undefined
        }

        // -------------------------------------------
        // GENERIC ACTIONS
        // -------------------------------------------

        actions={actions}
      />




      {error && (
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            bg-destructive/5
            px-5
            py-4
          "
        >

          <p
            className="
              text-sm
              text-destructive
            "
          >
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



      <div
        className="
          border-t
          p-4
          sm:p-5
        "
      >

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
