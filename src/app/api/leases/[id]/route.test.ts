import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ find: vi.fn(), leaseUpdate: vi.fn(), propertyUpdate: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: { handler: unknown }) => options.handler }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/lib/cache", () => ({ smartCache: { invalidateTag: vi.fn() } }));
import { PATCH } from "./route";
const send = (action: "TERMINATE" | "RELIST") => (PATCH as unknown as (req: NextRequest, ctx: unknown) => Promise<Response>)(new NextRequest("http://localhost/api/leases/lease", { method: "PATCH" }), { params: { id: "lease" }, organizationId: "org", userId: "actor", body: { action, reason: "Cancellation requested" } });
beforeEach(() => { vi.clearAllMocks(); mocks.leaseUpdate.mockResolvedValue({ id: "lease", status: "TERMINATED" }); mocks.propertyUpdate.mockResolvedValue({ id: "property", status: "AVAILABLE" }); mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ lease: { findFirst: mocks.find, update: mocks.leaseUpdate }, property: { update: mocks.propertyUpdate }, auditLog: { create: mocks.audit } })); });
describe("lease termination inventory integrity", () => {
  it("rejects repeated termination of a historical lease before property mutation", async () => { mocks.find.mockResolvedValueOnce({ id: "lease", propertyId: "property", status: "TERMINATED" }); await expect(send("TERMINATE")).rejects.toMatchObject({ status: 409 }); expect(mocks.propertyUpdate).not.toHaveBeenCalled(); });
  it("protects a successor active lease when historical lease is relisted", async () => { mocks.find.mockResolvedValueOnce({ id: "lease", propertyId: "property", status: "TERMINATED" }).mockResolvedValueOnce({ id: "successor" }); await expect(send("RELIST")).rejects.toMatchObject({ status: 409 }); expect(mocks.propertyUpdate).not.toHaveBeenCalled(); });
  it("terminates only current state and relists only tenant-owned nonarchived inventory in serializable transaction", async () => { mocks.find.mockResolvedValueOnce({ id: "lease", propertyId: "property", status: "ACTIVE" }).mockResolvedValueOnce(null); expect((await send("TERMINATE")).status).toBe(200); expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" }); expect(mocks.leaseUpdate.mock.calls[0][0].where).toEqual({ id: "lease", organizationId: "org", status: "ACTIVE" }); expect(mocks.propertyUpdate.mock.calls[0][0].where).toMatchObject({ organizationId: "org", status: { notIn: ["SOLD", "ARCHIVED"] } }); });
});
