
"use client";

import type { ReactNode } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "./table/data-pagination";

type AppDataTableLayoutProps = {
  children: ReactNode;
  isEmpty: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  filteredEmptyDescription?: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pagination?: boolean;
  className?: string;
};

export default function AppDataTableLayout({
  children,
  isEmpty,
  hasFilters = false,
  onClearFilters,
  emptyTitle = "No records found",
  emptyDescription = "Records will appear here when available.",
  filteredEmptyDescription = "Try adjusting your search or filters.",
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pagination = true,
  className,
}: AppDataTableLayoutProps) {
  return (
    <div className={`overflow-hidden rounded-lg border bg-card ${className ?? ""}`}>
      {isEmpty ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <FileText className="size-8 text-muted-foreground" />

          <p className="text-sm font-medium">{emptyTitle}</p>

          <p className="max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? filteredEmptyDescription
              : emptyDescription}
          </p>

          {hasFilters && onClearFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="mt-1"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}

      {pagination && (
        <div className="border-t px-4 py-3">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}