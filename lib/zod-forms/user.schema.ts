import { z } from "zod";

const levels = ["CITY", "SUBCITY", "WEREDA"] as const;

const baseUserSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required"),

    email: z
      .string()
      .email("Invalid email"),

    phone: z
      .string()
      .optional(),

    avatar: z
      .string()
      .optional(),

    /*
    |--------------------------------------------------------------------------
    | Role
    |--------------------------------------------------------------------------
    | Send the database Role UUID to the backend.
    */
    role_id: z
  .number({
    message: "Role is required",
  })
  .int("Invalid role")
  .positive("Invalid role")
  .nullable()
  .refine(
    (value) => value !== null,
    {
      message: "Role is required",
    }
  ),
    /*
    |--------------------------------------------------------------------------
    | Administrative Level
    |--------------------------------------------------------------------------
    */
    level: z.enum(levels),

    /*
    |--------------------------------------------------------------------------
    | Administrative Unit
    |--------------------------------------------------------------------------
    */
    administrative_unit_id: z
      .string()
      .uuid("Invalid administrative unit"),

    /*
    |--------------------------------------------------------------------------
    | Sector
    |--------------------------------------------------------------------------
    */
    sector_id: z
      .string()
      .uuid("Invalid sector")
      .optional()
      .or(z.literal("")),

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */
    is_active: z.boolean(),
  });

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/

export const createUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/

export const updateUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type CreateUserFormData = z.infer<
  typeof createUserSchema
>;

export type UpdateUserFormData = z.infer<
  typeof updateUserSchema
>;

export type UserFormData =
  | CreateUserFormData
  | UpdateUserFormData;