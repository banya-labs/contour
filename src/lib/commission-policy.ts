export type CommissionListingType = "FOR_SALE" | "FOR_RENT" | "BOTH";

export class CommissionOverrideForbiddenError extends Error {
  constructor() {
    super("Only owners and broker managers can override commission percentages.");
    this.name = "CommissionOverrideForbiddenError";
  }
}

export function defaultCommissionPct(listingType: CommissionListingType): number {
  return listingType === "FOR_RENT" ? 10 : 5;
}

type ResolveCommissionPctInput = {
  listingType: CommissionListingType;
  propertyPct?: number | null;
  requestedPct?: number;
  canOverride: boolean;
};

export function resolveCommissionPct({
  listingType,
  propertyPct,
  requestedPct,
  canOverride,
}: ResolveCommissionPctInput): number {
  if (requestedPct !== undefined) {
    if (!canOverride) throw new CommissionOverrideForbiddenError();
    return requestedPct;
  }

  return propertyPct ?? defaultCommissionPct(listingType);
}
