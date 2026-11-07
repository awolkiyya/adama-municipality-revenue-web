
import { z } from "zod";

/*
|--------------------------------------------------------------------------
| ENUMS
|--------------------------------------------------------------------------
*/

/**
 * Revenue service classification.
 */
export const serviceTypeSchema = z.enum([
    "REGISTRATION",
    "ASSESSMENT",
    "PERMIT",
    "RENEWAL",
    "COLLECTION",
    "PENALTY",
]);

/**
 * How the service participates in the collection workflow.
 */
export const collectionModeSchema = z.enum([
    "ASSESSMENT_ONLY",
    "FIELD_COLLECTION",
    "BOTH",
]);

/*
|--------------------------------------------------------------------------
| VALIDATION RULES
|--------------------------------------------------------------------------
|
| These rules configure a service-specific BaseField.
| The canonical data type comes from BaseField.dataType.
|
*/

export const validationRulesSchema = z
    .object({
        min: z
            .number()
            .finite()
            .optional(),

        max: z
            .number()
            .finite()
            .optional(),

        minLength: z
            .number()
            .int()
            .min(0)
            .optional(),

        maxLength: z
            .number()
            .int()
            .min(0)
            .optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
        /*
        |--------------------------------------------------------------------------
        | Numeric range validation
        |--------------------------------------------------------------------------
        */

        if (
            data.min !== undefined &&
            data.max !== undefined &&
            data.min > data.max
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["max"],
                message:
                    "Maximum value must be greater than or equal to minimum value.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | String length validation
        |--------------------------------------------------------------------------
        */

        if (
            data.minLength !== undefined &&
            data.maxLength !== undefined &&
            data.minLength > data.maxLength
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["maxLength"],
                message:
                    "Maximum length must be greater than or equal to minimum length.",
            });
        }
    });

/*
|--------------------------------------------------------------------------
| REVENUE SERVICE FIELD
|--------------------------------------------------------------------------
|
| A RevenueServiceField references a canonical BaseField.
| It can override presentation and validation for this service.
|
*/

export const revenueServiceFieldSchema = z.object({
    /*
    |--------------------------------------------------------------------------
    | Canonical BaseField reference
    |--------------------------------------------------------------------------
    */

    baseFieldId: z
        .string()
        .uuid("A valid base field is required."),

    /*
    |--------------------------------------------------------------------------
    | Service-specific presentation
    |--------------------------------------------------------------------------
    */

    label: z
        .string()
        .trim()
        .max(150, "Field label is too long.")
        .default(""),

    /*
    |--------------------------------------------------------------------------
    | Required
    |--------------------------------------------------------------------------
    */

    required: z
        .boolean()
        .default(true),

    /*
    |--------------------------------------------------------------------------
    | Help text
    |--------------------------------------------------------------------------
    */

    helpText: z
        .string()
        .trim()
        .max(
            500,
            "Help text cannot exceed 500 characters."
        )
        .default(""),

    /*
    |--------------------------------------------------------------------------
    | Service-specific validation
    |--------------------------------------------------------------------------
    */

    validationRules: validationRulesSchema
        .nullable()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | Display order
    |--------------------------------------------------------------------------
    */

    sortOrder: z
        .number()
        .int()
        .min(0)
        .default(0),
});

/*
|--------------------------------------------------------------------------
| REVENUE SERVICE — BASE SHAPE
|--------------------------------------------------------------------------
|
| Shared by create and update schemas.
|
*/

const baseRevenueServiceShape = {
    /*
    |--------------------------------------------------------------------------
    | Revenue Code
    |--------------------------------------------------------------------------
    */

    revenueCodeId: z
        .string()
        .uuid("A valid revenue code is required."),

    /*
    |--------------------------------------------------------------------------
    | Identity
    |--------------------------------------------------------------------------
    */

    name: z
        .string()
        .trim()
        .min(
            2,
            "Service name must be at least 2 characters."
        )
        .max(
            150,
            "Service name cannot exceed 150 characters."
        ),

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    description: z
        .string()
        .trim()
        .max(
            255,
            "Description cannot exceed 255 characters."
        )
        .nullable()
        .optional()
        .default(""),

    /*
    |--------------------------------------------------------------------------
    | Service Type
    |--------------------------------------------------------------------------
    */

    serviceType: serviceTypeSchema
        .nullable()
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | Collection Mode
    |--------------------------------------------------------------------------
    */

    collectionMode: collectionModeSchema
        .default("ASSESSMENT_ONLY"),

    /*
    |--------------------------------------------------------------------------
    | Multiple Collection Entries
    |--------------------------------------------------------------------------
    |
    | Determines whether collectors can add multiple entries
    | for this revenue service in one transaction.
    |
    | Default: false (single entry).
    |
    */

    allowMultiple: z
        .boolean()
        .default(false),

    /*
    |--------------------------------------------------------------------------
    | Active Status
    |--------------------------------------------------------------------------
    */

    isActive: z
        .boolean()
        .default(true),

    /*
    |--------------------------------------------------------------------------
    | Service Fields
    |--------------------------------------------------------------------------
    */

    fields: z
        .array(revenueServiceFieldSchema)
        .default([]),
};

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

const createRevenueServiceBaseSchema =
    z.object(baseRevenueServiceShape);

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
|
| The service ID is required because the current frontend
| update schema expects it in the request body.
|
| If the API gets the ID exclusively from:
|
|     /revenue-services/{id}
|
| remove `id` from this schema.
|
*/

const updateRevenueServiceBaseSchema = z
    .object(baseRevenueServiceShape)
    .partial()
    .extend({
        id: z
            .string()
            .uuid("A valid service ID is required."),
    });

/*
|--------------------------------------------------------------------------
| SHARED FIELD VALIDATION
|--------------------------------------------------------------------------
|
| Ensures:
|
| 1. No BaseField is selected twice.
| 2. Field sort order is valid.
|
*/

function applyRevenueServiceFieldRefinements(
    data: {
        fields?: Array<{
            baseFieldId: string;
            sortOrder?: number;
        }>;
    },
    ctx: z.RefinementCtx
) {
    const fields = data.fields ?? [];

    /*
    |--------------------------------------------------------------------------
    | Duplicate BaseField detection
    |--------------------------------------------------------------------------
    */

    const seenBaseFields =
        new Map<string, number>();

    fields.forEach((field, index) => {
        const baseFieldId =
            field.baseFieldId.trim();

        if (seenBaseFields.has(baseFieldId)) {
            const firstIndex =
                seenBaseFields.get(baseFieldId)!;

            /*
            |--------------------------------------------------------------------------
            | Highlight first occurrence
            |--------------------------------------------------------------------------
            */

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                    "fields",
                    firstIndex,
                    "baseFieldId",
                ],
                message:
                    "This base field is already selected.",
            });

            /*
            |--------------------------------------------------------------------------
            | Highlight duplicate occurrence
            |--------------------------------------------------------------------------
            */

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                    "fields",
                    index,
                    "baseFieldId",
                ],
                message:
                    "This base field is already selected.",
            });
        } else {
            seenBaseFields.set(
                baseFieldId,
                index
            );
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Sort order validation
    |--------------------------------------------------------------------------
    */

    fields.forEach((field, index) => {
        if (
            field.sortOrder !== undefined &&
            field.sortOrder !== index
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                    "fields",
                    index,
                    "sortOrder",
                ],
                message:
                    "Field order is invalid.",
            });
        }
    });
}

/*
|--------------------------------------------------------------------------
| PUBLIC SCHEMAS
|--------------------------------------------------------------------------
*/

export const createRevenueServiceSchema =
    createRevenueServiceBaseSchema.superRefine(
        applyRevenueServiceFieldRefinements
    );

export const updateRevenueServiceSchema =
    updateRevenueServiceBaseSchema.superRefine(
        applyRevenueServiceFieldRefinements
    );

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type RevenueServiceFieldInput =
    z.infer<typeof revenueServiceFieldSchema>;

export type ValidationRulesInput =
    z.infer<typeof validationRulesSchema>;

export type CreateRevenueServiceInput =
    z.infer<typeof createRevenueServiceSchema>;

export type UpdateRevenueServiceInput =
    z.infer<typeof updateRevenueServiceSchema>;
