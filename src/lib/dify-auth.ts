import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { effectivePermissionsForMember, resolveApplicationRole, resolveContourRole, PERMISSIONS, type Permission } from "./authorization";
import { canUseMachineOperation, isMachineOperation, type MachineOperation } from "./machine-permissions";
import { createHash, timingSafeEqual } from "node:crypto";
import { checkRateLimit } from "./rate-limiter";
import { assertVaultAccess, tenantVaultLocator, VaultSecurityError } from "./storage/vault-security";

export interface DifyTenantContext {
  organizationId: string;
  userId?: string;
  userRole?: string;
  apiKeyName?: string;
  contourRole: string;
  permissions: readonly Permission[];
  principal: "user" | "service" | "development";
}

export async function assertMachineDocumentAccess(context: DifyTenantContext, document: { organizationId: string; propertyId: string | null; objectKey: string }) {
  const locator = tenantVaultLocator(context.organizationId, document.objectKey, true);
  if (locator.kind !== "s3") throw new VaultSecurityError("Document is unavailable through machine storage", 403);
  const actor = { ...context, userId: context.userId || "machine_service" };
  await assertVaultAccess(actor, document, "read");
  await assertVaultAccess(actor, document, "download");
}

export async function machineVisibleDocuments<T extends { organizationId: string; propertyId: string | null; objectKey: string }>(context: DifyTenantContext, documents: readonly T[]): Promise<T[]> {
  const visible: T[] = [];
  for (const document of documents) {
    try {
      await assertMachineDocumentAccess(context, document);
      visible.push(document);
    } catch (error) {
      if (!(error instanceof VaultSecurityError) || ![400, 403, 404].includes(error.status)) throw error;
    }
  }
  return visible;
}

async function directToolRateLimit(req: NextRequest, organizationId?: string): Promise<NextResponse | null> {
  if (!req.nextUrl.pathname.startsWith("/api/dify/tools/")) return null;
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "").trim();
  const checks: Array<[string, number]> = organizationId
    ? [[`mcp:key:${createHash("sha256").update(token || "anonymous_dev").digest("hex").slice(0, 16)}`, 60], [`mcp:org:${organizationId}`, 120]]
    : [[`mcp:ip:${ip}`, 60]];
  for (const [key, limit] of checks) {
    const result = await checkRateLimit(key, limit, 60);
    if (!result.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(result.resetSeconds) } });
  }
  return null;
}

const directIpChecks = new WeakMap<NextRequest, NextResponse | null>();
export async function checkDirectMachineIpLimit(req: NextRequest): Promise<NextResponse | null> {
  if (directIpChecks.has(req)) return directIpChecks.get(req)!;
  const response = await directToolRateLimit(req);
  directIpChecks.set(req, response);
  return response;
}

/**
 * Authenticates an incoming Dify Agent Tool request and resolves the tenant context.
 * 
 * Supports:
 * 1. Bearer API Key from Contour's `ApiKey` table in Neon PostgreSQL.
 * 2. Explicit cross-tenant service authority via separate DIFY_MASTER_SECRET.
 * 3. Dev / Local demo fallback (`org_demo_contour`).
 */
export async function authenticateDifyRequest(
  req: NextRequest,
  bodyOrQueryOrgId?: string,
  operation?: MachineOperation,
): Promise<{ context: DifyTenantContext | null; errorResponse: NextResponse | null }> {
  try {
    const authHeader = req.headers.get("authorization");
    const headerOrgId = req.headers.get("x-organization-id");
    const targetOrgId = bodyOrQueryOrgId || headerOrgId;
    const ipRateError = await checkDirectMachineIpLimit(req);
    if (ipRateError) return { context: null, errorResponse: ipRateError };
    const routeOperations: Record<string, MachineOperation> = { properties: "search_properties", inquiries: "create_inquiry_or_lead", arrears: "get_rental_arrears", commission: "get_revenue_commission", documents: "get_property_documents" };
    const requestedOperation = operation || routeOperations[req.nextUrl.pathname.split("/").pop() || ""];
    if (!requestedOperation || !isMachineOperation(requestedOperation)) return { context: null, errorResponse: NextResponse.json({ error: "Unknown machine operation" }, { status: 400 }) };

    // 1. Dev Mode Bypass (when no auth header provided)
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true" && !authHeader) {
      return {
        context: {
          organizationId: targetOrgId || "org_demo_contour",
          userId: "user_demo_broker",
          userRole: "SUPER_ADMIN",
          apiKeyName: "Dev Mode Local Key",
          principal: "development", contourRole: "OWNER", permissions: PERMISSIONS,
        },
        errorResponse: null,
      };
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // In dev mode, allow fallback
      if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        return {
          context: {
            organizationId: targetOrgId || "org_demo_contour",
            userId: "user_demo_broker",
            userRole: "SUPER_ADMIN",
            principal: "development", contourRole: "OWNER", permissions: PERMISSIONS,
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

    // 2. Master service secret validation (configured in Dokploy / .env)
    // Uses a SEPARATE DIFY_MASTER_SECRET - never reuse BETTER_AUTH_SECRET here.
    const masterSecret = process.env.DIFY_MASTER_SECRET;
    if (masterSecret && timingSafeEqual(createHash("sha256").update(token).digest(), createHash("sha256").update(masterSecret).digest())) {
      if (!targetOrgId) {
        return {
          context: null,
          errorResponse: NextResponse.json(
            { error: "Missing required 'organization_id' parameter or 'X-Organization-Id' header for master token authentication" },
            { status: 400 }
          ),
        };
      }

      const organization = await db.organization.findUnique({ where: { id: targetOrgId }, select: { id: true, accountStatus: true } });
      if (!organization || organization.accountStatus !== "ACTIVE") return { context: null, errorResponse: NextResponse.json({ error: "Workspace is unavailable" }, { status: 403 }) };
      const rateError = await directToolRateLimit(req, organization.id);
      if (rateError) return { context: null, errorResponse: rateError };

      return {
        context: {
          organizationId: targetOrgId,
          userRole: "AGENT_RUNTIME",
          apiKeyName: "Dify Master Service Key",
          principal: "service", contourRole: "OWNER", permissions: PERMISSIONS,
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

      if (apiKeyRecord.status !== "active" || apiKeyRecord.organization.accountStatus !== "ACTIVE") {
        return {
          context: null,
          errorResponse: NextResponse.json(
            { error: "Forbidden: API Key has been revoked" },
            { status: 403 }
          ),
        };
      }

      const membership = await db.member.findUnique({
        where: { organizationId_userId: { organizationId: apiKeyRecord.organizationId, userId: apiKeyRecord.userId } },
        include: { roleAssignments: { include: { role: true } }, permissionOverrides: true },
      });
      const permissions = membership ? effectivePermissionsForMember(membership.role, membership.roleAssignments[0]?.role.key, membership.permissionOverrides) : [];
      if (!membership || membership.status !== "active" || !requestedOperation || !canUseMachineOperation(requestedOperation, apiKeyRecord.permissions, permissions)) {
        return { context: null, errorResponse: NextResponse.json({ error: "Forbidden: API key scope or active member permission is missing" }, { status: 403 }) };
      }
      if (targetOrgId && targetOrgId !== apiKeyRecord.organizationId) return { context: null, errorResponse: NextResponse.json({ error: "Workspace access denied" }, { status: 403 }) };
      const rateError = await directToolRateLimit(req, apiKeyRecord.organizationId);
      if (rateError) return { context: null, errorResponse: rateError };

      // Update lastUsedAt asynchronously in Neon
      db.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      }).catch((e: unknown) => console.warn("Failed to update apiKey lastUsedAt:", e));

      return {
        context: {
          organizationId: apiKeyRecord.organizationId,
          userId: apiKeyRecord.userId,
          userRole: resolveApplicationRole(undefined, membership.role),
          apiKeyName: apiKeyRecord.name,
          principal: "user", permissions,
          contourRole: resolveContourRole(undefined, membership.role, membership.roleAssignments[0]?.role.key),
        },
        errorResponse: null,
      };
    } catch (dbErr) {
      // If DB is offline during local test, fallback in dev mode
      if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        return {
          context: {
            organizationId: targetOrgId || "org_demo_contour",
            userId: "user_demo_broker",
            userRole: "SUPER_ADMIN",
            principal: "development", contourRole: "OWNER", permissions: PERMISSIONS,
          },
          errorResponse: null,
        };
      }
      throw dbErr;
    }
  } catch (error: unknown) {
    console.error("Dify Auth Verification Error:", error);
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 500 }
      ),
    };
  }
}
