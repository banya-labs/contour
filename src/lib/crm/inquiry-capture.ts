import { createInquirySurfaceSchema } from "../validations";
import type { Currency, InquiryStatus, LeadSource, ListingType, PropertyType } from "@prisma/client";
import type { StrictRequirements } from "../matching/types";
type InquiryCapture = { lookingFor: ListingType; propertyType: PropertyType; currency: Currency; budgetMin?: string; budgetMax?: string; bedroomsMin?: string; bathroomsMin?: string; areaMinSqm?: string; preferredSuburbs: string[]; notes?: string; idempotencyKey: string; assignedAgentId?: string; leadSource?: LeadSource; status?: InquiryStatus; propertyId?: string; dealValue?: number; existingInquiryId?: string; matchingProfile?: { strictRequirements?: StrictRequirements } };
export function buildInquiryCapturePayload(form: InquiryCapture, contact: { id: string; name: string; phone: string; email?: string | null } | null) {
  if (!contact) throw new Error("Select a contact before creating an inquiry");
  if (!form.notes?.trim()) throw new Error("Property requirements are required.");
  if (form.budgetMin?.trim() && form.budgetMax?.trim() && Number(form.budgetMin) > Number(form.budgetMax)) throw new Error("Minimum budget cannot exceed maximum budget.");
  const number = (value: string | undefined) => value?.trim() ? Number(value) : undefined;
  return createInquirySurfaceSchema.parse({ ...form, notes: form.notes.trim(), budgetMin: number(form.budgetMin), budgetMax: number(form.budgetMax), bedroomsMin: number(form.bedroomsMin), bathroomsMin: number(form.bathroomsMin), areaMinSqm: number(form.areaMinSqm), contactId: contact.id, clientName: contact.name, clientPhone: contact.phone, clientEmail: contact.email || undefined, creationSurface: "PWA", status: form.status || "NEW_INQUIRY" });
}
