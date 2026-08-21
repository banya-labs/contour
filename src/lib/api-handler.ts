import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";
import { auth } from "./auth";
import { headers } from "next/headers";

export type ApiContext = {
  params?: Record<string, string | string[]>;
  session?: any;
  organizationId?: string;
  userId?: string;
  userRole?: string;
};

export type ApiHandlerOptions<TBody, TQuery> = {
  bodySchema?: z.ZodType<TBody>;
  querySchema?: z.ZodType<TQuery>;
  requireAuth?: boolean;
  requireRoles?: string[];
  handler: (
    req: NextRequest,
    context: ApiContext & { body: TBody; query: TQuery }
  ) => Promise<NextResponse | Response>;
};

export function createApiHandler<TBody = unknown, TQuery = unknown>(
  options: ApiHandlerOptions<TBody, TQuery>
) {
  return async (req: NextRequest, { params }: { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> } = {}) => {
    try {
      const resolvedParams = params instanceof Promise ? await params : params;
      let session: any = null;
      let organizationId: string | undefined = undefined;
      let userId: string | undefined = undefined;
      let userRole: string = "FIELD_AGENT";

      // Dev Mode Super Admin Bypass
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        organizationId = "org_contour_demo";
        userId = "user_demo_superadmin";
        userRole = "SUPER_ADMIN";
        session = {
          user: { id: userId, name: "Demo Principal Broker", email: "grace@contour.demo", role: userRole },
          session: { id: "sess_demo", organizationId },
        };
      } else {
        const reqHeaders = await headers();
        session = await auth.api.getSession({ headers: reqHeaders });
        if (options.requireAuth && !session) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session) {
          userId = session.user.id;
          organizationId = session.session?.organizationId || session.user.organizationId || "org_contour_demo";
          userRole = session.user.role || "FIELD_AGENT";
        }
      }

      if (!organizationId || organizationId === "org_demo_contour") {
        organizationId = "org_contour_demo";
      }

      if (options.requireRoles && options.requireRoles.length > 0 && !options.requireRoles.includes(userRole)) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }

      // Parse Query
      let query: any = {};
      if (options.querySchema) {
        const url = new URL(req.url);
        const rawQuery = Object.fromEntries(url.searchParams.entries());
        const parsed = options.querySchema.safeParse(rawQuery);
        if (!parsed.success) {
          return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.format() }, { status: 400 });
        }
        query = parsed.data;
      }

      // Parse Body
      let body: any = {};
      if (options.bodySchema && ["POST", "PUT", "PATCH"].includes(req.method)) {
        const json = await req.json().catch(() => ({}));
        const parsed = options.bodySchema.safeParse(json);
        if (!parsed.success) {
          return NextResponse.json({ error: "Invalid request payload", details: parsed.error.format() }, { status: 400 });
        }
        body = parsed.data;
      }

      return await options.handler(req, {
        params: resolvedParams,
        session,
        organizationId,
        userId,
        userRole,
        body,
        query,
      });
    } catch (error: any) {
      logger.error({ err: error, path: req.nextUrl?.pathname }, "Unhandled API error");
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
