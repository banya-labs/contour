import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { signPowerSyncToken } from "@/lib/local-first/sync-token";

const tokenHandler = createApiHandler({
  requireAuth: true,
  handler: async (req, ctx) => {
    const { organizationId, userId, userRole, contourRole } = ctx;

    const orgId = organizationId!;
    const sub = userId!;
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration

    const token = signPowerSyncToken({
      userId: sub,
      organizationId: orgId,
      role: contourRole || userRole || "FIELD_AGENT",
      expiresAt: exp,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: exp,
      powersyncUrl: process.env.POWERSYNC_URL || "http://localhost:8080",
    });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return tokenHandler(req, context);
}
