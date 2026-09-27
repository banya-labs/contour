export type ConveyanceState = "MISSING" | "PENDING" | "VERIFIED";

export function getConveyanceState(documents: Array<{ isVerified: boolean }>): ConveyanceState {
  if (documents.some((document) => document.isVerified)) return "VERIFIED";
  if (documents.length > 0) return "PENDING";
  return "MISSING";
}
