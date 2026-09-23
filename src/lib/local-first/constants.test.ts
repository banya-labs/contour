import { describe, expect, it } from "vitest";
import {
  OFFLINE_SUPPORTED_ROUTES,
  OFFLINE_TABLES,
  SENSITIVE_OFFLINE_EXCLUSIONS,
  SYNC_MUTATION_STATUSES,
} from "./constants";

describe("local-first contract", () => {
  it("defines the supported offline application routes", () => {
    expect(OFFLINE_SUPPORTED_ROUTES).toEqual(["/agent", "/kiosk"]);
  });

  it("defines durable mutation lifecycle statuses", () => {
    expect(SYNC_MUTATION_STATUSES).toEqual([
      "LOCAL_ONLY",
      "QUEUED",
      "SYNCING",
      "CONFIRMED",
      "FAILED",
      "CONFLICT",
    ]);
  });

  it("keeps sensitive data outside the offline replica", () => {
    expect(OFFLINE_TABLES).not.toContain("vault_documents");
    expect(OFFLINE_TABLES).not.toContain("bank_accounts");
    expect(OFFLINE_TABLES).not.toContain("payment_transactions");
    expect(SENSITIVE_OFFLINE_EXCLUSIONS).toEqual([
      "vault_documents",
      "bank_accounts",
      "payment_transactions",
      "title_deeds",
      "identity_documents",
    ]);
  });
});
