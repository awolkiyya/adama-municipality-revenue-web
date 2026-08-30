"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Save,
  Loader2,
  Landmark,
  CheckCircle2,
  Circle,
  Mail,
  Cake,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  TaxpayerFormValues,
  taxpayerSchema,
} from "@/lib/zod-forms/taxpayer.schema";
import { useAdminUnits } from "@/hooks/useAdminUnit.hook";
import { AdminUnit } from "@/types/admin-unit";
import { SmartSelect, type Option } from "../input/SmartSelect";
import { FieldHint } from "./FieldHint";
import { Label } from "./UserForm";
import { EthiopianDatePicker } from "../input/EthiopianDatePicker";
import { parseDate } from "@/utils/formatEth";
import { formatDate, formatEthiopianDate } from "@/lib/utils";

// Use SmartSelect's own Option type rather than a parallel local type.
// Its `meta` field is optional there, so anything we build (meta always
// present) is assignable to it — but the reverse isn't true, which is what
// caused the onChange type error. Alias it so the rest of the file reads
// clearly, without redeclaring a stricter, incompatible shape.
type AdminUnitOption = Option;

type TaxpayerFormProps = {
  defaultValues?: Partial<TaxpayerFormValues>;
  onSubmit: (values: TaxpayerFormValues) => void;
  isSubmitting?: boolean;
  /** Administrative level this form registers taxpayers under. */
  adminLevel?: string;
};

/** Section wrapper: numbered, with an icon, title, and a one-line purpose statement. */
function FormSection({
  index,
  icon: Icon,
  title,
  description,
  children,
  complete,
}: {
  index: number;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  complete: boolean;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground">
              {index}
            </span>
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {complete ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>
        <p className="pl-10 text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
        {children}
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function TaxpayerForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  adminLevel = "WEREDA",
}: TaxpayerFormProps) {


  const form = useForm<TaxpayerFormValues>({
    resolver: zodResolver(taxpayerSchema),
    defaultValues: {
      full_name: "",
      national_id: "",
      gender: "MALE",
      date_of_birth: "",
      phone: "",
      email: "",
      administrative_unit_id: "",
      ...defaultValues,
    },
  });

  const {
    data: adminUnitResponse,
    isLoading: isLoadingAdminUnits,
    isError: isAdminUnitsError,
  } = useAdminUnits({ per_page: 30, page: 1 });

  const values = form.watch();
  const errors = form.formState.errors;

  const identityComplete = Boolean(
    values.full_name && values.national_id && values.date_of_birth
  );
  const contactComplete = Boolean(values.phone);
  const addressComplete = Boolean(values.administrative_unit_id);

  const fieldsFilled = [
    values.full_name,
    values.national_id,
    values.date_of_birth,
    values.phone,
    values.administrative_unit_id,
  ].filter(Boolean).length;
  const progressPct = Math.round((fieldsFilled / 5) * 100);

  const initials = useMemo(() => {
    if (!values.full_name) return "—";
    return values.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [values.full_name]);

  // Administrative units filtered to the level this form registers against.
  const adminUnitOptions: AdminUnitOption[] = useMemo(() => {
    if (!adminLevel) return [];
    return (
      adminUnitResponse?.data
        ?.filter((unit: AdminUnit) => String(unit.level) === String(adminLevel))
        .map((unit: AdminUnit) => ({
          id: String(unit.id),
          label: unit.name,
          meta: unit,
        })) ?? []
    );
  }, [adminUnitResponse, adminLevel]);

  // The option object SmartSelect should show as currently selected.
  const selectedAdminUnit = useMemo(
    () =>
      adminUnitOptions.find(
        (unit) => unit.id === values.administrative_unit_id
      ) ?? null,
    [adminUnitOptions, values.administrative_unit_id]
  );

  const handleAdminUnitChange: (option: AdminUnitOption | null) => void = (
    option
  ) => {
    form.setValue("administrative_unit_id", option?.id ?? "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 lg:col-span-2"
      >
        {/* Progress */}
        <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <Landmark className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Taxpayer registration</span>
              <span className="text-muted-foreground">
                {progressPct}% complete
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Identity */}
        <FormSection
          index={1}
          icon={User}
          title="Taxpayer identity"
          description="Legal name and national ID as they appear on the taxpayer's identification document."
          complete={identityComplete}
        >
          <div className="space-y-2">
            <Label required>Full name</Label>
            <Input
              placeholder="Enter full name"
              {...form.register("full_name")}
              className="py-4"

            />
            <FieldError message={errors.full_name?.message} />
          </div>

          <div className="space-y-2">
            <Label required>
              National ID
            </Label>
            <Input
              placeholder="Enter national ID"
              {...form.register("national_id")}
              className="py-4"
            />
            <FieldError message={errors.national_id?.message} />
          </div>

          <div className="space-y-2">
            <Label required>Gender</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(value) =>
                form.setValue("gender", value as "MALE" | "FEMALE", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full py-4">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors.gender?.message} />
          </div>

          <div className="space-y-2">
            <Label required>
              Date of birth
            </Label>
            <EthiopianDatePicker
              value={parseDate(values.date_of_birth ?? undefined)}
              onChange={(date) =>
                form.setValue("date_of_birth", formatDate(date), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder = "Guyyaa dhalootaa filadhaa"
                          />
            {/* <Input type="date" {...form.register("date_of_birth")}               className="py-4" /> */}
            <FieldError message={errors.date_of_birth?.message} />
          </div>
        </FormSection>

        {/* Contact */}
        <FormSection
          index={2}
          icon={Phone}
          title="Contact information"
          description="How the tax office will reach this taxpayer for notices and correspondence."
          complete={contactComplete}
        >
          <div className="space-y-2">
            <Label required>Phone number</Label>
            <Input placeholder="+2519XXXXXXXX" {...form.register("phone")}  className="py-4" />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <Label >
              Email
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              placeholder="email@example.com"
              {...form.register("email")}
              className="py-4"
            />
            <FieldError message={errors.email?.message} />
          </div>
        </FormSection>

        {/* Address */}
        <FormSection
          index={3}
          icon={MapPin}
          title="Address information"
          description="The administrative unit where this taxpayer is registered."
          complete={addressComplete}
        >
          <div className="space-y-2 md:col-span-2">
            <Label>Administrative unit (Wereda)</Label>

            <SmartSelect
              value={selectedAdminUnit?.id}
              options={adminUnitOptions}
              onChange={handleAdminUnitChange}
              placeholder={
                isLoadingAdminUnits
                  ? "Loading administrative units..."
                  : "Select Wereda"
              }
              disabled={isLoadingAdminUnits || isAdminUnitsError}
            />

            {isAdminUnitsError && (
              <p className="text-sm text-destructive">
                Couldn&apos;t load administrative units. Try refreshing the page.
              </p>
            )}

            <FieldError
              message={errors.administrative_unit_id?.message?.toString()}
            />

            <FieldHint
              text="Select the administrative area this taxpayer is registered under"
              required
            />
          </div>
        </FormSection>

        {/* Submit */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Review the registration card before saving.
          </p>
          <Button disabled={isSubmitting} type="submit" size="lg">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Saving..." : "Save taxpayer"}
          </Button>
        </div>
      </form>

      {/* Live registration card preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-3">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="bg-primary px-5 py-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  Taxpayer registration card
                </span>
                <Landmark className="h-4 w-4 opacity-80" />
              </div>
            </div>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {values.full_name || "Full name pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {values.national_id
                      ? `ID ${values.national_id}`
                      : "National ID pending"}
                  </p>
                </div>
              </div>

              <Separator />

              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Gender</dt>
                  <dd className="font-medium capitalize">
                    {values.gender?.toLowerCase() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd className="font-medium">{values.date_of_birth?formatEthiopianDate(new Date(values.date_of_birth)) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{values.phone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate font-medium">
                    {values.email || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">Wereda</dt>
                  <dd className="text-right font-medium">
                    {selectedAdminUnit?.label || "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Badge
            variant={progressPct === 100 ? "default" : "secondary"}
            className="w-full justify-center py-1.5 text-xs"
          >
            {progressPct === 100
              ? "Ready to save"
              : `${5 - fieldsFilled} field${
                  5 - fieldsFilled === 1 ? "" : "s"
                } remaining`}
          </Badge>
        </div>
      </div>
    </div>
  );
}