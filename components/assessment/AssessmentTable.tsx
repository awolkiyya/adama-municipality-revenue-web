// =====================================================
// ASSESSMENT TABLE
// =====================================================

"use client";

import {
  Button,
} from "@/components/ui/button";

import {
  CommenTable,
} from "@/components/table/CommenTable";

import {
  CommentTableRegistry,
} from "@/components/table/registry";

import {
  resolveActions,
} from "@/components/table/permissions/ResolveActions";

import type {
  CommentType,
} from "@/types/commen";

import type {
  AssessmentConfig,
} from "./assessment.config";
import { DataTablePagination } from "../table/data-pagination";


// =====================================================
// PROPS
// =====================================================

type AssessmentTableProps = {

  config:
    AssessmentConfig;

  data:
    any[];

  page:
    number;

  pageSize:
    number;

  total:
    number;

  isLoading:
    boolean;

  error:
    boolean;

  onView:
    (
      row: any,
    ) => void;

  onEdit:
    (
      row: any,
    ) => void;

  onDelete:
    (
      id: string,
    ) => void;

  onApprove:
    (
      row: any,
    ) => void;

  onReject:
    (
      row: any,
    ) => void;

  onReturn:
    (
      row: any,
    ) => void;

  onRetry:
    () => void;

  onPageChange:
    (
      page: number,
    ) => void;

  onPageSizeChange:
    (
      size: number,
    ) => void;
};


// =====================================================
// COMPONENT
// =====================================================

export function AssessmentTable({
  config,

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
  // BASE ACTIONS
  // ===================================================

  const actions =
    resolveActions(
      CommentTableRegistry.sector,
      config.role,
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
          HEADER
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

        type={
          "assessment" as CommentType
        }

        data={
          data
        }

        page={
          page
        }

        pageSize={
          pageSize
        }

        isLoading={
          isLoading
        }

        onView={
          onView
        }

        onEdit={
          config.canEdit
            ? onEdit
            : undefined
        }

        onDelete={
          config.canDelete
            ? onDelete
            : undefined
        }

        actions={
          actions
        }

      />


      {/* =============================================
          ERROR
      ============================================= */}

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
            onClick={
              onRetry
            }
          >
            Retry
          </Button>

        </div>
      )}


      {/* =============================================
          PAGINATION
      ============================================= */}

      <div
        className="
          border-t
          p-4
          sm:p-5
        "
      >

        <DataTablePagination
          page={
            page
          }

          pageSize={
            pageSize
          }

          total={
            total
          }

          onPageChange={
            onPageChange
          }

          onPageSizeChange={
            onPageSizeChange
          }
        />

      </div>

    </div>
  );
}