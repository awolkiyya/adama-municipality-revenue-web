import { api, initializeCsrf } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import { SingleResponse } from "@/types/api";
import type { LoginResponse } from "@/types/user";

/**
 * authService
 *
 * WEB authentication API layer.
 *
 * Authentication mechanism:
 *
 *     Laravel Sanctum Stateful Session Authentication
 *
 * The browser receives:
 *
 *     laravel_session
 *     XSRF-TOKEN
 *
 * Axios automatically sends the session cookie because
 * `withCredentials: true` is enabled in api.ts.
 *
 * Axios also sends the X-XSRF-TOKEN header after
 * initializeCsrf() has established the XSRF-TOKEN cookie.
 *
 * No access token is stored in localStorage.
 */
export const authService = {
  /* =========================================================
     WEB EMPLOYEE LOGIN
     ========================================================= */

  login: async (data: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    try {
      // Initialize Laravel CSRF protection before
      // the state-changing authentication request.
      await initializeCsrf();

      const res = await api.post<
        SingleResponse<LoginResponse>
      >(
        "/auth/web-login",
        data
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     WEB CITIZEN SEND OTP
     ========================================================= */

  sendOtp: async (data: {
    phone: string;
    type: string;
  }) => {
    try {
      // Required for Laravel stateful web POST request.
      await initializeCsrf();

      const res = await api.post<
        SingleResponse<{
          expiresIn?: number;
        }>
      >(
        "/auth/web-otp/send",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     WEB CITIZEN RESEND OTP
     ========================================================= */

  resendOtp: async (data: {
    phone: string;
    type: string;
  }) => {
    try {
      // Required for Laravel stateful web POST request.
      await initializeCsrf();

      const res = await api.post<
        SingleResponse<{
          expiresIn?: number;
        }>
      >(
        "/auth/web-otp/resend",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     WEB CITIZEN VERIFY OTP
     ========================================================= */

  verifyOtp: async (data: {
    phone: string;
    otp: string;
    type: string;
  }): Promise<LoginResponse> => {
    try {
      // Initialize CSRF before the request that
      // authenticates the citizen and creates the session.
      await initializeCsrf();

      const res = await api.post<
        SingleResponse<LoginResponse>
      >(
        "/auth/web-otp/verify",
        data
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     CURRENT WEB USER
     ========================================================= */

  me: async (): Promise<
    SingleResponse<LoginResponse>
  > => {
    try {
      // GET request; CSRF initialization is not required.
      const res = await api.get<
        SingleResponse<LoginResponse>
      >(
        "/auth/web-me"
      );

      console.log(
        "Current authenticated web user =",
        res.data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     WEB LOGOUT
     ========================================================= */

  logout: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      // The user already has an authenticated session and
      // XSRF-TOKEN should already exist.
      const res = await api.post<
        SingleResponse<null>
      >(
        "/auth/web-logout"
      );

      return {
        success: res.data.success,
        message: res.data.message,
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     UPDATE PASSWORD
     ========================================================= */

  updatePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => {
    try {
      const res = await api.post<
        SingleResponse<null>
      >(
        "/auth/update-password",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =========================================================
     UPDATE PROFILE
     ========================================================= */

  updateProfile: async (data: {
    name: string;
    email: string;
  }) => {
    try {
      const res = await api.put<
        SingleResponse<LoginResponse>
      >(
        "/auth/update-profile",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};