"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Smartphone,
  Loader2,
  AlertCircle,
  ArrowRight,
  SignalHigh,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { citizenLoginSchema, CitizenUserFormData } from "@/lib/zod-forms/citizenLogin.schema";
import { useSendOtp } from "@/hooks/auth/useLogin";

const DIGIT_TARGET = 9;

type Provider = {
  name: string;
  text: string;
  ring: string;
  bar: string;
  chipBg: string;
};

type ProviderKey = "9" | "7";

const PROVIDERS: Record<ProviderKey, Provider> = {
  "9": {
    name: "Ethio Telecom",
    text: "text-blue-700",
    ring: "focus-within:ring-blue-500/25 focus-within:border-blue-400",
    bar: "bg-blue-500",
    chipBg: "bg-blue-50",
  },
  "7": {
    name: "Safaricom Ethiopia",
    text: "text-emerald-700",
    ring: "focus-within:ring-emerald-500/25 focus-within:border-emerald-400",
    bar: "bg-emerald-500",
    chipBg: "bg-emerald-50",
  },
};

export default function CitizenUserLogin({ className, ...props }: React.ComponentProps<"div">) {

    const {mutate:sendOtp,isPending} = useSendOtp();

  const form = useForm<CitizenUserFormData>({
    resolver: zodResolver(citizenLoginSchema),
    defaultValues: { phone: "" },
    mode: "onChange",
  });

  const phoneValue = useWatch({ control: form.control, name: "phone" }) ?? "";
//   const isPending = form.formState.isSubmitting;
  const hasError = !!form.formState.errors.phone;

  const provider = useMemo(() => {
    const clean = phoneValue.replace(/\D/g, "");
  
    let localNumber = clean;
  
    if (clean.startsWith("251")) {
      localNumber = clean.slice(3);
    } else if (clean.startsWith("0")) {
      localNumber = clean.slice(1);
    }
  
    const prefix = localNumber.charAt(0) as "9" | "7";
  
    return PROVIDERS[prefix] ?? null;
  }, [phoneValue]);

  const cleanPhone = phoneValue.replace(/\D/g, "");

  const digitsEntered = cleanPhone.startsWith("251")
    ? cleanPhone.slice(3).length
    : cleanPhone.length;

  const progress = Math.min(digitsEntered / DIGIT_TARGET, 1) * 100;
  const isComplete = digitsEntered === DIGIT_TARGET && !hasError;

  const handleSendOtp = (data: CitizenUserFormData) => {
    sendOtp({
        phone:data.phone,
        type:"login",
    }
    );
  };

  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-7", className)} {...props}>


      <form onSubmit={form.handleSubmit(handleSendOtp)} noValidate>
        <FieldGroup className="space-y-1">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Smartphone className="size-6" strokeWidth={2.25} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Sign in with your phone</h1>
              <FieldDescription className="text-sm text-muted-foreground">
                We'll send a one-time code to verify it's you.
              </FieldDescription>
            </div>
          </div>

          {/* Phone field */}
          <Field>
            <FieldLabel htmlFor="phone">Mobile number</FieldLabel>

            <div
              className={cn(
                "relative flex items-center rounded-lg border bg-background transition-all duration-200 focus-within:ring-4",
                hasError
                  ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/15"
                  : provider
                  ? provider.ring
                  : "focus-within:border-primary focus-within:ring-primary/15"
              )}
            >
              <Smartphone
                className={cn(
                  "pointer-events-none ml-3 size-4 shrink-0 transition-colors",
                  hasError ? "text-destructive" : provider ? provider.text : "text-muted-foreground"
                )}
              />
              <Input
                id="phone"
                {...form.register("phone")}
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
                placeholder="+2519XX XXX XXX"
                className="h-12 flex-1 border-0 bg-transparent p-0 text-base tracking-wide shadow-none outline-none ring-0 ring-offset-0 focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 aria-invalid:border-0 aria-invalid:ring-0 aria-invalid:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:inherit] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
                aria-invalid={hasError}
                />
              {isComplete && (
                <CheckCircle2 className="mr-3 size-4 shrink-0 text-emerald-600 animate-in fade-in zoom-in-50" />
              )}
            </div>

            {/* Progress affordance */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  hasError ? "bg-destructive" : provider ? provider.bar : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Hint / error / detected provider */}
            <div className="mt-2.5 ">
              {hasError ? (
                <FieldDescription className="flex items-center gap-1.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {form.formState.errors.phone?.message}
                </FieldDescription>
              ) : provider ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium animate-in fade-in slide-in-from-top-1",
                    provider.chipBg,
                    provider.text
                  )}
                >
                  <SignalHigh className="size-3.5" />
                  {provider.name} detected
                </div>
              ) : (
                <FieldDescription className="text-xs text-muted-foreground">
                  Start with 09 (Ethio Telecom) or 07 (Safaricom)
                </FieldDescription>
              )}
            </div>
          </Field>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !form.formState.isValid}
            className="h-11 w-full gap-2 shadow-lg shadow-primary/15 transition-transform active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending code
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>

      {/* Trust footer */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Encrypted
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5">
          <Lock className="size-3.5" />
          Verified access
        </span>
      </div>
    </div>
  );
}