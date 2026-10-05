import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

describe("shared dashboard and PWA contact validation", () => {
  const contact = { name: "  Buyer  ", phone: "+260971111111", email: "", notes: "  Repeat client  " };
  it("requires name and phone while leaving email and notes optional", () => {
    expect(contactSchema.parse(contact)).toMatchObject({ name: "Buyer", notes: "Repeat client" });
    expect(contactSchema.safeParse({ name: "Buyer", phone: contact.phone }).success).toBe(true);
    expect(contactSchema.safeParse({ ...contact, name: "  " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...contact, phone: "" }).success).toBe(false);
  });
  it("rejects invalid email and overlong notes before a write", () => {
    expect(contactSchema.safeParse({ ...contact, email: "invalid" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...contact, notes: "a".repeat(1001) }).success).toBe(false);
  });
});
