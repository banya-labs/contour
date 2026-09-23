import type { SyncMutation } from "./types";
import type { SyncMutationStatus } from "./constants";

const MAX_RETRIES = 5;

type MutationInput<TPayload> = Omit<SyncMutation<TPayload>, "status" | "createdAt" | "retryCount"> & {
  mutationId?: string;
};

export function createMutation<TPayload>(input: MutationInput<TPayload>): SyncMutation<TPayload> {
  return {
    ...input,
    mutationId: input.mutationId || crypto.randomUUID(),
    status: "QUEUED",
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
}

export function shouldRetryMutation(input: Pick<SyncMutation, "status" | "retryCount">): boolean {
  return (input.status === "QUEUED" || input.status === "FAILED") && input.retryCount < MAX_RETRIES;
}

export function nextMutationStatus(status: SyncMutationStatus, lastError?: string): Pick<SyncMutation, "status" | "lastError"> {
  return { status, lastError };
}

export function incrementRetry<TPayload>(mutation: SyncMutation<TPayload>, lastError: string): SyncMutation<TPayload> {
  const retryCount = mutation.retryCount + 1;
  return {
    ...mutation,
    retryCount,
    status: retryCount >= MAX_RETRIES ? "FAILED" : "QUEUED",
    lastError,
  };
}
