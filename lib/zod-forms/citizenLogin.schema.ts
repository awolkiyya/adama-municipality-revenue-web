import { z } from "zod";

export const citizenLoginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((value) => {
      const clean = value.replace(/\s|-/g, "");

      // Convert local Ethiopia format to international
      if (clean.startsWith("0")) {
        return `+251${clean.slice(1)}`;
      }

      return clean;
    })
    .refine(
      (value) => /^\+251(9|7)\d{8}$/.test(value),
      "Enter a valid Ethiopian phone number"
    ),
});

export type CitizenUserFormData = z.infer<typeof citizenLoginSchema>;