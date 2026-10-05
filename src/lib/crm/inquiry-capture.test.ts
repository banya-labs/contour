import { describe, expect, it } from "vitest";
import { buildInquiryCapturePayload } from "./inquiry-capture";
describe("contact-linked inquiry capture", () => {
  const form = { lookingFor: "FOR_RENT" as const, propertyType: "APARTMENT" as const, currency: "ZMW" as const, budgetMax: "6000", bedroomsMin: "3", bathroomsMin: "2", areaMinSqm: "100", preferredSuburbs: ["Roma"], idempotencyKey: "pwa-inquiry-first", notes: "request" };
  const contact = { id: "contact", name: "Buyer", phone: "+260971111111" };
  it("requires a contact and carries typed matching criteria", () => {
    expect(() => buildInquiryCapturePayload(form, null)).toThrow("Select a contact");
    expect(buildInquiryCapturePayload(form, contact)).toMatchObject({ contactId: "contact", bedroomsMin: 3, bathroomsMin: 2, areaMinSqm: 100, budgetMax: 6000, status: "NEW_INQUIRY", idempotencyKey: "pwa-inquiry-first" });
  });
  it("keeps retries stable and separate requests distinct", () => {
    expect(buildInquiryCapturePayload(form, contact).idempotencyKey).toBe(buildInquiryCapturePayload(form, contact).idempotencyKey);
    expect(buildInquiryCapturePayload({ ...form, idempotencyKey: "pwa-inquiry-second" }, contact).idempotencyKey).not.toBe(form.idempotencyKey);
  });
  it("rejects invalid numeric requirements before queueing", () => { expect(() => buildInquiryCapturePayload({ ...form, bedroomsMin: "-1" }, contact)).toThrow(); });
  it("requires property type and written requirements like the dashboard", () => {
    expect(() => buildInquiryCapturePayload({ ...form, propertyType: "" as typeof form.propertyType }, contact)).toThrow();
    expect(() => buildInquiryCapturePayload({ ...form, notes: "   " }, contact)).toThrow("Property requirements");
  });
  it("preserves custom locations, lead source and attached deal details", () => {
    expect(buildInquiryCapturePayload({ ...form, preferredSuburbs: ["  Makeni East  "], leadSource: "WHATSAPP", propertyId: "property", dealValue: 5500, existingInquiryId: "inquiry" }, contact)).toMatchObject({ preferredSuburbs: ["Makeni East"], leadSource: "WHATSAPP", propertyId: "property", dealValue: 5500, existingInquiryId: "inquiry", creationSurface: "PWA" });
  });
  it("leaves location and budget optional and rejects reversed budget ranges", () => {
    expect(buildInquiryCapturePayload({ ...form, preferredSuburbs: [], budgetMax: "" }, contact)).toMatchObject({ preferredSuburbs: [], budgetMax: undefined });
    expect(() => buildInquiryCapturePayload({ ...form, budgetMin: "7000" }, contact)).toThrow("Minimum budget");
  });
  it("retains an existing inquiry's pipeline stage when attaching a deal", () => {
    expect(buildInquiryCapturePayload({ ...form, existingInquiryId: "inquiry", status: "NEGOTIATING" }, contact)).toMatchObject({ existingInquiryId: "inquiry", status: "NEGOTIATING" });
  });
});
