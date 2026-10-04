import { createInquirySchema } from "../validations";
import type { Currency, ListingType, PropertyType } from "@prisma/client";
import type { StrictRequirements } from "../matching/types";
type InquiryCapture = { lookingFor: ListingType; propertyType: PropertyType; currency: Currency; budgetMin?: string; budgetMax?: string; bedroomsMin?: string; bathroomsMin?: string; areaMinSqm?: string; preferredSuburbs: string[]; notes?: string; idempotencyKey: string; assignedAgentId?: string; matchingProfile?: { strictRequirements?: StrictRequirements } };
export function buildInquiryCapturePayload(form: InquiryCapture, contact: { id: string; name: string; phone: string; email?: string | null } | null) {
  if (!contact) throw new Error("Select a contact before creating an inquiry");
  const number = (value: string | undefined) => value?.trim() ? Number(value) : undefined;
  return createInquirySchema.parse({ ...form, budgetMin: number(form.budgetMin), budgetMax: number(form.budgetMax), bedroomsMin: number(form.bedroomsMin), bathroomsMin: number(form.bathroomsMin), areaMinSqm: number(form.areaMinSqm), contactId: contact.id, clientName: contact.name, clientPhone: contact.phone, clientEmail: contact.email || undefined, creationSurface: "PWA", status: "NEW_INQUIRY" });
}
