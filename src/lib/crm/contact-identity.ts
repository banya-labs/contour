export function normalizeContactPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildContactIdentity(
  organizationId: string,
  phone: string,
  name = "Unknown contact",
): string {
  const normalizedPhone = normalizeContactPhone(phone);
  return normalizedPhone
    ? `${organizationId}:${normalizedPhone}`
    : `${organizationId}:name:${name.trim().toLowerCase() || "unknown contact"}`;
}
