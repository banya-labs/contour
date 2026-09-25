export function getPublicPropertyImageUrl(
  publicDomain: string | undefined,
  bucketName: string,
  objectKey: string,
): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl && objectKey.includes("/property_photo/")) {
    return `${appUrl}/api/properties/images/${objectKey}`;
  }
  const domain = publicDomain?.trim().replace(/\/$/, "");
  if (!domain || !bucketName || !objectKey) return null;
  return `${domain}/${bucketName}/${objectKey}`;
}
