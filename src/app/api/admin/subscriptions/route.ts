import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(25), status: z.string().trim().max(30).optional() });

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  const { page, pageSize, status } = parsed.data;
  const where = status ? { subscriptionStatus: status } : {};
  const [total, agencies] = await Promise.all([
    db.organization.count({ where }),
    db.organization.findMany({ where, select: { id: true, name: true, slug: true, subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true, createdAt: true, _count: { select: { members: true, properties: true, inquiries: true } }, payments: { where: { status: "SUCCESS" }, orderBy: { completedAt: "desc" }, take: 1, select: { amount: true, currency: true, billingCycle: true, completedAt: true, planId: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return NextResponse.json({ success: true, subscriptions: agencies.map(({ payments, ...agency }) => ({ ...agency, lastPayment: payments[0] ? { ...payments[0], amount: Number(payments[0].amount) } : null })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}
