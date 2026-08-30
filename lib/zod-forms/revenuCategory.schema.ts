import { z } from "zod";

/* ============================================================
 * Revenue Domain
 * ============================================================ */

export const revenueDomainSchema = z.enum([
  "TAX",
  "RENT",
  "INVESTMENT",
  "SERVICE",
  "SALE",
  "CAPITAL",
]);

/* ============================================================
 * Shared Validators
 * ============================================================ */

const codeSchema = z
  .string()
  .trim()
  .min(1, "Code is required.")
  .max(20, "Code cannot exceed 20 digits.")
  .regex(/^[0-9]+$/, "Code must contain only digits (0-9).")
  .refine((value) => Number(value) >= 0, {
    message: "Code cannot be negative.",
  });

const descriptionSchema = z
  .string()
  .trim()
  .max(255, "Description cannot exceed 255 characters.")
  .optional()
  .or(z.literal(""));

/* ============================================================
 * Revenue Code
 * ============================================================ */

export const createRevenueCodeSchema = z.object({
  code: codeSchema,

  name: z
    .string()
    .trim()
    .min(1, "Revenue code name is required.")
    .max(255, "Revenue code name cannot exceed 255 characters."),

  description: descriptionSchema,

  isActive: z.boolean().default(true),
});

export const updateRevenueCodeSchema = createRevenueCodeSchema.extend({

  /**
   * Existing database record
   */
  id: z
    .string()
    .uuid("Invalid revenue code ID.")
    .optional(),


  /**
   * Frontend-only identifier
   *
   * Never sent to backend
   */
  clientId: z
    .string()
    .uuid("Invalid client ID.")
    .optional(),

});

/* ============================================================
 * Revenue Category — base shapes (NO refinements here)
 *
 * Keep these as plain ZodObjects so both the create and update
 * variants can still be built with `.extend()`. Once `.superRefine()`
 * is attached to a schema, Zod v4 no longer treats it as a plain
 * object schema and `.extend()` stops working on it.
 * ============================================================ */

const baseRevenueCategoryShape = {
  revenueDomain: revenueDomainSchema,

  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(255, "Category name cannot exceed 255 characters."),

  startCode: codeSchema,

  endCode: codeSchema,

  description: descriptionSchema,

  sortOrder: z.coerce
    .number({
      error: "Sort order must be a number.",
    })
    .int("Sort order must be a whole number.")
    .min(0, "Sort order cannot be negative."),

  isActive: z.boolean().default(true),
};

const createRevenueCategoryBaseSchema = z.object({
  ...baseRevenueCategoryShape,
  codes: z.array(createRevenueCodeSchema).default([]),
});

const updateRevenueCategoryBaseSchema = z.object({
  ...baseRevenueCategoryShape,
  id: z.string().uuid("Invalid category ID."),
  codes: z.array(updateRevenueCodeSchema),
});

/* ============================================================
 * Shared cross-field validation
 *
 * Works for both the create and update payload shapes, since it
 * only ever reads `startCode` / `endCode` / `codes` off `data`.
 * ============================================================ */

function applyRevenueCategoryRefinements<
  T extends {
    startCode: string;
    endCode: string;
    codes: { code: string }[];
  }
>(data: T, ctx: z.RefinementCtx) {
  const start = Number(data.startCode);
  const end = Number(data.endCode);

  /**
   * =========================================================
   * Category Range Validation
   * =========================================================
   */

  if (start > end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startCode"],
      message: "Start code must be less than or equal to End code.",
    });

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endCode"],
      message: "End code must be greater than or equal to Start code.",
    });

    return;
  }

  /**
   * =========================================================
   * Duplicate Revenue Codes
   * =========================================================
   */

  const seenCodes = new Map<string, number>();

  /**
   * =========================================================
   * Validate Each Revenue Code
   * =========================================================
   */

  data.codes.forEach((item, index) => {
    const code = item.code.trim();

    /**
     * Duplicate validation
     */
    if (seenCodes.has(code)) {
      const firstIndex = seenCodes.get(code)!;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codes", firstIndex, "code"],
        message: "Duplicate revenue code.",
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codes", index, "code"],
        message: "Duplicate revenue code.",
      });
    } else {
      seenCodes.set(code, index);
    }

    const numericCode = Number(code);

    /**
     * Code must be inside category range
     */
    if (numericCode < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codes", index, "code"],
        message: `Revenue code must be greater than or equal to ${data.startCode}.`,
      });
    }

    if (numericCode > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codes", index, "code"],
        message: `Revenue code must not exceed ${data.endCode}.`,
      });
    }
  });
}

/* ============================================================
 * Public schemas
 * ============================================================ */

export const createRevenueCategorySchema = createRevenueCategoryBaseSchema.superRefine(
  applyRevenueCategoryRefinements
);

export const updateRevenueCategorySchema = updateRevenueCategoryBaseSchema.superRefine(
  applyRevenueCategoryRefinements
);

/* ============================================================
 * Types
 * ============================================================ */

export type RevenueDomain = z.infer<typeof revenueDomainSchema>;

export type CreateRevenueCategoryInput = z.infer<
  typeof createRevenueCategorySchema
>;

export type UpdateRevenueCategoryInput = z.infer<
  typeof updateRevenueCategorySchema
>;

export type CreateRevenueCodeInput = z.infer<
  typeof createRevenueCodeSchema
>;

export type UpdateRevenueCodeInput = z.infer<
  typeof updateRevenueCodeSchema
>;