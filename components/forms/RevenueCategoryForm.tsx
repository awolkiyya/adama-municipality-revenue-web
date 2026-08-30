"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
    Plus,
    Trash2,
    Loader2,
    Save,
    Hash,
    ListChecks,
    AlertCircle,
    Inbox,
    CheckCircle2,
    ChevronDown,
} from "lucide-react";
import { createRevenueCategorySchema, updateRevenueCategorySchema } from "@/lib/zod-forms/revenuCategory.schema";


/* =========================
   TYPES
========================= */

export type RevenueDomain =
    | "TAX"
    | "RENT"
    | "INVESTMENT"
    | "SERVICE"
    | "SALE"
    | "CAPITAL";

export interface RevenueCodeFormRow {

    id?: string;
    clientId?: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
}

export interface RevenueCategoryFormValues {
    id?: string;
    revenueDomain: RevenueDomain;
    name: string;
    startCode: string;
    endCode: string;
    description: string;
    sortOrder: string;
    isActive: boolean;
    codes: RevenueCodeFormRow[];
}

const DOMAIN_OPTIONS: {
    value: RevenueDomain;
    label: string;
    dot: string;
}[] = [
    { value: "TAX", label: "Tax", dot: "bg-red-500" },
    { value: "RENT", label: "Rent", dot: "bg-blue-500" },
    { value: "INVESTMENT", label: "Investment", dot: "bg-violet-500" },
    { value: "SERVICE", label: "Service", dot: "bg-amber-500" },
    { value: "SALE", label: "Sale", dot: "bg-emerald-500" },
    { value: "CAPITAL", label: "Capital", dot: "bg-cyan-500" },
];

const EMPTY_CODE_ROW: RevenueCodeFormRow = {
    code: "",
    name: "",
    description: "",
    isActive: true,
};

const DEFAULT_VALUES: RevenueCategoryFormValues = {
    revenueDomain: "TAX",
    name: "",
    startCode: "",
    endCode: "",
    description: "",
    sortOrder: "0",
    isActive: true,
    codes: [],
};

/* =========================
   FORM COMPONENT
========================= */

interface RevenueCategoryFormProps {
    mode: "create" | "edit";
    initialValues?: RevenueCategoryFormValues;
    onSubmit: (values: RevenueCategoryFormValues) => Promise<void>;
    isSubmitting:boolean;
}

export function RevenueCategoryForm({
    mode,
    initialValues,
    onSubmit,
    isSubmitting
}: RevenueCategoryFormProps) {
    const router = useRouter();

    const [values, setValues] = useState<RevenueCategoryFormValues>(
        initialValues ?? DEFAULT_VALUES
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showErrorBanner, setShowErrorBanner] = useState(false);
    const [isCodesOpen, setIsCodesOpen] = useState(mode === "create");

    const selectedDomain = DOMAIN_OPTIONS.find(
        (d) => d.value === values.revenueDomain
    );

    /* ---- field helpers ---- */

    const setField = <K extends keyof RevenueCategoryFormValues>(
        key: K,
        value: RevenueCategoryFormValues[K]
    ) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const setCodeField = (
        index: number,
        key: keyof RevenueCodeFormRow,
        value: string | boolean
    ) => {
        setValues((prev) => {
            const codes = [...prev.codes];
            codes[index] = { ...codes[index], [key]: value };
            return { ...prev, codes };
        });
        setErrors((prev) => ({ ...prev, [`codes.${index}.${key}`]: "" }));
    };

    const addCodeRow = () => {
        setValues((prev) => ({
            ...prev,
            // Give new rows a client-side id so `updateRevenueCodeSchema`
            // (which requires a uuid `id`) doesn't reject them when editing
            // an existing category. Ignored by the create-mode schema.
            codes: [
                ...prev.codes,
                {
                    ...EMPTY_CODE_ROW,
                    clientId: crypto.randomUUID(),
                },
            ],
        }));
    };

    const removeCodeRow = (index: number) => {
        setValues((prev) => ({
            ...prev,
            codes: prev.codes.filter((_, i) => i !== index),
        }));
    };

    /* ---- derived summary ---- */

    const summary = useMemo(() => {
        const nonEmpty = values.codes.filter(
            (c) => c.code.trim() || c.name.trim()
        );
        const active = nonEmpty.filter((c) => c.isActive).length;
        return {
            total: nonEmpty.length,
            active,
            inactive: nonEmpty.length - active,
        };
    }, [values.codes]);

    /* ---- validation (Zod-backed) ---- */

    const validate = (codes: RevenueCodeFormRow[]) => {
        const schema =
            mode === "create"
                ? createRevenueCategorySchema
                : updateRevenueCategorySchema;

        const payload = {
            ...values,
            codes,
        };

        const result = schema.safeParse(payload);

        if (result.success) {
            setErrors({});
            setShowErrorBanner(false);
            return { isValid: true as const, cleanedCodes: codes };
        }

        const next: Record<string, string> = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join(".");
            if (!next[key]) next[key] = issue.message;
        }

        setErrors(next);
        setShowErrorBanner(true);

        // Auto-expand the codes card if any of the errors live inside it,
        // so the user isn't stuck looking at a collapsed section that's
        // silently failing validation.
        if (Object.keys(next).some((key) => key.startsWith("codes."))) {
            setIsCodesOpen(true);
        }

        return { isValid: false as const, cleanedCodes: codes };
    };

    /* ---- submit ---- */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        // Drop fully-empty rows before validating, same as before
        const codes = values.codes.filter(
            (c) => c.code.trim() || c.name.trim()
        );

        const { isValid } = validate(codes);

        if (!isValid) {
            document
                .getElementById("form-error-banner")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
            const cleanedCodes = codes.filter(
                (c) => c.code.trim() && c.name.trim()
            );
            await onSubmit({ ...values, codes: cleanedCodes });
    };
    const errorCount = Object.values(errors).filter(Boolean).length;

    return (
        <form onSubmit={handleSubmit} className="pb-24">
            <div className="space-y-6">
                {/* ================= ERROR SUMMARY ================= */}
                {showErrorBanner && errorCount > 0 && (
                    <div
                        id="form-error-banner"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                {errorCount} {errorCount === 1 ? "issue" : "issues"} need
                                your attention
                            </p>
                            <p className="text-xs text-red-600/80 dark:text-red-400/70">
                                Fix the highlighted fields below before saving.
                            </p>
                        </div>
                    </div>
                )}

                {/* ================= CATEGORY DETAILS ================= */}
                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Hash className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Category Details
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Core information used to classify this revenue category
                                </p>
                            </div>
                        </div>

                        {selectedDomain && (
                            <Badge
                                variant="outline"
                                className="gap-1.5 border-none bg-muted/60 px-2.5 py-1 font-normal"
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${selectedDomain.dot}`}
                                />
                                {selectedDomain.label}
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">
                                Category Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={values.name}
                                onChange={(e) => setField("name", e.target.value)}
                                placeholder="e.g. Galii Kiraarraa Argamu"
                                className={errors.name ? "border-red-400 focus-visible:ring-red-400" : "py-5"}
                            />
                            {errors.name && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Revenue Domain</Label>
                            <Select
                                value={values.revenueDomain}
                                onValueChange={(v) =>
                                    setField("revenueDomain", v as RevenueDomain)
                                }
                            >
                                <SelectTrigger className="w-full py-5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOMAIN_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${opt.dot}`}
                                                />
                                                {opt.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="startCode">Start Code Range</Label>
                            <Input
                                id="startCode"
                                type="number"
                                inputMode="numeric"
                                value={values.startCode}
                                onChange={(e) => setField("startCode", e.target.value)}
                                placeholder="1701"
                                className={errors.startCode ? "border-red-400 focus-visible:ring-red-400" : "py-5"}
                            />
                            {errors.startCode && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.startCode}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="endCode">End Code Range</Label>
                            <Input
                                id="endCode"
                                type="number"
                                inputMode="numeric"
                                value={values.endCode}
                                onChange={(e) => setField("endCode", e.target.value)}
                                placeholder="1719"
                                className={errors.endCode ? "border-red-400 focus-visible:ring-red-400" : "py-5"}
                            />
                            {errors.endCode && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.endCode}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                inputMode="numeric"
                                value={values.sortOrder}
                                onChange={(e) => setField("sortOrder", e.target.value)}
                                className={errors.sortOrder ? "border-red-400 focus-visible:ring-red-400" : "py-5"}
                            />
                            {errors.sortOrder ? (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.sortOrder}
                                </p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Lower numbers appear first in lists
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 ">
                            <div>
                                <Label htmlFor="isActive" className="text-sm">
                                    Active Status
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Hidden from selection lists when off
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={values.isActive}
                                onCheckedChange={(v) => setField("isActive", v)}
                            />
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description">Description</Label>
                                <span className="text-[11px] text-muted-foreground">
                                    {values.description.length}/255
                                </span>
                            </div>
                            <Textarea
                                id="description"
                                value={values.description}
                                maxLength={255}
                                onChange={(e) => setField("description", e.target.value)}
                                placeholder="Optional notes about this category"
                                rows={3}
                            />
                            {errors.description && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ================= REVENUE CODES ================= */}
                <section className="rounded-xl border bg-card shadow-sm">
                    <button
                        type="button"
                        onClick={() => setIsCodesOpen((prev) => !prev)}
                        aria-expanded={isCodesOpen}
                        className="flex w-full flex-wrap items-center justify-between gap-3 border-b px-6 py-4 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <ListChecks className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Revenue Codes
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Individual codes that belong to this category
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {summary.total > 0 && (
                                <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {summary.total}
                                    </span>
                                    code{summary.total !== 1 ? "s" : ""}
                                    {summary.inactive > 0 && (
                                        <span className="text-amber-600">
                                            · {summary.inactive} inactive
                                        </span>
                                    )}
                                </div>
                            )}

                            <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCodesOpen(true);
                                    addCodeRow();
                                }}
                                className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Add Code
                            </span>

                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${isCodesOpen ? "rotate-180" : ""}`}
                            />
                        </div>
                    </button>

                    <div
                        className={isCodesOpen ? "p-6" : "hidden"}
                    >
                        {values.codes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <Inbox className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        No codes added yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Add the government revenue codes that fall under this category
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addCodeRow}
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add First Code
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {values.codes.map((row, index) => {
                                    const codeError = errors[`codes.${index}.code`];
                                    const nameError = errors[`codes.${index}.name`];
                                    const descriptionError =
                                        errors[`codes.${index}.description`];

                                    return (
                                        <div
                                            key={row.id ?? `new-${index}`}
                                            className={`
                                                group relative rounded-lg border bg-muted/20 p-4
                                                transition-colors
                                                ${codeError || nameError ? "border-red-300 bg-red-50/50 dark:bg-red-950/10" : "hover:bg-muted/40"}
                                            `}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                                                    {index + 1}
                                                </div>

                                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[110px_1fr_1fr_auto]">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Code
                                                        </Label>
                                                        <Input
                                                            value={row.code}
                                                            onChange={(e) =>
                                                                setCodeField(index, "code", e.target.value)
                                                            }
                                                            placeholder="1701"
                                                            className={`h-9 font-mono text-sm ${codeError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                                                        />
                                                        {codeError && (
                                                            <p className="text-[11px] text-red-500">{codeError}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            value={row.name}
                                                            onChange={(e) =>
                                                                setCodeField(index, "name", e.target.value)
                                                            }
                                                            placeholder="e.g. Residential Tax"
                                                            className={`h-9 ${nameError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                                                        />
                                                        {nameError && (
                                                            <p className="text-[11px] text-red-500">{nameError}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Description
                                                        </Label>
                                                        <Input
                                                            value={row.description}
                                                            onChange={(e) =>
                                                                setCodeField(index, "description", e.target.value)
                                                            }
                                                            placeholder="Optional"
                                                            className={`h-9 ${descriptionError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                                                        />
                                                        {descriptionError && (
                                                            <p className="text-[11px] text-red-500">
                                                                {descriptionError}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-end gap-1">
                                                        <div className="flex h-9 items-center gap-2 px-1">
                                                            <Switch
                                                                checked={row.isActive}
                                                                onCheckedChange={(v) =>
                                                                    setCodeField(index, "isActive", v)
                                                                }
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                                                            onClick={() => removeCodeRow(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={addCodeRow}
                                    className="w-full border border-dashed text-muted-foreground hover:text-foreground"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Another Code
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ================= STICKY ACTION BAR ================= */}
            <div className="fixed inset-x-0 bottom-0 z-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex max-w-7xl items-end justify-end  py-3.5">
                    <div className="flex items-center gap-3">
                        {!showErrorBanner && summary.total > 0 && (
                            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                {summary.total} code{summary.total !== 1 ? "s" : ""} ready
                            </span>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {mode === "create" ? "Create Category" : "Save Changes"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}