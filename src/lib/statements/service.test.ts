import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
const mocks = vi.hoisted(() => ({ org: vi.fn(), deal: vi.fn(), deals: vi.fn(), count: vi.fn(), user: vi.fn(), document: vi.fn(), existing: vi.fn(), create: vi.fn(), lease: vi.fn(), payments: vi.fn(), paymentCount: vi.fn(), instructions: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/db", () => { const tx = { $executeRaw: vi.fn(), statementDocument: { findUnique: mocks.existing, findFirst: vi.fn().mockResolvedValue(null), create: mocks.create }, auditLog: { create: mocks.audit } }; return { db: { organization: { findUnique: mocks.org }, transaction: { findFirst: mocks.deal, findMany: mocks.deals, count: mocks.count }, user: { findUnique: mocks.user }, lease: { findFirst: mocks.lease }, rentPayment: { findMany: mocks.payments, count: mocks.paymentCount }, statementPaymentInstruction: { findMany: mocks.instructions }, statementDocument: { findFirst: mocks.document, findUnique: mocks.existing }, $transaction: async (run: (client: typeof tx) => unknown) => run(tx) } }; });
import { assertDocumentAccess, generateStatementDocument, readStatementDocument } from "./service";
import type { ApiContext } from "@/lib/api-handler";
const ctx: ApiContext = { organizationId: "org", userId: "agent", contourRole: "OWNER", permissions: ["finance.read", "pwa.access", "leases.read"] };
const key = "00000000-0000-4000-8000-000000000001";
const decimal = (v: number) => new Prisma.Decimal(v);
beforeEach(() => {
  vi.clearAllMocks(); mocks.existing.mockResolvedValue(null); mocks.org.mockResolvedValue({ name: "Agency", logo: null, profile: { timezone: "Africa/Lusaka" } }); mocks.create.mockResolvedValue({ id: "doc" }); mocks.count.mockResolvedValue(1); mocks.user.mockResolvedValue({ name: "Agent" });
  mocks.deal.mockResolvedValue({ id: "t", property: { title: "Property", suburb: "Roma", city: "Lusaka", ownerName: "Owner" }, inquiry: null, closingAgent: { name: "Agent" }, grossValue: decimal(100000), currency: "ZMW", agencyCommissionPct: decimal(5), agencyCommissionAmount: decimal(5000), agentSplitPct: decimal(40), agentSplitAmount: decimal(2000), status: "EARNED", depositAmount: null, balanceAmount: null, closedAt: null, transferStatus: "SALE_AGREED", transferReference: null });
});
describe("financial statement disclosure and authorization", () => {
  it("excludes internal split from client-facing sale and preserves unknown deposits", async () => {
    await generateStatementDocument(ctx, { kind: "SALE", transactionId: "t", idempotencyKey: key }); const snapshot = mocks.create.mock.calls[0][0].data.snapshot;
    expect(JSON.stringify(snapshot)).not.toMatch(/Agent split|Agency commission|2000/);
    expect(snapshot.sections[0].rows).toContainEqual(["Recorded deposit", "Not recorded"]);
    expect(snapshot.details).toContainEqual(["Buyer", "Not recorded"]);
    expect(mocks.deal.mock.calls[0][0].where).toMatchObject({ organizationId: "org", transactionType: "PROPERTY_SALE" });
  });
  it("includes recorded internal commission but never asserts payout for EARNED", async () => {
    await generateStatementDocument(ctx, { kind: "SALE_COMMISSION", transactionId: "t", idempotencyKey: key }); const snapshot = mocks.create.mock.calls[0][0].data.snapshot;
    expect(JSON.stringify(snapshot)).toContain("40%"); expect(JSON.stringify(snapshot)).toContain("not recorded as paid");
  });
  it("refuses another agent's document even with a guessed id", async () => {
    mocks.document.mockResolvedValue({ kind: "AGENT_COMMISSION", agentId: "other", transactionId: null });
    await expect(readStatementDocument({ ...ctx, contourRole: "FIELD_AGENT", permissions: ["pwa.access"] }, "guessed")).rejects.toThrow("Statement not found.");
    expect(mocks.document.mock.calls[0][0].where).toEqual({ id: "guessed", organizationId: "org" });
  });
  it("permits finance-authorized management to read agency agent statements", async () => {
    await expect(assertDocumentAccess({ ...ctx, permissions: ["finance.read"] }, { kind: "AGENT_COMMISSION", agentId: "other", leaseId: null, transactionId: "t" })).resolves.toBeUndefined();
    expect(mocks.deal.mock.calls[0][0].where).toEqual({ id: "t", organizationId: "org" });
    await expect(assertDocumentAccess({ ...ctx, permissions: [] }, { kind: "AGENT_COMMISSION", agentId: "other", leaseId: null, transactionId: "t" })).rejects.toThrow(/access denied/i);
    mocks.document.mockResolvedValue({ id: "saved", revision: 1, kind: "AGENT_COMMISSION", agentId: "other", transactionId: null, generationInput: { kind: "AGENT_COMMISSION", period: "month", idempotencyKey: key }, snapshot: { version: 1, kind: "AGENT_COMMISSION", title: "Agent commission statement", period: "September 2026", asOf: "2026-09-30T12:00:00Z", organization: { name: "Agency", logo: null, address: null, phone: null, email: null }, details: [], sections: [], notices: [], sourceTransactionIds: [] } });
    mocks.org.mockResolvedValue({ logo: "https://images.example/current-agency-logo.png" });
    const read = await readStatementDocument(ctx, "saved");
    expect(read.generationInput).toBeNull();
    expect(read.snapshot.organization.logo).toBe("https://images.example/current-agency-logo.png");
    expect(mocks.document.mock.results[0] && (await mocks.document.mock.results[0].value).snapshot.organization.logo).toBeNull();
    expect((await readStatementDocument({ ...ctx, userId: "other", contourRole: "FIELD_AGENT", permissions: ["pwa.access"] }, "saved")).generationInput).toMatchObject({ kind: "AGENT_COMMISSION", period: "month" });
  });
  it("denies financial variants without finance permission", async () => {
    await expect(generateStatementDocument({ ...ctx, permissions: ["pwa.access"], contourRole: "FIELD_AGENT" }, { kind: "SALE_COMMISSION", transactionId: "t", idempotencyKey: key })).rejects.toThrow(/access denied/i);
    expect(mocks.deal).not.toHaveBeenCalled();
  });
  it("does not assume JSONB object key order for idempotent retries", async () => {
    mocks.existing.mockResolvedValue({ id: "same", kind: "SALE", transactionId: "t", createdById: "agent", generationInput: { transactionId: "t", idempotencyKey: key, kind: "SALE" } });
    expect(await generateStatementDocument(ctx, { kind: "SALE", transactionId: "t", idempotencyKey: key })).toEqual({ id: "same" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
