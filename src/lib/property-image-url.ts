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

export function normalizePropertyImageUrl(url: string, bucketName = "contour-vault"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (!appUrl || !url) return url;

  try {
    const parsed = new URL(url);
    const marker = `/${bucketName}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    const objectKey = markerIndex >= 0 ? parsed.pathname.slice(markerIndex + marker.length) : "";
    if (objectKey.includes("/property_photo/") && !url.includes("/api/properties/images/")) {
      return `${appUrl}/api/properties/images/${objectKey}`;
    }
  } catch {
    // Keep non-URL values unchanged; the gallery will handle its normal fallback.
  }

  return url;
}
