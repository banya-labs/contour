import { z } from "zod";
export const statementKinds = ["TENANT", "AGENT_COMMISSION", "SALE", "SALE_COMMISSION"] as const;
export type StatementKind = typeof statementKinds[number];
const common = { idempotencyKey: z.string().uuid() };
export const generationSchema = z.discriminatedUnion("kind", [
  z.object({ ...common, kind: z.literal("TENANT"), leaseId: z.string().min(1).max(128), month: z.number().int().min(1).max(12), year: z.number().int().min(2020).max(2100), recipient: z.object({ name: z.string().trim().min(2).max(160), phone: z.string().trim().max(40), email: z.string().email().or(z.literal("")), address: z.string().trim().max(300) }), paymentInstructionIds: z.array(z.string().min(1).max(128)).min(1).max(5), notes: z.string().trim().max(500).default("") }),
  z.object({ ...common, kind: z.literal("AGENT_COMMISSION"), period: z.enum(["today", "week", "month", "all"]).default("month"), anchor: z.string().datetime().optional(), transactionId: z.string().min(1).max(128).optional() }),
  z.object({ ...common, kind: z.literal("SALE"), transactionId: z.string().min(1).max(128) }),
  z.object({ ...common, kind: z.literal("SALE_COMMISSION"), transactionId: z.string().min(1).max(128) }),
]);
export type GenerationInput = z.infer<typeof generationSchema>;
export const paymentInstructionSchema = z.object({
  id: z.string().max(128).optional(), label: z.string().trim().min(2).max(80), method: z.enum(["BANK_TRANSFER", "MOBILE_MONEY_AIRTEL", "MOBILE_MONEY_MTN", "CASH", "CHEQUE"]), active: z.boolean().default(true),
  details: z.object({ accountHolder: z.string().trim().max(160).default(""), bank: z.string().trim().max(100).default(""), accountNumber: z.string().trim().max(80).default(""), branch: z.string().trim().max(100).default(""), recipientPhone: z.string().trim().max(40).default(""), reference: z.string().trim().max(120).default(""), instructions: z.string().trim().max(300).default("") }),
}).superRefine((v, ctx) => {
  if (!v.active) return;
  const required = v.method === "BANK_TRANSFER" ? ["accountHolder", "bank", "accountNumber"] as const : v.method.startsWith("MOBILE_MONEY") ? ["accountHolder", "recipientPhone"] as const : ["instructions"] as const;
  for (const key of required) if (!v.details[key]) ctx.addIssue({ code: "custom", path: ["details", key], message: "This payment detail is required." });
});
export const snapshotSchema = z.object({
  version: z.literal(1), kind: z.enum([...statementKinds, "LANDLORD"]), title: z.string(), period: z.string(), asOf: z.string(),
  organization: z.object({ name: z.string(), logo: z.string().nullable(), address: z.string().nullable(), phone: z.string().nullable(), email: z.string().nullable() }),
  details: z.array(z.tuple([z.string(), z.string()])), notices: z.array(z.string()),
  sections: z.array(z.object({ title: z.string(), columns: z.array(z.string()), rows: z.array(z.array(z.string())) })),
  sourceTransactionIds: z.array(z.string()).default([]),
});
export type StatementSnapshot = z.infer<typeof snapshotSchema>;
export const commissionStatusLabels: Record<string, string> = { EXPECTED: "Expected", EARNED: "Earned — not recorded as paid to agent", PARTIALLY_RECEIVED: "Partially received by agency", RECEIVED: "Received by agency — not recorded as paid to agent", AGENT_PAID_OUT: "Agent payout recorded" };
export function statementUrl(id: string) { return `/statements/${encodeURIComponent(id)}`; }
export async function prepareStatement(input: GenerationInput): Promise<string> {
  const response = await fetch("/api/statement-documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const body = await response.json();
  if (!response.ok || !body.success || !body.id) throw new Error(body.error || "Unable to prepare statement.");
  return body.id;
}
