import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { normalizeApiError } from "./api-error";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type RetryableRequestConfig =
  InternalAxiosRequestConfig & {
    _csrfRetry?: boolean;
  };

/*
|--------------------------------------------------------------------------
| SUPPORTED LOCALES
|--------------------------------------------------------------------------
*/

const SUPPORTED_LOCALES = [
  "en",
  "am",
  "or",
] as const;

type Locale = (typeof SUPPORTED_LOCALES)[number];

/*
|--------------------------------------------------------------------------
| ROUTE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Get locale from current browser pathname.
 *
 * Examples:
 *
 * /or/office/dashboard
 * /en/citizen/profile
 * /am/citizen/dashboard
 */
const getCurrentLocale = (): Locale => {
  if (typeof window === "undefined") {
    return "or";
  }

  const segments = window.location.pathname
    .split("/")
    .filter(Boolean);

  const firstSegment = segments[0];

  if (
    SUPPORTED_LOCALES.includes(
      firstSegment as Locale
    )
  ) {
    return firstSegment as Locale;
  }

  return "or";
};

/**
 * Remove locale from current pathname.
 *
 * /en/office/dashboard
 *        ↓
 * /office/dashboard
 */
const getCleanPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  const pathname =
    window.location.pathname;

  const locale =
    getCurrentLocale();

  if (
    pathname === `/${locale}`
  ) {
    return "/";
  }

  if (
    pathname.startsWith(
      `/${locale}/`
    )
  ) {
    return (
      pathname.substring(
        `/${locale}`.length
      ) || "/"
    );
  }

  return pathname;
};

/*
|--------------------------------------------------------------------------
| OFFICE ROUTE
|--------------------------------------------------------------------------
*/

const isOfficeRoute = (): boolean => {
  const path = getCleanPath();

  return (
    path === "/office" ||
    path.startsWith("/office/")
  );
};

/*
|--------------------------------------------------------------------------
| CITIZEN ROUTE
|--------------------------------------------------------------------------
*/

const isCitizenRoute = (): boolean => {
  const path = getCleanPath();

  return (
    path === "/citizen" ||
    path.startsWith("/citizen/")
  );
};

/*
|--------------------------------------------------------------------------
| OFFICE LOGIN PAGE
|--------------------------------------------------------------------------
*/

const isOfficeLoginPage = (): boolean => {
  const path = getCleanPath();

  return (
    path === "/office/auth/login" ||
    path.startsWith(
      "/office/auth/login/"
    )
  );
};

/*
|--------------------------------------------------------------------------
| CITIZEN LOGIN PAGE
|--------------------------------------------------------------------------
*/

const isCitizenLoginPage = (): boolean => {
  const path = getCleanPath();

  return (
    path === "/citizen/auth/login" ||
    path.startsWith(
      "/citizen/auth/login/"
    )
  );
};

/*
|--------------------------------------------------------------------------
| ANY LOGIN PAGE
|--------------------------------------------------------------------------
*/

const isLoginPage = (): boolean => {
  return (
    isOfficeLoginPage() ||
    isCitizenLoginPage()
  );
};

/*
|--------------------------------------------------------------------------
| AUTH ENDPOINT
|--------------------------------------------------------------------------
*/

const isAuthEndpoint = (
  requestUrl: string
): boolean => {

  return (
    requestUrl.includes(
      "/auth/login"
    ) ||
    requestUrl.includes(
      "/auth/logout"
    )
  );
};

/*
|--------------------------------------------------------------------------
| BUILD LOGIN URL
|--------------------------------------------------------------------------
*/

const buildLoginUrl = (
  locale: Locale,
  application: "office" | "citizen",
  returnUrl: string
): string => {

  const loginPath =
    application === "office"
      ? `/${locale}/office/auth/login`
      : `/${locale}/citizen/auth/login`;

  return (
    `${loginPath}?redirect=` +
    encodeURIComponent(returnUrl)
  );
};

/*
|--------------------------------------------------------------------------
| DETERMINE APPLICATION
|--------------------------------------------------------------------------
*/

const getApplication = ():
  | "office"
  | "citizen"
  | null => {

  if (isOfficeRoute()) {
    return "office";
  }

  if (isCitizenRoute()) {
    return "citizen";
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| LARAVEL API CLIENT
|--------------------------------------------------------------------------
|
| Authentication:
|
|   Laravel Sanctum SPA authentication
|
| Credentials:
|
|   XSRF-TOKEN
|   laravel-session
|
|--------------------------------------------------------------------------
*/

export const api = axios.create({

  /*
  |--------------------------------------------------------------------------
  | Laravel API
  |--------------------------------------------------------------------------
  */

  baseURL: "/api",

  /*
  |--------------------------------------------------------------------------
  | Send browser cookies
  |--------------------------------------------------------------------------
  */

  withCredentials: true,

  /*
  |--------------------------------------------------------------------------
  | Axios / Laravel XSRF
  |--------------------------------------------------------------------------
  */

  withXSRFToken: true,

  xsrfCookieName: "XSRF-TOKEN",

  xsrfHeaderName: "X-XSRF-TOKEN",

});

/*
|--------------------------------------------------------------------------
| SANCTUM CLIENT
|--------------------------------------------------------------------------
|
| Used for:
|
|   GET /sanctum/csrf-cookie
|
|--------------------------------------------------------------------------
*/

const sanctum = axios.create({

  baseURL: "/",

  withCredentials: true,

  withXSRFToken: true,

  xsrfCookieName: "XSRF-TOKEN",

  xsrfHeaderName: "X-XSRF-TOKEN",

  headers: {
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| CSRF STATE
|--------------------------------------------------------------------------
*/

let csrfInitialized = false;

let csrfPromise: Promise<void> | null = null;

/*
|--------------------------------------------------------------------------
| READ XSRF TOKEN
|--------------------------------------------------------------------------
*/

const getXsrfToken = (): string | null => {

  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  const cookie =
    document.cookie
      .split("; ")
      .find(
        (row) =>
          row.startsWith(
            "XSRF-TOKEN="
          )
      );

  if (!cookie) {
    return null;
  }

  const value =
    cookie.substring(
      "XSRF-TOKEN=".length
    );

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/*
|--------------------------------------------------------------------------
| INITIALIZE CSRF
|--------------------------------------------------------------------------
*/

export const initializeCsrf =
  async (): Promise<void> => {

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Already initialized
    |--------------------------------------------------------------------------
    */

    if (csrfInitialized) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Existing initialization
    |--------------------------------------------------------------------------
    */

    if (csrfPromise) {
      return csrfPromise;
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize
    |--------------------------------------------------------------------------
    */

    csrfPromise =
      (async () => {

        try {

          await sanctum.get(
            "/sanctum/csrf-cookie"
          );

          const token =
            getXsrfToken();

          if (!token) {

            console.error(
              "Sanctum CSRF initialization succeeded, but XSRF-TOKEN cookie was not found."
            );

            throw new Error(
              "XSRF-TOKEN cookie was not received from Laravel."
            );
          }

          csrfInitialized = true;

          console.debug(
            "Sanctum CSRF initialized successfully."
          );

        } catch (error) {

          csrfInitialized = false;

          throw error;

        } finally {

          csrfPromise = null;
        }

      })();

    return csrfPromise;
  };

/*
|--------------------------------------------------------------------------
| RESET CSRF STATE
|--------------------------------------------------------------------------
*/

export const resetCsrf = (): void => {
  csrfInitialized = false;
};

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(

  async (
    config: InternalAxiosRequestConfig
  ) => {

    /*
    |--------------------------------------------------------------------------
    | Never send Bearer authentication from web client
    |--------------------------------------------------------------------------
    */

    if (
      config.headers?.has(
        "Authorization"
      )
    ) {

      config.headers.delete(
        "Authorization"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Browser only
    |--------------------------------------------------------------------------
    */

    if (
      typeof window !== "undefined"
    ) {

      const method =
        config.method?.toLowerCase();

      const requiresCsrf =
        method === "post" ||
        method === "put" ||
        method === "patch" ||
        method === "delete";

      /*
      |--------------------------------------------------------------------------
      | Initialize CSRF
      |--------------------------------------------------------------------------
      */

      if (requiresCsrf) {

        await initializeCsrf();

        const xsrfToken =
          getXsrfToken();

        if (xsrfToken) {

          config.headers.set(
            "X-XSRF-TOKEN",
            xsrfToken
          );

        } else {

          console.warn(
            "XSRF-TOKEN cookie is missing before state-changing request.",
            {
              method,
              url: config.url,
            }
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Debug
    |--------------------------------------------------------------------------
    */

    if (
      typeof window !== "undefined"
    ) {

      console.debug(
        "API REQUEST",
        {
          method:
            config.method?.toUpperCase(),

          url:
            `${config.baseURL ?? ""}${config.url ?? ""}`,

          withCredentials:
            config.withCredentials,

          hasXsrfHeader:
            config.headers.has(
              "X-XSRF-TOKEN"
            ),

          hasAuthorization:
            config.headers.has(
              "Authorization"
            ),
        }
      );
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  (response) => {
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  async (
    error: AxiosError
  ) => {

    const status =
      error.response?.status;

    /*
    |--------------------------------------------------------------------------
    | 419 — CSRF FAILURE
    |--------------------------------------------------------------------------
    */

    if (status === 419) {

      const originalRequest =
        error.config as
          | RetryableRequestConfig
          | undefined;

      /*
      |--------------------------------------------------------------------------
      | Retry only once
      |--------------------------------------------------------------------------
      */

      if (
        originalRequest &&
        !originalRequest._csrfRetry
      ) {

        originalRequest._csrfRetry = true;

        try {

          /*
          |--------------------------------------------------------------------------
          | Reset old CSRF state
          |--------------------------------------------------------------------------
          */

          resetCsrf();

          /*
          |--------------------------------------------------------------------------
          | Get fresh CSRF cookie
          |--------------------------------------------------------------------------
          */

          await initializeCsrf();

          /*
          |--------------------------------------------------------------------------
          | Get fresh token
          |--------------------------------------------------------------------------
          */

          const xsrfToken =
            getXsrfToken();

          /*
          |--------------------------------------------------------------------------
          | Attach fresh token
          |--------------------------------------------------------------------------
          */

          if (
            xsrfToken &&
            originalRequest.headers
          ) {

            originalRequest.headers.set(
              "X-XSRF-TOKEN",
              xsrfToken
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Retry original request
          |--------------------------------------------------------------------------
          */

          return api(
            originalRequest
          );

        } catch (csrfError) {

          return Promise.reject(
            normalizeApiError(
              csrfError
            )
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 401 — UNAUTHENTICATED
    |--------------------------------------------------------------------------
    |
    | Laravel Sanctum is the source of truth.
    |
    | 401 means:
    |
    |   The current session is no longer authenticated.
    |
    | We determine whether the user was using:
    |
    |   OFFICE
    |
    | or:
    |
    |   CITIZEN
    |
    | and redirect accordingly.
    |--------------------------------------------------------------------------
    */

    if (status === 401) {

      if (
        typeof window !== "undefined"
      ) {

        const currentPath =
          window.location.pathname;

        const currentSearch =
          window.location.search;

        const requestUrl =
          error.config?.url ?? "";

        /*
        |--------------------------------------------------------------------------
        | Never redirect from login pages
        |--------------------------------------------------------------------------
        */

        const alreadyOnLogin =
          isLoginPage();

        /*
        |--------------------------------------------------------------------------
        | Never redirect failed authentication endpoints
        |--------------------------------------------------------------------------
        */

        const authenticationRequest =
          isAuthEndpoint(
            requestUrl
          );

        /*
        |--------------------------------------------------------------------------
        | Determine application
        |--------------------------------------------------------------------------
        */

        const application =
          getApplication();

        /*
        |--------------------------------------------------------------------------
        | Only redirect if:
        |
        | 1. Not already on login
        | 2. Not login/logout request
        | 3. Current page belongs to an application
        |--------------------------------------------------------------------------
        */

        if (
          !alreadyOnLogin &&
          !authenticationRequest &&
          application
        ) {

          /*
          |--------------------------------------------------------------------------
          | Preserve current page
          |--------------------------------------------------------------------------
          */

          const returnUrl =
            currentPath +
            currentSearch;

          /*
          |--------------------------------------------------------------------------
          | Preserve current locale
          |--------------------------------------------------------------------------
          */

          const locale =
            getCurrentLocale();

          /*
          |--------------------------------------------------------------------------
          | Build correct login URL
          |--------------------------------------------------------------------------
          */

          const loginUrl =
            buildLoginUrl(
              locale,
              application,
              returnUrl
            );

          /*
          |--------------------------------------------------------------------------
          | Reset CSRF state
          |--------------------------------------------------------------------------
          */

          resetCsrf();

          /*
          |--------------------------------------------------------------------------
          | Debug
          |--------------------------------------------------------------------------
          */

          console.warn(
            "Laravel session is no longer authenticated.",
            {
              status,
              requestUrl,
              currentPath,
              locale,
              application,
              loginUrl,
            }
          );

          /*
          |--------------------------------------------------------------------------
          | Redirect
          |--------------------------------------------------------------------------
          */

          window.location.replace(
            loginUrl
          );

          /*
          |--------------------------------------------------------------------------
          | Stop processing
          |--------------------------------------------------------------------------
          */

          return Promise.reject(
            normalizeApiError(
              error
            )
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ERROR
    |--------------------------------------------------------------------------
    */

    return Promise.reject(
      normalizeApiError(
        error
      )
    );
  }
);