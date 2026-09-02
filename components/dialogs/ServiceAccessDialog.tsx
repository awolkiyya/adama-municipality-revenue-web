"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* =========================================================
   TYPES
========================================================= */

/**
 * Sector available in the system.
 */
export interface Sector {
  id: string;
  name: string;
}

/**
 * Existing access rule returned by the backend.
 *
 * One rule represents:
 *
 *     revenue service + sector
 *
 * isActive:
 *     true  = sector is allowed
 *     false = sector is not allowed
 */
export interface AccessRule {
  id: string;
  sectorId: string;
  isActive: boolean;
}

/**
 * Form state for one sector.
 */
export interface SectorAccess {
  sectorId: string;
  sectorName: string;
  isActive: boolean;
}

/**
 * Complete form payload.
 */
export interface FormValues {
  sectors: SectorAccess[];
}

/* =========================================================
   PROPS
========================================================= */

interface Props {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  /**
   * Revenue service name displayed in the dialog.
   */
  serviceName: string;

  /**
   * Complete list of sectors.
   */
  sectors: Sector[];

  /**
   * Existing access rules for this service.
   */
  existingAccess: AccessRule[];

  /**
   * Save sector access configuration.
   */
  onSubmit: (
    data: FormValues
  ) => Promise<void>;
}

/* =========================================================
   COMPONENT
========================================================= */

export function ServiceAccessDialog({
  open,
  onOpenChange,
  serviceName,
  sectors,
  existingAccess,
  onSubmit,
}: Props) {
  const [sectorAccess, setSectorAccess] =
    useState<SectorAccess[]>([]);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     INITIALIZE
  ========================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    /**
     * Build the complete sector access list.
     *
     * Every sector is displayed.
     *
     * Existing rule:
     *     use existing isActive state
     *
     * No existing rule:
     *     not allowed
     */
    const initialAccess: SectorAccess[] =
      sectors.map((sector) => {
        const existingRule =
          existingAccess.find(
            (rule) =>
              rule.sectorId === sector.id
          );

        return {
          sectorId: sector.id,
          sectorName: sector.name,
          isActive:
            existingRule?.isActive ??
            false,
        };
      });

    setSectorAccess(initialAccess);

    setSearch("");

    setError("");
  }, [
    open,
    sectors,
    existingAccess,
  ]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredSectors = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return sectorAccess;
    }

    return sectorAccess.filter(
      (sector) =>
        sector.sectorName
          .toLowerCase()
          .includes(query)
    );
  }, [
    search,
    sectorAccess,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const allowedSectors = useMemo(
    () =>
      sectorAccess.filter(
        (sector) => sector.isActive
      ).length,
    [sectorAccess]
  );

  const notAllowedSectors =
    sectorAccess.length -
    allowedSectors;

  /* =========================================================
     TOGGLE SECTOR
  ========================================================= */

  const toggleSector = (
    sectorId: string,
    isActive: boolean
  ) => {
    setSectorAccess((current) =>
      current.map((sector) =>
        sector.sectorId === sectorId
          ? {
              ...sector,
              isActive,
            }
          : sector
      )
    );

    setError("");
  };

  /* =========================================================
     ALLOW ALL SECTORS
  ========================================================= */

  const allowAllSectors = () => {
    setSectorAccess((current) =>
      current.map((sector) => ({
        ...sector,
        isActive: true,
      }))
    );

    setError("");
  };

  /* =========================================================
     NOT ALLOW ALL SECTORS
  ========================================================= */

  const notAllowAllSectors = () => {
    setSectorAccess((current) =>
      current.map((sector) => ({
        ...sector,
        isActive: false,
      }))
    );

    setError("");
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const closeDialog = () => {
    if (loading) {
      return;
    }

    setError("");

    setSearch("");

    onOpenChange(false);
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async () => {
    setError("");

    if (sectorAccess.length === 0) {
      setError(
        "No sectors are available to configure."
      );

      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        sectors: sectorAccess,
      });

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Failed to save service access:",
        error
      );

      setError(
        "Failed to save service access. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!loading) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        {/* ===================================================
            HEADER
        =================================================== */}

        <DialogHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={20} />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-xl">
                Configure Sector Access
              </DialogTitle>

              <DialogDescription className="mt-1">
                Control which sectors are allowed to
                access{" "}
                <span className="font-semibold text-foreground">
                  {serviceName}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="max-h-[calc(92vh-170px)] overflow-y-auto">
          <div className="space-y-5 px-6 py-5">

            {/* =================================================
                SERVICE
            ================================================= */}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Revenue Service
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {serviceName}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className="shrink-0"
                >
                  Sector Access
                </Badge>
              </div>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-lg font-semibold">
                  {allowedSectors}
                </p>

                <p className="text-xs text-muted-foreground">
                  Allowed sectors
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-lg font-semibold">
                  {notAllowedSectors}
                </p>

                <p className="text-xs text-muted-foreground">
                  Not allowed
                </p>
              </div>
            </div>

            {/* =================================================
                SEARCH + BULK ACTIONS
            ================================================= */}

            <div className="space-y-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search sectors..."
                  className="pl-9"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={allowAllSectors}
                  disabled={loading}
                >
                  Allow All
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={notAllowAllSectors}
                  disabled={loading}
                >
                  Not Allow All
                </Button>
              </div>
            </div>

            {/* =================================================
                ACCESS TABLE
            ================================================= */}

            <div className="overflow-hidden rounded-xl border border-border/60">
              {/* =================================================
                  TABLE HEADER
              ================================================= */}

              <div className="grid grid-cols-[minmax(240px,1fr)_140px] items-center border-b bg-muted/30 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sector
                </div>

                <div className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Access
                </div>
              </div>

              {/* =================================================
                  ROWS
              ================================================= */}

              {filteredSectors.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <Building2
                    size={30}
                    className="text-muted-foreground/50"
                  />

                  <p className="mt-3 text-sm font-medium">
                    No sectors found
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredSectors.map(
                    (sector) => (
                      <div
                        key={sector.sectorId}
                        className={cn(
                          "grid grid-cols-[minmax(240px,1fr)_140px] items-center px-4 py-4 transition-colors",
                          sector.isActive
                            ? "bg-emerald-500/[0.025]"
                            : "bg-background"
                        )}
                      >
                        {/* =====================================
                            SECTOR
                        ===================================== */}

                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              sector.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Building2 size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {sector.sectorName}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {sector.isActive
                                ? "Access allowed"
                                : "Access not allowed"}
                            </p>
                          </div>
                        </div>

                        {/* =====================================
                            ACCESS
                        ===================================== */}

                        <div className="flex items-center justify-center gap-3">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              sector.isActive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {sector.isActive
                              ? "Allow"
                              : "Not Allow"}
                          </span>

                          <Switch
                            checked={
                              sector.isActive
                            }
                            onCheckedChange={(
                              checked
                            ) =>
                              toggleSector(
                                sector.sectorId,
                                checked
                              )
                            }
                            disabled={loading}
                            aria-label={`Toggle ${sector.sectorName} access`}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            disabled={loading}
            onClick={closeDialog}
            type="button"
          >
            Cancel
          </Button>

          <Button
            disabled={
              loading ||
              sectorAccess.length === 0
            }
            onClick={submit}
            type="button"
          >
            {loading ? (
              <>
                <Loader2
                  className="mr-2 animate-spin"
                  size={16}
                />

                Saving Changes
              </>
            ) : (
              <>
                <CheckCircle2
                  className="mr-2"
                  size={16}
                />

                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
