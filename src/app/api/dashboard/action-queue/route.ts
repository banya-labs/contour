import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";

import { smartCache } from "@/lib/cache";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const cacheKey = "dashboard-action-queue";

    const data = await smartCache.getOrSet(
      organizationId!,
      "dashboard-action-queue",
      cacheKey,
      async () => {
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        // Run all 6 action-queue queries concurrently in a single parallel batch
        const [
          arrearsLeases,
          draftStatements,
          newInquiries,
          managementHandoverInquiries,
          pendingTransactions,
          inquiryStatusBreakdown,
          expiringSoonLeases,
        ] = await Promise.all([
          // 1. IN_ARREARS Leases
          db.lease.findMany({
            where: { organizationId, status: "IN_ARREARS" },
            include: {
              property: { select: { title: true, suburb: true } },
            },
            orderBy: { updatedAt: "asc" },
            take: 3,
          }),
          // 2. DRAFT Landlord Statements
          db.landlordStatement.findMany({
            where: { organizationId, status: "DRAFT" },
            include: {
              property: { select: { title: true } },
            },
            orderBy: { createdAt: "asc" },
            take: 2,
          }),
          // 3. NEW_INQUIRY clients not yet contacted
          db.inquiry.findMany({
            where: { organizationId, status: "NEW_INQUIRY" },
            orderBy: { createdAt: "asc" },
            take: 2,
          }),
          // 4. Verification and closing actions awaiting management action
          db.inquiry.findMany({
            where: { organizationId, status: "VERIFICATION_CLOSING", outcome: null },
            include: {
              property: { select: { id: true, title: true, suburb: true } },
              assignedAgent: { select: { id: true, name: true } },
            },
            orderBy: { managementCloseRequestedAt: "asc" },
            take: 20,
          }),
          // 5. EXPECTED Transactions
          db.transaction.findMany({
            where: { organizationId, status: "EXPECTED" },
            include: {
              property: { select: { title: true, suburb: true } },
              closingAgent: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
            take: 2,
          }),
          // 6. Inquiry status breakdown
          db.inquiry.groupBy({
            by: ["status"],
            where: { organizationId },
            _count: { status: true },
          }),
          // 7. EXPIRING_SOON leases
          db.lease.findMany({
            where: {
              organizationId,
              status: "ACTIVE",
              leaseEndDate: { lte: sixtyDaysFromNow, gte: new Date() },
            },
            include: {
              property: { select: { title: true, suburb: true } },
            },
            orderBy: { leaseEndDate: "asc" },
            take: 2,
          }),
        ]);

        const totalInquiries = inquiryStatusBreakdown.reduce(
          (acc: number, g: { _count: { status: number } }) => acc + g._count.status,
          0
        );

        return {
          arrearsLeases,
          draftStatements,
          newInquiries,
          managementHandoverInquiries,
          managementActionCount: managementHandoverInquiries.length,
          pendingTransactions,
          expiringSoonLeases,
          inquiryStatusBreakdown,
          totalInquiries,
        };
      },
      60
    );

    return NextResponse.json(
      {
        success: true,
        ...data,
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
