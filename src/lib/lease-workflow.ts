export function requiresLeaseSetup(input: { lookingFor: string; outcome?: string | null; hasLease: boolean }): boolean {
  return input.lookingFor === "FOR_RENT" && input.outcome === "WON" && !input.hasLease;
}
