"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  Shield,
  MapPin,
  BadgeCheck,
  EyeOff,
  Eye,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  AdministrativeLevel,
  UserFormData,
  UserRole,
} from "@/types/user";

import { Role } from "@/types/access-management";

import { flattenFormErrors } from "@/utils/formErrors";

import {
  useAdminUnits,
  useSectors,
} from "@/hooks/useAdminUnit.hook";

import { SmartSelect } from "../input/SmartSelect";

import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/zod-forms/user.schema";

import { AdminUnit } from "@/types/admin-unit";

import { FormErrorSummary } from "./FormErrorSummary";
import { FieldHint } from "./FieldHint";

import { usePrivateImage } from "@/hooks/usePrivateImage";

import { RoleDropdown } from "../input/RoleDropDown";


type Mode = "create" | "edit";


type Props = {
  mode: Mode;

  initialData?: UserFormData;

  onSubmit: (
    data: UserFormData,
    avatarFile?: File | null
  ) => Promise<void>;

  loading: boolean;
};


export function Label({
  icon,
  children,
  required,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {icon}

      <span className="text-[14px] font-semibold">
        {children}
      </span>

      {required && (
        <span className="text-red-500">*</span>
      )}
    </div>
  );
}


export function UserForm({
  mode,
  initialData,
  onSubmit,
  loading,
}: Props) {

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const {
    data: sectors,
  } = useSectors({
    per_page: 34,
    page: 1,
  });

  const {
    data: admin_unit,
  } = useAdminUnits({
    per_page: 30,
    page: 1,
  });


  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [
    showPassword,
    setShowPassword,
  ] = React.useState(false);


  const [
    avatarFile,
    setAvatarFile,
  ] = React.useState<File | null>(null);


  const [
    avatarPreview,
    setAvatarPreview,
  ] = React.useState<string>("");


  /*
  |--------------------------------------------------------------------------
  | Selected Role
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | role_id is stored in React Hook Form.
  |
  | selectedRole is kept separately because UI logic needs
  | the role name.
  |
  */

  const [
    selectedRole,
    setSelectedRole,
  ] = React.useState<Role | null>(null);


  /*
  |--------------------------------------------------------------------------
  | Validation Schema
  |--------------------------------------------------------------------------
  */

  const schema =
    mode === "create"
      ? createUserSchema
      : updateUserSchema;


  /*
  |--------------------------------------------------------------------------
  | React Hook Form
  |--------------------------------------------------------------------------
  */

  const {
    register,
    handleSubmit,
    setValue,
    watch,

    formState: {
      isSubmitting,
      errors,
    },

  } = useForm<UserFormData>({
    resolver: zodResolver(schema),

    defaultValues:
      initialData || {
        name: "",
        email: "",
        phone: "",
        password: "",
        avatar: "",

        /*
        |--------------------------------------------------------------------------
        | Role ID
        |--------------------------------------------------------------------------
        */

        role_id: null,

        level: "CITY",

        is_active: true,

        sector_id: "",

        administrative_unit_id: "",
      },
  });


  /*
  |--------------------------------------------------------------------------
  | Watch Form Values
  |--------------------------------------------------------------------------
  */

  const roleId = watch("role_id");

  const sector_id =
    watch("sector_id");

  const adminUnitId =
    watch("administrative_unit_id");

  const level =
    watch("level");


  /*
  |--------------------------------------------------------------------------
  | Current Role Name
  |--------------------------------------------------------------------------
  |
  | Role ID is submitted to backend.
  |
  | Role name is used only for frontend UI rules.
  |
  */

  const roleName =
    selectedRole?.name as UserRole | undefined;


  /*
  |--------------------------------------------------------------------------
  | Initialize Selected Role During Edit
  |--------------------------------------------------------------------------
  |
  | If initialData already contains role information separately,
  | the parent can provide it through selectedRole initialization.
  |
  | Since role_id alone cannot tell us the role name, RoleDropdown
  | will resolve the actual Role object when the user interacts with it.
  |
  | If your API provides role object in initialData, you can initialize
  | selectedRole here.
  |
  */

  useEffect(() => {

    if (!initialData?.role_id) {
      setSelectedRole(null);
    }

  }, [initialData]);


  /*
  |--------------------------------------------------------------------------
  | Role → Sector Rules
  |--------------------------------------------------------------------------
  |
  | These are role NAMES, not role IDs.
  |
  */

  const sectorRoles: UserRole[] = [
    "SECTOR_OFFICER",
    "REVENUE_DECISION_OFFICER",
    "REVENUE_COMPLAINT_OFFICER",
    "REVENUE_TAX_ADMINISTRATION_OFFICER",
    "REVENUE_COLLECTOR",
  ];


  const showSectorField =
    roleName !== undefined &&
    sectorRoles.includes(roleName);


  /*
  |--------------------------------------------------------------------------
  | Role → Administrative Level Rules
  |--------------------------------------------------------------------------
  */

  const lowerLevelRoles: UserRole[] = [
    "SECTOR_OFFICER",
    "REGISTRATION_OFFICER",
    "REVENUE_DECISION_OFFICER",
    "REVENUE_COMPLAINT_OFFICER",
    "REVENUE_TAX_ADMINISTRATION_OFFICER",
    "REVENUE_COLLECTOR",
  ];


  const canSelectLowerLevels =
    roleName !== undefined &&
    lowerLevelRoles.includes(roleName);


  /*
  |--------------------------------------------------------------------------
  | Error Management
  |--------------------------------------------------------------------------
  */

  const allErrors =
    React.useMemo(
      () => flattenFormErrors(errors),
      [errors]
    );


  /*
  |--------------------------------------------------------------------------
  | Filter Administrative Units
  |--------------------------------------------------------------------------
  */

  const filteredAdminUnit =
    React.useMemo(() => {

      if (!level) {
        return [];
      }

      return (
        admin_unit?.data
          ?.filter(
            (unit: AdminUnit) =>
              String(unit.level) ===
              String(level)
          )

          .map((unit: AdminUnit) => ({
            id: String(unit.id),

            label: unit.name,

            meta: unit,
          })) || []
      );

    }, [
      admin_unit,
      level,
    ]);


  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const {
    url,
  } = usePrivateImage(
    initialData?.avatar
  );


  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submitForm = (
    data: UserFormData
  ) => {

    onSubmit(
      data,
      avatarFile
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <form
      onSubmit={handleSubmit(submitForm)}
      className="space-y-6"
    >

      <FormErrorSummary
        errors={allErrors}
      />


      {/* ================================================================== */}
      {/* PROFILE IMAGE */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <ImageIcon className="w-4 h-4 text-primary" />

            Profile Image

          </CardTitle>

        </CardHeader>


        <CardContent className="flex items-center gap-6">

          <Avatar className="h-20 w-20 border">

            <AvatarImage
              src={
                avatarPreview ||
                url ||
                undefined
              }
            />

            <AvatarFallback>

              <ImageIcon className="w-6 h-6 text-muted-foreground" />

            </AvatarFallback>

          </Avatar>


          <div className="w-full">

            <Label>
              Upload Image
            </Label>


            <Input
              type="file"
              accept="image/*"

              onChange={(e) => {

                const file =
                  e.target.files?.[0];

                if (!file) {
                  return;
                }

                setAvatarFile(file);

                setAvatarPreview(
                  URL.createObjectURL(file)
                );

                /*
                |--------------------------------------------------------------------------
                | Do not store blob URL in form
                |--------------------------------------------------------------------------
                */

                setValue(
                  "avatar",
                  ""
                );

              }}
            />


            <FieldHint
              text="JPG/PNG recommended (512x512)"
            />

          </div>

        </CardContent>

      </Card>


      {/* ================================================================== */}
      {/* BASIC INFORMATION */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <User className="w-4 h-4 text-primary" />

            Basic Information

          </CardTitle>

        </CardHeader>


        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {/* NAME */}

          <div>

            <Label
              icon={
                <User className="w-4 h-4" />
              }
              required
            >
              Full Name
            </Label>


            <Input
              {...register("name")}
              className="py-4"
            />


            <p className="text-red-500 text-xs">

              {errors.name?.message?.toString()}

            </p>


            <FieldHint
              text="Displayed across system"
              required
            />


            <p className="text-red-500 text-xs">

              {errors.form?.message}

            </p>

          </div>


          {/* EMAIL */}

          <div>

            <Label
              icon={
                <Mail className="w-4 h-4" />
              }
              required
            >
              Email
            </Label>


            <Input
              {...register("email")}
              className="py-4"
            />


            <p className="text-red-500 text-xs">

              {errors.email?.message?.toString()}

            </p>


            <FieldHint
              text="Must be unique"
              required
            />

          </div>


          {/* PHONE */}

          <div>

            <Label
              icon={
                <Phone className="w-4 h-4" />
              }
            >
              Phone
            </Label>


            <Input
              {...register("phone")}
              className="py-4"
            />


            <FieldHint
              text="Optional"
            />

          </div>


          {/* PASSWORD */}

          {mode === "create" && (

            <div>

              <Label required>
                Password
              </Label>


              <div className="relative">

                <Input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }

                  {...register("password")}

                  placeholder="Enter password"

                  className="pr-12 py-4"
                />


                <Button
                  type="button"
                  variant="ghost"
                  size="icon"

                  className="absolute right-1 top-0 h-9 w-9"

                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                >

                  {showPassword ? (

                    <EyeOff className="h-4 w-4" />

                  ) : (

                    <Eye className="h-4 w-4" />

                  )}

                </Button>

              </div>


              <p className="text-red-500 text-xs">

                {errors.password?.message?.toString()}

              </p>


              <FieldHint
                text="Password is required for new users"
                required
              />

            </div>

          )}

        </CardContent>

      </Card>


      {/* ================================================================== */}
      {/* ACCESS CONTROL */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Shield className="w-4 h-4 text-primary" />

            Access Control

          </CardTitle>

        </CardHeader>


        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {/* ================================================================ */}
          {/* ROLE */}
          {/* ================================================================ */}

          {/* ================================================================
    ROLE
================================================================ */}

<div className="w-full space-y-1.5">

<Label required>
  Role
</Label>

<RoleDropdown
  value={roleId}
  onChange={(value, item) => {

    // ------------------------------------------------------------
    // RoleDropdown may return the ID as a string because
    // shadcn Select values are strings.
    //
    // Backend/database expects INTEGER role_id.
    // ------------------------------------------------------------

    const numericRoleId =
      value === null ||
      value === undefined 
        ? null
        : Number(value);

    // ------------------------------------------------------------
    // Validate that conversion actually produced a number.
    // ------------------------------------------------------------

    if (
      numericRoleId !== null &&
      !Number.isInteger(numericRoleId)
    ) {
      console.error(
        "Invalid role ID:",
        value
      );

      return;
    }

    // ------------------------------------------------------------
    // Store INTEGER role_id in React Hook Form.
    // ------------------------------------------------------------

    setValue(
      "role_id",
      numericRoleId,
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      }
    );

    // ------------------------------------------------------------
    // Store complete Role object for UI business rules.
    // ------------------------------------------------------------

    setSelectedRole(item);

    // ------------------------------------------------------------
    // Role changed → dependent fields may no longer
    // be valid for the new role.
    // ------------------------------------------------------------

    setValue(
      "sector_id",
      "",
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );

    setValue(
      "administrative_unit_id",
      "",
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );
  }}
/>

{errors.role_id && (
  <p className="text-xs text-red-500">
    {errors.role_id.message?.toString()}
  </p>
)}

</div>

          {/* ================================================================ */}
          {/* LEVEL */}
          {/* ================================================================ */}

          <div>

            <Label required>
              Level
            </Label>


            <Select

              value={
                watch("level")
              }

              onValueChange={(
                val: AdministrativeLevel
              ) => {

                setValue(
                  "level",
                  val,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );


                /*
                |--------------------------------------------------------------------------
                | Reset dependent selections
                |--------------------------------------------------------------------------
                */

                setValue(
                  "administrative_unit_id",
                  "",
                  {
                    shouldValidate: true,
                  }
                );

                setValue(
                  "sector_id",
                  "",
                  {
                    shouldValidate: true,
                  }
                );

              }}

            >

              <SelectTrigger className="w-full py-4">

                <SelectValue
                  placeholder="Select Level"
                />

              </SelectTrigger>


              <SelectContent>

                <SelectItem value="CITY">
                  City
                </SelectItem>


                {canSelectLowerLevels && (

                  <>

                    <SelectItem value="SUBCITY">
                      Subcity
                    </SelectItem>


                    <SelectItem value="WEREDA">
                      Wereda
                    </SelectItem>

                  </>

                )}

              </SelectContent>

            </Select>


            <p className="text-red-500 text-xs">

              {errors.level?.message?.toString()}

            </p>

          </div>


          {/* ================================================================ */}
          {/* ACTIVE USER */}
          {/* ================================================================ */}

          <div className="col-span-2 flex items-center justify-between rounded-lg border border-border bg-card p-4 text-card-foreground">

            <div>

              <p className="flex items-center gap-2 text-sm font-medium">

                <BadgeCheck className="h-4 w-4 text-primary" />

                Active User

              </p>


              <p className="text-xs text-muted-foreground">

                Controls login access

              </p>

            </div>


            <Switch

              checked={
                watch("is_active")
              }

              onCheckedChange={(
                val
              ) => {

                setValue(
                  "is_active",
                  val,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );

              }}

            />

          </div>

        </CardContent>

      </Card>


      {/* ================================================================== */}
      {/* GOVERNANCE STRUCTURE */}
      {/* ================================================================== */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <MapPin className="w-4 h-4 text-primary" />

            Governance Structure

          </CardTitle>

        </CardHeader>


        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            {/* ================================================================ */}
            {/* SECTOR */}
            {/* ================================================================ */}

            {showSectorField && (

              <div className="space-y-1">

                <label className="text-sm font-medium">
                  Sector
                </label>


                <SmartSelect

                  value={
                    sector_id
                  }


                  options={

                    sectors?.data?.map(
                      (sector: any) => ({
                        id: String(
                          sector.id
                        ),

                        label:
                          sector.name,
                      })
                    ) || []

                  }


                  onChange={(
                    option: any
                  ) => {

                    setValue(
                      "sector_id",
                      option?.id || "",
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );

                  }}

                />


                <p className="text-xs text-red-500">

                  {errors.sector_id?.message?.toString()}

                </p>


                <FieldHint
                  text="Select responsible sector for this user"
                  required
                />

              </div>

            )}


            {/* ================================================================ */}
            {/* ADMINISTRATIVE UNIT */}
            {/* ================================================================ */}

            <div className="space-y-1">

              <label className="text-sm font-medium">

                Administrative Unit

              </label>


              <SmartSelect

                value={
                  adminUnitId
                }


                options={

                  filteredAdminUnit.map(
                    (unit) => ({
                      id: String(
                        unit.id
                      ),

                      label:
                        unit.label,
                    })
                  )

                }


                onChange={(
                  option: any
                ) => {

                  setValue(
                    "administrative_unit_id",
                    option?.id || "",
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );

                }}

              />


              <p className="text-xs text-red-500">

                {
                  errors
                    .administrative_unit_id
                    ?.message
                    ?.toString()
                }

              </p>


              <FieldHint
                text="Select administrative area for this user"
                required
              />

            </div>

          </div>

        </CardContent>

      </Card>


      {/* ================================================================== */}
      {/* ACTIONS */}
      {/* ================================================================== */}

      <div className="flex justify-end gap-3">

        <Button
          type="button"
          variant="outline"
        >
          Cancel
        </Button>


        <Button
          type="submit"
          disabled={
            isSubmitting ||
            loading
          }
        >

          {loading
            ? "Saving..."
            : mode === "create"
              ? "Create User"
              : "Update User"}

        </Button>

      </div>

    </form>
  );
}