import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    // 1. IN_ARREARS Leases ? "Rent Overdue" action items
    const arrearsLeases = await db.lease.findMany({
      where: { organizationId, status: "IN_ARREARS" },
      include: {
        property: { select: { title: true, suburb: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 3,
    });

    // 2. DRAFT Landlord Statements ? "DocuSign Authorization" action items
    const draftStatements = await db.landlordStatement.findMany({
      where: { organizationId, status: "DRAFT" },
      include: {
        property: { select: { title: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    // 3. NEW_INQUIRY clients not yet contacted ? "Follow-up Required"
    const newInquiries = await db.inquiry.findMany({
      where: { organizationId, status: "NEW_INQUIRY" },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    // 4. EXPECTED (pending) Transactions ? "Title Deed / Registry Pending"
    const pendingTransactions = await db.transaction.findMany({
      where: { organizationId, status: "EXPECTED" },
      include: {
        property: { select: { title: true, suburb: true } },
        closingAgent: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    // 5. Inquiry status breakdown for the "Lead Attribution" panel
    const inquiryStatusBreakdown = await db.inquiry.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    });

    const totalInquiries = inquiryStatusBreakdown.reduce(
      (acc, g) => acc + g._count.status,
      0
    );

    // 6. EXPIRING_SOON leases (within 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const expiringSoonLeases = await db.lease.findMany({
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
    });

    return NextResponse.json({
      success: true,
      arrearsLeases,
      draftStatements,
      newInquiries,
      pendingTransactions,
      expiringSoonLeases,
      inquiryStatusBreakdown,
      totalInquiries,
    });
  },
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}
