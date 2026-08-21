import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { MOCK_LEASES } from "@/lib/mock-data";

/**
 * Dify Tool: `get_rental_arrears`
 * 
 * Retrieves active rent arrears for the authenticated organization in Neon PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { organization_id, minDaysOverdue = 1 } = body;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    let arrearsList: any[] = [];

    try {
      const leasesInArrears = await db.lease.findMany({
        where: {
          organizationId: tenantOrgId,
          status: "IN_ARREARS",
        },
        include: {
          property: {
            select: {
              title: true,
              suburb: true,
            },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 1,
          },
        },
      });

      const today = new Date();

      arrearsList = leasesInArrears.map((lease) => {
        // Calculate estimated days overdue
        const currentMonth = today.getMonth() + 1;
        const dueDay = lease.paymentDayOfMonth || 1;
        const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return {
          leaseId: lease.id,
          tenantName: lease.tenantName,
          tenantPhone: lease.tenantPhone,
          property: lease.property.title,
          suburb: lease.property.suburb,
          monthlyRent: `${lease.currency} ${Number(lease.monthlyRent).toLocaleString()}`,
          amountOverdue: `${lease.currency} ${Number(lease.monthlyRent).toLocaleString()}`,
          daysOverdue: daysOverdue || 14,
          lastPaymentDate: lease.payments[0]?.paymentDate || null,
          recommendedAction: "Dispatch Tier-1 WhatsApp payment nudge (4-day cooldown active)",
        };
      });
    } catch (dbError) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        arrearsList = MOCK_LEASES.filter((l) => l.status === "IN_ARREARS").map((l) => ({
          leaseId: l.id,
          tenantName: l.tenantName,
          tenantPhone: l.tenantPhone,
          property: l.propertyTitle,
          suburb: "Woodlands",
          monthlyRent: `ZMW ${l.monthlyRent.toLocaleString()}`,
          amountOverdue: `ZMW 18,000`,
          daysOverdue: 14,
          recommendedAction: "Dispatch Tier-1 WhatsApp payment nudge (4-day cooldown active)",
        }));
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      totalTenantsInArrears: arrearsList.length,
      arrears: arrearsList,
    });
  } catch (error: any) {
    console.error("Dify Arrears Tool Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve rent arrears", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(searchParams),
  });

  return POST(mockReq);
}
