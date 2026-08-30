import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

/*
|--------------------------------------------------------------------------
| NEXT-INTL
|--------------------------------------------------------------------------
*/

const intlMiddleware = createMiddleware({
  locales: ["en", "am", "or"],
  defaultLocale: "or",
});

/*
|--------------------------------------------------------------------------
| SUPPORTED LOCALES
|--------------------------------------------------------------------------
*/

const LOCALES = ["en", "am", "or"] as const;

type Locale = (typeof LOCALES)[number];

/*
|--------------------------------------------------------------------------
| APPLICATION TYPES
|--------------------------------------------------------------------------
*/

type Application = "office" | "citizen";

/*
|--------------------------------------------------------------------------
| ROUTE AREAS
|--------------------------------------------------------------------------
*/

const OFFICE_PREFIX = "/office";
const CITIZEN_PREFIX = "/citizen";

/*
|--------------------------------------------------------------------------
| APPLICATION COOKIE
|--------------------------------------------------------------------------
|
| This cookie identifies which frontend application
| the authenticated session belongs to.
|
| Values:
|
|     office
|     citizen
|
| IMPORTANT:
|
| This cookie is NOT a security boundary.
|
| It is only used to determine which frontend
| application the user is attempting to access.
|
| Laravel remains the real authentication and
| authorization authority.
|
|--------------------------------------------------------------------------
*/

const APPLICATION_COOKIE = "app";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove locale from pathname.
 *
 * Example:
 *
 * /or/office/dashboard
 *      ↓
 * /office/dashboard
 *
 * /en/citizen/profile
 *      ↓
 * /citizen/profile
 */
function stripLocale(pathname: string): string {
  const parts = pathname.split("/");

  if (LOCALES.includes(parts[1] as Locale)) {
    parts.splice(1, 1);
  }

  const path = parts.join("/");

  return path || "/";
}

/**
 * Get locale from pathname.
 *
 * Example:
 *
 * /or/office/dashboard → or
 * /en/citizen/profile  → en
 * /am/office/dashboard → am
 */
function getLocale(pathname: string): Locale {
  const firstSegment = pathname.split("/")[1];

  if (LOCALES.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return "or";
}

/**
 * Determine whether the route belongs to the
 * citizen application.
 */
function isCitizenRoute(path: string): boolean {
  return (
    path === CITIZEN_PREFIX ||
    path.startsWith(`${CITIZEN_PREFIX}/`)
  );
}

/**
 * Determine whether the route belongs to the
 * office application.
 */
function isOfficeRoute(path: string): boolean {
  return (
    path === OFFICE_PREFIX ||
    path.startsWith(`${OFFICE_PREFIX}/`)
  );
}

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
|
| These routes do not require authentication.
|
|--------------------------------------------------------------------------
*/

function isPublicRoute(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/office/auth/login") ||
    path.startsWith("/citizen/auth/login") ||
    path.startsWith("/citizen/auth/verify-otp") ||
    path.startsWith("/unauthorized")
  );
}

/*
|--------------------------------------------------------------------------
| REDIRECT TO LOCALIZED ROUTE
|--------------------------------------------------------------------------
*/

function redirectTo(
  request: NextRequest,
  locale: Locale,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();

  url.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(url);
}

/*
|--------------------------------------------------------------------------
| REDIRECT TO OFFICE LOGIN
|--------------------------------------------------------------------------
*/

function redirectToOfficeLogin(
  request: NextRequest,
  locale: Locale,
): NextResponse {
  return redirectTo(
    request,
    locale,
    "/office/auth/login",
  );
}

/*
|--------------------------------------------------------------------------
| REDIRECT TO CITIZEN LOGIN
|--------------------------------------------------------------------------
*/

function redirectToCitizenLogin(
  request: NextRequest,
  locale: Locale,
): NextResponse {
  return redirectTo(
    request,
    locale,
    "/citizen/auth/login",
  );
}

/*
|--------------------------------------------------------------------------
| LARAVEL SESSION COOKIE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is ONLY a frontend navigation signal.
|
| The existence of this cookie does NOT prove that
| Laravel considers the session authenticated.
|
| Laravel remains the actual authentication authority.
|
|--------------------------------------------------------------------------
*/

function hasLaravelSession(
  request: NextRequest,
): boolean {
  const sessionCookie =
    request.cookies.get("laravel-session") ??
    request.cookies.get("laravel_session");

  return Boolean(sessionCookie?.value);
}

/*
|--------------------------------------------------------------------------
| GET APPLICATION COOKIE
|--------------------------------------------------------------------------
|
| Returns:
|
|     office
|     citizen
|     null
|
|--------------------------------------------------------------------------
*/

function getApplication(
  request: NextRequest,
): Application | null {
  const value = request.cookies.get(
    APPLICATION_COOKIE,
  )?.value;

  if (value === "office" || value === "citizen") {
    return value;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

export function middleware(
  request: NextRequest,
): NextResponse {
  const { pathname } = request.nextUrl;

  /*
  |--------------------------------------------------------------------------
  | 1. NORMALIZE PATH
  |--------------------------------------------------------------------------
  */

  const cleanPath = stripLocale(pathname);

  const locale = getLocale(pathname);

  /*
  |--------------------------------------------------------------------------
  | 2. PUBLIC ROUTES
  |--------------------------------------------------------------------------
  |
  | Public routes are allowed through next-intl.
  |
  |--------------------------------------------------------------------------
  */

  if (isPublicRoute(cleanPath)) {
    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 3. APPLICATION
  |--------------------------------------------------------------------------
  */

  const application = getApplication(request);

  /*
  |--------------------------------------------------------------------------
  | 4. CITIZEN APPLICATION
  |--------------------------------------------------------------------------
  |
  | Citizen routes require:
  |
  |     1. Laravel session cookie
  |     2. app = citizen
  |
  | No role or permission is checked here.
  |
  | Laravel remains responsible for:
  |
  |     - authentication
  |     - citizen authorization
  |     - resource ownership
  |     - IDOR protection
  |     - business rules
  |
  |--------------------------------------------------------------------------
  */

  if (isCitizenRoute(cleanPath)) {
    /*
    |--------------------------------------------------------------------------
    | 4.1 NO SESSION
    |--------------------------------------------------------------------------
    */

    if (!hasLaravelSession(request)) {
      return redirectToCitizenLogin(
        request,
        locale,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4.2 WRONG APPLICATION
    |--------------------------------------------------------------------------
    |
    | An office session must not enter the citizen
    | frontend application.
    |
    |--------------------------------------------------------------------------
    */

    if (application !== "citizen") {
      return redirectTo(
        request,
        locale,
        "/unauthorized",
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4.3 AUTHENTICATED CITIZEN FRONTEND
    |--------------------------------------------------------------------------
    */

    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 5. OFFICE APPLICATION
  |--------------------------------------------------------------------------
  |
  | Office routes require:
  |
  |     1. Laravel session cookie
  |     2. app = office
  |
  | IMPORTANT:
  |
  | There is NO role check here.
  |
  | There is NO permission check here.
  |
  | The frontend permission system should control
  | navigation visibility.
  |
  | Laravel MUST enforce the actual permissions
  | on every protected API operation.
  |
  |--------------------------------------------------------------------------
  */

  if (isOfficeRoute(cleanPath)) {
    /*
    |--------------------------------------------------------------------------
    | 5.1 NO SESSION
    |--------------------------------------------------------------------------
    */

    if (!hasLaravelSession(request)) {
      return redirectToOfficeLogin(
        request,
        locale,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 5.2 WRONG APPLICATION
    |--------------------------------------------------------------------------
    |
    | A citizen session must not enter the office
    | frontend application.
    |
    |--------------------------------------------------------------------------
    */

    if (application !== "office") {
      return redirectTo(
        request,
        locale,
        "/unauthorized",
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 5.3 AUTHENTICATED OFFICE FRONTEND
    |--------------------------------------------------------------------------
    |
    | No role check.
    |
    | No permission check.
    |
    | Permission authorization is handled by the
    | application/backend architecture.
    |
    |--------------------------------------------------------------------------
    */

    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 6. UNKNOWN ROUTES
  |--------------------------------------------------------------------------
  |
  | Security default:
  |
  | Anything outside:
  |
  |     /
  |     /office/*
  |     /citizen/*
  |
  | is redirected to unauthorized.
  |
  |--------------------------------------------------------------------------
  */

  return redirectTo(
    request,
    locale,
    "/unauthorized",
  );
}

/*
|--------------------------------------------------------------------------
| MATCHER
|--------------------------------------------------------------------------
|
| Middleware processes frontend pages only.
|
| Excluded:
|
|     /api/*
|     /sanctum/*
|     /ai/api/*
|     /auth/api/*
|     /_next/*
|     static files
|
|--------------------------------------------------------------------------
*/

export const config = {
  matcher: [
    "/((?!api|sanctum|ai/api|_next|.*\\..*|auth/api).*)",
  ],
};
