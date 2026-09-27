export function requiresLeaseSetup(input: { lookingFor: string; outcome?: string | null; hasLease: boolean }): boolean {
  return input.lookingFor === "FOR_RENT" && input.outcome === "WON" && !input.hasLease;
}

export function nextActionAfterClose(input: { lookingFor: string; outcome?: string | null; inquiryId: string; propertyId?: string | null }) {
  if (input.lookingFor !== "FOR_RENT" || input.outcome !== "WON") return null;
  return { type: "LEASE_SETUP_REQUIRED" as const, inquiryId: input.inquiryId, propertyId: input.propertyId ?? null };
}
