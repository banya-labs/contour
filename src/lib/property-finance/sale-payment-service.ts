import { Prisma } from "@prisma/client";
import { assertScheduleReconciles } from "./sale-payment-plan";
import type { CreateSalePaymentPlanInput, RecordSalePaymentReceiptInput } from "./sale-payment-validation";

type Tx = Prisma.TransactionClient;

export async function createSalePaymentPlan(tx: Tx, input: CreateSalePaymentPlanInput & { organizationId: string }) {
  assertScheduleReconciles(input.price, input.schedule.map((line, sequence) => ({ ...line, sequence })));
  const inquiry = await tx.inquiry.findFirst({ where: { id: input.inquiryId, organizationId: input.organizationId }, select: { id: true, contactId: true, currency: true } });
  if (!inquiry) throw new Error("SALE_INQUIRY_NOT_FOUND");
  if (inquiry.currency !== input.currency) throw new Error("SALE_CURRENCY_MISMATCH");
  if (inquiry.contactId !== input.buyerContactId) throw new Error("BUYER_CONTACT_MISMATCH");
  if (input.transactionId) {
    const transaction = await tx.transaction.findFirst({ where: { id: input.transactionId, organizationId: input.organizationId, inquiryId: input.inquiryId, transactionType: "PROPERTY_SALE" }, select: { id: true, currency: true } });
    if (!transaction) throw new Error("SALE_TRANSACTION_NOT_FOUND");
    if (transaction.currency !== input.currency) throw new Error("SALE_CURRENCY_MISMATCH");
  }
  const existing = await tx.salePaymentPlan.findFirst({ where: { organizationId: input.organizationId, inquiryId: input.inquiryId }, include: { revisions: { include: { installments: true }, orderBy: { revision: "desc" }, take: 1 } } });
  if (existing) return existing;
  return tx.salePaymentPlan.create({
    data: {
      organizationId: input.organizationId, inquiryId: input.inquiryId, transactionId: input.transactionId,
      buyerContactId: input.buyerContactId, price: input.price, currency: input.currency, evidenceReference: input.evidenceReference,
      revisions: { create: { organizationId: input.organizationId, revision: 1, effectiveDate: new Date(), reason: "Initial payment terms", installments: { create: input.schedule.map((line, sequence) => ({ organizationId: input.organizationId, sequence: sequence + 1, kind: line.kind, amount: line.amount, dueDate: new Date(`${line.dueDate}T00:00:00.000Z`) })) } } },
    }, include: { revisions: { include: { installments: true } } },
  });
}

export async function recordSalePaymentReceipt(tx: Tx, input: RecordSalePaymentReceiptInput & { organizationId: string; planId: string; recordedById: string }) {
  const existing = await tx.salePaymentEvent.findFirst({ where: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;
  const plan = await tx.salePaymentPlan.findFirst({ where: { id: input.planId, organizationId: input.organizationId }, select: { id: true, currency: true, status: true } });
  if (!plan) throw new Error("SALE_PAYMENT_PLAN_NOT_FOUND");
  if (plan.status === "CANCELLED") throw new Error("SALE_PAYMENT_PLAN_CANCELLED");
  if (plan.currency !== input.currency) throw new Error("SALE_CURRENCY_MISMATCH");
  return tx.salePaymentEvent.create({ data: {
    organizationId: input.organizationId, planId: plan.id, kind: "RECEIPT", amount: input.amount, currency: input.currency,
    paymentDate: new Date(`${input.paymentDate}T00:00:00.000Z`), custodian: input.custodian, paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber, evidenceReference: input.evidenceReference, idempotencyKey: input.idempotencyKey,
    payloadHash: JSON.stringify(input), recordedById: input.recordedById,
  } });
}

export async function confirmSalePaymentReceipt(tx: Tx, input: { organizationId: string; planId: string; receiptEventId: string; recordedById: string; idempotencyKey: string }) {
  await tx.$queryRaw`SELECT id FROM "sale_payment_plan" WHERE id = ${input.planId} AND "organizationId" = ${input.organizationId} FOR UPDATE`;
  const receipt = await tx.salePaymentEvent.findFirst({ where: { id: input.receiptEventId, planId: input.planId, organizationId: input.organizationId, kind: "RECEIPT" } });
  if (!receipt) throw new Error("SALE_RECEIPT_NOT_FOUND");
  const existingConfirmation = await tx.salePaymentEvent.findFirst({ where: { organizationId: input.organizationId, sourceEventId: receipt.id, kind: "CONFIRM" } });
  if (existingConfirmation) return existingConfirmation;
  const plan = await tx.salePaymentPlan.findFirst({ where: { id: input.planId, organizationId: input.organizationId }, select: { status: true, currentRevision: true, currency: true } });
  if (!plan) throw new Error("SALE_PAYMENT_PLAN_NOT_FOUND");
  if (plan.status === "CANCELLED" || plan.status === "COMPLETED") throw new Error("SALE_PAYMENT_PLAN_NOT_COLLECTIBLE");
  const revision = await tx.salePlanRevision.findFirst({ where: { planId: input.planId, organizationId: input.organizationId, revision: plan.currentRevision || undefined }, include: { installments: { orderBy: { sequence: "asc" } } } });
  if (!revision) throw new Error("SALE_PAYMENT_REVISION_NOT_FOUND");
  const confirmedAllocations = await tx.salePaymentAllocation.findMany({ where: { organizationId: input.organizationId, installment: { revisionId: revision.id }, event: { kind: "CONFIRM" } }, select: { installmentId: true, amount: true } });
  const paid = new Map<string, Prisma.Decimal>();
  for (const allocation of confirmedAllocations) paid.set(allocation.installmentId, (paid.get(allocation.installmentId) ?? new Prisma.Decimal(0)).plus(allocation.amount));
  let remaining = new Prisma.Decimal(receipt.amount);
  const allocations: Array<{ installmentId: string; amount: Prisma.Decimal }> = [];
  for (const installment of revision.installments) {
    const outstanding = new Prisma.Decimal(installment.amount).minus(installment.carriedPaidAmount).minus(paid.get(installment.id) ?? 0);
    if (outstanding.isPositive() && remaining.isPositive()) {
      const amount = Prisma.Decimal.min(outstanding, remaining);
      allocations.push({ installmentId: installment.id, amount });
      remaining = remaining.minus(amount);
    }
  }
  if (remaining.isPositive()) throw new Error("SALE_PAYMENT_EXCEEDS_BALANCE");
  return tx.salePaymentEvent.create({ data: {
    organizationId: input.organizationId, planId: input.planId, kind: "CONFIRM", amount: receipt.amount, currency: receipt.currency,
    paymentDate: receipt.paymentDate, custodian: receipt.custodian, sourceEventId: receipt.id, idempotencyKey: input.idempotencyKey,
    payloadHash: JSON.stringify({ receiptEventId: receipt.id }), recordedById: input.recordedById,
    allocations: { create: allocations.map((allocation) => ({ organizationId: input.organizationId, installmentId: allocation.installmentId, amount: allocation.amount })) },
  }, include: { allocations: true } });
}

export async function approveSalePaymentPlan(tx: Tx, input: { organizationId: string; planId: string; approvedById: string }) {
  await tx.$queryRaw`SELECT id FROM "sale_payment_plan" WHERE id = ${input.planId} AND "organizationId" = ${input.organizationId} FOR UPDATE`;
  const plan = await tx.salePaymentPlan.findFirst({ where: { id: input.planId, organizationId: input.organizationId }, include: { revisions: { orderBy: { revision: "desc" }, take: 1 } } });
  if (!plan) throw new Error("SALE_PAYMENT_PLAN_NOT_FOUND");
  if (plan.status === "CANCELLED" || plan.status === "COMPLETED") throw new Error("SALE_PAYMENT_PLAN_NOT_APPROVABLE");
  const revision = plan.revisions[0];
  if (!revision) throw new Error("SALE_PAYMENT_REVISION_NOT_FOUND");
  return tx.salePaymentPlan.update({ where: { id: plan.id }, data: { status: "ACTIVE", currentRevision: revision.revision, approvedById: input.approvedById, approvedAt: new Date(), version: { increment: 1 } }, include: { revisions: { include: { installments: true } } } });
}
