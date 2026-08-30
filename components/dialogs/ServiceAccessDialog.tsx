"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ShieldCheck,
  PencilLine,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  UserCog,
  ListChecks,
  Power,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SectorDropdown } from "../input/SectorDropDown";
import { RoleDropdown } from "../input/RoleDropDown";
import { ACTIONS, ServiceAction, TONE_STYLES } from "@/types/revenue/service-access-rule";

/* =========================================================
   TYPES
========================================================= */

interface FormValues {
  sectorId: string;
  roleId: number | null;
  actions: ServiceAction[];
  isActive: boolean;
}

interface AccessRule extends FormValues {
  id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  existingAccess: AccessRule[];

  /**
   * Pass an existing rule to edit it. Omit / pass null to create a new one.
   */
  editingRule?: AccessRule | null;

  onSubmit: (data: FormValues, ruleId?: string) => Promise<void>;
}





const EMPTY_VALUES: FormValues = {
  sectorId: "",
  roleId: null,
  actions: [],
  isActive: true,
};

/* =========================================================
   COMPONENT
========================================================= */

export function ServiceAccessDialog({
  open,
  onOpenChange,
  serviceName,
  existingAccess,
  editingRule = null,
  onSubmit,
}: Props) {
  const isEditMode = !!editingRule;

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* -----------------------------------------------------
     Sync form state whenever the dialog opens, or the
     rule being edited changes (switching between rules
     without fully unmounting the dialog).
  ----------------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    if (editingRule) {
      setValues({
        sectorId: editingRule.sectorId,
        roleId: editingRule.roleId,
        actions: editingRule.actions,
        isActive: editingRule.isActive,
      });
    } else {
      setValues(EMPTY_VALUES);
    }

    setError("");
  }, [open, editingRule]);

  /* -----------------------------------------------------
     Duplicate rule detection (sector + role combo)
     — excludes the rule currently being edited so editing
     a rule doesn't falsely flag itself as a duplicate.
  ----------------------------------------------------- */
  const duplicateRule = useMemo(() => {
    if (!values.sectorId || !values.roleId) return null;

    return (
      existingAccess.find(
        (a) =>
          a.sectorId === values.sectorId &&
          a.roleId === values.roleId &&
          a.id !== editingRule?.id
      ) ?? null
    );
  }, [values.sectorId, values.roleId, existingAccess, editingRule]);

  // const selectedSector = SECTORS.find((s) => s.id === values.sectorId);
  // const selectedRole = ROLES.find((r) => r.id === values.roleId);

  const toggleAction = (code: ServiceAction) => {
    setValues((prev) => ({
      ...prev,
      actions: prev.actions.includes(code)
        ? prev.actions.filter((x) => x !== code)
        : [...prev.actions, code],
    }));
  };

  const selectAllActions = () => {
    setValues((prev) => ({ ...prev, actionIds: ACTIONS.map((x) => x.id) }));
  };

  const clearActions = () => {
    setValues((prev) => ({ ...prev, actionIds: [] }));
  };

  const closeDialog = () => {
    setError("");
    onOpenChange(false);
  };

  const submit = async () => {
    setError("");

    if (!values.sectorId) {
      setError("Select a sector to continue.");
      return;
    }

    if (!values.roleId) {
      setError("Select a role to continue.");
      return;
    }

    if (values.actions.length === 0) {
      setError("Select at least one action.");
      return;
    }

    if (duplicateRule) {
      setError("This sector and role combination already has an access rule.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(values, editingRule?.id);
      closeDialog();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl lg:max-w-4xl">
        {/* HEADER */}
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isEditMode ? <PencilLine size={20} /> : <ShieldCheck size={20} />}
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-xl">
                {isEditMode ? "Edit Access Rule" : "Create Access Rule"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update workflow permission for" : "Configure workflow permission for"}
                <span className="mx-1 font-semibold text-foreground">{serviceName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* WORKFLOW OWNER */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 size={15} className="text-muted-foreground" />
              Workflow Owner
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Building2 size={13} className="text-muted-foreground" />
                  Sector
                </Label>

                <SectorDropdown

                  value={
                    values.sectorId || null
                  }


                  onChange={(value,item)=>{


                    setValues(prev=>({

                      ...prev,

                      sectorId:value

                    }));


                    // setSelectedSector(item);


                  }}

                  />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <UserCog size={13} className="text-muted-foreground" />
                  Role
                </Label>

                <RoleDropdown

                    value={
                      values.roleId || null
                    }


                    onChange={(value,item)=>{


                      setValues(prev=>({

                      ...prev,

                      roleId:value

                      }));


                      // setSelectedRole(item);


                    }}

                    />
              </div>
            </div>

          </div>

          {/* ACTIONS */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-1.5">
                <ListChecks size={15} className="text-muted-foreground" />
                Available Actions
              </Label>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllActions} type="button">
                  Select all
                </Button>
                <Button size="sm" variant="ghost" onClick={clearActions} type="button">
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACTIONS.map((action) => {
                const isChecked = values.actions.includes(action.code as ServiceAction);
                const tone = TONE_STYLES[action.tone];
                const Icon = action.icon;

                return (
                  <button
                    type="button"
                    key={action.id}
                    onClick={() => toggleAction(action.code as ServiceAction)}
                    aria-pressed={isChecked}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isChecked ? tone.ring : "border-border/60 hover:bg-muted/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isChecked ? tone.chipActive : tone.chip
                      )}
                    >
                      <Icon size={16} className={isChecked ? tone.iconActive : tone.icon} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{action.name}</p>
                        {isChecked && (
                          <CheckCircle2 size={16} className="shrink-0 text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <ListChecks size={12} />
                {values.actions.length} / {ACTIONS.length} actions selected
              </Badge>
            </div>
          </div>

          {/* STATUS */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  values.isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-500/10 text-slate-500"
                )}
              >
                <Power size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Active Rule</p>
                <p className="text-xs text-muted-foreground">
                  Allow this workflow access immediately.
                </p>
              </div>
            </div>

            <Switch
              checked={values.isActive}
              onCheckedChange={(v) => setValues((prev) => ({ ...prev, isActive: v }))}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle size={17} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="sticky bottom-0 gap-2 bg-background pt-3">
          <Button variant="outline" disabled={loading} onClick={closeDialog}>
            Cancel
          </Button>

          <Button disabled={loading} onClick={submit}>
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Saving
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2" size={16} />
                {isEditMode ? "Update Rule" : "Save Rule"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}