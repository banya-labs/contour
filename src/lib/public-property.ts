import { generateSlug } from "@/lib/slug";

/** Canonical comparison key used when enforcing property-name uniqueness. */
export function normalizePropertyTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Public property URLs are scoped by the owning organisation. */
export function publicPropertyPath(organizationSlug: string, propertySlug: string): string {
  return `/p/${encodeURIComponent(organizationSlug)}/${encodeURIComponent(propertySlug)}`;
}

export function propertySlugFromTitle(title: string): string {
  return generateSlug(title);
}
