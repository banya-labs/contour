export const ONE_TIME_UPLOAD_CONSUMED_MESSAGE =
  "This upload link has already been used. Please request a new upload form from the agency if you need to re-upload a document or add another file.";

export function isDocumentRequestConsumed(status: string): boolean {
  return status !== "PENDING";
}
