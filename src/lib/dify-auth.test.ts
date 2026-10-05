import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  db: {
    apiKey: { findUnique: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    member: { findUnique: vi.fn() },
    property: { findFirst: vi.fn() },
    vaultAccessGrant: { findUnique: vi.fn() },
    vaultDocument: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  rate: vi.fn(),
  sign: vi.fn(),
}));
vi.mock("./db", () => ({ db: mocks.db }));
vi.mock("./rate-limiter", () => ({ checkRateLimit: mocks.rate }));
vi.mock("./storage/s3", () => ({ s3Storage: { getPresignedDownloadUrl: mocks.sign } }));
import { authenticateDifyRequest, machineVisibleDocuments, type DifyTenantContext } from "./dify-auth";
import { POST as documentTool } from "../app/api/dify/tools/documents/route";

const request = (path = "/api/dify/tools/documents", token = "tenant-key") => new NextRequest(`https://contour.test${path}`, { headers: { authorization: `Bearer ${token}` } });
const key = { id: "key-a", name: "test", status: "active", organizationId: "org-a", userId: "user-a", permissions: ["read:documents"], organization: { accountStatus: "ACTIVE" }, user: { role: "SUPER_ADMIN" } };
const member = { status: "active", role: "member", roleAssignments: [{ role: { key: "VAULT_MANAGER" } }], permissionOverrides: [] };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_DEV_MODE", "false");
  vi.stubEnv("DIFY_MASTER_SECRET", "");
  mocks.db.apiKey.findUnique.mockResolvedValue(key);
  mocks.db.apiKey.update.mockResolvedValue({});
  mocks.db.member.findUnique.mockResolvedValue(member);
  mocks.rate.mockResolvedValue({ allowed: true, resetSeconds: 60 });
  mocks.sign.mockResolvedValue("https://storage.test/signed");
  mocks.db.auditLog.create.mockResolvedValue({});
});

describe("document tool export boundary", () => {
  const document = { id: "doc-a", organizationId: "org-a", propertyId: "property-a", objectKey: "org-a/title_deed/123_deed.pdf", originalFileName: "deed.pdf", docType: "TITLE_DEED", classification: "CONFIDENTIAL_PII" };
  const toolRequest = () => new NextRequest("https://contour.test/api/dify/tools/documents", { method: "POST", headers: { authorization: "Bearer tenant-key", "content-type": "application/json" }, body: "{}" });
  it("limits malformed direct-tool requests before parsing their bodies", async () => {
    mocks.rate.mockResolvedValue({ allowed: false, resetSeconds: 3 });
    const response = await documentTool(new NextRequest("https://contour.test/api/dify/tools/documents", { method: "POST", body: "invalid json" }));
    expect(response.status).toBe(429);
    expect(mocks.db.apiKey.findUnique).not.toHaveBeenCalled();
  });
  it("does not sign documents outside the member's folder grant", async () => {
    mocks.db.vaultDocument.findMany.mockResolvedValue([document]);
    mocks.db.property.findFirst.mockResolvedValue({ id: "property-a", assignedAgentId: "other", status: "AVAILABLE" });
    mocks.db.vaultAccessGrant.findUnique.mockResolvedValue({ accessLevel: "SPECIFIC_FOLDERS", propertyIds: [] });
    const response = await documentTool(toolRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ totalDocuments: 0, documents: [] });
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("signs only a granted tenant object and excludes forged namespace metadata", async () => {
    mocks.db.vaultDocument.findMany.mockResolvedValue([document, { ...document, id: "forged", objectKey: "org-b/title_deed/123_deed.pdf" }]);
    mocks.db.property.findFirst.mockResolvedValue({ id: "property-a", assignedAgentId: "other", status: "AVAILABLE" });
    mocks.db.vaultAccessGrant.findUnique.mockResolvedValue({ accessLevel: "SPECIFIC_FOLDERS", propertyIds: ["property-a"] });
    const response = await documentTool(toolRequest());
    expect(await response.json()).toMatchObject({ totalDocuments: 1 });
    expect(mocks.sign).toHaveBeenCalledExactlyOnceWith(document.objectKey, 900);
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("machine credential authorization", () => {
  it("denies default scopes for confidential document export", async () => {
    mocks.db.apiKey.findUnique.mockResolvedValue({ ...key, permissions: ["read:properties", "write:inquiries"] });
    expect((await authenticateDifyRequest(request())).errorResponse?.status).toBe(403);
  });
  it("denies removed and suspended members without trusting the global user role", async () => {
    mocks.db.member.findUnique.mockResolvedValue(null);
    expect((await authenticateDifyRequest(request())).errorResponse?.status).toBe(403);
    mocks.db.member.findUnique.mockResolvedValue({ ...member, status: "suspended" });
    expect((await authenticateDifyRequest(request())).errorResponse?.status).toBe(403);
  });
  it("enforces explicit download denial and key revocation", async () => {
    mocks.db.member.findUnique.mockResolvedValue({ ...member, permissionOverrides: [{ permission: "vault.download", effect: "DENY" }] });
    expect((await authenticateDifyRequest(request())).errorResponse?.status).toBe(403);
    mocks.db.apiKey.findUnique.mockResolvedValue({ ...key, status: "revoked" });
    expect((await authenticateDifyRequest(request())).errorResponse?.status).toBe(403);
  });
  it("returns membership authority and applies each direct-tool limit once", async () => {
    const result = await authenticateDifyRequest(request());
    expect(result.context).toMatchObject({ principal: "user", contourRole: "VAULT_MANAGER", userRole: "FIELD_AGENT" });
    expect(mocks.rate.mock.calls.map(([key]) => key)).toEqual(["mcp:ip:unknown", expect.stringMatching(/^mcp:key:/), "mcp:org:org-a"]);
  });
  it("leaves MCP transport rate limiting to its handler", async () => {
    expect((await authenticateDifyRequest(request("/api/mcp"), undefined, "get_property_documents")).context).not.toBeNull();
    expect(mocks.rate).not.toHaveBeenCalled();
  });
  it("returns throttling with retry-after and does not query data", async () => {
    mocks.rate.mockResolvedValue({ allowed: false, resetSeconds: 9 });
    const result = await authenticateDifyRequest(request());
    expect(result.errorResponse?.status).toBe(429);
    expect(result.errorResponse?.headers.get("Retry-After")).toBe("9");
    expect(mocks.db.apiKey.findUnique).not.toHaveBeenCalled();
  });
  it("denies a key selecting a different organization", async () => {
    expect((await authenticateDifyRequest(request(), "org-b")).errorResponse?.status).toBe(403);
  });
  it("requires a real active organization for explicit master service authority", async () => {
    vi.stubEnv("DIFY_MASTER_SECRET", "service-key");
    mocks.db.organization.findUnique.mockResolvedValue(null);
    expect((await authenticateDifyRequest(request(undefined, "service-key"), "org-a")).errorResponse?.status).toBe(403);
    mocks.db.organization.findUnique.mockResolvedValue({ id: "org-a", accountStatus: "SUSPENDED" });
    expect((await authenticateDifyRequest(request(undefined, "service-key"), "org-a")).errorResponse?.status).toBe(403);
    mocks.db.organization.findUnique.mockResolvedValue({ id: "org-a", accountStatus: "ACTIVE" });
    expect((await authenticateDifyRequest(request(undefined, "service-key"), "org-a")).context).toMatchObject({ principal: "service", contourRole: "OWNER", organizationId: "org-a" });
    expect(mocks.db.member.findUnique).not.toHaveBeenCalled();
  });
});

describe("machine vault folder authority", () => {
  const actor: DifyTenantContext = { organizationId: "org-a", userId: "user-a", principal: "user", contourRole: "VAULT_MANAGER", permissions: ["vault.read", "vault.download"] };
  const document = { organizationId: "org-a", propertyId: "property-a", objectKey: "org-a/title_deed/123_deed.pdf" };
  it("excludes unassigned, foreign-namespace, and forbidden folders before signing", async () => {
    mocks.db.property.findFirst.mockResolvedValue({ id: "property-a", assignedAgentId: "other", status: "AVAILABLE" });
    mocks.db.vaultAccessGrant.findUnique.mockResolvedValue(null);
    expect(await machineVisibleDocuments(actor, [document])).toEqual([]);
    expect(await machineVisibleDocuments(actor, [{ ...document, objectKey: "org-b/title_deed/123_deed.pdf" }])).toEqual([]);
    mocks.db.vaultAccessGrant.findUnique.mockResolvedValue({ accessLevel: "SPECIFIC_FOLDERS", propertyIds: ["different-property"] });
    expect(await machineVisibleDocuments(actor, [document])).toEqual([]);
  });
  it("retains documents in granted folders with both export permissions", async () => {
    mocks.db.property.findFirst.mockResolvedValue({ id: "property-a", assignedAgentId: "other", status: "AVAILABLE" });
    mocks.db.vaultAccessGrant.findUnique.mockResolvedValue({ accessLevel: "SPECIFIC_FOLDERS", propertyIds: ["property-a"] });
    expect(await machineVisibleDocuments(actor, [document])).toEqual([document]);
    expect(await machineVisibleDocuments({ ...actor, permissions: ["vault.read"] }, [document])).toEqual([]);
  });
});
