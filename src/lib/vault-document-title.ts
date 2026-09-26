export function resolveVaultDocumentTitle(input: { uploadedTitle?: string | null; requestTitle?: string | null; originalFileName: string }): string {
  return input.uploadedTitle?.trim() || input.requestTitle?.trim() || input.originalFileName;
}
