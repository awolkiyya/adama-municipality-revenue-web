import { useMutation } from "@tanstack/react-query";

import { authService } from "@/services/auth.service";

import { useDispatch } from "react-redux";
import { setAuth } from "@/lib/store/slices/user.slice";

import type { LoginResponse } from "@/types/user";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import Cookies from "js-cookie";

/*
|--------------------------------------------------------------------------
| OFFICE LOGIN
|--------------------------------------------------------------------------
|
| Successful authentication establishes:
|
|   app  = office
|   role = employee role
|
|--------------------------------------------------------------------------
*/

export const useLogin = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation<
    LoginResponse,
    any,
    {
      email: string;
      password: string;
    }
  >({

    mutationFn:
      authService.login,

    onSuccess: (res) => {

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | This login belongs to the OFFICE application.
      |
      |--------------------------------------------------------------------------
      */

      Cookies.set(
        "app",
        "office",
        {
          path: "/",
          sameSite: "lax",
        }
      );


      /*
      |--------------------------------------------------------------------------
      | Clear any stale citizen application state
      |--------------------------------------------------------------------------
      */

      /*
       * There is no separate citizen-role cookie,
       * so the important thing is that app is now
       * explicitly "office".
       */

      /*
      |--------------------------------------------------------------------------
      | Redux authentication state
      |--------------------------------------------------------------------------
      */

      dispatch(
        setAuth({
          user: res.user,
          token: res.access_token,
        })
      );

      /*
      |--------------------------------------------------------------------------
      | Success notification
      |--------------------------------------------------------------------------
      */

      toast.success(
        `Welcome back, ${res.user.name}!`,
        {
          description:
            "Login successful.",
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Navigate to office application
      |--------------------------------------------------------------------------
      */

      router.push(
        "/office/dashboard"
      );
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

  const router =
    useRouter();

  return useMutation<
    {
      message: string;
      expiresIn?: number;
    },
    any,
    {
      phone: string;
      type: string;
    }
  >({

    mutationFn:
      authService.sendOtp,

    onSuccess: (
      res,
      variables
    ) => {

      toast.success(
        "OTP sent successfully",
        {
          description:
            res.message ??
            "Check your phone for the verification code.",
        }
      );

      router.push(
        `/citizen/auth/verify-otp?phone=${encodeURIComponent(
          variables.phone
        )}`
      );
    },

    onError: (error) => {

      toast.error(
        "Failed to send OTP",
        {
          description:
            error?.message ??
            "Something went wrong. Please try again.",
        }
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
    {
      message: string;
      expiresIn?: number;
    },
    any,
    {
      phone: string;
      type: string;
    }
  >({

    mutationFn:
      authService.resendOtp,

    onSuccess: (res) => {

      toast.success(
        "OTP resent",
        {
          description:
            res.message ??
            "A new verification code has been sent to your phone.",
        }
      );
    },

    onError: (error) => {

      toast.error(
        "Failed to resend OTP",
        {
          description:
            error?.message ??
            "Something went wrong. Please try again.",
        }
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

  const dispatch =
    useDispatch();

  const router =
    useRouter();

  return useMutation<
    LoginResponse,
    any,
    {
      phone: string;
      otp: string;
      type: string;
    }
  >({

    mutationFn:
      authService.verifyOtp,

    onSuccess: (res) => {

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT: SWITCH APPLICATION
      |--------------------------------------------------------------------------
      |
      | The user may previously have been an office
      | employee in this browser.
      |
      | Therefore explicitly change:
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
        }
      );

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT: REMOVE EMPLOYEE ROLE
      |--------------------------------------------------------------------------
      |
      | A citizen must never inherit the previous
      | employee role from the browser.
      |
      |--------------------------------------------------------------------------
      */

      Cookies.remove(
        "role",
        {
          path: "/",
        }
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
        })
      );

      /*
      |--------------------------------------------------------------------------
      | Success notification
      |--------------------------------------------------------------------------
      */

      toast.success(
        "Login successful",
        {
          description:
            `Welcome, ${res.user.name}!`,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Navigate to citizen application
      |--------------------------------------------------------------------------
      */

      router.push(
        "/citizen/dashboard"
      );
    },

    onError: (error) => {

      toast.error(
        "OTP verification failed",
        {
          description:
            error?.message ??
            "Invalid or expired OTP.",
        }
      );
    },
  });
};