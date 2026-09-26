import { describe, expect, it } from "vitest";
import { resolveVaultDocumentTitle } from "./vault-document-title";

describe("resolveVaultDocumentTitle", () => {
  it("uses the request title for secure requested uploads", () => {
    expect(resolveVaultDocumentTitle({ requestTitle: "Client NRC and passport", originalFileName: "scan-1.pdf" })).toBe("Client NRC and passport");
  });

  it("preserves a title entered for a direct upload", () => {
    expect(resolveVaultDocumentTitle({ uploadedTitle: "Certificate of Title - Plot 12", requestTitle: "Property documents", originalFileName: "title.pdf" })).toBe("Certificate of Title - Plot 12");
  });

  it("falls back to the original filename when no title exists", () => {
    expect(resolveVaultDocumentTitle({ originalFileName: "proof.pdf" })).toBe("proof.pdf");
  });
});
