import { s3Storage } from "@/lib/storage/s3";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Resolve current agency branding for display without changing saved financial snapshots. */
export async function resolveStatementLogo(organizationId: string, logo: string | null | undefined): Promise<string | null> {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  if (!logo.startsWith(`${organizationId}/organization_logo/`)) return null;
  try {
    const metadata = await s3Storage.headObject(logo);
    if (metadata.contentLength <= 0 || metadata.contentLength > MAX_LOGO_BYTES || !LOGO_TYPES.has(metadata.contentType)) return null;
    const object = await s3Storage.getObject(logo);
    if (object.body.length > MAX_LOGO_BYTES || !LOGO_TYPES.has(object.contentType)) return null;
    // Inline the small uploaded logo so browser print/PDF does not depend on S3 CORS or expiring URLs.
    return `data:${object.contentType};base64,${object.body.toString("base64")}`;
  } catch {
    return null;
  }
}
