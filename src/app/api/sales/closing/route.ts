import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { isManagementRole } from "@/lib/authorization";
import { saleClosingSchema, startSaleClosing } from "@/lib/sales-closing";

import { smartCache } from "@/lib/cache";
export const POST = createApiHandler({ requirePermissions: ["pipeline.update", "pwa.inquiries.update"], bodySchema: saleClosingSchema, handler: async (_req, ctx) => {
  const result = await db.$transaction(tx => startSaleClosing(tx, { ...ctx.body, organizationId: ctx.organizationId!, actorId: ctx.userId!, canManage: isManagementRole(ctx.contourRole) }));
  for (const tag of ["clients", "pipeline", "properties", "dashboard-action-queue", "agent-summary"]) smartCache.invalidateTag(ctx.organizationId!, tag);
  return NextResponse.json({ success: true, ...result });
} });
