import type { AdminOwner } from "./types";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment due",
  suspended: "Suspended",
  canceled: "Canceled",
};

export function formatSubscriptionState(status: string | null | undefined): string {
  return STATUS_LABELS[status?.toLowerCase() || ""] || "Unknown";
}

export function formatTrialOrPaymentDue(input: { status: string; trialEndsAt: string | null; nextPaymentAt: string | null }): string {
  if (input.status.toLowerCase() === "trialing" && input.trialEndsAt) return `Trial ends ${new Date(input.trialEndsAt).toLocaleDateString()}`;
  if (input.nextPaymentAt) return `Payment due ${new Date(input.nextPaymentAt).toLocaleDateString()}`;
  return "No due date recorded";
}

export function formatAdminCurrency(amount: number | null, currency: string): string {
  if (amount === null || !Number.isFinite(amount)) return "Not recorded";
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAgencyOwner(owners: AdminOwner[]): string {
  if (owners.length === 0) return "Unassigned";
  if (owners.length > 1) return "Multiple owners";
  return `${owners[0].name} · ${owners[0].email}`;
}
