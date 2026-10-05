import { beforeEach, describe, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ headObject: vi.fn(), getObject: vi.fn() }));
vi.mock("@/lib/storage/s3", () => ({ s3Storage: storage }));
import { resolveStatementLogo } from "./branding";
beforeEach(() => { vi.resetAllMocks(); storage.headObject.mockResolvedValue({ contentLength: 3, contentType: "image/png" }); storage.getObject.mockResolvedValue({ body: Buffer.from("png"), contentType: "image/png" }); });
describe("statement agency logo resolution", () => {
  it("embeds an uploaded private logo for preview, print and PDF", async () => {
    expect(await resolveStatementLogo("agency", "agency/organization_logo/logo.png")).toBe("data:image/png;base64,cG5n");
    expect(storage.getObject).toHaveBeenCalledWith("agency/organization_logo/logo.png");
  });
  it("uses no agency image when none is uploaded", async () => {
    expect(await resolveStatementLogo("agency", null)).toBeNull();
    expect(storage.getObject).not.toHaveBeenCalled();
  });
  it("does not resolve another tenant's object or arbitrary vault files", async () => {
    expect(await resolveStatementLogo("agency", "other/organization_logo/logo.png")).toBeNull();
    expect(await resolveStatementLogo("agency", "agency/title_deed/file.png")).toBeNull();
    expect(storage.headObject).not.toHaveBeenCalled();
  });
  it("preserves legacy public image URLs without fetching them on the server", async () => {
    expect(await resolveStatementLogo("agency", "https://images.example/logo.png")).toBe("https://images.example/logo.png");
    expect(storage.getObject).not.toHaveBeenCalled();
  });
  it("falls back safely when storage fails or metadata is invalid", async () => {
    storage.headObject.mockRejectedValueOnce(new Error("Unavailable"));
    expect(await resolveStatementLogo("agency", "agency/organization_logo/logo.png")).toBeNull();
    storage.headObject.mockResolvedValue({ contentLength: 3 * 1024 * 1024, contentType: "image/png" });
    expect(await resolveStatementLogo("agency", "agency/organization_logo/logo.png")).toBeNull();
    expect(storage.getObject).not.toHaveBeenCalled();
  });
});
