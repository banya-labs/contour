import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { isManagementRole } from "@/lib/authorization";

const schema = z.object({
  status: z.enum(["SALE_AGREED", "TRANSFER_IN_PROGRESS", "TRANSFER_COMPLETE", "CANCELLED"]),
  transferAttorney: z.string().trim().max(200).nullable().optional(),
  transferReference: z.string().trim().max(200).nullable().optional(),
  transferNotes: z.string().trim().max(5000).nullable().optional(),
  depositAmount: z.number().nonnegative().nullable().optional(),
  balanceAmount: z.number().nonnegative().nullable().optional(),
});

export const PATCH = createApiHandler({
  requirePermissions: ["finance.manage"],
  bodySchema: schema,
  handler: async (_request, { params, organizationId, contourRole, body }) => {
    const id = typeof params?.id === "string" ? params.id : undefined;
    if (!id || !organizationId) return NextResponse.json({ success: false, error: "Sale and organization context are required." }, { status: 400 });
    if (!isManagementRole(contourRole)) return NextResponse.json({ success: false, error: "Only management can update transfer status." }, { status: 403 });
    const existing = await db.transaction.findFirst({ where: { id, organizationId, transactionType: "PROPERTY_SALE" } });
    if (!existing) return NextResponse.json({ success: false, error: "Property sale not found." }, { status: 404 });
    if (existing.transferStatus === "TRANSFER_COMPLETE" && body.status !== "TRANSFER_COMPLETE") return NextResponse.json({ success: false, error: "Completed transfers cannot be moved backwards." }, { status: 409 });
    const { status: transferStatus, ...details } = body;
    const updated = await db.transaction.update({ where: { id }, data: { ...details, transferStatus, transferStartedAt: body.status === "TRANSFER_IN_PROGRESS" && !existing.transferStartedAt ? new Date() : existing.transferStartedAt, transferCompletedAt: body.status === "TRANSFER_COMPLETE" ? new Date() : existing.transferCompletedAt } });
    return NextResponse.json({ success: true, transaction: updated });
  },
});
