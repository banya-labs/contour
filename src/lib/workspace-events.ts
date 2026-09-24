"use client";

export type WorkspaceMutationScope =
  | "pipeline"
  | "clients"
  | "properties"
  | "leases"
  | "sales"
  | "commissions"
  | "documents"
  | "organization"
  | "dashboard"
  | "agent"
  | "tenant-reset";

export type WorkspaceMutationEventDetail = {
  scopes: WorkspaceMutationScope[];
  entityId?: string;
};

export const WORKSPACE_MUTATION_EVENT = "contour:workspace-mutated";

export function emitWorkspaceMutation(
  scopes: WorkspaceMutationScope[],
  entityId?: string,
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<WorkspaceMutationEventDetail>(WORKSPACE_MUTATION_EVENT, {
      detail: { scopes, entityId },
    }),
  );
}

export function mutationTouchesScope(
  detail: WorkspaceMutationEventDetail,
  scope: WorkspaceMutationScope,
): boolean {
  return detail.scopes.includes(scope) || detail.scopes.includes("tenant-reset");
}
