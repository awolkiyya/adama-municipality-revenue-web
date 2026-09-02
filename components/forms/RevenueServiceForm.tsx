"use client";

import { useState } from "react";
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
    Briefcase,
    SlidersHorizontal,
    AlertCircle,
    Inbox,
    CheckCircle2,
    ListChecks,
    FileText,
    Hash,
    CalendarDays,
    ToggleLeft,
    ChevronDown,
    List,
} from "lucide-react";

import { RevenueCodeDropdown } from "../input/RevenuCodeDropDown";

import {
    createRevenueServiceSchema,
    updateRevenueServiceSchema,
    type CreateRevenueServiceInput,
    type UpdateRevenueServiceInput,
} from "@/lib/zod-forms/revenueService.schema";

import { RevenueCode } from "@/types/revenue/revenue-code";
import { ServiceType } from "@/types/service.type";
import { CollectionMode } from "@/types/revenue/revenu-service";
import { BaseField } from "@/types/revenue/revenue-baseField";


/*
|--------------------------------------------------------------------------
| Revenue Service Field Configuration
|--------------------------------------------------------------------------
|
| This represents revenue_service_fields.
|
*/

export interface RevenueServiceFieldRow {
    baseFieldId: string;

    /*
    | Service-specific label override.
    */
    label: string;

    /*
    | Whether officer must provide this value.
    */
    required: boolean;

    /*
    | Optional explanation shown to officer.
    */
    helpText: string;

    /*
    | Optional validation configuration.
    */
    validationRules?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
    };

    /*
    | Preserves service field order.
    */
    sortOrder: number;
}

/*
|--------------------------------------------------------------------------
| Form Values
|--------------------------------------------------------------------------
*/

export interface RevenueServiceFormValues {
    id?: string;

    revenueCodeId: string;

    name: string;

    description: string;

    serviceType: ServiceType | "";

    collectionMode: CollectionMode;

    isActive: boolean;

    fields: RevenueServiceFieldRow[];
}

/*
|--------------------------------------------------------------------------
| SERVICE TYPES
|--------------------------------------------------------------------------
*/

export const SERVICE_TYPE_OPTIONS = [
    {
        value: "REGISTRATION",
        label: "Registration",
        description: "Citizen or business registration service",
        icon: FileText,
    },
    {
        value: "ASSESSMENT",
        label: "Assessment",
        description: "Assessment requiring tariff calculation",
        icon: Hash,
    },
    {
        value: "PERMIT",
        label: "Permit",
        description: "Issue authorization or permit",
        icon: CheckCircle2,
    },
    {
        value: "RENEWAL",
        label: "Renewal",
        description: "Renew an existing authorization",
        icon: CalendarDays,
    },
    {
        value: "COLLECTION",
        label: "Collection",
        description: "Direct revenue collection service",
        icon: ListChecks,
    },
    {
        value: "PENALTY",
        label: "Penalty",
        description: "Violation or late-payment charge",
        icon: AlertCircle,
    },
] as const;

/*
|--------------------------------------------------------------------------
| COLLECTION MODES
|--------------------------------------------------------------------------
*/

const COLLECTION_MODE_OPTIONS: {
    value: CollectionMode;
    label: string;
    description: string;
    icon: React.ReactNode;
}[] = [
    {
        value: "ASSESSMENT_ONLY",
        label: "Assessment Only",
        description: "Handled through the assessment workflow",
        icon: <FileText className="h-4 w-4" />,
    },
    {
        value: "FIELD_COLLECTION",
        label: "Field Collection",
        description: "Collected directly by a revenue collector",
        icon: <ListChecks className="h-4 w-4" />,
    },
    {
        value: "BOTH",
        label: "Both",
        description: "Available through assessment and field collection",
        icon: <SlidersHorizontal className="h-4 w-4" />,
    },
];

/*
|--------------------------------------------------------------------------
| EMPTY FIELD
|--------------------------------------------------------------------------
*/

const EMPTY_FIELD_ROW: RevenueServiceFieldRow = {
    baseFieldId: "",
    label: "",
    required: true,
    helpText: "",
    validationRules: {},
    sortOrder: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT VALUES
|--------------------------------------------------------------------------
*/

const DEFAULT_VALUES: RevenueServiceFormValues = {
    revenueCodeId: "",
    name: "",
    description: "",
    serviceType: "",
    collectionMode: "ASSESSMENT_ONLY",
    isActive: true,
    fields: [],
};

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface RevenueServiceFormCreateProps {
    mode: "create";

    initialValues?: RevenueServiceFormValues;

    baseFields: BaseField[];

    onSubmit: (
        values: CreateRevenueServiceInput
    ) => Promise<void>;
}

interface RevenueServiceFormEditProps {
    mode: "edit";

    initialValues: RevenueServiceFormValues;

    baseFields: BaseField[];

    onSubmit: (
        values: UpdateRevenueServiceInput
    ) => Promise<void>;
}

type RevenueServiceFormProps =
    | RevenueServiceFormCreateProps
    | RevenueServiceFormEditProps;

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function RevenueServiceForm({
    mode,
    initialValues,
    baseFields,
    onSubmit,
}: RevenueServiceFormProps) {
    const router = useRouter();

    const [values, setValues] =
        useState<RevenueServiceFormValues>(
            initialValues ?? DEFAULT_VALUES
        );

    const [errors, setErrors] =
        useState<Record<string, string>>({});

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [showErrorBanner, setShowErrorBanner] =
        useState(false);

    const [selectedCode, setSelectedCode] =
        useState<RevenueCode>();

    /*
    |--------------------------------------------------------------------------
    | SERVICE TYPE
    |--------------------------------------------------------------------------
    */

    const selectedType =
        SERVICE_TYPE_OPTIONS.find(
            (item) =>
                item.value === values.serviceType
        );

    /*
    |--------------------------------------------------------------------------
    | FIELD HELPERS
    |--------------------------------------------------------------------------
    */

    const setField = <
        K extends keyof RevenueServiceFormValues
    >(
        key: K,
        value: RevenueServiceFormValues[K]
    ) => {
        setValues((previous) => ({
            ...previous,
            [key]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [key]: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | SERVICE FIELD HELPER
    |--------------------------------------------------------------------------
    */

    const setServiceField = (
        index: number,
        key: keyof RevenueServiceFieldRow,
        value:
            | string
            | boolean
            | number
            | object
            | undefined
    ) => {
        setValues((previous) => {
            const fields = [
                ...previous.fields,
            ];

            fields[index] = {
                ...fields[index],
                [key]: value,
            };

            return {
                ...previous,
                fields,
            };
        });

        setErrors((previous) => ({
            ...previous,
            [`fields.${index}.${key}`]: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | ADD FIELD
    |--------------------------------------------------------------------------
    */

    const addField = () => {
        setValues((previous) => ({
            ...previous,
            fields: [
                ...previous.fields,
                {
                    ...EMPTY_FIELD_ROW,
                    sortOrder:
                        previous.fields.length,
                },
            ],
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | REMOVE FIELD
    |--------------------------------------------------------------------------
    */

    const removeField = (index: number) => {
        setValues((previous) => ({
            ...previous,
            fields: previous.fields
                .filter(
                    (_, currentIndex) =>
                        currentIndex !== index
                )
                .map((field, currentIndex) => ({
                    ...field,
                    sortOrder: currentIndex,
                })),
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | CHANGE BASE FIELD
    |--------------------------------------------------------------------------
    */

    const handleBaseFieldChange = (
        index: number,
        baseFieldId: string
    ) => {
        const selectedField =
            baseFields.find(
                (field) =>
                    field.id === baseFieldId
            );

        if (!selectedField) {
            return;
        }

        setValues((previous) => {
            const fields = [
                ...previous.fields,
            ];

            fields[index] = {
                ...fields[index],
                baseFieldId:
                    selectedField.id,

                /*
                | Automatically use base field name
                | as initial service label.
                */
                label:
                    fields[index].label ||
                    selectedField.name,

                sortOrder: index,
            };

            return {
                ...previous,
                fields,
            };
        });

        setErrors((previous) => ({
            ...previous,
            [`fields.${index}.baseFieldId`]: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    const validate = () => {
        const schema =
            mode === "create"
                ? createRevenueServiceSchema
                : updateRevenueServiceSchema;

        /*
        |--------------------------------------------------------------------------
        | API PAYLOAD
        |--------------------------------------------------------------------------
        |
        | Convert frontend camelCase to backend
        | structure if your Zod schema expects this shape.
        |
        */

        const payload = {
            ...values,

            serviceType:
                values.serviceType === ""
                    ? undefined
                    : values.serviceType,

            fields: values.fields.map(
                (field, index) => ({
                    ...field,
                    sortOrder: index,
                })
            ),
        };

        const result =
            schema.safeParse(payload);

        if (result.success) {
            setErrors({});
            setShowErrorBanner(false);

            return {
                isValid: true as const,
                data: result.data,
            };
        }

        const nextErrors:
            Record<string, string> = {};

        for (
            const issue of result.error.issues
        ) {
            const key =
                issue.path.join(".");

            if (!nextErrors[key]) {
                nextErrors[key] =
                    issue.message;
            }
        }

        setErrors(nextErrors);
        setShowErrorBanner(true);

        return {
            isValid: false as const,
            data: null,
        };
    };

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        const {
            isValid,
            data,
        } = validate();

        if (!isValid || !data) {
            document
                .getElementById(
                    "service-error-banner"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

            return;
        }

        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await onSubmit(
                    data as CreateRevenueServiceInput
                );
            } else {
                await onSubmit(
                    data as UpdateRevenueServiceInput
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const errorCount =
        Object.values(errors)
            .filter(Boolean)
            .length;

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <form
            onSubmit={handleSubmit}
            className="pb-28"
        >
            <div className="space-y-6">

                {/* =====================================================
                    ERROR SUMMARY
                ====================================================== */}

                {showErrorBanner &&
                    errorCount > 0 && (
                        <div
                            id="service-error-banner"
                            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                            <div>
                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {errorCount}{" "}
                                    {errorCount === 1
                                        ? "issue"
                                        : "issues"}{" "}
                                    need your attention
                                </p>

                                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                                    Fix the highlighted
                                    fields before saving.
                                </p>
                            </div>
                        </div>
                    )}

                {/* =====================================================
                    SERVICE DETAILS
                ====================================================== */}

                <section className="rounded-xl border bg-card shadow-sm">

                    <div className="flex items-center justify-between border-b px-6 py-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Briefcase className="h-4 w-4" />
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold">
                                    Service Details
                                </h2>

                                <p className="text-xs text-muted-foreground">
                                    Define the revenue service
                                    and its behavior.
                                </p>
                            </div>

                        </div>

                        {selectedType && (
                            <Badge
                                variant="outline"
                                className="gap-1.5 border-none bg-muted/60 px-2.5 py-1 font-normal"
                            >
                                {selectedType.label}
                            </Badge>
                        )}

                    </div>

                    <div className="space-y-5 p-6">

                        {/* Revenue Code */}

                        <div className="space-y-1.5">

                            <Label>
                                Revenue Code{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <RevenueCodeDropdown
                                value={
                                    values.revenueCodeId ||
                                    null
                                }
                                onChange={(
                                    id,
                                    item
                                ) => {
                                    setField(
                                        "revenueCodeId",
                                        id
                                    );

                                    setSelectedCode(
                                        item
                                    );
                                }}
                            />

                            {errors.revenueCodeId && (
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {
                                        errors.revenueCodeId
                                    }
                                </p>
                            )}

                            {selectedCode && (
                                <p className="text-[11px] text-muted-foreground">
                                    Under category:{" "}
                                    <span className="font-medium text-foreground">
                                        {
                                            selectedCode
                                                .category
                                                ?.name
                                        }
                                    </span>
                                </p>
                            )}

                        </div>

                        {/* Name + Type */}

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            <div className="space-y-1.5">

                                <Label>
                                    Service Name{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    value={
                                        values.name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setField(
                                            "name",
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="e.g. Commercial Property Assessment"
                                    className={
                                        errors.name
                                            ? "border-red-400"
                                            : "py-5"
                                    }
                                />

                                {errors.name && (
                                    <p className="text-xs text-red-500">
                                        {
                                            errors.name
                                        }
                                    </p>
                                )}

                            </div>

                            <div className="space-y-1.5">

                                <Label>
                                    Service Type
                                </Label>

                                <Select
                                    value={
                                        values.serviceType
                                    }
                                    onValueChange={(
                                        value
                                    ) =>
                                        setField(
                                            "serviceType",
                                            value as ServiceType
                                        )
                                    }
                                >

                                    <SelectTrigger className="w-full py-5">
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        {SERVICE_TYPE_OPTIONS.map(
                                            (
                                                option
                                            ) => {
                                                const Icon =
                                                    option.icon;

                                                return (
                                                    <SelectItem
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        <div className="flex items-center gap-2">

                                                            <Icon className="h-4 w-4 text-muted-foreground" />

                                                            <span>
                                                                {
                                                                    option.label
                                                                }
                                                            </span>

                                                        </div>
                                                    </SelectItem>
                                                );
                                            }
                                        )}

                                    </SelectContent>

                                </Select>

                                {errors.serviceType && (
                                    <p className="text-xs text-red-500">
                                        {
                                            errors.serviceType
                                        }
                                    </p>
                                )}

                            </div>

                        </div>

                        {/* Description */}

                        <div className="space-y-1.5">

                            <div className="flex items-center justify-between">

                                <Label>
                                    Description
                                </Label>

                                <span className="text-[11px] text-muted-foreground">
                                    {
                                        values
                                            .description
                                            .length
                                    }
                                    /255
                                </span>

                            </div>

                            <Textarea
                                value={
                                    values.description
                                }
                                maxLength={255}
                                onChange={(
                                    event
                                ) =>
                                    setField(
                                        "description",
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Describe what this service covers."
                                rows={3}
                            />

                        </div>

                        {/* Active */}

                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">

                            <div>
                                <Label>
                                    Active Status
                                </Label>

                                <p className="text-xs text-muted-foreground">
                                    Inactive services
                                    cannot be selected.
                                </p>
                            </div>

                            <Switch
                                checked={
                                    values.isActive
                                }
                                onCheckedChange={(
                                    value
                                ) =>
                                    setField(
                                        "isActive",
                                        value
                                    )
                                }
                            />

                        </div>

                    </div>

                </section>

                {/* =====================================================
                    COLLECTION MODE
                ====================================================== */}

                <section className="rounded-xl border bg-card shadow-sm">

                    <div className="border-b px-6 py-4">

                        <h2 className="text-sm font-semibold">
                            Collection Mode
                        </h2>

                        <p className="text-xs text-muted-foreground">
                            Define how this service can
                            generate a payable charge.
                        </p>

                    </div>

                    <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">

                        {COLLECTION_MODE_OPTIONS.map(
                            (option) => {

                                const selected =
                                    values.collectionMode ===
                                    option.value;

                                return (
                                    <button
                                        key={
                                            option.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            setField(
                                                "collectionMode",
                                                option.value
                                            )
                                        }
                                        className={`
                                            flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition
                                            ${
                                                selected
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "hover:border-foreground/30 hover:bg-muted/40"
                                            }
                                        `}
                                    >

                                        <div className="flex w-full items-center justify-between">

                                            <div
                                                className={`
                                                    flex h-8 w-8 items-center justify-center rounded-lg
                                                    ${
                                                        selected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                    }
                                                `}
                                            >
                                                {
                                                    option.icon
                                                }
                                            </div>

                                            {selected && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}

                                        </div>

                                        <div>

                                            <p className="text-sm font-medium">
                                                {
                                                    option.label
                                                }
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    option.description
                                                }
                                            </p>

                                        </div>

                                    </button>
                                );
                            }
                        )}

                    </div>

                </section>

                {/* =====================================================
                    SERVICE FIELDS
                ====================================================== */}

                <section className="rounded-xl border bg-card shadow-sm">

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <SlidersHorizontal className="h-4 w-4" />
                            </div>

                            <div>

                                <h2 className="text-sm font-semibold">
                                    Service Fields
                                </h2>

                                <p className="text-xs text-muted-foreground">
                                    Select existing base fields
                                    required by this service.
                                </p>

                            </div>

                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addField}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add Field
                        </Button>

                    </div>

                    <div className="p-6">

                        {values.fields.length === 0 ? (

                            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Inbox className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div>

                                    <p className="text-sm font-medium">
                                        No fields configured
                                    </p>

                                    <p className="mt-1 max-w-md text-xs text-muted-foreground">
                                        Select the base fields that
                                        officers must provide when
                                        this service is used.
                                    </p>

                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={
                                        addField
                                    }
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add First Field
                                </Button>

                            </div>

                        ) : (

                            <div className="space-y-4">

                                {values.fields.map(
                                    (
                                        field,
                                        index
                                    ) => {

                                        const selectedBaseField =
                                            baseFields.find(
                                                (
                                                    baseField
                                                ) =>
                                                    baseField.id ===
                                                    field.baseFieldId
                                            );

                                        const fieldError =
                                            errors[
                                                `fields.${index}.baseFieldId`
                                            ];

                                        return (
                                            <div
                                                key={`${field.baseFieldId}-${index}`}
                                                className={`
                                                    rounded-xl border bg-muted/20 p-4
                                                    ${
                                                        fieldError
                                                            ? "border-red-300 bg-red-50/50"
                                                            : ""
                                                    }
                                                `}
                                            >

                                                <div className="flex items-start gap-3">

                                                    {/* ORDER */}

                                                    <div className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium ring-1 ring-border">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </div>

                                                    <div className="min-w-0 flex-1 space-y-4">

                                                        {/* FIELD SELECTION */}

                                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr_auto_auto]">

                                                            {/* BASE FIELD */}

                                                            <div className="space-y-1.5">

                                                                <Label className="text-xs">
                                                                    Base Field{" "}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                                </Label>

                                                                <Select
                                                                    value={
                                                                        field.baseFieldId
                                                                    }
                                                                    onValueChange={(
                                                                        value
                                                                    ) =>
                                                                        handleBaseFieldChange(
                                                                            index,
                                                                            value
                                                                        )
                                                                    }
                                                                >

                                                                    <SelectTrigger className="h-10 w-full py-5">

                                                                        <SelectValue placeholder="Select base field" />

                                                                    </SelectTrigger>

                                                                    <SelectContent>

                                                                        {baseFields
                                                                            .filter(
                                                                                (
                                                                                    baseField
                                                                                ) =>
                                                                                    !values.fields.some(
                                                                                        (
                                                                                            existing,
                                                                                            existingIndex
                                                                                        ) =>
                                                                                            existingIndex !==
                                                                                                index &&
                                                                                            existing.baseFieldId ===
                                                                                                baseField.id
                                                                                    )
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    baseField
                                                                                ) => (

                                                                                    <SelectItem
                                                                                        key={
                                                                                            baseField.id
                                                                                        }
                                                                                        value={
                                                                                            baseField.id
                                                                                        }
                                                                                    >

                                                                                        <div className="flex items-center gap-2">

                                                                                            <span className="font-medium">
                                                                                                {
                                                                                                    baseField.name
                                                                                                }
                                                                                            </span>

                                                                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                                                                {
                                                                                                    baseField.code
                                                                                                }
                                                                                            </span>

                                                                                        </div>

                                                                                    </SelectItem>

                                                                                )
                                                                            )}

                                                                    </SelectContent>

                                                                </Select>

                                                                {fieldError && (
                                                                    <p className="text-xs text-red-500">
                                                                        {
                                                                            fieldError
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                            {/* LABEL */}

                                                            <div className="space-y-1.5">

                                                                <Label className="text-xs">
                                                                    Display Label
                                                                </Label>

                                                                <Input
                                                                    value={
                                                                        field.label
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        setServiceField(
                                                                            index,
                                                                            "label",
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    placeholder={
                                                                        selectedBaseField?.name ||
                                                                        "Field label"
                                                                    }
                                                                    className="h-10"
                                                                />

                                                            </div>

                                                            {/* REQUIRED */}

                                                            <div className="flex flex-col items-center justify-end gap-1.5">

                                                                <Label className="text-xs">
                                                                    Required
                                                                </Label>

                                                                <Switch
                                                                    checked={
                                                                        field.required
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked
                                                                    ) =>
                                                                        setServiceField(
                                                                            index,
                                                                            "required",
                                                                            checked
                                                                        )
                                                                    }
                                                                />

                                                            </div>

                                                            {/* DELETE */}

                                                            <div className="flex items-end">

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 text-muted-foreground hover:text-red-500"
                                                                    onClick={() =>
                                                                        removeField(
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>

                                                            </div>

                                                        </div>

                                                       {/* FIELD INFORMATION */}

                                                        {selectedBaseField && (
                                                            <div className="rounded-lg border bg-background p-3">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="secondary">
                                                                        {selectedBaseField.code}
                                                                    </Badge>

                                                                    <Badge variant="outline">
                                                                        {selectedBaseField.data_type}
                                                                    </Badge>

                                                                    {/* {selectedBaseField.measurement_unit && (
                                                                        <Badge variant="outline">
                                                                            {selectedBaseField.measurement_unit.symbol
                                                                                ? `${selectedBaseField.measurement_unit.code} (${selectedBaseField.measurement_unit.symbol})`
                                                                                : selectedBaseField.measurement_unit.code}
                                                                        </Badge>
                                                                    )} */}
                                                                </div>

                                                                {selectedBaseField.description && (
                                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                                        {selectedBaseField.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* HELP TEXT */}

                                                        <div className="space-y-1.5">

                                                            <Label className="text-xs">
                                                                Help Text
                                                            </Label>

                                                            <Input
                                                                value={
                                                                    field.helpText
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setServiceField(
                                                                        index,
                                                                        "helpText",
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Explain what the officer should enter."
                                                                className="h-9"
                                                            />

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={addField}
                                    className="w-full border border-dashed text-muted-foreground"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Another Field
                                </Button>

                            </div>

                        )}

                    </div>

                </section>

            </div>

           {/* =====================================================
                STICKY ACTION BAR
            ====================================================== */}

            <div className="sticky inset-x-0 bottom-0 z-40 -mx-6 my-5 border-t bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">

            <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 py-3.5">

                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
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
                            {mode === "create" ? "Create Service" : "Save Changes"}
                        </>
                    )}
                </Button>

            </div>

            </div>

        </form>
    );
}