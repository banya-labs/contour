import type { PrismaClient } from "@prisma/client";
import { buildContactIdentity, normalizeContactPhone } from "./contact-identity";

type ContactDatabase = Pick<PrismaClient, "contact">;

export async function getOrCreateContact(
  database: ContactDatabase,
  input: { organizationId: string; name: string; phone: string; email?: string | null },
) {
  const phone = normalizeContactPhone(input.phone);
  const identityKey = buildContactIdentity(input.organizationId, phone, input.name);
  return database.contact.upsert({
    where: { organizationId_identityKey: { organizationId: input.organizationId, identityKey } },
    create: { organizationId: input.organizationId, identityKey, name: input.name.trim(), phone: phone || input.phone.trim(), email: input.email?.trim() || null },
    update: { name: input.name.trim(), phone: phone || input.phone.trim(), email: input.email?.trim() || undefined },
    select: { id: true, name: true, phone: true, email: true },
  });
}
