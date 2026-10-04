import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import type { ZodType } from "zod";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks } }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: { bodySchema: ZodType; handler: (req: NextRequest, ctx: unknown) => Promise<NextResponse> }) => async (req: NextRequest) => options.handler(req, { params: { id: "sale" }, organizationId: "org", contourRole: "OWNER", body: options.bodySchema.parse(await req.json()) }) }));
import { PATCH } from "./route";
describe("sale transfer persistence", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findFirst.mockResolvedValue({ id: "sale", transferStatus: "SALE_AGREED", transferStartedAt: null, transferCompletedAt: null }); mocks.update.mockResolvedValue({ id: "sale" }); });
  it("updates title transfer without changing commission accounting status", async () => {
    const response = await PATCH(new NextRequest("http://localhost/api/sales/sale/transfer", { method: "PATCH", body: JSON.stringify({ status: "TRANSFER_IN_PROGRESS", transferReference: "REF-1" }) }), { params: Promise.resolve({ id: "sale" }) });
    expect(response.status).toBe(200);
    const data = mocks.update.mock.calls[0][0].data;
    expect(data.transferStatus).toBe("TRANSFER_IN_PROGRESS");
    expect(data).not.toHaveProperty("status");
    expect(data.transferStartedAt).toBeInstanceOf(Date);
  });
  it("keeps a completed title transfer from moving backwards", async () => {
    mocks.findFirst.mockResolvedValue({ id: "sale", transferStatus: "TRANSFER_COMPLETE" });
    const response = await PATCH(new NextRequest("http://localhost/api/sales/sale/transfer", { method: "PATCH", body: JSON.stringify({ status: "SALE_AGREED" }) }), { params: Promise.resolve({ id: "sale" }) });
    expect(response.status).toBe(409); expect(mocks.update).not.toHaveBeenCalled();
  });
});
