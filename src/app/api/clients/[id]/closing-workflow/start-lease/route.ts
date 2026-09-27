import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { smartCache } from "@/lib/cache";
import { rentalClosingInputSchema, startRentalLease } from "@/lib/rental-closing";

export const POST = createApiHandler({
  requirePermissions: ["leases.manage"],
  bodySchema: rentalClosingInputSchema,
  handler: async (_request, { body, params, organizationId, userId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId || !organizationId || !userId) return NextResponse.json({ success: false, error: "Inquiry, organization, and actor are required." }, { status: 400 });
    try {
      const lease = await startRentalLease(db, { inquiryId, organizationId, actorId: userId, lease: body });
      smartCache.invalidateTag(organizationId, "leases", "/dashboard/leases");
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/properties");
      smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
      smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
      return NextResponse.json({ success: true, lease });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start the lease.";
      const status = message === "INQUIRY_NOT_FOUND" ? 404 : message === "ACTIVE_LEASE_EXISTS" ? 409 : 400;
      const errorText = message === "ACTIVE_LEASE_EXISTS" ? "This property already has an active lease." : message === "RENTAL_DEAL_NOT_READY" ? "Move the rental deal to Verification & Closing before starting a lease." : message;
      return NextResponse.json({ success: false, error: errorText }, { status });
    }
  },
});
