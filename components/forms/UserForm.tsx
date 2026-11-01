"use client";

import React from "react";
import { useForm, useWatch } from "react-hook-form";
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

import type {
  AdministrativeLevel,
  UserFormData,
} from "@/types/user";

import type { Role } from "@/types/access-management";
import type { AdminUnit } from "@/types/admin-unit";

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
    avatarFile?: File | null,
  ) => Promise<void>;
  loading: boolean;
};

type SmartSelectOption = {
  id: string;
  label: string;
};

type RoleDropdownValue = string | number | null | undefined;

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
    <div className="mb-1 flex items-center gap-2">
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

  const { data: sectors } = useSectors({
    per_page: 34,
    page: 1,
  });

  const { data: admin_unit } = useAdminUnits({
    per_page: 30,
    page: 1,
  });

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [showPassword, setShowPassword] = React.useState(false);

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = React.useState("");

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
    control,
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
  |
  | useWatch subscribes to individual form values without using
  | the watch() function returned by useForm().
  |
  */

  const roleId = useWatch({
    control,
    name: "role_id",
  });

  const sectorId = useWatch({
    control,
    name: "sector_id",
  });

  const adminUnitId = useWatch({
    control,
    name: "administrative_unit_id",
  });

  const level = useWatch({
    control,
    name: "level",
  });

  const isActive = useWatch({
    control,
    name: "is_active",
  });

  /*
  |--------------------------------------------------------------------------
  | Error Management
  |--------------------------------------------------------------------------
  */

  const allErrors = React.useMemo(
    () => flattenFormErrors(errors),
    [errors],
  );

  /*
  |--------------------------------------------------------------------------
  | Filter Administrative Units
  |--------------------------------------------------------------------------
  */

  const filteredAdminUnit = React.useMemo(
    () => {
      if (!level) {
        return [];
      }

      return (
        admin_unit?.data
          ?.filter(
            (unit: AdminUnit) =>
              String(unit.level) === String(level),
          )
          .map((unit: AdminUnit) => ({
            id: String(unit.id),
            label: unit.name,
            meta: unit,
          })) || []
      );
    },
    [admin_unit, level],
  );

  /*
  |--------------------------------------------------------------------------
  | Sector Options
  |--------------------------------------------------------------------------
  */

  const sectorOptions = React.useMemo<SmartSelectOption[]>(
    () =>
      sectors?.data?.map((sector) => ({
        id: String(sector.id),
        label: sector.name,
      })) || [],
    [sectors],
  );

  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const { url } = usePrivateImage(initialData?.avatar);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submitForm = async (data: UserFormData) => {
    await onSubmit(data, avatarFile);
  };

  /*
  |--------------------------------------------------------------------------
  | Role Change
  |--------------------------------------------------------------------------
  */

  const handleRoleChange = (
    value: RoleDropdownValue,
    _item: Role | null,
  ) => {
    const numericRoleId =
      value === null ||
      value === undefined ||
      value === ""
        ? null
        : Number(value);

    if (
      numericRoleId !== null &&
      !Number.isInteger(numericRoleId)
    ) {
      console.error("Invalid role ID:", value);
      return;
    }

    setValue("role_id", numericRoleId, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // Reset dependent selections when the role changes.
    setValue("sector_id", "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue("administrative_unit_id", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Level Change
  |--------------------------------------------------------------------------
  */

  const handleLevelChange = (value: AdministrativeLevel) => {
    setValue("level", value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue("administrative_unit_id", "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue("sector_id", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Sector Change
  |--------------------------------------------------------------------------
  */

  const handleSectorChange = (
    option: SmartSelectOption | null,
  ) => {
    setValue("sector_id", option?.id || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Administrative Unit Change
  |--------------------------------------------------------------------------
  */

  const handleAdminUnitChange = (
    option: SmartSelectOption | null,
  ) => {
    setValue("administrative_unit_id", option?.id || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Avatar Change
  |--------------------------------------------------------------------------
  */

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarFile(file);

    setAvatarPreview(URL.createObjectURL(file));

    // Never store a blob URL in the form data.
    setValue("avatar", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
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
      <FormErrorSummary errors={allErrors} />

      {/* PROFILE IMAGE */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
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
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="w-full">
            <Label>Upload Image</Label>

            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />

            <FieldHint text="JPG/PNG recommended (512x512)" />
          </div>
        </CardContent>
      </Card>

      {/* BASIC INFORMATION */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* NAME */}

          <div>
            <Label
              icon={<User className="h-4 w-4" />}
              required
            >
              Full Name
            </Label>

            <Input
              {...register("name")}
              className="py-4"
            />

            <p className="text-xs text-red-500">
              {errors.name?.message?.toString()}
            </p>

            <FieldHint
              text="Displayed across system"
              required
            />

            <p className="text-xs text-red-500">
              {errors.form?.message}
            </p>
          </div>

          {/* EMAIL */}

          <div>
            <Label
              icon={<Mail className="h-4 w-4" />}
              required
            >
              Email
            </Label>

            <Input
              {...register("email")}
              className="py-4"
            />

            <p className="text-xs text-red-500">
              {errors.email?.message?.toString()}
            </p>

            <FieldHint
              text="Must be unique"
              required
            />
          </div>

          {/* PHONE */}

          <div>
            <Label icon={<Phone className="h-4 w-4" />}>
              Phone
            </Label>

            <Input
              {...register("phone")}
              className="py-4"
            />

            <FieldHint text="Optional" />
          </div>

          {/* PASSWORD */}

          {mode === "create" && (
            <div>
              <Label required>Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter password"
                  className="py-4 pr-12"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-0 h-9 w-9"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-red-500">
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

      {/* ACCESS CONTROL */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Access Control
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* ROLE */}

          <div className="w-full space-y-1.5">
            <Label required>Role</Label>

            <RoleDropdown
              value={roleId}
              onChange={handleRoleChange}
            />

            {errors.role_id && (
              <p className="text-xs text-red-500">
                {errors.role_id.message?.toString()}
              </p>
            )}
          </div>

          {/* LEVEL */}

          <div>
            <Label required>Level</Label>

            <Select
              value={level || ""}
              onValueChange={handleLevelChange}
            >
              <SelectTrigger className="w-full py-5">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="CITY">
                  City
                </SelectItem>

                <SelectItem value="SUBCITY">
                  Subcity
                </SelectItem>

                <SelectItem value="WEREDA">
                  Wereda
                </SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-red-500">
              {errors.level?.message?.toString()}
            </p>
          </div>

          {/* ACTIVE USER */}

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
              checked={Boolean(isActive)}
              onCheckedChange={(value) => {
                setValue("is_active", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* GOVERNANCE STRUCTURE */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Governance Structure
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* SECTOR */}

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Sector
              </label>

              <SmartSelect
                value={sectorId || ""}
                options={sectorOptions}
                onChange={handleSectorChange}
              />

              <p className="text-xs text-red-500">
                {errors.sector_id?.message?.toString()}
              </p>

              <FieldHint
                text="Select responsible sector for this user"
                required
              />
            </div>

            {/* ADMINISTRATIVE UNIT */}

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Administrative Unit
              </label>

              <SmartSelect
                value={adminUnitId || ""}
                options={filteredAdminUnit.map((unit) => ({
                  id: unit.id,
                  label: unit.label,
                }))}
                onChange={handleAdminUnitChange}
              />

              <p className="text-xs text-red-500">
                {errors.administrative_unit_id?.message?.toString()}
              </p>

              <FieldHint
                text="Select administrative area for this user"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS */}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || loading}
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