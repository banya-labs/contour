import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { canTransitionBoundaryStatus } from "@/lib/cadastral";

const verifySchema = z.object({ status: z.enum(["VERIFIED", "REJECTED", "PENDING"]), rejectionReason: z.string().max(500).nullable().optional() });

export const POST = createApiHandler({
  requirePermissions: ["vault.verify"],
  bodySchema: verifySchema,
  handler: async (_req, { body, organizationId, userId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    const boundaryId = typeof params?.boundaryId === "string" ? params.boundaryId : null;
    if (!propertyId || !boundaryId || !organizationId || !userId) return NextResponse.json({ error: "Boundary is required" }, { status: 400 });
    const current = await db.propertyBoundary.findFirst({ where: { id: boundaryId, organizationId, propertyId }, select: { id: true, status: true } });
    if (!current) return NextResponse.json({ error: "Boundary not found" }, { status: 404 });
    if (!canTransitionBoundaryStatus(current.status, body.status)) return NextResponse.json({ error: `Cannot transition ${current.status} to ${body.status}` }, { status: 409 });
    const boundary = await db.$transaction(async (tx) => {
      if (body.status === "VERIFIED") await tx.propertyBoundary.updateMany({ where: { organizationId, propertyId, status: "VERIFIED", id: { not: boundaryId } }, data: { status: "SUPERSEDED" } });
      const updated = await tx.propertyBoundary.update({ where: { id: boundaryId }, data: { status: body.status, rejectionReason: body.status === "REJECTED" ? body.rejectionReason || null : null, verifiedById: body.status === "VERIFIED" ? userId : null, verifiedAt: body.status === "VERIFIED" ? new Date() : null } });
      await tx.boundaryEvidenceEvent.create({ data: { organizationId, propertyId, boundaryId, eventType: body.status === "VERIFIED" ? "BOUNDARY_APPROVED" : body.status === "REJECTED" ? "BOUNDARY_REJECTED" : "BOUNDARY_REVIEW_REOPENED", actorId: userId, details: { rejectionReason: body.rejectionReason || null } } });
      return updated;
    });
    return NextResponse.json({ success: true, boundary });
  },
});
