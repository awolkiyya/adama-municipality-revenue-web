"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Hash,
  Divide,
  Percent,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  ListChecks,
  FileText,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CircleCheck,
  CircleSlash,
  Ruler,
  AlertTriangle,
  Inbox,
  Loader2,
} from "lucide-react";

import {
  BaseField,
  BaseFieldDataType,
  BaseFieldFilters,
} from "@/types/revenue/revenue-baseField";

import { MeasurementUnit } from "@/types/revenue/revenue-unit";
import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";

import {
  useBaseFields,
  useCreateBaseField,
  useUpdateBaseField,
  useActivateBaseField,
  useDeactivateBaseField,
  useDeleteBaseField,
} from "@/hooks/revenue/revenueBaseField.hook";

import { toast } from "sonner";
import FieldPanel, { DATA_TYPE_META, DATA_TYPES } from "@/components/dialogs/FieldPanel";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Button } from "@/components/ui/button";

// ============================================================
// DATA TYPE PRESENTATION
// ============================================================
// NOTE: "FILE" was added here. It must also exist on the
// BaseFieldDataType union in "@/types/revenue/revenue-baseField",
// and on whatever type-selection UI FieldPanel renders internally
// (see the callout at the bottom of this file).


interface FieldFormState {
  name: string;
  code: string;
  data_type: BaseFieldDataType;
  measurement_unit_id: string;
  description: string;
  is_active: boolean;
}

const emptyForm: FieldFormState = {
  name: "",
  code: "",
  data_type: "NUMBER",
  measurement_unit_id: "",
  description: "",
  is_active: true,
};


// ============================================================
// ERROR HELPER
// ============================================================

function getErrorMessage(
  error: any,
  fallback: string,
): string {
  return (
    error?.response?.data?.message ??
    error?.message ??
    fallback
  );
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
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
        {type}
      </span>
    );
  }

  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
      <Icon
        size={13}
        strokeWidth={2}
        className="text-teal-700"
      />

      {meta.label}
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
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
        <Loader2
          size={13}
          className="animate-spin"
        />

        Updating...
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
        <CircleCheck
          size={13}
          strokeWidth={2}
        />

        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
      <CircleSlash
        size={13}
        strokeWidth={2}
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
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors " +
        "hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        (tone === "danger"
          ? "hover:!border-red-200 hover:!bg-red-50 hover:!text-red-700"
          : "")
      }
    >
      <Icon
        size={16}
        strokeWidth={2}
      />
    </button>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 size={16} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Delete this field?
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono text-slate-700">
                {field.code}
              </span>{" "}
              will be permanently removed.
              Reports or forms referencing
              it may break.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && (
              <Loader2
                size={14}
                className="mr-2 animate-spin"
              />
            )}

            {isLoading
              ? "Deleting..."
              : "Delete field"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN MANAGER
// ============================================================

export default function BaseFieldManager() {
  // ==========================================================
  // SERVER STATE
  // ==========================================================

  const [filters, setFilters] =
    useState<BaseFieldFilters>({
      page: 1,
      per_page: 8,
      search: "",
      dataType: undefined,
      isActive: undefined,
    });

  const [searchInput, setSearchInput] =
    useState("");

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [panelOpen, setPanelOpen] =
    useState(false);

  const [editingField, setEditingField] =
    useState<BaseField | null>(null);

  const [pendingDelete, setPendingDelete] =
    useState<BaseField | null>(null);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<string | null>(null);

  // ==========================================================
  // QUERY
  // ==========================================================

  const {
    data,
    isLoading,
    isFetching,
  } = useBaseFields(filters);

  const fields =
    data?.data ?? [];

  const meta =
    data?.meta;

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createBaseField =
    useCreateBaseField();

  const updateBaseField =
    useUpdateBaseField();

  const activateBaseField =
    useActivateBaseField();

  const deactivateBaseField =
    useDeactivateBaseField();

  const deleteBaseField =
    useDeleteBaseField();

  // ==========================================================
  // DEBOUNCED SEARCH
  // ==========================================================

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setFilters((current) => ({
          ...current,
          search:
            searchInput.trim() || undefined,
          page: 1,
        }));
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [searchInput]);

  // ==========================================================
  // EXISTING CODES
  // ==========================================================

  const existingCodes =
    useMemo(
      () =>
        new Set(
          fields.map(
            (field) =>
              field.code,
          ),
        ),
      [fields],
    );

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const currentPage =
    meta?.current_page ??
    filters.page ??
    1;

  const lastPage =
    meta?.last_page ??
    1;

  const total =
    meta?.total ?? 0;

  const perPage =
    meta?.per_page ??
    filters.per_page ??
    8;

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  function openCreate() {
    setEditingField(null);
    setPanelOpen(true);
  }

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  function openEdit(
    field: BaseField,
  ) {
    setEditingField(field);
    setPanelOpen(true);
  }

  // ==========================================================
  // CLOSE PANEL
  // ==========================================================

  function closePanel() {
    if (
      createBaseField.isPending ||
      updateBaseField.isPending
    ) {
      return;
    }

    setPanelOpen(false);
    setEditingField(null);
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  function handleSave(
    formData: FieldFormState,
  ) {
    const payload: Partial<BaseField> =
      {
        name: formData.name.trim(),

        code: formData.code
          .trim()
          .toUpperCase(),

        data_type:
          formData.data_type,

        measurement_unit_id:
          formData.measurement_unit_id ||
          undefined,

        description:
          formData.description.trim() ||
          undefined,

        is_active:
          formData.is_active,
      };

    // ========================================================
    // UPDATE
    // ========================================================

    if (editingField) {
      updateBaseField.mutate(
        {
          id: editingField.id,
          data: payload,
        },
        {
          onSuccess: () => {
            toast.success(
              "Base field updated successfully",
            );

            setPanelOpen(false);
            setEditingField(null);
          },

          onError: (
            error: any,
          ) => {
            toast.error(
              getErrorMessage(
                error,
                "Failed to update base field",
              ),
            );
          },
        },
      );

      return;
    }

    // ========================================================
    // CREATE
    // ========================================================

    createBaseField.mutate(
      payload,
      {
        onSuccess: () => {
          toast.success(
            "Base field created successfully",
          );

          setPanelOpen(false);
          setEditingField(null);
        },

        onError: (
          error: any,
        ) => {
          toast.error(
            getErrorMessage(
              error,
              "Failed to create base field",
            ),
          );
        },
      },
    );
  }

  // ==========================================================
  // TOGGLE ACTIVE
  // ==========================================================

  function toggleActive(
    field: BaseField,
  ) {
    if (
      statusUpdatingId !== null ||
      activateBaseField.isPending ||
      deactivateBaseField.isPending
    ) {
      return;
    }

    setStatusUpdatingId(
      field.id,
    );

    const mutation =
      field.is_active
        ? deactivateBaseField
        : activateBaseField;

    mutation.mutate(
      field.id,
      {
        onSuccess: () => {
          toast.success(
            field.is_active
              ? "Base field deactivated successfully"
              : "Base field activated successfully",
          );
        },

        onError: (
          error: any,
        ) => {
          toast.error(
            getErrorMessage(
              error,
              "Failed to change base field status",
            ),
          );
        },

        onSettled: () => {
          setStatusUpdatingId(
            null,
          );
        },
      },
    );
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    deleteBaseField.mutate(
      pendingDelete.id,
      {
        onSuccess: () => {
          toast.success(
            "Base field deleted successfully",
          );

          setPendingDelete(null);
        },

        onError: (
          error: any,
        ) => {
          toast.error(
            getErrorMessage(
              error,
              "Failed to delete base field",
            ),
          );
        },
      },
    );
  }

  // ==========================================================
  // FILTER COUNT
  // ==========================================================

  const activeFilterCount =
    (filters.dataType
      ? 1
      : 0) +
    (filters.isActive !== undefined
      ? 1
      : 0);

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  function clearFilters() {
    setSearchInput("");

    setFilters(
      (current) => ({
        ...current,
        search: undefined,
        dataType:
          undefined,
        isActive:
          undefined,
        page: 1,
      }),
    );
  }

  // ==========================================================
  // PAGE CHANGE
  // ==========================================================

  const setPage =
    useCallback(
      (page: number) => {
        setFilters(
          (current) => ({
            ...current,
            page: Math.max(
              1,
              Math.min(
                page,
                lastPage,
              ),
            ),
          }),
        );
      },
      [lastPage],
    );

  // ==========================================================
  // EMPTY
  // ==========================================================

  const isEmpty =
    !isLoading &&
    fields.length === 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 font-sans sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <Banner
          description="
          Reusable field definitions
          available across forms,
          templates, and reports.
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
                <Ruler
                  className="
                    h-3
                    w-3
                  "
                />
              }
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
            <Button
              variant="outline"
              onClick={openCreate}
            >
              <Plus
                className="
                  h-4
                  w-4
                "
              />

              Create New
            </Button>
          }
          overlayClassName="
            bg-gradient-to-r
            from-primary/95
            via-primary/80
            to-primary/50
          "
          className="
            text-white
          "
        />

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder="Search by name or code"
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* FILTERS */}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <SlidersHorizontal size={13} />
            </div>

            {/* DATA TYPE */}

            <select
              value={
                filters.dataType ??
                ""
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,

                    dataType:
                      event.target
                        .value
                        ? (event.target
                            .value as BaseFieldDataType)
                        : undefined,

                    page: 1,
                  }),
                )
              }
              className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">
                All types
              </option>

              {DATA_TYPES.map(
                (dataType) => (
                  <option
                    key={dataType}
                    value={dataType}
                  >
                    {
                      DATA_TYPE_META[
                        dataType
                      ].label
                    }
                  </option>
                ),
              )}
            </select>

            {/* STATUS */}

            <select
              value={
                filters.isActive ===
                undefined
                  ? ""
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,

                    isActive:
                      event.target
                        .value === ""
                        ? undefined
                        : event.target
                              .value ===
                            "active",

                    page: 1,
                  }),
                )
              }
              className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-teal-500"
            >
              <option value="">
                Any status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            {/* CLEAR */}

            {activeFilterCount >
              0 && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={12} />

                Clear
              </button>
            )}
          </div>
        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">

          {/* LOADING */}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <Loader2
                size={28}
                className="animate-spin text-teal-700"
              />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Loading base fields
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait...
                </p>
              </div>
            </div>
          ) : isEmpty ? (
            /* ==================================================
               EMPTY
            ================================================== */

            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Inbox
                size={28}
                className="text-slate-300"
              />

              <p className="text-sm font-medium text-slate-700">
                No fields match these
                filters
              </p>

              <p className="text-xs text-slate-400">
                Try a different search
                term or clear your
                filters.
              </p>

              {(filters.search ||
                activeFilterCount >
                  0) && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="mt-1 text-xs font-medium text-teal-700 hover:underline"
                >
                  Reset search and
                  filters
                </button>
              )}
            </div>
          ) : (
            /* ==================================================
               DATA
            ================================================== */

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">
                      Field
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Type
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Unit
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Updated
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {fields.map(
                    (field) => {
                      const statusLoading =
                        statusUpdatingId ===
                        field.id;

                      return (
                        <tr
                          key={
                            field.id
                          }
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                        >
                          {/* FIELD */}

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {
                                field.name
                              }
                            </div>

                            <div className="font-mono text-xs text-slate-400">
                              {
                                field.code
                              }
                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-4 py-3">
                            <DataTypeBadge
                              type={
                                field.data_type
                              }
                            />
                          </td>

                          {/* UNIT */}

                          <td className="px-4 py-3 text-slate-500">
                            {field.unit_code ? (
                              <span className="font-mono text-xs">
                                {
                                  field.unit_code
                                }
                              </span>
                            ) : (
                              <span className="text-slate-300">
                                —
                              </span>
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  field,
                                )
                              }
                              disabled={
                                statusLoading ||
                                statusUpdatingId !==
                                  null
                              }
                              className="cursor-pointer disabled:cursor-not-allowed"
                              title={
                                field.is_active
                                  ? "Deactivate field"
                                  : "Activate field"
                              }
                            >
                              <StatusBadge
                                active={
                                  field.is_active
                                }
                                loading={
                                  statusLoading
                                }
                              />
                            </button>
                          </td>

                          {/* UPDATED */}

                          <td className="px-4 py-3 text-xs text-slate-400">
                            {field.updated_at
                              ? new Date(
                                  field.updated_at,
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconButton
                                icon={
                                  Pencil
                                }
                                label={`Edit ${field.name}`}
                                onClick={() =>
                                  openEdit(
                                    field,
                                  )
                                }
                                disabled={
                                  statusLoading ||
                                  statusUpdatingId !==
                                    null
                                }
                              />

                              <IconButton
                                icon={
                                  Trash2
                                }
                                label={`Delete ${field.name}`}
                                tone="danger"
                                onClick={() =>
                                  setPendingDelete(
                                    field,
                                  )
                                }
                                disabled={
                                  statusLoading ||
                                  statusUpdatingId !==
                                    null
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================================================
              PAGINATION
          ================================================== */}

          {!isLoading &&
            total > 0 && (
              <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      (currentPage -
                        1) *
                        perPage +
                        1,
                      total,
                    )}
                  </span>
                  –
                  <span className="font-medium text-slate-700">
                    {Math.min(
                      currentPage *
                        perPage,
                      total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {total}
                  </span>{" "}
                  fields
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        currentPage -
                          1,
                      )
                    }
                    disabled={
                      currentPage <=
                        1 ||
                      isFetching
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-600">
                    Page{" "}
                    {currentPage}{" "}
                    of{" "}
                    {lastPage}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        currentPage +
                          1,
                      )
                    }
                    disabled={
                      currentPage >=
                        lastPage ||
                      isFetching
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* ======================================================
          CREATE / EDIT PANEL
      ====================================================== */}

      <FieldPanel
        open={panelOpen}
        editing={editingField}
        existingCodes={
          existingCodes
        }
        isLoading={
          createBaseField.isPending ||
          updateBaseField.isPending
        }
        onClose={
          closePanel
        }
        onSave={
          handleSave
        }
      />

      {/* ======================================================
          DELETE CONFIRMATION
      ====================================================== */}

      {pendingDelete && (
        <DeleteConfirm
          field={
            pendingDelete
          }
          isLoading={
            deleteBaseField.isPending
          }
          onCancel={() =>
            !deleteBaseField.isPending &&
            setPendingDelete(
              null,
            )
          }
          onConfirm={
            confirmDelete
          }
        />
      )}
    </div>
  );
}