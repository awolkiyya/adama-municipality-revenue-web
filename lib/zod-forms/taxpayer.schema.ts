import { z } from "zod";


export const taxpayerSchema = z.object({

  /*
  |--------------------------------------------------------------------------
  | Identity Information
  |--------------------------------------------------------------------------
  */

  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(150, "Full name is too long"),


  national_id: z
    .string()
    .min(3, "National ID is required")
    .max(100, "National ID is too long"),


  gender: z.enum([
    "MALE",
    "FEMALE",
  ], {
    message: "Select gender",
  }),


  date_of_birth: z
    .string()
    .nullable()
    .optional(),



  /*
  |--------------------------------------------------------------------------
  | Contact Information
  |--------------------------------------------------------------------------
  */

  phone: z
    .string()
    .regex(
      /^(?:\+251|0)(7|9)[0-9]{8}$/,
      "Invalid Ethiopian phone number"
    ),


  email: z
    .string()
    .email("Invalid email address")
    .nullable()
    .optional(),



  /*
  |--------------------------------------------------------------------------
  | Address Information
  |--------------------------------------------------------------------------
  */

  administrative_unit_id: z
    .string()
    .uuid("Select a valid administrative unit"),


});


export type TaxpayerFormValues = z.infer<
  typeof taxpayerSchema
>;