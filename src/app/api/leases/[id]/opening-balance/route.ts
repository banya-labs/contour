import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { hasStatementPermission } from "@/lib/statements/service";
const schema = z.object({ amount: z.coerce.number().finite().min(-9999999999).max(9999999999), month: z.number().int().min(1).max(12), year: z.number().int().min(2020).max(2100), reason: z.string().trim().min(10).max(500), terminatedAt: z.string().datetime().optional() });
export const POST = createApiHandler({ bodySchema: schema, handler: async (_req, ctx) => {
  if (!hasStatementPermission(ctx, "finance.manage") && !(hasStatementPermission(ctx, "org.update") && hasStatementPermission(ctx, "leases.manage"))) return NextResponse.json({ error: "Management or finance must verify opening balances." }, { status: 403 });
  const lease = await db.lease.findFirst({ where: { id: String(ctx.params?.id || ""), organizationId: ctx.organizationId }, select: { id: true, currency: true, status: true, leaseStartDate: true, leaseEndDate: true } });
  if (!lease) return NextResponse.json({ error: "Lease not found." }, { status: 404 });
  if (ctx.body.terminatedAt && (lease.status !== "TERMINATED" || new Date(ctx.body.terminatedAt) < lease.leaseStartDate || new Date(ctx.body.terminatedAt) > new Date())) return NextResponse.json({ error: "Choose a valid effective date for this cancelled lease." }, { status: 400 });
  await db.$transaction(async tx => {
    await tx.lease.update({ where: { id: lease.id }, data: { openingBalance: ctx.body.amount, openingBalanceMonth: ctx.body.month, openingBalanceYear: ctx.body.year, openingBalanceVerifiedAt: new Date(), openingBalanceVerifiedById: ctx.userId, ...(ctx.body.terminatedAt ? { terminatedAt: new Date(ctx.body.terminatedAt) } : {}) } });
    await tx.auditLog.create({ data: { organizationId: ctx.organizationId!, userId: ctx.userId, action: "LEASE_OPENING_BALANCE_VERIFIED", entityType: "Lease", entityId: lease.id, details: { amount: ctx.body.amount, currency: lease.currency, month: ctx.body.month, year: ctx.body.year, reason: ctx.body.reason, terminatedAt: ctx.body.terminatedAt || null } } });
  });
  return NextResponse.json({ success: true });
} });
