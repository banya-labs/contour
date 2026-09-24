import { describe, expect, it } from "vitest";
import { isDocumentRequestConsumed, ONE_TIME_UPLOAD_CONSUMED_MESSAGE } from "./document-request-status";

describe("one-time document upload requests", () => {
  it("only keeps pending requests available for upload", () => {
    expect(isDocumentRequestConsumed("PENDING")).toBe(false);
    expect(isDocumentRequestConsumed("FULFILLED")).toBe(true);
    expect(isDocumentRequestConsumed("EXPIRED")).toBe(true);
  });

  it("gives clients a clear recovery instruction after consumption", () => {
    expect(ONE_TIME_UPLOAD_CONSUMED_MESSAGE).toContain("already been used");
    expect(ONE_TIME_UPLOAD_CONSUMED_MESSAGE).toContain("new upload form from the agency");
  });
});
