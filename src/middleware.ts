import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { CORRELATION_HEADER, getOrCreateCorrelationId } from "@/lib/correlation";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/sign-in",
  "/sign-up",
  "/privacy",
  "/terms",
  "/p/",
  "/kiosk",
  "/agent",
  "/upload/",
  "/api/auth/",
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
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
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
