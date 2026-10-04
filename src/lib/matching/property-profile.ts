import type { MatchingCandidate, MatchingMetadata } from "./types";
type Numeric = number | string | { toString(): string } | null;
export type PropertyProfileSource = Omit<MatchingCandidate, "askingPrice" | "rentalPrice" | "bathrooms" | "plotSizeSqm" | "matchingMetadata"> & { askingPrice: Numeric; rentalPrice: Numeric; bathrooms: Numeric; plotSizeSqm?: Numeric; matchingMetadata?: unknown };
export function buildPropertyMatchingCandidate(source: PropertyProfileSource): MatchingCandidate {
  const metadata = source.matchingMetadata && typeof source.matchingMetadata === "object" ? source.matchingMetadata as Record<string, unknown> : {};
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  const matchingMetadata: MatchingMetadata = { nearbyAreas: strings(metadata.nearbyAreas), features: strings(metadata.features), keywords: strings(metadata.keywords) };
  return { ...source, bathrooms: source.bathrooms == null ? null : Number(source.bathrooms), askingPrice: source.askingPrice == null ? null : Number(source.askingPrice), rentalPrice: source.rentalPrice == null ? null : Number(source.rentalPrice), plotSizeSqm: source.plotSizeSqm == null ? null : Number(source.plotSizeSqm), matchingMetadata };
}
