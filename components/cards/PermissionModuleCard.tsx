"use client";

import { useId, useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import type { PermissionModuleCardProps } from "@/types/permission.types";

export function PermissionModuleCard({
  value,
  group,
  selected,
  onChange,
  disabled = false,
}: PermissionModuleCardProps & { value: string }) {
  const groupInputId = useId();

  const permissionKeys = useMemo(
    () => group.permissions.map((permission) => permission.name),
    [group.permissions]
  );

  const selectedCount = useMemo(
    () => permissionKeys.filter((key) => selected.has(key)).length,
    [permissionKeys, selected]
  );

  const isAllSelected =
    permissionKeys.length > 0 && selectedCount === permissionKeys.length;
  const isPartiallySelected =
    selectedCount > 0 && selectedCount < permissionKeys.length;

  // Radix Checkbox natively supports a tri-state value — use it instead of
  // collapsing "all" and "partial" into the same visual `checked` state.
  const moduleCheckedState: boolean | "indeterminate" = isAllSelected
    ? true
    : isPartiallySelected
    ? "indeterminate"
    : false;

  const toggleModule = () => {
    onChange(
      isAllSelected
        ? permissionKeys // all selected -> clear the group
        : permissionKeys.filter((key) => !selected.has(key)) // fill the gaps
    );
  };

  return (
    <AccordionItem value={value} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="text-left">
            <div className="text-lg font-medium">{group.module}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCount}/{permissionKeys.length} permissions
            </p>
          </div>

          <Badge variant="secondary" className="text-sm px-3 py-1">
            {group.key}
          </Badge>
        </div>
      </AccordionTrigger>

      <AccordionContent className="space-y-4 pb-4">
        <label
          htmlFor={`${groupInputId}-select-all`}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <Checkbox
            id={`${groupInputId}-select-all`}
            checked={moduleCheckedState}
            onCheckedChange={toggleModule}
            disabled={disabled || permissionKeys.length === 0}
            aria-label={`Select all permissions in ${group.module}`}
            className="size-5"
          />
          <span className="text-base font-medium">Select all</span>
        </label>

        {permissionKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">
            No permissions in this module.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {group.permissions.map((permission) => {
              const inputId = `${groupInputId}-${permission.name}`;
              const isChecked = selected.has(permission.name);

              return (
                <label
                  key={permission.id ?? permission.name}
                  htmlFor={inputId}
                  data-checked={isChecked}
                  className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-muted data-[checked=true]:border-primary data-[checked=true]:bg-muted/60"
                >
                  <Checkbox
                    id={inputId}
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={() => onChange([permission.name])}
                    className="size-5"
                  />
                  <span className="text-base">
                    {permission.label ?? permission.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}