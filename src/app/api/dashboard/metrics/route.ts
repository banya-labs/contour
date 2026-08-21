import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    // Count properties
    const totalProperties = await db.property.count({
      where: { organizationId }
    });

    const forSaleCount = await db.property.count({
      where: { organizationId, listingType: "FOR_SALE" }
    });

    const forRentCount = await db.property.count({
      where: { organizationId, listingType: "FOR_RENT" }
    });

    // Count leases
    const activeLeasesCount = await db.lease.count({
      where: { organizationId, status: "ACTIVE" }
    });

    // Arrears
    const inArrearsLeases = await db.lease.findMany({
      where: { organizationId, status: "IN_ARREARS" },
      select: { monthlyRent: true }
    });

    const arrearsCount = inArrearsLeases.length;
    const arrearsAmount = inArrearsLeases.reduce((acc, l) => acc + Number(l.monthlyRent), 0);

    // Sum commissions & closed volumes
    const receivedTransactions = await db.transaction.findMany({
      where: { organizationId, status: "RECEIVED" },
      select: { agencyCommissionAmount: true, agentSplitAmount: true }
    });

    const expectedTransactions = await db.transaction.findMany({
      where: { organizationId, status: "EXPECTED" },
      select: { agencyCommissionAmount: true, agentSplitAmount: true }
    });

    const earnedCommission = receivedTransactions.reduce((acc, t) => acc + Number(t.agencyCommissionAmount), 0);
    const expectedCommission = expectedTransactions.reduce((acc, t) => acc + Number(t.agencyCommissionAmount), 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalProperties,
        forSaleCount,
        forRentCount,
        activeLeasesCount,
        arrearsCount,
        arrearsAmount,
        earnedCommission,
        expectedCommission,
      }
    });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}
