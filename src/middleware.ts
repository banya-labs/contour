import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingAccessState, getTrialEnd } from "@/lib/billing-access";
import { CORRELATION_HEADER, getOrCreateCorrelationId } from "@/lib/correlation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, roleHasPermission } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getControlPlaneAccessDestination, hasControlPlaneAccess, hasPersistedControlPlaneAccess } from "@/lib/control-plane";
import { toAuthHeaders } from "@/lib/auth-headers";

const PUBLIC_PATHS = [
  "/login",
  "/sign-in",
  "/sign-up",
  "/home",
  "/accept-invitation",
  "/request-access/",
  "/privacy",
  "/terms",
  "/account-locked",
  "/cookies",
  "/sitemap.xml",
  "/robots.txt",
  "/p/",
  "/map",
  "/upload/",
  "/api/auth/",
  "/api/access-requests/",
  "/api/organization/invitations/claim",
  "/api/health",
  "/api/ready",
  "/api/properties",
  "/api/inquiries",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  // Zero-touch bypass for binary & multipart upload endpoints to prevent stream proxy corruption
  if (
    request.nextUrl.pathname === "/api/properties/upload-image" ||
    request.nextUrl.pathname === "/api/storage/upload"
  ) {
    return NextResponse.next();
  }

  const correlationId = getOrCreateCorrelationId(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_HEADER, correlationId);

  const createForwardResponse = () => {
    const isMultipart = (request.headers.get("content-type") || "").toLowerCase().includes("multipart/form-data");
    const response = isMultipart
      ? NextResponse.next()
      : NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  };

  // Fix 2: Rate-limit login attempts BEFORE the public-path bypass.
  // /api/auth/ is public for cookie handling, but brute-force on sign-in must be throttled.
  if (
    request.nextUrl.pathname === "/api/auth/sign-in/email" ||
    request.nextUrl.pathname === "/api/auth/sign-in/social"
  ) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    const result = await checkRateLimit(`login:ip:${ip}`, 10, 60); // 10 attempts / 60s
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.resetSeconds),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  if (request.nextUrl.pathname === "/agent/kiosk" || request.nextUrl.pathname === "/kiosk/agent") {
    const canonicalUrl = new URL("/agent", request.url);
    canonicalUrl.search = request.nextUrl.search;
    return NextResponse.redirect(canonicalUrl);
  }

  // Intercept root "/" to handle authenticated session restoration
  if (request.nextUrl.pathname === "/") {
    const session = await auth.api.getSession({
      headers: toAuthHeaders(request.headers),
    });

    if (session?.user) {
      // User is already logged in: restore last visited page
      const lastPage = request.cookies.get("contour_last_page")?.value;
      const isValidLastPage =
        lastPage &&
        (lastPage.startsWith("/dashboard") || lastPage.startsWith("/agent") || lastPage.startsWith("/kiosk")) &&
        !lastPage.startsWith("/sign-in") &&
        !lastPage.startsWith("/login");

      if (isValidLastPage) {
        const redirectUrl = new URL(lastPage, request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }

      // No previous page saved: route based on role
      const tenant = await getTenantContext(request);
      const role = tenant?.contourRole || resolveContourRole(session.user.role ?? undefined, "member", tenant?.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
      const destination = roleHasPermission(role, "dashboard.read") ? "/dashboard" : "/agent";
      const redirectUrl = new URL(destination, request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    // Unauthenticated: redirect to sign-in. Marketing page is at /home.
    const signInUrl = new URL("/sign-in", request.url);
    const response = NextResponse.redirect(signInUrl);
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  }


  if (isPublicPath(request.nextUrl.pathname)) {
    return createForwardResponse();
  }

  const session = await auth.api.getSession({
    headers: toAuthHeaders(request.headers),
  });
  const pathname = request.nextUrl.pathname;
  const impersonationId = request.cookies.get("contour_impersonation")?.value;

  const allowedImpersonationApi = pathname === "/api/admin/support-access/current" || pathname === "/api/admin/support-access/current/exit" || /^\/api\/admin\/support-access\/[^/]+\/impersonate$/.test(pathname);
  if (impersonationId && ((pathname === "/admin" || pathname.startsWith("/admin/")) && !pathname.startsWith("/admin/support-access/")) || (impersonationId && pathname.startsWith("/api/admin/") && !allowedImpersonationApi)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session) {
    // The control plane must always authenticate, even when local demo mode
    // bypasses tenant-scoped dashboard authentication.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", pathname);
      const response = NextResponse.redirect(signInUrl);
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    // Allow unauthenticated demo bypass if dev mode is enabled and no session exists
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      return createForwardResponse();
    }

    const signInUrl = new URL("/sign-in", request.url);
    const targetPath = request.nextUrl.pathname === "/agent/kiosk" || request.nextUrl.pathname === "/kiosk/agent" ? "/agent" : request.nextUrl.pathname;
    signInUrl.searchParams.set("redirect_url", targetPath);
    const response = NextResponse.redirect(signInUrl);
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const persistedStaff = await hasPersistedControlPlaneAccess(session.user.id);
    const destination = getControlPlaneAccessDestination(true, hasControlPlaneAccess(session.user.email, persistedStaff));
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }
  if (pathname.startsWith("/agent") || pathname.startsWith("/kiosk") || pathname.startsWith("/dashboard")) {
    const tenant = await getTenantContext(request);
    const role = tenant?.contourRole || resolveContourRole(session.user.role ?? undefined, "member", tenant?.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
    const requiredPermission = pathname.startsWith("/agent") || pathname.startsWith("/kiosk") ? "pwa.access" : "dashboard.read";
    if (!tenant || !roleHasPermission(role, requiredPermission)) {
      if (!tenant) {
        const onboardingUrl = new URL("/onboarding", request.url);
        onboardingUrl.searchParams.set("redirect_url", pathname);
        onboardingUrl.searchParams.set("notice", "no_organization");
        const response = NextResponse.redirect(onboardingUrl);
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }
      const destination = pathname.startsWith("/dashboard") && roleHasPermission(role, "pwa.access") ? "/agent" : "/sign-in";
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    if (!pathname.startsWith("/dashboard/billing")) {
      const organization = await db.organization.findUnique({
        where: { id: tenant.organizationId },
        select: { createdAt: true, trialEndsAt: true, subscriptionStatus: true, lencoSubscriptionId: true, accountStatus: true },
      });
      if (organization?.accountStatus && organization.accountStatus !== "ACTIVE") {
        const response = NextResponse.redirect(new URL(`/account-locked?status=${organization.accountStatus}`, request.url));
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }
      const successfulPayment = await db.payment.findFirst({
        where: { organizationId: tenant.organizationId, status: "SUCCESS" },
        select: { id: true },
      });
      const trialEndsAt = organization?.trialEndsAt || (organization ? getTrialEnd(organization.createdAt) : null);
      const accessState = getBillingAccessState({ subscriptionStatus: organization?.subscriptionStatus, trialEndsAt, hasSuccessfulPayment: Boolean(successfulPayment) || Boolean(organization?.lencoSubscriptionId) });
      if (accessState === "TRIAL_EXPIRED") {
        const response = NextResponse.redirect(new URL("/dashboard/billing?required=1", request.url));
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }
    }
  }

  const response = createForwardResponse();

  // Track last visited application path for seamless session restoration
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/agent") || pathname.startsWith("/kiosk")) &&
    !pathname.startsWith("/dashboard/billing")
  ) {
    response.cookies.set("contour_last_page", pathname, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30-day persistence
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next|api/properties/upload-image|api/storage/upload|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
