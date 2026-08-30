"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, AlertCircle, RefreshCcw, CheckCircle2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useResendOtp, useVerifyOtp } from "@/hooks/auth/useLogin";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const RESEND_STORAGE_KEY = "otp_resend_until";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  const prefix = phone.slice(0, phone.length - 4).replace(/\d/g, "\u2022");
  return `${prefix}${last4}`;
}

// Reads a persisted "resend allowed at" timestamp and returns remaining seconds.
function getStoredRemainingSeconds(phone: string): number {
  if (typeof window === "undefined") return RESEND_SECONDS;

  const raw = sessionStorage.getItem(`${RESEND_STORAGE_KEY}:${phone}`);
  if (!raw) return RESEND_SECONDS;

  const until = Number(raw);
  const remaining = Math.ceil((until - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function persistResendUntil(phone: string, seconds: number) {
  if (typeof window === "undefined") return;
  const until = Date.now() + seconds * 1000;
  sessionStorage.setItem(`${RESEND_STORAGE_KEY}:${phone}`, String(until));
}

export default function VerifyOtpPage() {
  const {
    mutateAsync: resendOtpAsync,
    isPending: resending,
    isError: resendIsError,
    error: resendError,
  } = useResendOtp();

  const {
    mutateAsync: verifyOtpAsync,
    isPending: verifying,
    isSuccess: verified,
  } = useVerifyOtp();

  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);

  const formRef = useRef<HTMLFormElement>(null);

  // Guard: no phone in the URL (direct nav, refresh that dropped params, etc.)
  useEffect(() => {
    if (!phone) {
      router.replace("/citizen/auth/login");
    }
  }, [phone, router]);

  // Initialize the countdown from a persisted timestamp, not a hardcoded reset,
  // so a page refresh doesn't unfairly re-arm a fresh 60s window.
  useEffect(() => {
    if (!phone) return;
    setTimer(getStoredRemainingSeconds(phone));
  }, [phone]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  function triggerShake(message: string) {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 420);
  }

  async function handleVerify(e?: FormEvent) {
    e?.preventDefault();
    if (otp.length !== OTP_LENGTH || verifying) return;

      setError(null);
      await verifyOtpAsync({ phone:phone, otp:otp,type:"login" });
      setOtp("");
      setError(null);
  }

  async function handleResend() {
    if (timer > 0 || resending) return;

      await resendOtpAsync({ phone, type: "login" });

      setTimer(RESEND_SECONDS);
      persistResendUntil(phone, RESEND_SECONDS);
      setOtp("");
      setError(null);
  }

  if (!phone) return null; // brief flash before redirect above fires

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm gap-0 overflow-hidden p-0 shadow-sm">
        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(120deg, var(--primary) 0px, var(--primary) 1px, transparent 1px, transparent 5px)",
            backgroundColor: "color-mix(in oklab, var(--primary) 55%, transparent)",
          }}
        />

        <CardHeader className="px-8 pt-8">
          {!verified && (
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-5 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Change number
            </button>
          )}

          <div className="flex flex-col items-center gap-4 text-center">
            {/* Icon: soft pulsing ring while awaiting verification, settles to a solid confirmation state on success */}
            <div className="relative flex items-center justify-center">
              {!verified && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -m-1.5 rounded-2xl bg-primary/15 animate-ping [animation-duration:2.2s]"
                />
              )}
              <div
                className={cn(
                  "relative flex size-12 sm:size-11 items-center justify-center rounded-xl transition-all duration-300",
                  verified ? "bg-primary/10 scale-105" : "bg-primary"
                )}
              >
                {verified ? (
                  <CheckCircle2 className="size-6 text-primary" strokeWidth={2} />
                ) : (
                  <ShieldCheck className="size-5 text-primary-foreground" strokeWidth={2} />
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <h1 className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-balance">
                {verified ? "Identity verified" : "Verify your identity"}
              </h1>

              <FieldDescription className="text-center text-pretty max-w-[280px] sm:max-w-none">
                {verified ? "Taking you to your dashboard." : "Enter the 6-digit code sent by SMS to"}
              </FieldDescription>
            </div>

            {/* Phone number as a distinct chip, separated from the description copy */}
            {!verified && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1">
                <span className="size-1.5 rounded-full bg-primary/60" aria-hidden="true" />
                <span className="font-mono text-xs sm:text-[13px] font-medium tracking-wide text-foreground">
                  {maskPhone(phone)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        {!verified && (
          <CardContent className="px-8 pb-8">
            <form ref={formRef} onSubmit={handleVerify}>
              <FieldGroup>
                <div className={cn("flex justify-center py-2", shake && "animate-otp-shake")}>
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError(null);
                    }}
                    onComplete={() => handleVerify()}
                    disabled={verifying}
                    aria-label="6-digit verification code"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-11 font-mono text-lg" />
                      <InputOTPSlot index={1} className="size-11 font-mono text-lg" />
                      <InputOTPSlot index={2} className="size-11 font-mono text-lg" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="size-11 font-mono text-lg" />
                      <InputOTPSlot index={4} className="size-11 font-mono text-lg" />
                      <InputOTPSlot index={5} className="size-11 font-mono text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {resendIsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                      {(resendError as any)?.message ?? "Couldn't resend the code. Try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={verifying || otp.length !== OTP_LENGTH} className="gap-2">
                  {verifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    "Verify code"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={timer > 0 || resending}
                  onClick={handleResend}
                  className="gap-2"
                >
                  {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                  {timer > 0 ? (
                    <span>
                      Resend code in <span className="font-medium text-foreground">{timer}s</span>
                    </span>
                  ) : (
                    "Resend code"
                  )}
                </Button>

                <p className="mt-2 border-t pt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Having trouble? Contact support at{" "}
                  <a href="mailto:help@gov.et" className="font-medium text-foreground hover:underline">
                    help@gov.et
                  </a>{" "}
                  or call the citizen services line.
                </p>
              </FieldGroup>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}