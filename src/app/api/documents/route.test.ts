import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ tenant: vi.fn(), existing: vi.fn(), create: vi.fn(), audit: vi.fn(), property: vi.fn(), grant: vi.fn(), configured: vi.fn(), head: vi.fn() }));
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: mocks.tenant }));
vi.mock("@/lib/db", () => ({ db: { property: { findFirst: mocks.property }, vaultAccessGrant: { findUnique: mocks.grant }, vaultDocument: { findFirst: mocks.existing, create: mocks.create }, auditLog: { create: mocks.audit } } }));
vi.mock("@/lib/storage/s3", () => ({ s3Storage: { isConfigured: mocks.configured, headObject: mocks.head } }));
import { POST } from "./route";
const body = { title: "Title deed", docType: "TITLE_DEED", objectKey: "org-a/title_deed/123_deed.pdf", originalFileName: "deed.pdf", fileSize: 1, mimeType: "text/html", fileType: "PDF" };
const post = (payload = body) => POST(new NextRequest("http://localhost/api/documents", { method: "POST", body: JSON.stringify(payload) }));
beforeEach(() => { vi.clearAllMocks(); mocks.tenant.mockResolvedValue({ organizationId: "org-a", userId: "owner", contourRole: "OWNER", permissions: ["vault.upload"] }); mocks.configured.mockReturnValue(true); mocks.head.mockResolvedValue({ contentType: "application/pdf", contentLength: 500 }); mocks.create.mockImplementation(async ({ data }) => ({ id: "doc", ...data })); mocks.audit.mockResolvedValue({}); mocks.property.mockResolvedValue(null); });
describe("metadata upload registration", () => {
  it.each(["local:/uploads/vault/org-a/../../.env", "org-b/title_deed/123_deed.pdf", "org-a/title_deed/%2e%2e"])("rejects unsafe objectKey %s before any HEAD or create", async (objectKey) => { const response = await post({ ...body, objectKey }); expect(response.status).toBe(400); expect(mocks.head).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled(); });
  it("persists server HEAD metadata rather than claimed MIME/size", async () => { const response = await post(); expect(response.status).toBe(201); expect(mocks.create.mock.calls[0][0].data).toMatchObject({ mimeType: "application/pdf", fileSize: 500, uploadedBy: "owner" }); });
  it("rejects cross-tenant property relation before write", async () => { const response = await post({ ...body, propertyId: "foreign-property" } as typeof body); expect(response.status).toBe(404); expect(mocks.property).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign-property", organizationId: "org-a" } })); expect(mocks.create).not.toHaveBeenCalled(); });
  it("fails with 503 instead of storing nonexistent original", async () => { mocks.configured.mockReturnValue(false); const response = await post(); expect(response.status).toBe(503); expect(mocks.create).not.toHaveBeenCalled(); });
  it("honors explicit upload denial for management", async () => { mocks.tenant.mockResolvedValue({ organizationId: "org-a", userId: "owner", contourRole: "OWNER", permissions: [] }); expect((await post()).status).toBe(403); expect(mocks.create).not.toHaveBeenCalled(); });
  it("rejects active actual object MIME before create", async () => { mocks.head.mockResolvedValue({ contentType: "image/svg+xml", contentLength: 200 }); expect((await post()).status).toBe(400); expect(mocks.create).not.toHaveBeenCalled(); });
});
