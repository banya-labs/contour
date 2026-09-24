export function getPublicPropertyImageUrl(
  publicDomain: string | undefined,
  bucketName: string,
  objectKey: string,
): string | null {
  const domain = publicDomain?.trim().replace(/\/$/, "");
  if (!domain || !bucketName || !objectKey) return null;
  return `${domain}/${bucketName}/${objectKey}`;
}
