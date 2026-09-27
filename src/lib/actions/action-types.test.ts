import { describe, expect, it } from "vitest";
import { buildActionIdempotencyKey, getActionType, type ActionStatus } from "./action-types";

describe("operational action contract", () => {
  it("builds a stable tenant-scoped idempotency key", () => {
    expect(buildActionIdempotencyKey("org-1", "ASSIGN_INQUIRY", "inq-1")).toBe(
      "org-1:ASSIGN_INQUIRY:inq-1"
    );
  });

  it("recognizes the supported action types", () => {
    expect(getActionType("REGISTER_LEASE")).toBe("REGISTER_LEASE");
  });

  it("exposes durable action statuses", () => {
    const status: ActionStatus = "FAILED";
    expect(status).toBe("FAILED");
  });
});
