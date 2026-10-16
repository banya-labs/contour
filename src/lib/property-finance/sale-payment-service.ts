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
