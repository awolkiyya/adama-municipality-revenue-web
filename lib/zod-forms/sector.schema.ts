
import { z } from "zod";

export const sectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Sector name must be at least 2 characters"),

  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters"),

  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters"),

  cluster_id: z
    .string()
    .min(1, "Cluster is required"),

  is_active: z.boolean().default(true),
});

/** Values accepted by the schema before parsing. */
export type SectorFormInput = z.input<typeof sectorSchema>;

/** Validated values produced by the schema. */
export type SectorFormData = z.output<typeof sectorSchema>;
