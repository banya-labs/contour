import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Money must be a non-negative decimal with at most two fraction digits.").refine((value) => Number(value) > 0, "Money must be positive.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD dates.");
const idempotencyKey = z.string().min(16).max(200);

export const saleScheduleLineSchema = z.object({
  kind: z.enum(["DEPOSIT", "INSTALLMENT", "FULL_PAYMENT"]),
  amount: money,
  dueDate: date,
});

export const createSalePaymentPlanSchema = z.object({
  inquiryId: z.string().min(1),
  transactionId: z.string().min(1).optional(),
  buyerContactId: z.string().min(1),
  price: money,
  currency: z.enum(["ZMW", "USD", "ZAR"]),
  schedule: z.array(saleScheduleLineSchema).min(1).max(360),
  evidenceReference: z.string().max(200).optional(),
  idempotencyKey,
});

export const recordSalePaymentReceiptSchema = z.object({
  amount: money,
  currency: z.enum(["ZMW", "USD", "ZAR"]),
  paymentDate: date,
  custodian: z.enum(["AGENCY", "SELLER", "CONVEYANCER"]),
  paymentMethod: z.enum(["BANK_TRANSFER", "MOBILE_MONEY_AIRTEL", "MOBILE_MONEY_MTN", "CASH", "CHEQUE"]).optional(),
  referenceNumber: z.string().max(120).optional(),
  evidenceReference: z.string().max(200).optional(),
  idempotencyKey,
});

export const createSalePlanRevisionSchema = z.object({
  effectiveDate: date,
  reason: z.string().min(3).max(500),
  schedule: z.array(saleScheduleLineSchema).min(1).max(360),
  expectedVersion: z.number().int().positive(),
  idempotencyKey,
});

export const salePaymentEventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("CONFIRM"), sourceEventId: z.string().min(1), idempotencyKey }),
  z.object({ kind: z.literal("REJECT"), sourceEventId: z.string().min(1), reason: z.string().min(3).max(500), idempotencyKey }),
  z.object({ kind: z.literal("REVERSAL"), sourceEventId: z.string().min(1), amount: money, reason: z.string().min(3).max(500), idempotencyKey }),
  z.object({ kind: z.literal("REFUND"), sourceEventId: z.string().min(1), amount: money, reason: z.string().min(3).max(500), evidenceReference: z.string().min(1).max(200), idempotencyKey }),
]);

export type CreateSalePaymentPlanInput = z.infer<typeof createSalePaymentPlanSchema>;
export type RecordSalePaymentReceiptInput = z.infer<typeof recordSalePaymentReceiptSchema>;
export type CreateSalePlanRevisionInput = z.infer<typeof createSalePlanRevisionSchema>;
