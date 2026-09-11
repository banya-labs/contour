import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  handler: async (_req, { organizationId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    const boundaryId = typeof params?.boundaryId === "string" ? params.boundaryId : null;
    if (!propertyId || !boundaryId || !organizationId) return NextResponse.json({ error: "Boundary is required" }, { status: 400 });
    const boundary = await db.propertyBoundary.findFirst({ where: { id: boundaryId, propertyId, organizationId }, select: { id: true } });
    if (!boundary) return NextResponse.json({ error: "Boundary not found" }, { status: 404 });
    const events = await db.boundaryEvidenceEvent.findMany({ where: { organizationId, propertyId, boundaryId }, orderBy: { createdAt: "asc" }, include: { } });
    return NextResponse.json({ success: true, events });
  },
});
