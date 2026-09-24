import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

function addBillingCycle(date: Date, cycle: string): Date {
  const next = new Date(date);
  if (cycle === "ANNUAL") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const organization = await db.organization.findUnique({
    where: { id },
    select: {
      id: true, name: true, slug: true, logo: true, currency: true, createdAt: true, updatedAt: true,
      subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true, accountStatus: true, accountLockedAt: true, accountLockReason: true,
      profile: { select: { country: true, city: true, primaryOfficeAddress: true, primaryPhone: true, primaryEmail: true, agencyType: true } },
      members: { orderBy: { createdAt: "asc" }, take: 100, select: { id: true, role: true, status: true, createdAt: true, user: { select: { name: true, email: true, phone: true } } } },
      payments: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, reference: true, planId: true, billingCycle: true, amount: true, currency: true, status: true, completedAt: true, createdAt: true, failureReason: true } },
      _count: { select: { members: true, properties: true, inquiries: true } },
    },
  });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const owners = organization.members.filter((member) => ["owner", "admin", "principal"].includes(member.role.toLowerCase()) && member.status.toLowerCase() !== "suspended");
  const latestSuccess = organization.payments.find((payment) => payment.status === "SUCCESS" && payment.completedAt);
  const nextPaymentAt = latestSuccess?.completedAt ? addBillingCycle(latestSuccess.completedAt, latestSuccess.billingCycle).toISOString() : null;
  return NextResponse.json({
    success: true,
    agency: {
      ...organization,
      members: organization.members.map((member) => ({ id: member.id, name: member.user.name, email: member.user.email, role: member.role, status: member.status, phonePresent: Boolean(member.user.phone), createdAt: member.createdAt })),
      owners: owners.map((member) => ({ name: member.user.name, email: member.user.email })),
      subscription: { tier: organization.subscriptionTier, status: organization.subscriptionStatus, trialEndsAt: organization.trialEndsAt, nextPaymentAt, lastPayment: latestSuccess ? { ...latestSuccess, amount: Number(latestSuccess.amount) } : null },
      payments: organization.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    },
  });
}
