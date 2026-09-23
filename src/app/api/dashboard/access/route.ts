import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";

export const GET = createApiHandler({
  requirePermissions: ["dashboard.read"],
  handler: async () => NextResponse.json({ success: true, canAccessDashboard: true }),
});
