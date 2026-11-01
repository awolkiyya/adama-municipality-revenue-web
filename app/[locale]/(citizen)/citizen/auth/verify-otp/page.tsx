
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { cn } from "@/lib/utils";
import { useResendOtp, useVerifyOtp } from "@/hooks/auth/useLogin";

/* =========================================================
   CONSTANTS
   ========================================================= */

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const RESEND_STORAGE_KEY = "otp_resend_until";

/* =========================================================
   HELPERS
   ========================================================= */

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 4) {
    return phone;
  }

  const last4 = digits.slice(-4);

  const prefix = phone
    .slice(0, phone.length - 4)
    .replace(/\d/g, "\u2022");

  return `${prefix}${last4}`;
}

function getStoredRemainingSeconds(phone: string): number {
  if (typeof window === "undefined") {
    return RESEND_SECONDS;
  }

  const raw = sessionStorage.getItem(
    `${RESEND_STORAGE_KEY}:${phone}`,
  );

  if (!raw) {
    return RESEND_SECONDS;
  }

  const until = Number(raw);

  if (!Number.isFinite(until)) {
    return RESEND_SECONDS;
  }

  const remaining = Math.ceil(
    (until - Date.now()) / 1000,
  );

  return Math.max(remaining, 0);
}

function persistResendUntil(
  phone: string,
  seconds: number,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const until = Date.now() + seconds * 1000;

  sessionStorage.setItem(
    `${RESEND_STORAGE_KEY}:${phone}`,
    String(until),
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function VerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();

  const phone = params.get("phone") ?? "";

  /* =======================================================
     OTP MUTATIONS
     ======================================================= */

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

  /* =======================================================
     FORM STATE
     ======================================================= */

  const [otp, setOtp] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [shake, setShake] = useState(false);

  /* =======================================================
     RESEND TIMER STATE
     ======================================================= */

  /*
   * Start with null so server rendering and the first client
   * render use the same value.
   *
   * The persisted countdown is initialized asynchronously
   * after mounting to avoid a synchronous state update inside
   * an effect and prevent hydration mismatches.
   */

  const [timer, setTimer] = useState<number | null>(null);

  const [timerReady, setTimerReady] = useState(false);

  /* =======================================================
     REDIRECT WHEN PHONE IS MISSING
     ======================================================= */

  useEffect(() => {
    if (!phone) {
      router.replace("/citizen/auth/login");
    }
  }, [phone, router]);

  /* =======================================================
     INITIALIZE RESEND COUNTDOWN
     ======================================================= */

  useEffect(() => {
    if (!phone) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimer(getStoredRemainingSeconds(phone));
      setTimerReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [phone]);

  /* =======================================================
     COUNTDOWN
     ======================================================= */

  useEffect(() => {
    if (timer === null || timer <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimer((previous) => {
        if (previous === null || previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timer]);

  /* =======================================================
     SHAKE / ERROR HANDLING
     ======================================================= */

  function triggerShake(message: string): void {
    setError(message);
    setShake(true);

    window.setTimeout(() => {
      setShake(false);
    }, 420);
  }

  /* =======================================================
     VERIFY OTP
     ======================================================= */

  async function handleVerify(
    event?: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event?.preventDefault();

    if (
      !phone ||
      otp.length !== OTP_LENGTH ||
      verifying
    ) {
      return;
    }

    setError(null);

    try {
      await verifyOtpAsync({
        phone,
        otp,
        type: "login",
      });

      setOtp("");
      setError(null);
    } catch (verificationError: unknown) {
      triggerShake(
        getErrorMessage(
          verificationError,
          "The verification code is invalid or has expired. Please try again.",
        ),
      );
    }
  }

  /* =======================================================
     RESEND OTP
     ======================================================= */

  async function handleResend(): Promise<void> {
    if (
      !phone ||
      !timerReady ||
      timer === null ||
      timer > 0 ||
      resending
    ) {
      return;
    }

    setError(null);

    try {
      await resendOtpAsync({
        phone,
        type: "login",
      });

      setTimer(RESEND_SECONDS);

      persistResendUntil(
        phone,
        RESEND_SECONDS,
      );

      setOtp("");
      setError(null);
    } catch {
      /*
       * The mutation error is displayed through resendIsError
       * and resendError below.
       */
      return;
    }
  }

  /* =======================================================
     GUARD
     ======================================================= */

  if (!phone) {
    return null;
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm gap-0 overflow-hidden p-0 shadow-sm">
        {/* =================================================
            TOP ACCENT
            ================================================= */}

        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(120deg, var(--primary) 0px, var(--primary) 1px, transparent 1px, transparent 5px)",
            backgroundColor:
              "color-mix(in oklab, var(--primary) 55%, transparent)",
          }}
        />

        {/* =================================================
            HEADER
            ================================================= */}

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
            {/* =============================================
                ICON
                ============================================= */}

            <div className="relative flex items-center justify-center">
              {!verified && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -m-1.5 animate-ping rounded-2xl bg-primary/15 [animation-duration:2.2s]"
                />
              )}

              <div
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-xl transition-all duration-300 sm:size-11",
                  verified
                    ? "scale-105 bg-primary/10"
                    : "bg-primary",
                )}
              >
                {verified ? (
                  <CheckCircle2
                    className="size-6 text-primary"
                    strokeWidth={2}
                  />
                ) : (
                  <ShieldCheck
                    className="size-5 text-primary-foreground"
                    strokeWidth={2}
                  />
                )}
              </div>
            </div>

            {/* =============================================
                TITLE
                ============================================= */}

            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-balance font-serif text-lg font-semibold tracking-tight sm:text-xl">
                {verified
                  ? "Identity verified"
                  : "Verify your identity"}
              </h1>

              <FieldDescription className="max-w-[280px] text-center text-pretty sm:max-w-none">
                {verified
                  ? "Taking you to your dashboard."
                  : "Enter the 6-digit code sent by SMS to"}
              </FieldDescription>
            </div>

            {/* =============================================
                PHONE NUMBER
                ============================================= */}

            {!verified && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1">
                <span
                  className="size-1.5 rounded-full bg-primary/60"
                  aria-hidden="true"
                />

                <span className="font-mono text-xs font-medium tracking-wide text-foreground sm:text-[13px]">
                  {maskPhone(phone)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        {/* =================================================
            OTP FORM
            ================================================= */}

        {!verified && (
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleVerify}>
              <FieldGroup>
                {/* =========================================
                    OTP INPUT
                    ========================================= */}

                <div
                  className={cn(
                    "flex justify-center py-2",
                    shake && "animate-otp-shake",
                  )}
                >
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError(null);
                    }}
                    onComplete={() => {
                      void handleVerify();
                    }}
                    disabled={verifying}
                    aria-label="6-digit verification code"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="size-11 font-mono text-lg"
                      />

                      <InputOTPSlot
                        index={1}
                        className="size-11 font-mono text-lg"
                      />

                      <InputOTPSlot
                        index={2}
                        className="size-11 font-mono text-lg"
                      />
                    </InputOTPGroup>

                    <InputOTPSeparator />

                    <InputOTPGroup>
                      <InputOTPSlot
                        index={3}
                        className="size-11 font-mono text-lg"
                      />

                      <InputOTPSlot
                        index={4}
                        className="size-11 font-mono text-lg"
                      />

                      <InputOTPSlot
                        index={5}
                        className="size-11 font-mono text-lg"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* =========================================
                    VERIFICATION ERROR
                    ========================================= */}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />

                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* =========================================
                    RESEND ERROR
                    ========================================= */}

                {resendIsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />

                    <AlertDescription>
                      {getErrorMessage(
                        resendError,
                        "Couldn't resend the code. Try again.",
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* =========================================
                    VERIFY BUTTON
                    ========================================= */}

                <Button
                  type="submit"
                  disabled={
                    verifying ||
                    otp.length !== OTP_LENGTH
                  }
                  className="gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    "Verify code"
                  )}
                </Button>

                {/* =========================================
                    RESEND BUTTON
                    ========================================= */}

                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    !timerReady ||
                    timer === null ||
                    timer > 0 ||
                    resending
                  }
                  onClick={handleResend}
                  className="gap-2"
                >
                  {resending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-4" />
                  )}

                  {resending ? (
                    "Sending code..."
                  ) : !timerReady || timer === null ? (
                    "Loading resend timer..."
                  ) : timer > 0 ? (
                    <span>
                      Resend code in{" "}
                      <span className="font-medium text-foreground">
                        {timer}s
                      </span>
                    </span>
                  ) : (
                    "Resend code"
                  )}
                </Button>

                {/* =========================================
                    SUPPORT
                    ========================================= */}

                <p className="mt-2 border-t pt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Having trouble? Contact support at{" "}

                  <a
                    href="mailto:help@gov.et"
                    className="font-medium text-foreground hover:underline"
                  >
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
