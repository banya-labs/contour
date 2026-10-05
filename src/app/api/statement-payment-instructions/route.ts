import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { paymentInstructionSchema } from "@/lib/statements/document";
import { hasStatementPermission } from "@/lib/statements/service";
export const GET = createApiHandler({ requirePermissions: ["leases.read"], handler: async (_req, ctx) => {
  const canManage = hasStatementPermission(ctx, "finance.manage") || (hasStatementPermission(ctx, "org.update") && hasStatementPermission(ctx, "leases.manage"));
  const instructions = await db.statementPaymentInstruction.findMany({ where: { organizationId: ctx.organizationId, ...(canManage ? {} : { active: true }) }, orderBy: { label: "asc" }, take: 50 });
  return NextResponse.json({ success: true, instructions, canManage }, { headers: { "Cache-Control": "private, no-store" } });
} });
export const POST = createApiHandler({ bodySchema: paymentInstructionSchema, handler: async (_req, ctx) => {
  if (!hasStatementPermission(ctx, "finance.manage") && !(hasStatementPermission(ctx, "org.update") && hasStatementPermission(ctx, "leases.manage"))) return NextResponse.json({ error: "Only authorized agency management or finance can edit payment instructions." }, { status: 403 });
  if (ctx.body.id && !await db.statementPaymentInstruction.findFirst({ where: { id: ctx.body.id, organizationId: ctx.organizationId }, select: { id: true } })) return NextResponse.json({ error: "Payment instructions not found." }, { status: 404 });
  const { id, ...data } = ctx.body;
  const instruction = await db.$transaction(async tx => {
    const saved = id ? await tx.statementPaymentInstruction.update({ where: { id }, data }) : await tx.statementPaymentInstruction.create({ data: { ...data, organizationId: ctx.organizationId! } });
    await tx.auditLog.create({ data: { organizationId: ctx.organizationId!, userId: ctx.userId, action: "STATEMENT_PAYMENT_INSTRUCTIONS_CHANGED", entityType: "StatementPaymentInstruction", entityId: saved.id, details: { method: saved.method, active: saved.active } } });
    return saved;
  });
  return NextResponse.json({ success: true, instruction }, { headers: { "Cache-Control": "private, no-store" } });
} });
