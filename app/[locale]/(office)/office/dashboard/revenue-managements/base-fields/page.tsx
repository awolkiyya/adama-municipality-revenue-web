"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  CircleCheck,
  CircleSlash,
  Ruler,
  Inbox,
  Loader2,
  Bot,
  UserRound,
  Workflow,
  Check,
  X,
  FileText,
  ListChecks,
} from "lucide-react";

import type {
  BaseField,
  BaseFieldDataType,
  BaseFieldFilters,
} from "@/types/revenue/revenue-baseField";

import {
  useBaseFields,
  useActivateBaseField,
  useDeactivateBaseField,
  useDeleteBaseField,
} from "@/hooks/revenue/revenueBaseField.hook";

import { toast } from "sonner";

import {
  DATA_TYPE_META,
  DATA_TYPES,
} from "@/components/revenue/base-fields/BaseFieldDataTypePicker";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import AppFilterBar from "@/components/app-filter-bar";
import { DataTablePagination } from "@/components/table/data-pagination";
import Can from "@/components/access/Can";

// ============================================================
// TYPES
// ============================================================

type BaseFieldStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type BaseFieldDraftFilters = {
  dataType: BaseFieldDataType | "ALL";
  status: BaseFieldStatusFilter;
};

type BaseFieldInputSource =
  | "MANUAL"
  | "AI"
  | "MANUAL_OR_AI";

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const BASE_FIELD_RESOURCE = "base_fields";

const INITIAL_FILTERS: BaseFieldFilters = {
  page: DEFAULT_PAGE,
  per_page: DEFAULT_PAGE_SIZE,
  search: "",
  dataType: undefined,
  isActive: undefined,
};

const INITIAL_DRAFT_FILTERS: BaseFieldDraftFilters = {
  dataType: "ALL",
  status: "ALL",
};

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = error.response;

    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      const data = response.data;

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeInputSource(
  value: unknown,
): BaseFieldInputSource {
  if (
    value === "AI" ||
    value === "MANUAL_OR_AI" ||
    value === "MANUAL"
  ) {
    return value;
  }

  return "MANUAL";
}

// ============================================================
// DATA TYPE BADGE
// ============================================================

function DataTypeBadge({
  type,
}: {
  type: BaseFieldDataType;
}) {
  const meta = DATA_TYPE_META[type];

  if (!meta) {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        {type}
      </span>
    );
  }

  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
      <Icon
        size={13}
        strokeWidth={2}
        className="text-primary"
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

// ============================================================
// INPUT SOURCE BADGE
// ============================================================

function InputSourceBadge({
  source,
}: {
  source: unknown;
}) {
  const normalizedSource = normalizeInputSource(source);

  const config = {
    MANUAL: {
      label: "Manual",
      description: "Entered by a user",
      Icon: UserRound,
      className:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    },
    AI: {
      label: "AI",
      description: "Provided by an AI process",
      Icon: Bot,
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
    },
    MANUAL_OR_AI: {
      label: "Manual or AI",
      description: "Either input method is allowed",
      Icon: Workflow,
      className:
        "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
    },
  }[normalizedSource];

  const Icon = config.Icon;

  return (
    <span
      title={config.description}
      className={[
        "inline-flex max-w-full items-center gap-1.5",
        "rounded-md border px-2 py-1 text-xs font-medium",
        config.className,
      ].join(" ")}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  active,
  loading = false,
}: {
  active: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        <Loader2
          size={13}
          className="animate-spin"
          aria-hidden="true"
        />
        Updating...
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
        <CircleCheck
          size={13}
          strokeWidth={2}
          aria-hidden="true"
        />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      <CircleSlash
        size={13}
        strokeWidth={2}
        aria-hidden="true"
      />
      Inactive
    </span>
  );
}

// ============================================================
// ICON BUTTON
// ============================================================

function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex size-8 items-center justify-center rounded-md",
        "border border-transparent text-muted-foreground transition-colors",
        "hover:border-border hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          : "",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <div className="break-words text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// VIEW DETAILS SHEET
// ============================================================

function BaseFieldDetailsSheet({
  field,
  open,
  onOpenChange,
  onEdit,
}: {
  field: BaseField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (field: BaseField) => void;
}) {
  const options = [...(field?.options ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const description = field?.description?.trim();

  const inputSource = normalizeInputSource(
    field?.input_source,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {field && (
          <>
            <div className="border-b border-border px-6 py-5">
              <SheetHeader className="space-y-3 text-left">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted">
                  <Eye
                    size={20}
                    className="text-primary"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <SheetTitle className="text-lg">
                    Base field details
                  </SheetTitle>

                  <SheetDescription className="mt-1">
                    Review the field configuration and input
                    behavior.
                  </SheetDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <StatusBadge active={field.is_active} />
                  <DataTypeBadge type={field.data_type} />
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 space-y-6 px-6 py-5">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Field information
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <DetailItem label="Field name">
                    <span className="font-medium">
                      {field.name}
                    </span>
                  </DetailItem>

                  <DetailItem label="Field code">
                    <span className="break-all font-mono text-xs">
                      {field.code}
                    </span>
                  </DetailItem>

                  <DetailItem label="Data type">
                    {DATA_TYPE_META[field.data_type]?.label ??
                      field.data_type}
                  </DetailItem>

                  <DetailItem label="Measurement unit">
                    {field.unit_code || "No unit assigned"}
                  </DetailItem>
                </div>

                <DetailItem label="Description">
                  {description || (
                    <span className="italic text-muted-foreground">
                      No description provided
                    </span>
                  )}
                </DetailItem>
              </section>

              <div className="border-t border-border" />

              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Input configuration
                </h3>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      {inputSource === "AI" ? (
                        <Bot
                          size={17}
                          className="text-violet-600"
                          aria-hidden="true"
                        />
                      ) : inputSource === "MANUAL_OR_AI" ? (
                        <Workflow
                          size={17}
                          className="text-teal-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <UserRound
                          size={17}
                          className="text-slate-600"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Input source
                      </p>

                      <div className="mt-2">
                        <InputSourceBadge
                          source={field.input_source}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {inputSource === "AI"
                          ? "This field is intended to be populated by an AI process."
                          : inputSource === "MANUAL_OR_AI"
                            ? "This field can be populated manually or by an AI process."
                            : "This field is intended to be entered manually by a user."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Field options
                  </h3>

                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {options.length}
                  </span>
                </div>

                {options.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    {options.map((option, index) => (
                      <div
                        key={
                          option.id ??
                          `${option.value}-${index}`
                        }
                        className={[
                          "flex items-start justify-between gap-3 px-3 py-3",
                          index > 0
                            ? "border-t border-border"
                            : "",
                        ].join(" ")}
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <ListChecks
                              size={14}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium">
                              {option.label}
                            </p>

                            <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                              {option.value}
                            </p>
                          </div>
                        </div>

                        {option.is_default && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            <Check size={12} aria-hidden="true" />
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center">
                    <FileText
                      size={20}
                      className="mx-auto text-muted-foreground"
                      aria-hidden="true"
                    />

                    <p className="mt-2 text-sm font-medium">
                      No options configured
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        "SELECT",
                        "RADIO",
                        "CHECKBOX",
                      ].includes(field.data_type)
                        ? "Edit this field to add its selectable options."
                        : "This data type does not require selectable options."}
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-3 border-t border-border pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Record information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Created">
                    {field.created_at
                      ? new Date(
                          field.created_at,
                        ).toLocaleDateString()
                      : "—"}
                  </DetailItem>

                  <DetailItem label="Last updated">
                    {field.updated_at
                      ? new Date(
                          field.updated_at,
                        ).toLocaleDateString()
                      : "—"}
                  </DetailItem>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <X size={15} aria-hidden="true" />
                Close
              </Button>

              <Can
                resource={BASE_FIELD_RESOURCE}
                action="update"
              >
                <Button
                  type="button"
                  onClick={() => onEdit(field)}
                >
                  <Pencil size={15} aria-hidden="true" />
                  Edit field
                </Button>
              </Can>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// DELETE CONFIRMATION
// ============================================================

function DeleteConfirm({
  field,
  isLoading,
  onCancel,
  onConfirm,
}: {
  field: BaseField;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 px-4 py-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-field-title"
        aria-describedby="delete-field-description"
        className="w-full max-w-sm rounded-xl border border-border bg-background p-5 text-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 size={17} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3
              id="delete-field-title"
              className="text-sm font-semibold"
            >
              Delete this field?
            </h3>

            <p
              id="delete-field-description"
              className="mt-1 text-sm leading-5 text-muted-foreground"
            >
              <span className="font-mono font-medium text-foreground">
                {field.code}
              </span>{" "}
              will be removed. Forms or reports referencing this
              field may be affected.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2
                size={14}
                className="animate-spin"
                aria-hidden="true"
              />
            )}

            {isLoading ? "Deleting..." : "Delete field"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACCESS DENIED
// ============================================================

function BaseFieldAccessDenied() {
  return (
    <div className="min-h-[50vh] bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Eye
            size={22}
            className="text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          Access denied
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You do not have permission to view base fields.
          Contact your system administrator if you need access.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PAGE PERMISSION GATE
// ============================================================

export default function BaseFieldManager() {
  return (
    <Can
      resource={BASE_FIELD_RESOURCE}
      action="view"
      fallback={<BaseFieldAccessDenied />}
    >
      <BaseFieldManagerContent />
    </Can>
  );
}

// ============================================================
// MAIN MANAGER CONTENT
// ============================================================

function BaseFieldManagerContent() {
  const router = useRouter();

  // FILTERS

  const [filters, setFilters] = useState<BaseFieldFilters>({
    ...INITIAL_FILTERS,
  });

  const [draftFilters, setDraftFilters] =
    useState<BaseFieldDraftFilters>({
      ...INITIAL_DRAFT_FILTERS,
    });

  const [appliedDraftFilters, setAppliedDraftFilters] =
    useState<BaseFieldDraftFilters>({
      ...INITIAL_DRAFT_FILTERS,
    });

  const [searchInput, setSearchInput] = useState("");

  // ACTION AND DETAIL STATE

  const [pendingDelete, setPendingDelete] =
    useState<BaseField | null>(null);

  const [selectedField, setSelectedField] =
    useState<BaseField | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<string | null>(null);

  // PAGINATION

  const currentPage = filters.page ?? DEFAULT_PAGE;
  const pageSize = filters.per_page ?? DEFAULT_PAGE_SIZE;

  // QUERY

  const {
    data,
    isLoading,
    isFetching,
  } = useBaseFields(filters);

  const fields = data?.data ?? [];
  const meta = data?.meta;

  const displayedPage = meta?.current_page ?? currentPage;
  const total = meta?.total ?? 0;

  // MUTATIONS

  const activateBaseField = useActivateBaseField();
  const deactivateBaseField = useDeactivateBaseField();
  const deleteBaseField = useDeleteBaseField();

  const isUpdatingStatus =
    statusUpdatingId !== null ||
    activateBaseField.isPending ||
    deactivateBaseField.isPending;

  const isDeleting = deleteBaseField.isPending;

  const isMutationRunning =
    isUpdatingStatus || isDeleting;

  // DEBOUNCED SEARCH

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      setFilters((current) => {
        const currentSearch = current.search?.trim() ?? "";

        if (
          currentSearch === nextSearch &&
          current.page === DEFAULT_PAGE
        ) {
          return current;
        }

        return {
          ...current,
          search: nextSearch,
          page: DEFAULT_PAGE,
        };
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // FILTER COUNTS AND DIRTY STATE

  const activeFilterCount =
    (appliedDraftFilters.dataType !== "ALL" ? 1 : 0) +
    (appliedDraftFilters.status !== "ALL" ? 1 : 0);

  const hasAppliedFilters =
    Boolean(filters.search?.trim()) ||
    filters.dataType !== undefined ||
    filters.isActive !== undefined;

  const hasPendingChanges =
    draftFilters.dataType !== appliedDraftFilters.dataType ||
    draftFilters.status !== appliedDraftFilters.status;

  const hasSearchInput = Boolean(searchInput.trim());

  // APPLY FILTERS

  const applyFilters = useCallback(() => {
    const nextDataType =
      draftFilters.dataType === "ALL"
        ? undefined
        : draftFilters.dataType;

    const nextIsActive =
      draftFilters.status === "ALL"
        ? undefined
        : draftFilters.status === "ACTIVE";

    setAppliedDraftFilters({ ...draftFilters });

    setFilters((current) => ({
      ...current,
      page: DEFAULT_PAGE,
      per_page: current.per_page ?? DEFAULT_PAGE_SIZE,
      search: searchInput.trim(),
      dataType: nextDataType,
      isActive: nextIsActive,
    }));
  }, [draftFilters, searchInput]);

  // CLEAR FILTERS

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setDraftFilters({ ...INITIAL_DRAFT_FILTERS });
    setAppliedDraftFilters({ ...INITIAL_DRAFT_FILTERS });
    setFilters({ ...INITIAL_FILTERS });
  }, []);

  // PAGINATION

  const handlePageChange = useCallback((pageIndex: number) => {
    const nextPage = pageIndex + 1;

    setFilters((current) => {
      if (current.page === nextPage) {
        return current;
      }

      return {
        ...current,
        page: nextPage,
      };
    });
  }, []);

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      if (
        !Number.isFinite(nextPageSize) ||
        nextPageSize < 1
      ) {
        return;
      }

      setFilters((current) => ({
        ...current,
        page: DEFAULT_PAGE,
        per_page: nextPageSize,
      }));
    },
    [],
  );

  // NAVIGATION: CREATE

  const openCreate = useCallback(() => {
    if (isMutationRunning) return;

    router.push(
      "/en/office/dashboard/revenue-managements/base-fields/create",
    );
  }, [router, isMutationRunning]);

  // NAVIGATION: EDIT

  const openEdit = useCallback(
    (field: BaseField) => {
      if (isMutationRunning) return;

      setDetailsOpen(false);

      router.push(
        `/en/office/dashboard/revenue-managements/base-fields/${encodeURIComponent(field.id)}/edit`,
      );
    },
    [router, isMutationRunning],
  );

  // VIEW DETAILS

  const openDetails = useCallback((field: BaseField) => {
    setSelectedField(field);
    setDetailsOpen(true);
  }, []);

  // TOGGLE ACTIVE

  const toggleActive = useCallback(
    (field: BaseField) => {
      if (isMutationRunning) return;

      setStatusUpdatingId(field.id);

      const mutation = field.is_active
        ? deactivateBaseField
        : activateBaseField;

      mutation.mutate(field.id, {
        onSuccess: () => {
          toast.success(
            field.is_active
              ? "Base field deactivated successfully"
              : "Base field activated successfully",
          );
        },
        onError: (error: unknown) => {
          toast.error(
            getErrorMessage(
              error,
              "Failed to change base field status",
            ),
          );
        },
        onSettled: () => {
          setStatusUpdatingId(null);
        },
      });
    },
    [
      isMutationRunning,
      activateBaseField,
      deactivateBaseField,
    ],
  );

  // DELETE

  const confirmDelete = useCallback(() => {
    if (!pendingDelete || isDeleting) return;

    deleteBaseField.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Base field deleted successfully");
        setPendingDelete(null);

        if (selectedField?.id === pendingDelete.id) {
          setDetailsOpen(false);
          setSelectedField(null);
        }

        setFilters((current) => {
          const currentPage =
            current.page ?? DEFAULT_PAGE;

          const currentPageSize =
            current.per_page ?? DEFAULT_PAGE_SIZE;

          const remainingTotal = Math.max(0, total - 1);

          const lastPage = Math.max(
            DEFAULT_PAGE,
            Math.ceil(remainingTotal / currentPageSize),
          );

          return {
            ...current,
            page: Math.min(currentPage, lastPage),
          };
        });
      },
      onError: (error: unknown) => {
        toast.error(
          getErrorMessage(
            error,
            "Failed to delete base field",
          ),
        );
      },
    });
  }, [
    pendingDelete,
    isDeleting,
    deleteBaseField,
    total,
    selectedField,
  ]);

  // EMPTY STATE

  const isEmpty = !isLoading && fields.length === 0;

  // RENDER

  return (
    <div className="min-h-screen bg-background px-4 py-8 font-sans text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <Banner
          description="Reusable field definitions available across forms, templates, and reports."
          badge={
            <IconBadge
              className="gap-2 rounded-full p-3 text-[10px]"
              icon={<Ruler className="size-3" />}
            >
              Base fields
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
          actions={
            <Can
              resource={BASE_FIELD_RESOURCE}
              action="create"
            >
              <Button
                variant="default"
                onClick={openCreate}
                disabled={isMutationRunning}
              >
                <Plus className="size-4" />
                Create New
              </Button>
            </Can>
          }
          overlayClassName="bg-transparent"
        />

        {/* FILTERS */}

        <AppFilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by field name or code..."
          searchLabel="Search base fields"
          title="Search and filter"
          description="Search updates automatically. Select filters and click Apply."
          activeFilterCount={activeFilterCount}
          hasFilters={
            hasAppliedFilters ||
            hasPendingChanges ||
            hasSearchInput
          }
          onApply={applyFilters}
          onClear={clearFilters}
          className="py-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Data type
            </label>

            <Select
              value={draftFilters.dataType}
              onValueChange={(value) => {
                setDraftFilters((current) => ({
                  ...current,
                  dataType:
                    value === "ALL"
                      ? "ALL"
                      : (value as BaseFieldDataType),
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All types
                </SelectItem>

                {DATA_TYPES.map((dataType) => (
                  <SelectItem
                    key={dataType}
                    value={dataType}
                  >
                    {DATA_TYPE_META[dataType].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Status
            </label>

            <Select
              value={draftFilters.status}
              onValueChange={(value) => {
                if (
                  value !== "ALL" &&
                  value !== "ACTIVE" &&
                  value !== "INACTIVE"
                ) {
                  return;
                }

                setDraftFilters((current) => ({
                  ...current,
                  status: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All statuses
                </SelectItem>
                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>
                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AppFilterBar>

        {/* TABLE */}

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          {!isLoading && isFetching && (
            <div
              role="status"
              className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground"
            >
              <Loader2
                size={13}
                className="animate-spin"
                aria-hidden="true"
              />
              Updating results...
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <Loader2
                size={28}
                className="animate-spin text-primary"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-medium">
                  Loading base fields
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please wait...
                </p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Inbox
                  size={24}
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <p className="text-sm font-medium">
                No fields match these filters
              </p>

              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                Try a different search term or clear your filters
                to see more results.
              </p>

              {(filters.search ||
                filters.dataType ||
                filters.isActive !== undefined ||
                hasPendingChanges ||
                hasSearchInput) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Reset search and filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Field
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Input source
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Unit
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Updated
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {fields.map((field) => {
                    const statusLoading =
                      statusUpdatingId === field.id;

                    return (
                      <tr
                        key={field.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {field.name}
                          </div>

                          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {field.code}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <DataTypeBadge type={field.data_type} />
                        </td>

                        <td className="px-4 py-3">
                          <InputSourceBadge
                            source={field.input_source}
                          />
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {field.unit_code ? (
                            <span className="font-mono text-xs">
                              {field.unit_code}
                            </span>
                          ) : (
                            <span aria-label="No unit">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Can
                            resource={BASE_FIELD_RESOURCE}
                            action="update"
                            fallback={
                              <StatusBadge
                                active={field.is_active}
                              />
                            }
                          >
                            <button
                              type="button"
                              onClick={() => toggleActive(field)}
                              disabled={isMutationRunning}
                              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                              title={
                                field.is_active
                                  ? "Deactivate field"
                                  : "Activate field"
                              }
                              aria-label={
                                field.is_active
                                  ? `Deactivate ${field.name}`
                                  : `Activate ${field.name}`
                              }
                            >
                              <StatusBadge
                                active={field.is_active}
                                loading={statusLoading}
                              />
                            </button>
                          </Can>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {field.updated_at
                            ? new Date(
                                field.updated_at,
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Can
                              resource={BASE_FIELD_RESOURCE}
                              action="view"
                            >
                              <IconButton
                                icon={Eye}
                                label={`View ${field.name}`}
                                onClick={() => openDetails(field)}
                              />
                            </Can>

                            <Can
                              resource={BASE_FIELD_RESOURCE}
                              action="update"
                            >
                              <IconButton
                                icon={Pencil}
                                label={`Edit ${field.name}`}
                                onClick={() => openEdit(field)}
                                disabled={isMutationRunning}
                              />
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <DataTablePagination
            page={displayedPage}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {/* VIEW DETAILS SHEET */}

      <Can resource={BASE_FIELD_RESOURCE} action="view">
        <BaseFieldDetailsSheet
          field={selectedField}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onEdit={openEdit}
        />
      </Can>

      {/* DELETE CONFIRMATION */}

      <Can resource={BASE_FIELD_RESOURCE} action="delete">
        {pendingDelete && (
          <DeleteConfirm
            field={pendingDelete}
            isLoading={isDeleting}
            onCancel={() => {
              if (!isDeleting) {
                setPendingDelete(null);
              }
            }}
            onConfirm={confirmDelete}
          />
        )}
      </Can>
    </div>
  );
}