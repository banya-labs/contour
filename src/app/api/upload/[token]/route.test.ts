import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ request: vi.fn(), consume: vi.fn(), create: vi.fn(), existing: vi.fn(), configured: vi.fn(), head: vi.fn(), presign: vi.fn(), consent: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { documentRequest: { findUnique: mocks.request, updateMany: mocks.consume }, vaultDocument: { findFirst: mocks.existing, create: mocks.create } } }));
vi.mock("@/lib/storage/s3", () => ({ s3Storage: { isConfigured: mocks.configured, headObject: mocks.head, getPresignedUploadUrl: mocks.presign } }));
vi.mock("@/lib/zambia-dpa", () => ({ recordClientConsent: mocks.consent }));
import { POST } from "./route";
const request = { id: "request", organizationId: "org-a", propertyId: null, inquiryId: null, title: "Verification", status: "PENDING", pinHash: null, maxFiles: 3, maxSizeMbPerFile: 25, expiresAt: new Date(Date.now() + 100000) };
const send = (body: unknown) => POST(new NextRequest("http://localhost/api/upload/token", { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ token: "token" }) });
beforeEach(() => { vi.clearAllMocks(); mocks.request.mockResolvedValue(request); mocks.existing.mockResolvedValue(null); mocks.consume.mockResolvedValue({ count: 1 }); mocks.configured.mockReturnValue(true); mocks.head.mockResolvedValue({ contentType: "application/pdf", contentLength: 500 }); mocks.create.mockImplementation(async ({ data }) => ({ id: "doc", ...data })); });
describe("client document upload capability", () => {
  it.each(["presign", "complete"])("requires configured PIN for %s instead of trusting prior client verification", async (action) => { mocks.request.mockResolvedValue({ ...request, pinHash: createHash("sha256").update("1234").digest("hex") }); const result = await send({ action, filename: "deed.pdf", mimeType: "application/pdf", consent: { agreed: true }, files: [] }); expect(result.status).toBe(401); expect(mocks.presign).not.toHaveBeenCalled(); expect(mocks.consume).not.toHaveBeenCalled(); });
  it("rejects cross-tenant key before consuming the one-time request", async () => { const response = await send({ action: "complete", consent: { agreed: true }, files: [{ objectKey: "org-b/title_deed/123_deed.pdf", originalFileName: "deed.pdf" }] }); expect(response.status).toBe(400); expect(mocks.consume).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled(); });
  it("rejects active MIME during presign", async () => { const response = await send({ action: "presign", filename: "evil.svg", mimeType: "image/svg+xml" }); expect(response.status).toBe(400); expect(mocks.presign).not.toHaveBeenCalled(); });
  it("fails clearly when private storage is absent", async () => { mocks.configured.mockReturnValue(false); expect((await send({ action: "presign", filename: "deed.pdf", mimeType: "application/pdf" })).status).toBe(503); expect(mocks.presign).not.toHaveBeenCalled(); });
  it("saves only server-observed passive MIME and size", async () => { const response = await send({ action: "complete", consent: { agreed: true }, files: [{ objectKey: "org-a/title_deed/123_deed.pdf", originalFileName: "deed.pdf", fileSize: 1, mimeType: "text/html" }] }); expect(response.status).toBe(200); expect(mocks.create.mock.calls[0][0].data).toMatchObject({ mimeType: "application/pdf", fileSize: 500, isVerified: false }); });
});
