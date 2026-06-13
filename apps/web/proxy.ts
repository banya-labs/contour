import "./lib/load-contour-env";
import { bootstrapContourClerkEnv } from "@contour/config";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authConfig = bootstrapContourClerkEnv();
const clerkKeysConfigured = authConfig.isConfigured;

const passThrough = () => NextResponse.next();

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (!clerkKeysConfigured) {
    return passThrough();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

  return clerkMiddleware(
    async (auth, authRequest) => {
      if (!isPublicRoute(authRequest)) {
        await auth.protect();
      }
    },
    {
      publishableKey: authConfig.publishableKey,
      secretKey: authConfig.secretKey,
    },
  )(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
