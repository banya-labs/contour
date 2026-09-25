import { describe, expect, it } from "vitest";
import { filterContacts, normalizeInquiryContact, sortContactsAlphabetically, type ContactRow } from "./contacts-view-model";

const inquiry = (overrides: Record<string, unknown> = {}) => ({
  id: "inq-1",
  clientName: "  zanele Dube ",
  clientPhone: "+260 97 000 0000",
  clientEmail: "zanele@example.com",
  notes: "[Source: WEBSITE] Three bedroom home",
  preferredSuburbs: ["Kabulonga"],
  budgetMax: 2500000,
  currency: "ZMW",
  lookingFor: "FOR_SALE",
  status: "NEW_INQUIRY",
  assignedAgent: null,
  assignedAgentId: null,
  ...overrides,
});

describe("contacts view model", () => {
  it("normalizes an inquiry into a contact row", () => {
    expect(normalizeInquiryContact(inquiry())).toMatchObject({
      id: "inq-1",
      name: "zanele Dube",
      phone: "+260 97 000 0000",
      email: "zanele@example.com",
      lookingFor: "Three bedroom home",
      purpose: "BUY",
    });
  });

  it("sorts contacts alphabetically without changing the original array", () => {
    const rows = [
      normalizeInquiryContact(inquiry({ id: "2", clientName: "bongani Banda" })),
      normalizeInquiryContact(inquiry({ id: "1", clientName: "Alice Phiri" })),
    ];

    expect(sortContactsAlphabetically(rows).map((row) => row.name)).toEqual(["Alice Phiri", "bongani Banda"]);
    expect(rows.map((row) => row.id)).toEqual(["2", "1"]);
  });

  it("searches name, phone, and email and filters assignment", () => {
    const rows: ContactRow[] = [
      normalizeInquiryContact(inquiry({ id: "1", clientName: "Alice Phiri", assignedAgentId: "agent-1", assignedAgent: { name: "Grace" } })),
      normalizeInquiryContact(inquiry({ id: "2", clientName: "Bongani Banda", clientPhone: "+260 96 123 4567", clientEmail: "bongani@example.com" })),
    ];

    expect(filterContacts(rows, { search: "bongani@example.com", status: "ALL", assignment: "ALL" }).map((row) => row.id)).toEqual(["2"]);
    expect(filterContacts(rows, { search: "", status: "ALL", assignment: "ASSIGNED" }).map((row) => row.id)).toEqual(["1"]);
  });
});
