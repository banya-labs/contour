import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";

export const GET = createApiHandler({
  requirePermissions: ["dashboard.read"],
  handler: async (_req, ctx) => NextResponse.json({ success: true, canAccessDashboard: true, permissions: ctx.permissions || [] }),
});
