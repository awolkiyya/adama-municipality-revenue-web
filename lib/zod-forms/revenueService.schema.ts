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

/**
 * Validation rules that can be configured for a
 * service-specific BaseField.
 *
 * These rules do NOT define the field's data type.
 * The canonical data type comes from BaseField.dataType.
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
| A RevenueServiceField does NOT define a new field type.
|
| It references a canonical BaseField and optionally overrides
| presentation/configuration for this specific service.
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
    |
    | If empty, backend/frontend can fall back to BaseField.name.
    |
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

    required: z.boolean().default(true),

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

    validationRules:
        validationRulesSchema
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
| Keep this as a plain ZodObject so create/update schemas can
| safely use .partial() / .extend().
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
| The service ID is required here because your current frontend
| update schema expects the ID in the request body.
|
| If your API gets the ID exclusively from:
|
|     /revenue-services/{id}
|
| then remove `id` from this schema.
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
| 2. sortOrder is normalized/validated.
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
    |
    | One canonical BaseField should only appear once in a service.
    |
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