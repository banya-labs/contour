import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";

import { smartCache } from "@/lib/cache";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const cacheKey = `dashboard-kpi-summary`;

    const metrics = await smartCache.getOrSet(
      organizationId!,
      "dashboard-metrics",
      cacheKey,
      async () => {
        // Parallelized concurrent queries: Eliminate 7 sequential roundtrips
        const [
          totalProperties,
          forSaleCount,
          forRentCount,
          activeLeasesCount,
          inArrearsLeases,
          receivedTransactions,
          expectedTransactions,
        ] = await Promise.all([
          db.property.count({ where: { organizationId } }),
          db.property.count({ where: { organizationId, listingType: "FOR_SALE" } }),
          db.property.count({ where: { organizationId, listingType: "FOR_RENT" } }),
          db.lease.count({ where: { organizationId, status: "ACTIVE" } }),
          db.lease.findMany({
            where: { organizationId, status: "IN_ARREARS" },
            select: { monthlyRent: true },
          }),
          db.transaction.findMany({
            where: { organizationId, status: "RECEIVED" },
            select: { agencyCommissionAmount: true, agentSplitAmount: true },
          }),
          db.transaction.findMany({
            where: { organizationId, status: "EXPECTED" },
            select: { agencyCommissionAmount: true, agentSplitAmount: true },
          }),
        ]);

        const arrearsCount = inArrearsLeases.length;
        const arrearsAmount = inArrearsLeases.reduce(
          (acc: number, l: any) => acc + Number(l.monthlyRent),
          0
        );
        const earnedCommission = receivedTransactions.reduce(
          (acc: number, t: any) => acc + Number(t.agencyCommissionAmount),
          0
        );
        const expectedCommission = expectedTransactions.reduce(
          (acc: number, t: any) => acc + Number(t.agencyCommissionAmount),
          0
        );

        return {
          totalProperties,
          forSaleCount,
          forRentCount,
          activeLeasesCount,
          arrearsCount,
          arrearsAmount,
          earnedCommission,
          expectedCommission,
        };
      },
      60 // 60s TTL for high-velocity dashboard updates
    );

    return NextResponse.json(
      {
        success: true,
        metrics,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  },
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}
