import { z } from "zod";

/* =========================
   SCHEMA
========================= */

export const sectorSchema = z.object({

  name: z
    .string()
    .min(2, "Sector name must be at least 2 characters"),

  code: z
    .string()
    .min(2, "Code must be at least 2 characters"),

  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),

  cluster_id: z
    .string()
    .min(1, "Cluster is required"),

});


export type SectorFormData = z.infer<typeof sectorSchema>;