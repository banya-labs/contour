import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";
import { getTenantContext, type TenantContext } from "./tenant-context";
import { hasRequiredRole } from "./authorization";
import type { Session } from "./auth";

export type ApiContext = {
  params?: Record<string, string | string[]>;
  session?: import("./auth").Session;
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
  return async (req: NextRequest, context?: any) => {
    try {
      const params = context?.params;
      const resolvedParams = params instanceof Promise ? await params : params;
      const isLocalDevelopment =
        process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true";
      const demoTenant: TenantContext = {
        session: {
          user: {
            id: "user_demo_superadmin",
            name: "Demo Principal Broker",
            email: "grace@contour.demo",
            role: "SUPER_ADMIN",
          },
          session: {
            id: "sess_demo",
            activeOrganizationId: "org_contour_demo",
          },
        } as unknown as Session,
        userId: "user_demo_superadmin",
        organizationId: "org_contour_demo",
        userRole: "SUPER_ADMIN",
      };
      const tenant = isLocalDevelopment ? demoTenant : await getTenantContext(req);

      // API handlers are protected by default. Public endpoints should use a
      // dedicated handler so authentication is never accidentally omitted.
      if (options.requireAuth !== false && !tenant) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (options.requireAuth !== false && tenant === null) {
        return NextResponse.json(
          { error: "Organization context required", code: "ORGANIZATION_CONTEXT_REQUIRED" },
          { status: 403 }
        );
      }

      const session = tenant?.session;
      const organizationId = tenant?.organizationId;
      const userId = tenant?.userId;
      const userRole = tenant?.userRole || "FIELD_AGENT";

      if (options.requireRoles && options.requireRoles.length > 0 && !hasRequiredRole(userRole, options.requireRoles)) {
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
    } catch (error: unknown) {
      logger.error({ err: error, path: req.nextUrl?.pathname }, "Unhandled API error");
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
