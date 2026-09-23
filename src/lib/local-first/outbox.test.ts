import { describe, expect, it } from "vitest";
import { createMutation, nextMutationStatus, shouldRetryMutation } from "./outbox";

describe("offline mutation outbox", () => {
  it("creates a queued mutation with a stable idempotency key", () => {
    const mutation = createMutation({
      organizationId: "org_a",
      userId: "user_a",
      entityType: "INQUIRY",
      entityId: "client_1",
      operation: "CREATE",
      payload: { clientName: "A" },
      mutationId: "mutation_1",
    });

    expect(mutation).toMatchObject({ mutationId: "mutation_1", status: "QUEUED", retryCount: 0 });
  });

  it("does not retry a confirmed, conflicted, or exhausted mutation", () => {
    expect(shouldRetryMutation({ status: "QUEUED", retryCount: 0 })).toBe(true);
    expect(shouldRetryMutation({ status: "CONFIRMED", retryCount: 0 })).toBe(false);
    expect(shouldRetryMutation({ status: "CONFLICT", retryCount: 0 })).toBe(false);
    expect(shouldRetryMutation({ status: "FAILED", retryCount: 5 })).toBe(false);
  });

  it("keeps server conflicts actionable", () => {
    expect(nextMutationStatus("CONFLICT", "stale version")).toEqual({ status: "CONFLICT", lastError: "stale version" });
    expect(nextMutationStatus("CONFIRMED")).toEqual({ status: "CONFIRMED", lastError: undefined });
  });
});
