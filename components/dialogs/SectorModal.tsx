
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Field,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { ClusterDropdown } from "@/components/input/ClusterDropdown";
import type { Cluster, Sector } from "@/types/admin-unit";
import {
  type SectorFormData,
  SectorFormInput,
  sectorSchema,
} from "@/lib/zod-forms/sector.schema";

interface SectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector?: Sector | null;
  onSubmit: (data: SectorFormData) => void;
  isLoading?: boolean;
}

export function SectorDialog({
  open,
  onOpenChange,
  sector,
  onSubmit,
  isLoading = false,
}: SectorDialogProps) {
  const form = useForm<SectorFormInput, unknown, SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      cluster_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (sector) {
      form.reset({
        name: sector.name,
        code: sector.code,
        description: sector.description ?? "",
        cluster_id: sector.cluster?.id ?? "",
        is_active: sector.is_active ?? true,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        cluster_id: "",
        is_active: true,
      });
    }
  }, [sector, open, form]);

  const isActive = form.watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {sector ? "Update Sector" : "Create Sector"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FieldGroup>
            {/* Cluster */}
            <Field>
              <FieldLabel>Cluster</FieldLabel>

              <ClusterDropdown
                value={form.watch("cluster_id")}
                onChange={(value: string, _item: Cluster) => {
                  form.setValue("cluster_id", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />

              <FieldError>
                {form.formState.errors.cluster_id?.message}
              </FieldError>
            </Field>

            {/* Name */}
            <Field>
              <FieldLabel>Sector Name</FieldLabel>

              <Input
                placeholder="Enter sector name"
                {...form.register("name")}
              />

              <FieldError>
                {form.formState.errors.name?.message}
              </FieldError>
            </Field>

            {/* Code */}
            <Field>
              <FieldLabel>Sector Code</FieldLabel>

              <Input
                placeholder="Example: SEC-001"
                {...form.register("code")}
              />

              <FieldError>
                {form.formState.errors.code?.message}
              </FieldError>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>Description</FieldLabel>

              <Textarea
                placeholder="Describe the sector"
                rows={4}
                {...form.register("description")}
              />

              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </Field>

            {/* Status toggle — edit only */}
            {sector && (
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {isActive ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <FieldLabel htmlFor="sector-is-active">
                      Sector Status
                    </FieldLabel>

                    <p className="text-sm text-muted-foreground">
                      {isActive
                        ? "This sector is active and available for use."
                        : "This sector is inactive."}
                    </p>

                    <p className="text-xs font-medium">
                      {isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <Switch
                  id="sector-is-active"
                  checked={isActive}
                  disabled={isLoading}
                  onCheckedChange={(checked) => {
                    form.setValue("is_active", checked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  aria-label="Toggle sector active status"
                />
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button disabled={isLoading} type="submit">
              {isLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {sector ? "Update Sector" : "Create Sector"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
