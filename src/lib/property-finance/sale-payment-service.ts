import { Prisma } from "@prisma/client";
import { assertScheduleReconciles } from "./sale-payment-plan";
import type { CreateSalePaymentPlanInput, RecordSalePaymentReceiptInput, CreateSalePlanRevisionInput } from "./sale-payment-validation";

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
  const existing = await tx.salePaymentPlan.findFirst({ where: { organizationId: input.organizationId, OR: [{ idempotencyKey: input.idempotencyKey }, { inquiryId: input.inquiryId }] }, include: { revisions: { include: { installments: true }, orderBy: { revision: "desc" }, take: 1 } } });
  if (existing) return existing;
  return tx.salePaymentPlan.create({
    data: {
      organizationId: input.organizationId, inquiryId: input.inquiryId, transactionId: input.transactionId,
      buyerContactId: input.buyerContactId, price: input.price, currency: input.currency, evidenceReference: input.evidenceReference,
      idempotencyKey: input.idempotencyKey,
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

export async function reverseOrRefundSalePayment(tx: Tx, input: {
  organizationId: string; planId: string; sourceEventId: string; kind: "REVERSAL" | "REFUND";
  amount: string; reason: string; evidenceReference?: string; recordedById: string; idempotencyKey: string;
}) {
  await tx.$queryRaw`SELECT id FROM "sale_payment_plan" WHERE id = ${input.planId} AND "organizationId" = ${input.organizationId} FOR UPDATE`;
  const source = await tx.salePaymentEvent.findFirst({ where: { id: input.sourceEventId, planId: input.planId, organizationId: input.organizationId, kind: { in: ["CONFIRM", "RECEIPT"] } } });
  if (!source) throw new Error("SALE_SOURCE_PAYMENT_NOT_FOUND");
  const existing = await tx.salePaymentEvent.findFirst({ where: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;
  const related = await tx.salePaymentEvent.aggregate({ where: { organizationId: input.organizationId, planId: input.planId, sourceEventId: source.id, kind: input.kind }, _sum: { amount: true } });
  const alreadyApplied = related._sum.amount ?? new Prisma.Decimal(0);
  const available = new Prisma.Decimal(source.amount).minus(alreadyApplied);
  const amount = new Prisma.Decimal(input.amount);
  if (!amount.isPositive() || amount.greaterThan(available)) throw new Error(input.kind === "REFUND" ? "SALE_REFUND_EXCEEDS_AVAILABLE" : "SALE_REVERSAL_EXCEEDS_AVAILABLE");
  const allocations = input.kind === "REVERSAL" ? await tx.salePaymentAllocation.findMany({ where: { organizationId: input.organizationId, eventId: source.id }, orderBy: { installmentId: "asc" } }) : [];
  let remaining = amount;
  return tx.salePaymentEvent.create({ data: {
    organizationId: input.organizationId, planId: input.planId, kind: input.kind, amount, currency: source.currency,
    paymentDate: new Date(), custodian: source.custodian, sourceEventId: source.id, evidenceReference: input.evidenceReference,
    idempotencyKey: input.idempotencyKey, payloadHash: JSON.stringify({ sourceEventId: source.id, amount: input.amount, reason: input.reason }), recordedById: input.recordedById,
    allocations: input.kind === "REVERSAL" ? { create: allocations.flatMap((allocation) => {
      if (!remaining.isPositive()) return [];
      const reversalAmount = Prisma.Decimal.min(allocation.amount, remaining);
      remaining = remaining.minus(reversalAmount);
      return [{ organizationId: input.organizationId, installmentId: allocation.installmentId, amount: reversalAmount.negated(), reversedAllocationId: allocation.id }];
    }) } : undefined,
  }, include: { allocations: true } });
}

export async function createSalePlanRevision(tx: Tx, input: CreateSalePlanRevisionInput & { organizationId: string; planId: string }) {
  assertScheduleReconciles((await tx.salePaymentPlan.findFirst({ where: { id: input.planId, organizationId: input.organizationId }, select: { price: true } }))?.price.toFixed(2) ?? "0", input.schedule.map((line, sequence) => ({ ...line, sequence })));
  await tx.$queryRaw`SELECT id FROM "sale_payment_plan" WHERE id = ${input.planId} AND "organizationId" = ${input.organizationId} FOR UPDATE`;
  const plan = await tx.salePaymentPlan.findFirst({ where: { id: input.planId, organizationId: input.organizationId }, include: { revisions: { include: { installments: true }, orderBy: { revision: "desc" }, take: 1 } } });
  if (!plan) throw new Error("SALE_PAYMENT_PLAN_NOT_FOUND");
  if (plan.version !== input.expectedVersion) throw new Error("SALE_PAYMENT_PLAN_VERSION_CONFLICT");
  if (plan.status !== "ACTIVE") throw new Error("SALE_PAYMENT_PLAN_NOT_RESCHEDULABLE");
  const previous = plan.revisions[0];
  if (!previous) throw new Error("SALE_PAYMENT_REVISION_NOT_FOUND");
  const allocations = await tx.salePaymentAllocation.findMany({ where: { organizationId: input.organizationId, installment: { revisionId: previous.id }, event: { kind: "CONFIRM" } }, select: { installmentId: true, amount: true } });
  const paidBySequence = new Map<number, Prisma.Decimal>();
  for (const allocation of allocations) {
    const line = previous.installments.find((item) => item.id === allocation.installmentId);
    if (line) paidBySequence.set(line.sequence, (paidBySequence.get(line.sequence) ?? new Prisma.Decimal(0)).plus(allocation.amount));
  }
  const nextRevision = previous.revision + 1;
  return tx.salePlanRevision.create({ data: {
    organizationId: input.organizationId, planId: plan.id, revision: nextRevision, effectiveDate: new Date(`${input.effectiveDate}T00:00:00.000Z`), reason: input.reason, supersedesId: previous.id,
    installments: { create: input.schedule.map((line, index) => ({ organizationId: input.organizationId, sequence: index + 1, kind: line.kind, amount: line.amount, dueDate: new Date(`${line.dueDate}T00:00:00.000Z`), carriedPaidAmount: paidBySequence.get(index + 1) ?? 0 })) },
  }, include: { installments: true } });
}
