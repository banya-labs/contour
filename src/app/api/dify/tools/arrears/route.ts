import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { rentalArrearsToolSchema } from "@/lib/ai-tool-schemas";
import { getOrCreateCorrelationId } from "@/lib/correlation";

/**
 * Dify Tool: `get_rental_arrears`
 * 
 * Retrieves active rent arrears for the authenticated organization in Neon PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = rentalArrearsToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid arrears arguments" }, { status: 400 });
    }
    const { organization_id, minDaysOverdue } = parsed.data;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

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

    const arrearsList = leasesInArrears.map((lease) => {
        // Calculate estimated days overdue
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
      }).filter((arrears) => arrears.daysOverdue >= Number(minDaysOverdue));

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      totalTenantsInArrears: arrearsList.length,
      arrears: arrearsList,
    });
  } catch (error: any) {
    const correlationId = getOrCreateCorrelationId(req);
    console.error("Dify Arrears Tool Error:", { correlationId, error });
    return NextResponse.json(
      { error: "Failed to retrieve rent arrears", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
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
