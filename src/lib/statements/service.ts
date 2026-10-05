import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ApiContext } from "@/lib/api-handler";
import { isManagementRole, roleHasPermission, type Permission } from "@/lib/authorization";
import { MatchingError } from "@/lib/matching/errors";
import { formatCurrency } from "@/lib/utils";
import { calculateTenantLedger, ledgerPaymentPeriodWhere } from "./ledger";
import { resolveEarningsPeriod } from "./period";
import { commissionStatusLabels, generationSchema, paymentInstructionSchema, snapshotSchema, type GenerationInput, type StatementSnapshot } from "./document";

export function hasStatementPermission(ctx: ApiContext, permission: Permission) {
  return ctx.permissions ? ctx.permissions.includes(permission) : roleHasPermission(ctx.contourRole || "FIELD_AGENT", permission);
}
function requirePermission(ctx: ApiContext, permission: Permission) {
  if (!hasStatementPermission(ctx, permission)) throw new MatchingError("Statement access denied.", 403);
}
const canReadAgencyCommissions = (ctx: ApiContext) => isManagementRole(ctx.contourRole) && hasStatementPermission(ctx, "finance.read");
export async function assertDocumentAccess(ctx: ApiContext, document: { kind: string; leaseId: string | null; transactionId: string | null; agentId: string | null }) {
  if (document.kind === "AGENT_COMMISSION") {
    const agencyAccess = canReadAgencyCommissions(ctx);
    if (!agencyAccess) requirePermission(ctx, "pwa.access");
    if (!agencyAccess && document.agentId !== ctx.userId) throw new MatchingError("Statement not found.", 404);
    if (document.transactionId && !await db.transaction.findFirst({ where: { id: document.transactionId, organizationId: ctx.organizationId, ...(agencyAccess ? {} : { closingAgentId: ctx.userId }) }, select: { id: true } })) throw new MatchingError("Statement not found.", 404);
    return;
  }
  if (document.kind === "TENANT") {
    requirePermission(ctx, "leases.read");
    const lease = await db.lease.findFirst({ where: { id: document.leaseId || "", organizationId: ctx.organizationId }, select: { id: true, inquiry: { select: { assignedAgentId: true } }, property: { select: { assignedAgentId: true } } } });
    if (!lease || (ctx.contourRole === "FIELD_AGENT" && lease.inquiry?.assignedAgentId !== ctx.userId && lease.property.assignedAgentId !== ctx.userId)) throw new MatchingError("Statement not found.", 404);
    return;
  }
  requirePermission(ctx, "finance.read");
  if (!await db.transaction.findFirst({ where: { id: document.transactionId || "", organizationId: ctx.organizationId, transactionType: "PROPERTY_SALE", ...(ctx.contourRole === "FIELD_AGENT" ? { closingAgentId: ctx.userId } : {}) }, select: { id: true } })) throw new MatchingError("Statement not found.", 404);
}
const date = (value: Date | null, timezone: string) => value ? value.toLocaleDateString("en-GB", { timeZone: timezone }) : "Not recorded";
const money = (value: Prisma.Decimal | string | number | null, currency: string) => value === null ? "Not recorded" : formatCurrency(Number(value), currency);

async function buildSnapshot(ctx: ApiContext, input: GenerationInput) {
  const org = await db.organization.findUnique({ where: { id: ctx.organizationId }, select: { name: true, logo: true, profile: true } });
  if (!org) throw new MatchingError("Workspace not found.", 404);
  const timezone = org.profile?.timezone || "Africa/Lusaka";
  const snapshot: StatementSnapshot = { version: 1, kind: input.kind, title: "", period: "", asOf: new Date().toISOString(), organization: { name: org.name, logo: org.logo, address: org.profile?.primaryOfficeAddress || null, phone: org.profile?.primaryPhone || null, email: org.profile?.primaryEmail || null }, details: [], sections: [], notices: [], sourceTransactionIds: [] };
  if (input.kind === "TENANT") {
    requirePermission(ctx, "leases.read");
    const lease = await db.lease.findFirst({ where: { id: input.leaseId, organizationId: ctx.organizationId }, include: { property: { select: { title: true, suburb: true, city: true, assignedAgentId: true } }, inquiry: { select: { assignedAgentId: true } } } });
    if (!lease) throw new MatchingError("Lease not found.", 404);
    await assertDocumentAccess(ctx, { kind: input.kind, leaseId: lease.id, transactionId: null, agentId: null });
    const instructions = await db.statementPaymentInstruction.findMany({ where: { id: { in: input.paymentInstructionIds }, organizationId: ctx.organizationId, active: true } });
    if (instructions.length !== new Set(input.paymentInstructionIds).size) throw new MatchingError("Select valid agency payment instructions.", 400);
    const paymentWhere = { leaseId: lease.id, organizationId: ctx.organizationId, paymentDate: { lte: new Date(snapshot.asOf) }, ...ledgerPaymentPeriodWhere(lease.openingBalanceYear || input.year, lease.openingBalanceMonth || input.month, input.year, input.month) };
    const paymentCount = await db.rentPayment.count({ where: paymentWhere });
    if (paymentCount > 5000) throw new MatchingError("This lease has more than 5,000 payments. Verify a recent opening balance before exporting.", 400);
    const payments = await db.rentPayment.findMany({ where: paymentWhere, orderBy: [{ paymentDate: "asc" }, { id: "asc" }], take: 5001 });
    if (payments.length > 5000) throw new MatchingError("Select a more recent verified opening balance (maximum 5,000 payments).", 400);
    const ledger = calculateTenantLedger({ ...lease, baseline: lease.openingBalance !== null && lease.openingBalanceVerifiedAt && lease.openingBalanceMonth && lease.openingBalanceYear ? { amount: lease.openingBalance, month: lease.openingBalanceMonth, year: lease.openingBalanceYear } : null, payments, month: input.month, year: input.year, timezone, now: new Date(snapshot.asOf) });
    snapshot.title = "Tenant rental statement";
    snapshot.period = new Date(Date.UTC(input.year, input.month - 1, 15)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: timezone });
    snapshot.details = [["Prepared for", input.recipient.name], ["Phone", input.recipient.phone || "Not recorded"], ["Email", input.recipient.email || "Not recorded"], ["Recipient address", input.recipient.address || "Not recorded"], ["Managed property", lease.property.title], ["Property location", `${lease.property.suburb}, ${lease.property.city}`], ["Lease reference", lease.id], ["Rent due day", String(lease.paymentDayOfMonth)]];
    snapshot.sections.push({ title: `Rental account (${lease.currency})`, columns: ["Description", "Amount"], rows: [["Opening balance", money(ledger.openingBalance, lease.currency)], ["Full monthly rent charged", money(ledger.rentCharged, lease.currency)], ["Confirmed rent payments", money(ledger.confirmedPayments, lease.currency)], [Number(ledger.closingBalance) < 0 ? "Closing credit" : "Closing balance", money(Math.abs(Number(ledger.closingBalance)), lease.currency)], ["Overdue arrears as of generation", money(ledger.arrears, lease.currency)]] });
    snapshot.sections.push({ title: "Confirmed payments allocated to this month", columns: ["Date", "Receipt / reference", "Method", "Amount"], rows: ledger.receipts.map(p => [date(p.paymentDate, timezone), `${p.receiptNumber}${p.referenceNumber ? ` · ${p.referenceNumber}` : ""}`, p.paymentMethod?.replace(/_/g, " ") || "Not recorded", money(p.amountPaid, lease.currency)]) });
    if (ledger.unconfirmed.length) snapshot.sections.push({ title: "Unconfirmed / bounced — excluded from balance", columns: ["Receipt", "Status", "Amount"], rows: ledger.unconfirmed.map(p => [p.receiptNumber, p.status.replace(/_/g, " "), money(p.amountPaid, lease.currency)]) });
    for (const instruction of instructions) {
      const valid = paymentInstructionSchema.parse({ ...instruction, details: instruction.details });
      const labels: Record<string, string> = { accountHolder: "Account holder / recipient", bank: "Bank", accountNumber: "Account number", branch: "Branch / code", recipientPhone: "Mobile-money number", reference: "Payment reference", instructions: "Instructions" };
      snapshot.sections.push({ title: `${valid.label} · ${valid.method.replace(/_/g, " ")}`, columns: ["Payment details", "Value"], rows: Object.entries(valid.details).filter(([, v]) => v).map(([k, v]) => [labels[k], v]) });
    }
    snapshot.notices = ["Amounts use full monthly rent and confirmed payments allocated to this lease. Deposits are not deducted as rent payments.", ...(input.notes ? [input.notes] : [])];
  } else if (input.kind === "AGENT_COMMISSION") {
    requirePermission(ctx, "pwa.access");
    const period = resolveEarningsPeriod(input.period, timezone, input.anchor ? new Date(input.anchor) : new Date());
    const where: Prisma.TransactionWhereInput = { organizationId: ctx.organizationId, closingAgentId: ctx.userId, ...(input.transactionId ? { id: input.transactionId } : { OR: [{ closedAt: { ...(period.start ? { gte: period.start } : {}), lt: period.end } }, { closedAt: null, createdAt: { ...(period.start ? { gte: period.start } : {}), lt: period.end } }] }) };
    const count = await db.transaction.count({ where });
    if (count > 5000) throw new MatchingError("Select a shorter earnings period (maximum 5,000 deals per statement).", 400);
    const deals = await db.transaction.findMany({ where, include: { property: { select: { title: true } }, closingAgent: { select: { name: true } } }, orderBy: [{ closedAt: "desc" }, { id: "asc" }], take: 5001 });
    if (input.transactionId && !deals.length) throw new MatchingError("Deal not found.", 404);
    snapshot.sourceTransactionIds = deals.map(t => t.id);
    const user = await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true } });
    snapshot.title = "Agent commission statement"; snapshot.period = input.transactionId ? "Individual deal" : period.label;
    snapshot.details = [["Agent", user?.name || "Not recorded"], ["Scope", input.transactionId || "Selected earnings filter"]];
    snapshot.sections = [{ title: "Recorded commission entitlements", columns: ["Deal / property", "Value / agency fee", "Agent split", "Status"], rows: deals.map(t => [`${t.property.title}\n${t.id}\n${date(t.closedAt || t.createdAt, timezone)} · ${t.transactionType.replace(/_/g, " ")}`, `${money(t.grossValue, t.currency)}\n${Number(t.agencyCommissionPct)}% · ${money(t.agencyCommissionAmount, t.currency)}`, `${Number(t.agentSplitPct)}% · ${money(t.agentSplitAmount, t.currency)}`, commissionStatusLabels[t.status]]) }];
    const totals = new Map<string, { entitlement: Prisma.Decimal; paid: Prisma.Decimal }>();
    for (const deal of deals) { const total = totals.get(deal.currency) || { entitlement: new Prisma.Decimal(0), paid: new Prisma.Decimal(0) }; total.entitlement = total.entitlement.plus(deal.agentSplitAmount); if (deal.status === "AGENT_PAID_OUT") total.paid = total.paid.plus(deal.agentSplitAmount); totals.set(deal.currency, total); }
    snapshot.sections.push({ title: "Totals by currency", columns: ["Currency", "Recorded split entitlements", "Agent payout recorded"], rows: [...totals].map(([currency, total]) => [currency, money(total.entitlement, currency), money(total.paid, currency)]) });
    snapshot.notices = ["Earned or agency-received commission does not confirm an agent payout. Settlement dates and partial paid amounts are not recorded in this ledger.", "Dates use commercial close date, or creation date where no close date is recorded."];
  } else {
    requirePermission(ctx, "finance.read");
    const t = await db.transaction.findFirst({ where: { id: input.transactionId, organizationId: ctx.organizationId, transactionType: "PROPERTY_SALE", ...(ctx.contourRole === "FIELD_AGENT" ? { closingAgentId: ctx.userId } : {}) }, include: { property: { select: { title: true, suburb: true, city: true, ownerName: true } }, inquiry: { select: { clientName: true, clientPhone: true, clientEmail: true } }, closingAgent: { select: { name: true } } } });
    if (!t) throw new MatchingError("Sale not found.", 404);
    snapshot.title = input.kind === "SALE" ? "Property sale statement" : "Internal sale commission statement";
    snapshot.period = date(t.closedAt, timezone);
    snapshot.details = [["Property", t.property.title], ["Location", `${t.property.suburb}, ${t.property.city}`], ["Seller / owner", t.property.ownerName || "Not recorded"], ["Buyer", t.inquiry?.clientName || "Not recorded"], ["Buyer contact", t.inquiry?.clientPhone || "Not recorded"], ["Sale reference", t.id]];
    snapshot.sections = [{ title: "Recorded sale", columns: ["Description", "Value"], rows: [["Agreed price", money(t.grossValue, t.currency)], ["Recorded deposit", money(t.depositAmount, t.currency)], ["Recorded balance", money(t.balanceAmount, t.currency)], ["Transfer status", t.transferStatus.replace(/_/g, " ")], ["Transfer reference", t.transferReference || "Not recorded"]] }];
    if (input.kind === "SALE_COMMISSION") snapshot.sections.push({ title: "Internal commission", columns: ["Description", "Value"], rows: [["Agency commission", `${Number(t.agencyCommissionPct)}% · ${money(t.agencyCommissionAmount, t.currency)}`], ["Closing agent", t.closingAgent.name], ["Agent split", `${Number(t.agentSplitPct)}% · ${money(t.agentSplitAmount, t.currency)}`], ["Commission status", commissionStatusLabels[t.status]]] });
    snapshot.notices = ["This statement summarizes recorded sale facts. It is not a payment receipt or proof of title transfer.", ...(input.kind === "SALE_COMMISSION" ? ["Internal use — contains commission information."] : [])];
  }
  return snapshotSchema.parse(snapshot);
}

export async function generateStatementDocument(ctx: ApiContext, input: GenerationInput) {
  if (!ctx.organizationId || !ctx.userId) throw new MatchingError("Workspace and authenticated user are required.", 401);
  const previous = await db.statementDocument.findUnique({ where: { organizationId_idempotencyKey: { organizationId: ctx.organizationId, idempotencyKey: input.idempotencyKey } } });
  if (previous) {
    if (previous.createdById !== ctx.userId || stableJson(previous.generationInput) !== stableJson(input)) throw new MatchingError("Generation key already used for a different statement.", 409);
    await assertDocumentAccess(ctx, previous); return { id: previous.id };
  }
  const snapshot = await buildSnapshot(ctx, input);
  const leaseId = input.kind === "TENANT" ? input.leaseId : null;
  const transactionId = "transactionId" in input ? input.transactionId || null : null;
  const agentId = input.kind === "AGENT_COMMISSION" ? ctx.userId : null;
  const seriesKey = input.kind === "TENANT" ? `TENANT:${leaseId}:${input.year}-${input.month}` : input.kind === "AGENT_COMMISSION" ? `AGENT:${agentId}:${transactionId || snapshot.period}` : `${input.kind}:${transactionId}`;
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${ctx.organizationId}:${seriesKey}`}, 0))`;
    const existing = await tx.statementDocument.findUnique({ where: { organizationId_idempotencyKey: { organizationId: ctx.organizationId!, idempotencyKey: input.idempotencyKey } } });
    if (existing) { if (existing.createdById !== ctx.userId || stableJson(existing.generationInput) !== stableJson(input)) throw new MatchingError("Generation key conflict.", 409); return { id: existing.id }; }
    const last = await tx.statementDocument.findFirst({ where: { organizationId: ctx.organizationId, seriesKey }, orderBy: { revision: "desc" }, select: { revision: true } });
    const saved = await tx.statementDocument.create({ data: { organizationId: ctx.organizationId!, createdById: ctx.userId!, kind: input.kind, leaseId, transactionId, agentId, seriesKey, revision: (last?.revision || 0) + 1, idempotencyKey: input.idempotencyKey, snapshot: snapshot as Prisma.InputJsonValue, generationInput: input as Prisma.InputJsonValue }, select: { id: true } });
    await tx.auditLog.create({ data: { organizationId: ctx.organizationId!, userId: ctx.userId, action: "STATEMENT_GENERATED", entityType: "StatementDocument", entityId: saved.id, details: { kind: input.kind, leaseId, transactionId } } });
    return saved;
  });
}
export async function readStatementDocument(ctx: ApiContext, id: string) {
  if (!ctx.organizationId || !ctx.userId) throw new MatchingError("Statement access denied.", 403);
  const document = await db.statementDocument.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!document) throw new MatchingError("Statement not found.", 404);
  await assertDocumentAccess(ctx, document);
  if (document.kind === "AGENT_COMMISSION") {
    const snapshot = snapshotSchema.parse(document.snapshot);
    const ids = snapshot.sourceTransactionIds;
    if (ids.length && await db.transaction.count({ where: { id: { in: ids }, organizationId: ctx.organizationId, ...(canReadAgencyCommissions(ctx) ? {} : { closingAgentId: ctx.userId }) } }) !== ids.length) throw new MatchingError("Statement not found.", 404);
  }
  const snapshot = snapshotSchema.parse(document.snapshot), generationInput = generationSchema.parse(document.generationInput);
  if (document.kind === "AGENT_COMMISSION" && document.agentId !== ctx.userId) return { id: document.id, revision: document.revision, snapshot, generationInput: null };
  return { id: document.id, revision: document.revision, snapshot, generationInput: generationInput.kind === "AGENT_COMMISSION" ? { ...generationInput, anchor: generationInput.anchor || snapshot.asOf } : generationInput };
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
