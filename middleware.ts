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
| ROUTE AREAS
|--------------------------------------------------------------------------
*/

const OFFICE_PREFIX = "/office";
const AGENT_PREFIX = "/agent";
const CITIZEN_PREFIX = "/citizen";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove locale from pathname.
 *
 * Examples:
 *
 * /or/office/dashboard
 *      ↓
 * /office/dashboard
 *
 * /en/citizen/profile
 *      ↓
 * /citizen/profile
 *
 * /am/agent/dashboard
 *      ↓
 * /agent/dashboard
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
 * Examples:
 *
 * /or/office/dashboard → or
 * /en/citizen/profile  → en
 * /am/agent/dashboard  → am
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
 * Citizen application.
 */
function isCitizenRoute(path: string): boolean {
  return (
    path === CITIZEN_PREFIX ||
    path.startsWith(`${CITIZEN_PREFIX}/`)
  );
}

/**
 * Determine whether the route belongs to the
 * Office application.
 */
function isOfficeRoute(path: string): boolean {
  return (
    path === OFFICE_PREFIX ||
    path.startsWith(`${OFFICE_PREFIX}/`)
  );
}

/**
 * Determine whether the route belongs to the
 * Agent application.
 */
function isAgentRoute(path: string): boolean {
  return (
    path === AGENT_PREFIX ||
    path.startsWith(`${AGENT_PREFIX}/`)
  );
}

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
|
| These routes do not require an authenticated session.
|
|--------------------------------------------------------------------------
*/

function isPublicRoute(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/office/auth/login") ||
    path.startsWith("/citizen/auth/login") ||
    path.startsWith("/citizen/auth/verify-otp") ||
    path.startsWith("/payment/result") ||
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
| OFFICE LOGIN
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
| CITIZEN LOGIN
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
| LARAVEL SESSION
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This only detects whether the browser appears to have
| a Laravel session cookie.
|
| It does NOT prove authentication.
|
| The Laravel API remains the source of truth for
| authentication.
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
  | Public routes are handled by next-intl.
  |
  |--------------------------------------------------------------------------
  */

  if (isPublicRoute(cleanPath)) {
    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 3. CITIZEN APPLICATION
  |--------------------------------------------------------------------------
  |
  | Middleware performs only a basic session-presence
  | check.
  |
  | It does NOT check:
  |
  |     - role
  |     - permission
  |     - user identity
  |     - resource ownership
  |     - business rules
  |
  | Those belong to the authenticated application and
  | Laravel backend.
  |
  |--------------------------------------------------------------------------
  */

  if (isCitizenRoute(cleanPath)) {

    /*
    |--------------------------------------------------------------------------
    | 3.1 SESSION REQUIRED
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
    | 3.2 PASS TO NEXT-INTL
    |--------------------------------------------------------------------------
    */

    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 4. OFFICE APPLICATION
  |--------------------------------------------------------------------------
  |
  | Office routes require an apparent Laravel session.
  |
  | IMPORTANT:
  |
  | No portal permission is checked here.
  |
  | The Office layout performs:
  |
  |     office.portal_access
  |
  | and, when necessary:
  |
  |     agent.portal_access
  |
  | Example:
  |
  |     Agent logs in
  |          ↓
  |     /office/dashboard
  |          ↓
  |     Office Layout
  |          ↓
  |     office.portal_access = false
  |          ↓
  |     agent.portal_access = true
  |          ↓
  |     /agent/dashboard
  |
  |--------------------------------------------------------------------------
  */

  if (isOfficeRoute(cleanPath)) {

    /*
    |--------------------------------------------------------------------------
    | 4.1 SESSION REQUIRED
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
    | 4.2 PASS TO NEXT-INTL
    |--------------------------------------------------------------------------
    */

    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 5. AGENT APPLICATION
  |--------------------------------------------------------------------------
  |
  | Agent routes require an apparent Laravel session.
  |
  | The Agent layout performs the actual frontend portal
  | permission check:
  |
  |     agent.portal_access
  |
  | Laravel additionally protects Agent APIs with:
  |
  |     permission:agent.portal_access
  |
  | No role check is performed here.
  |
  |--------------------------------------------------------------------------
  */

  if (isAgentRoute(cleanPath)) {

    /*
    |--------------------------------------------------------------------------
    | 5.1 SESSION REQUIRED
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
    | 5.2 PASS TO NEXT-INTL
    |--------------------------------------------------------------------------
    */

    return intlMiddleware(request);
  }

  /*
  |--------------------------------------------------------------------------
  | 6. UNKNOWN ROUTES
  |--------------------------------------------------------------------------
  |
  | Security-conscious default:
  |
  | Anything outside the known frontend route areas is
  | redirected to the localized unauthorized page.
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