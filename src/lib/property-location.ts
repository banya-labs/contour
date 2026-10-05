/** Display recorded location values without inventing a city for incomplete records. */
export function formatPropertyLocation(
  property: { suburb?: string | null; city?: string | null } | null | undefined,
  fallback = "Location not recorded",
): string {
  const parts = [property?.suburb?.trim(), property?.city?.trim()].filter((part): part is string => Boolean(part));
  return parts.filter((part, index) => parts.findIndex(value => value.toLowerCase() === part.toLowerCase()) === index).join(", ") || fallback;
}
