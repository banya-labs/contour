import "./lib/load-contour-env";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const passThrough = () => NextResponse.next();

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  void request;
  void event;
  return passThrough();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
