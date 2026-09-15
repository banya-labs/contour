/**
 * URL Slug Sanitization & Validation Utility (Layer 2 & SEO Standard)
 * Ensures all property and category slugs are search-engine optimized,
 * lowercase, and free of invalid characters or trailing punctuation.
 */

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace duplicate hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
