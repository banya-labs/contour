import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const agency = await db.organization.findUnique({ where: { id }, select: { id: true, name: true, slug: true, subscriptionTier: true, subscriptionStatus: true, accountStatus: true, createdAt: true, profile: { select: { country: true, agencyType: true, city: true } }, _count: { select: { members: true, properties: true, inquiries: true, transactions: true, vaultDocuments: true } } } });
  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const [propertyValues, recentTransactions, recentAudit] = await Promise.all([
    db.property.groupBy({ by: ["currency"], where: { organizationId: id, status: { in: ["AVAILABLE", "UNDER_OFFER"] }, askingPrice: { not: null } }, _sum: { askingPrice: true } }),
    db.transaction.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, status: true, grossValue: true, currency: true, property: { select: { title: true } } } }),
    db.platformAuditEvent.findMany({ where: { targetType: "Organization", targetId: id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, capability: true, reason: true, createdAt: true } }),
  ]);
  return NextResponse.json({ success: true, agency, propertyValueByCurrency: Object.fromEntries(propertyValues.map((row) => [row.currency, Number(row._sum.askingPrice || 0)])), recentTransactions, recentAudit });
}
