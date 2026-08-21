import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";

export interface DifyTenantContext {
  organizationId: string;
  userId?: string;
  userRole?: string;
  apiKeyName?: string;
}

/**
 * Authenticates an incoming Dify Agent Tool request and resolves the tenant context.
 * 
 * Supports:
 * 1. Bearer API Key from Contour's `ApiKey` table in Neon PostgreSQL.
 * 2. Master System Secret `DIFY_TOOL_SECRET` + `X-Organization-Id` header / body param.
 * 3. Dev / Local demo fallback (`org_demo_contour`).
 */
export async function authenticateDifyRequest(
  req: NextRequest,
  bodyOrQueryOrgId?: string
): Promise<{ context: DifyTenantContext | null; errorResponse: NextResponse | null }> {
  try {
    const authHeader = req.headers.get("authorization");
    const headerOrgId = req.headers.get("x-organization-id");
    const targetOrgId = bodyOrQueryOrgId || headerOrgId;

    // 1. Dev Mode Bypass (when no auth header provided)
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true" && !authHeader) {
      return {
        context: {
          organizationId: targetOrgId || "org_contour_demo",
          userId: "user_demo_broker",
          userRole: "SUPER_ADMIN",
          apiKeyName: "Dev Mode Local Key",
        },
        errorResponse: null,
      };
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // In dev mode, allow fallback
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        return {
          context: {
            organizationId: targetOrgId || "org_contour_demo",
            userId: "user_demo_broker",
            userRole: "SUPER_ADMIN",
          },
          errorResponse: null,
        };
      }

      return {
        context: null,
        errorResponse: NextResponse.json(
          { error: "Unauthorized: Missing or malformed Bearer Token" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 2. Master Dify Tool Secret Validation (Configured in Dokploy / .env)
    const masterSecret = process.env.DIFY_TOOL_SECRET || process.env.BETTER_AUTH_SECRET;
    if (masterSecret && token === masterSecret) {
      if (!targetOrgId) {
        return {
          context: null,
          errorResponse: NextResponse.json(
            { error: "Missing required 'organization_id' parameter or 'X-Organization-Id' header for master token authentication" },
            { status: 400 }
          ),
        };
      }

      return {
        context: {
          organizationId: targetOrgId,
          userId: "dify_agent_master",
          userRole: "AGENT_RUNTIME",
          apiKeyName: "Dify Master Service Key",
        },
        errorResponse: null,
      };
    }

    // 3. Database ApiKey Lookup in Neon PostgreSQL
    try {
      const apiKeyRecord = await db.apiKey.findUnique({
        where: { key: token },
        include: { organization: true, user: true },
      });

      if (!apiKeyRecord) {
        return {
          context: null,
          errorResponse: NextResponse.json(
            { error: "Unauthorized: Invalid API Key" },
            { status: 401 }
          ),
        };
      }

      if (apiKeyRecord.status === "revoked") {
        return {
          context: null,
          errorResponse: NextResponse.json(
            { error: "Forbidden: API Key has been revoked" },
            { status: 403 }
          ),
        };
      }

      // Update lastUsedAt asynchronously in Neon
      db.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      }).catch((e) => console.warn("Failed to update apiKey lastUsedAt:", e));

      return {
        context: {
          organizationId: apiKeyRecord.organizationId,
          userId: apiKeyRecord.userId,
          userRole: apiKeyRecord.user.role || "FIELD_AGENT",
          apiKeyName: apiKeyRecord.name,
        },
        errorResponse: null,
      };
    } catch (dbErr) {
      // If DB is offline during local test, fallback in dev mode
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        return {
          context: {
            organizationId: targetOrgId || "org_contour_demo",
            userId: "user_demo_broker",
            userRole: "SUPER_ADMIN",
          },
          errorResponse: null,
        };
      }
      throw dbErr;
    }
  } catch (error: any) {
    console.error("Dify Auth Verification Error:", error);
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Authentication verification failed", details: error.message },
        { status: 500 }
      ),
    };
  }
}
