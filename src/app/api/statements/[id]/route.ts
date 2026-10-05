import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({
  requirePermissions: ["statements.read"],
  handler: async (_req, { params, organizationId }) => {
    const id = z.string().trim().min(1).max(128).safeParse(params?.id);
    if (!id.success || !organizationId) return NextResponse.json({ success: false, error: "Statement and workspace are required." }, { status: 400 });
    const statement = await db.landlordStatement.findFirst({
      where: { id: id.data, organizationId },
      select: {
        id: true, status: true, landlordName: true, currency: true,
        statementMonth: true, statementYear: true, createdAt: true, approvedAt: true,
        grossRentCollected: true, rentDue: true, arrearsBroughtForward: true, arrearsClosing: true,
        agencyFeeDeducted: true, maintenanceDeducted: true, netLandlordPayout: true,
        property: { select: { title: true, suburb: true, city: true } },
        organization: { select: { name: true, logo: true, profile: { select: { primaryOfficeAddress: true, primaryPhone: true, primaryEmail: true } } } },
      },
    });
    if (!statement) return NextResponse.json({ success: false, error: "Statement not found." }, { status: 404 });
    return NextResponse.json({ success: true, statement }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
