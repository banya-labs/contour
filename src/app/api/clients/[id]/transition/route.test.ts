import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { ApiHandlerOptions } from "@/lib/api-handler";
import { z } from "zod";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn(), transaction: vi.fn(), audit: vi.fn(), workflow: vi.fn(), permissions: [] as string[], role: "FIELD_AGENT" }));
vi.mock("@/lib/db", () => ({ db: { inquiry: { findFirst: mocks.findFirst }, closingWorkflow: { findFirst: mocks.workflow }, $transaction: mocks.transaction, auditLog: { create: mocks.audit } } }));
vi.mock("@/lib/cache", () => ({ smartCache: { invalidateTag: vi.fn() } }));
vi.mock("@/lib/matching/service", () => ({ invalidateMatchingSummaries: vi.fn() }));
vi.mock("@/lib/closing-workflow-persistence", () => ({ ensureClosingWorkflow: vi.fn() }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: ApiHandlerOptions<unknown, unknown>) => async (req: NextRequest) => {
  try { return await options.handler(req, { params: { id: "inquiry" }, organizationId: "org", userId: "agent", contourRole: mocks.role as "FIELD_AGENT", permissions: mocks.permissions as [], body: options.bodySchema?.parse(await req.json()), query: {} }); }
  catch (error) { if (error instanceof Error && "status" in error) return NextResponse.json({ error: error.message }, { status: Number(error.status) }); throw error; }
} }));
import { POST } from "./route";
const call = (body: z.input<z.ZodType>) => POST(new NextRequest("http://localhost/api/clients/inquiry/transition", { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "inquiry" }) });
const inquiry = { id: "inquiry", status: "NEW_INQUIRY", propertyId: null, assignedAgentId: "agent", clientName: "Client", clientPhone: "260000000000", contactId: "contact", updatedAt: new Date(), followUpTasks: [], visits: [], documentRequests: [], lookingFor: "FOR_SALE", currency: "ZMW" };
describe("property-required transition boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.role = "FIELD_AGENT"; mocks.permissions = []; mocks.findFirst.mockResolvedValue(inquiry); mocks.update.mockResolvedValue({ ...inquiry, status: "CLOSED", property: null }); mocks.transaction.mockImplementation(async (run) => run({ inquiry: { update: mocks.update } })); });
  it.each(["QUALIFIED", "VIEWING_OR_OFFER", "NEGOTIATING", "VERIFICATION_CLOSING"])("rejects %s without writing", async (targetStage) => {
    const response = await call({ targetStage });
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ code: "PROPERTY_REQUIRED" }); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not let management override property assignment", async () => {
    mocks.role = "OWNER"; mocks.permissions = ["leads.assign"];
    expect((await call({ targetStage: "QUALIFIED", overrideMissingRequirements: true })).status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each(["LOST", "CANCELLED"])("records %s without a property", async (outcome) => {
    expect((await call({ targetStage: "CLOSED", outcome, reason: "The client withdrew the inquiry." })).status).toBe(200);
    expect(mocks.update.mock.calls[0][0].data).toMatchObject({ status: "CLOSED", outcome });
  });
  it("requires a property before Won workflow checks", async () => {
    mocks.role = "OWNER";
    expect(await (await call({ targetStage: "CLOSED", outcome: "WON" })).json()).toMatchObject({ code: "PROPERTY_REQUIRED" });
    expect(mocks.workflow).not.toHaveBeenCalled();
  });
  it("allows progression with persisted attachment and conditionally checks it during update", async () => {
    mocks.findFirst.mockResolvedValue({ ...inquiry, propertyId: "property" });
    expect((await call({ targetStage: "QUALIFIED" })).status).toBe(200);
    expect(mocks.update.mock.calls[0][0].where).toMatchObject({ organizationId: "org", propertyId: "property", status: "NEW_INQUIRY", assignedAgentId: "agent" });
    expect(mocks.findFirst.mock.calls[0][0].where).toMatchObject({ organizationId: "org", OR: [{ assignedAgentId: "agent" }, { assignedAgentId: null }] });
  });
  it("rejects hidden inquiries and handles a concurrent detach without advancing", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    expect((await call({ targetStage: "QUALIFIED" })).status).toBe(404);
    mocks.findFirst.mockResolvedValue({ ...inquiry, propertyId: "property" });
    mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Concurrent change", { code: "P2025", clientVersion: "test" }));
    expect((await call({ targetStage: "QUALIFIED" })).status).toBe(409);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
