import { z } from "zod";

export const officeLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type OfficeUserFormData = z.input<typeof officeLoginSchema>;