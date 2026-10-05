import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ find: vi.fn(), access: vi.fn(), binary: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: { handler: unknown }) => options.handler }));
vi.mock("@/lib/db", () => ({ db: { vaultDocument: { findFirst: mocks.find }, auditLog: { create: mocks.audit } } }));
vi.mock("@/lib/storage/vault-security", async (importOriginal) => { const actual = await importOriginal<typeof import("@/lib/storage/vault-security")>(); return { ...actual, assertVaultAccess: mocks.access, readVaultBinary: mocks.binary }; });
import { VaultSecurityError } from "@/lib/storage/vault-security";
import { GET as preview } from "./[id]/preview/route";
import { GET as download } from "./[id]/download/route";
const ctx = { params: { id: "doc" }, organizationId: "org-a", userId: "agent", permissions: ["vault.read", "vault.download"], body: {}, query: {} };
const call = (handler: unknown, url: string) => (handler as (req: NextRequest, context: typeof ctx) => Promise<Response>)(new NextRequest(url), ctx);
beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue({ id: "doc", organizationId: "org-a", objectKey: "org-a/title_deed/123_deed.pdf", mimeType: "application/pdf", originalFileName: "deed.pdf" }); mocks.access.mockResolvedValue(undefined); mocks.binary.mockResolvedValue({ body: Buffer.from("%PDF-original"), contentType: "application/pdf" }); mocks.audit.mockResolvedValue({}); });
describe("vault binary route enforcement", () => {
  it("checks grants before preview and download read any bytes", async () => { mocks.access.mockRejectedValue(new VaultSecurityError("Forbidden", 403)); expect((await call(preview, "http://localhost/api/vault/documents/doc/preview")).status).toBe(403); expect((await call(download, "http://localhost/api/vault/documents/doc/download?direct=true")).status).toBe(403); expect(mocks.binary).not.toHaveBeenCalled(); });
  it("returns sandboxed passive preview with no-store and nosniff", async () => { const result = await call(preview, "http://localhost/api/vault/documents/doc/preview"); expect(result.headers.get("content-security-policy")).toContain("sandbox"); expect(result.headers.get("cache-control")).toBe("private, no-store"); expect(result.headers.get("x-content-type-options")).toBe("nosniff"); expect(await result.text()).toBe("%PDF-original"); });
  it("returns 503 for missing originals without fabricated certificate", async () => { mocks.binary.mockRejectedValue(new VaultSecurityError("Original document file is unavailable", 503)); const result = await call(download, "http://localhost/api/vault/documents/doc/download?direct=true"); expect(result.status).toBe(503); expect(result.headers.get("content-type")).toContain("application/json"); expect(await result.text()).not.toContain("OFFICIAL STATUTORY"); });
});
