import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyLencoSignature } from "./lenco";

describe("Lenco webhook signatures", () => {
  it("accepts a valid HMAC signature", () => {
    const previousApiKey = process.env.LENCO_API_KEY;
    process.env.LENCO_API_KEY = "test-api-token";
    const body = JSON.stringify({ event: "transaction.successful", reference: "ref-1" });
    const webhookHashKey = crypto.createHash("sha256").update("test-api-token").digest("hex");
    const signature = crypto.createHmac("sha512", webhookHashKey).update(body).digest("hex");

    expect(verifyLencoSignature(body, signature)).toBe(true);
    expect(verifyLencoSignature(body, `${signature.slice(0, -1)}0`)).toBe(false);

    if (previousApiKey === undefined) delete process.env.LENCO_API_KEY;
    else process.env.LENCO_API_KEY = previousApiKey;
  });

  it("rejects signatures when the API token is missing", () => {
    const previousApiKey = process.env.LENCO_API_KEY;
    delete process.env.LENCO_API_KEY;

    expect(verifyLencoSignature("{}", "anything")).toBe(false);

    if (previousApiKey) process.env.LENCO_API_KEY = previousApiKey;
  });
});
