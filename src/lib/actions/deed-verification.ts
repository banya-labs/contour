export type DeedVerificationResult = "VERIFIED" | "ALREADY_VERIFIED";

export function resolveDeedVerificationResult(isVerified: boolean): DeedVerificationResult {
  return isVerified ? "ALREADY_VERIFIED" : "VERIFIED";
}

export function isConveyanceDeed(docType: string): boolean {
  return docType === "TITLE_DEED";
}
