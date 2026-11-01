
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

import Cookies from "js-cookie";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import { setAuth } from "@/lib/store/slices/user.slice";

import type { LoginResponse } from "@/types/user";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type LoginPayload = {
  email: string;
  password: string;
};

type OtpPayload = {
  phone: string;
  type: string;
};

type VerifyOtpPayload = OtpPayload & {
  otp: string;
};

type OtpResponse = {
  message: string;
  expiresIn?: number;
};

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};

/*
|--------------------------------------------------------------------------
| OFFICE LOGIN
|--------------------------------------------------------------------------
|
| Successful authentication establishes:
|
|   app = office
|   role = employee role
|
|--------------------------------------------------------------------------
*/

export const useLogin = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation<
    LoginResponse,
    unknown,
    LoginPayload
  >({
    mutationFn: authService.login,

    onSuccess: (res) => {
      /*
      |--------------------------------------------------------------------------
      | Redux authentication state
      |--------------------------------------------------------------------------
      */

      dispatch(
        setAuth({
          user: res.user,
          token: res.access_token,
        }),
      );

      /*
      |--------------------------------------------------------------------------
      | Success notification
      |--------------------------------------------------------------------------
      */

      toast.success(
        `Welcome back, ${res.user.name}!`,
        {
          description: "Login successful.",
        },
      );

      /*
      |--------------------------------------------------------------------------
      | Navigate to office application
      |--------------------------------------------------------------------------
      */

      router.push("/office/dashboard");
    },
  });
};

/*
|--------------------------------------------------------------------------
| SEND CITIZEN OTP
|--------------------------------------------------------------------------
|
| This does NOT authenticate the citizen yet.
|
| Therefore:
|
|   app cookie should NOT be changed here.
|
| The application becomes "citizen" only after
| OTP verification succeeds.
|
|--------------------------------------------------------------------------
*/

export const useSendOtp = () => {
  const router = useRouter();

  return useMutation<
    OtpResponse,
    unknown,
    OtpPayload
  >({
    mutationFn: authService.sendOtp,

    onSuccess: (res, variables) => {
      toast.success(
        "OTP sent successfully",
        {
          description:
            res.message ||
            "Check your phone for the verification code.",
        },
      );

      router.push(
        `/citizen/auth/verify-otp?phone=${encodeURIComponent(
          variables.phone,
        )}`,
      );
    },

    onError: (error) => {
      toast.error(
        "Failed to send OTP",
        {
          description: getErrorMessage(
            error,
            "Something went wrong. Please try again.",
          ),
        },
      );
    },
  });
};

/*
|--------------------------------------------------------------------------
| RESEND CITIZEN OTP
|--------------------------------------------------------------------------
|
| This also does NOT authenticate the citizen.
|
| Therefore the app cookie is unchanged.
|
|--------------------------------------------------------------------------
*/

export const useResendOtp = () => {
  return useMutation<
    OtpResponse,
    unknown,
    OtpPayload
  >({
    mutationFn: authService.resendOtp,

    onSuccess: (res) => {
      toast.success(
        "OTP resent",
        {
          description:
            res.message ||
            "A new verification code has been sent to your phone.",
        },
      );
    },

    onError: (error) => {
      toast.error(
        "Failed to resend OTP",
        {
          description: getErrorMessage(
            error,
            "Something went wrong. Please try again.",
          ),
        },
      );
    },
  });
};

/*
|--------------------------------------------------------------------------
| VERIFY CITIZEN OTP
|--------------------------------------------------------------------------
|
| Successful OTP verification establishes:
|
|   app = citizen
|
| A citizen must NOT have an employee role.
|
|--------------------------------------------------------------------------
*/

export const useVerifyOtp = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation<
    LoginResponse,
    unknown,
    VerifyOtpPayload
  >({
    mutationFn: authService.verifyOtp,

    onSuccess: (res) => {
      /*
      |--------------------------------------------------------------------------
      | IMPORTANT: SWITCH APPLICATION
      |--------------------------------------------------------------------------
      |
      | Explicitly change:
      |
      |     app = citizen
      |
      |--------------------------------------------------------------------------
      */

      Cookies.set(
        "app",
        "citizen",
        {
          path: "/",
          sameSite: "lax",
        },
      );

      /*
      |--------------------------------------------------------------------------
      | REMOVE EMPLOYEE ROLE
      |--------------------------------------------------------------------------
      */

      Cookies.remove(
        "role",
        {
          path: "/",
        },
      );

      /*
      |--------------------------------------------------------------------------
      | Redux authentication state
      |--------------------------------------------------------------------------
      */

      dispatch(
        setAuth({
          user: res.user,
          token: res.access_token,
        }),
      );

      /*
      |--------------------------------------------------------------------------
      | Success notification
      |--------------------------------------------------------------------------
      */

      toast.success(
        "Login successful",
        {
          description: `Welcome, ${res.user.name}!`,
        },
      );

      /*
      |--------------------------------------------------------------------------
      | Navigate to citizen application
      |--------------------------------------------------------------------------
      */

      router.push("/citizen/dashboard");
    },

    onError: (error) => {
      toast.error(
        "OTP verification failed",
        {
          description: getErrorMessage(
            error,
            "Invalid or expired OTP.",
          ),
        },
      );
    },
  });
};
