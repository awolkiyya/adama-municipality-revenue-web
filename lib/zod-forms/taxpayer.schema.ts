import { z } from "zod";

export const taxpayerSchema = z.object({
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(150, "Full name is too long"),

  national_id: z
    .string()
    .min(3, "National ID is required")
    .max(100, "National ID is too long"),

  gender: z.enum(["MALE", "FEMALE"], {
    message: "Select gender",
  }),

  date_of_birth: z.string().nullable().optional(),

  phone: z
    .string()
    .regex(
      /^(?:\+251|0)(7|9)[0-9]{8}$/,
      "Invalid Ethiopian phone number"
    ),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),

  administrative_unit_id: z
    .string()
    .uuid("Select a valid administrative unit"),
});

/** Values held by React Hook Form before Zod transforms them. */
export type TaxpayerFormInput = z.input<typeof taxpayerSchema>;

/** Validated values passed to the submit handler after Zod transforms them. */
export type TaxpayerFormValues = z.output<typeof taxpayerSchema>;