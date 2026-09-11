import { describe, expect, it } from "vitest";
import { S3StorageService } from "./s3";

describe("S3 storage service", () => {
  it("creates tenant-prefixed, sanitized object keys", () => {
    const storage = new S3StorageService();
    const key = storage.generateObjectKey("org-a", "TITLE_DEED", "Title Deed 2026!!.PDF");

    expect(key).toMatch(/^org-a\/title_deed\/\d+_title-deed-2026-\.pdf$/);
  });

  it("rejects presigning when storage credentials are missing", async () => {
    const previousAccessKey = process.env.S3_ACCESS_KEY_ID;
    const previousSecretKey = process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;

    await expect(
      new S3StorageService().getPresignedUploadUrl("org-a", "TITLE_DEED", "deed.pdf", "application/pdf"),
    ).rejects.toThrow("S3_ACCESS_KEY_ID is required");

    if (previousAccessKey) process.env.S3_ACCESS_KEY_ID = previousAccessKey;
    if (previousSecretKey) process.env.S3_SECRET_ACCESS_KEY = previousSecretKey;
  });
});
