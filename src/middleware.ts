import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTrialEnd, hasPaidSubscription, isTrialActive } from "@/lib/billing-access";
import { CORRELATION_HEADER, getOrCreateCorrelationId } from "@/lib/correlation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, roleHasPermission } from "@/lib/authorization";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/sign-in",
  "/sign-up",
  "/request-access/",
  "/privacy",
  "/terms",
  "/p/",
  "/upload/",
  "/api/auth/",
  "/api/access-requests/",
  "/api/health",
  "/api/ready",
  "/api/properties",
  "/api/inquiries",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_HEADER, correlationId);

  if (isPublicPath(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  }

  // Local manual testing uses the same demo tenant as the API handler. This
  // can never activate in production, even if the public flag is mis-set.
  const isFieldAgentSurface = request.nextUrl.pathname.startsWith("/agent") || request.nextUrl.pathname.startsWith("/kiosk");
  if (!isFieldAgentSurface && process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname);
    const response = NextResponse.redirect(signInUrl);
    response.headers.set(CORRELATION_HEADER, correlationId);
    return response;
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/agent") || pathname.startsWith("/kiosk") || pathname.startsWith("/dashboard")) {
    const tenant = await getTenantContext(request);
    const role = resolveContourRole(session.user.role ?? undefined, "member", tenant?.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
    const requiredPermission = pathname.startsWith("/agent") || pathname.startsWith("/kiosk") ? "pwa.access" : "dashboard.read";
    if (!tenant || !roleHasPermission(role, requiredPermission)) {
      const destination = pathname.startsWith("/dashboard") && roleHasPermission(role, "pwa.access") ? "/agent" : "/sign-in";
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set(CORRELATION_HEADER, correlationId);
      return response;
    }

    if (!pathname.startsWith("/dashboard/billing")) {
      const organization = await db.organization.findUnique({
        where: { id: tenant.organizationId },
        select: { createdAt: true, trialEndsAt: true, subscriptionStatus: true, lencoSubscriptionId: true },
      });
      const successfulPayment = await db.payment.findFirst({
        where: { organizationId: tenant.organizationId, status: "SUCCESS" },
        select: { id: true },
      });
      const trialEndsAt = organization?.trialEndsAt || (organization ? getTrialEnd(organization.createdAt) : null);
      const paid = hasPaidSubscription(organization?.subscriptionStatus, Boolean(successfulPayment) || Boolean(organization?.lencoSubscriptionId));
      const trialActive = !paid && isTrialActive(trialEndsAt);
      if (!paid && !trialActive) {
        const response = NextResponse.redirect(new URL("/dashboard/billing?required=1", request.url));
        response.headers.set(CORRELATION_HEADER, correlationId);
        return response;
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CORRELATION_HEADER, correlationId);
  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
