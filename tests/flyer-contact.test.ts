import { describe, expect, it } from "vitest";
import { resolveFlyerContact } from "@/components/marketing/flyer-contact";

describe("resolveFlyerContact", () => {
  it("uses the assigned agent details when agent is selected", () => {
    expect(
      resolveFlyerContact(
        "agent",
        { name: "Assigned Agent", phone: "+260 970 000 000" },
        { name: "Agency", phone: "+260 960 000 000" },
      ),
    ).toMatchObject({ name: "Assigned Agent", phone: "+260 970 000 000" });
  });

  it("falls back to safe contact labels when the selected source is incomplete", () => {
    expect(resolveFlyerContact("agent", {}, { name: "Agency" })).toMatchObject({
      name: "Contour Agent",
      phone: "Contact for details",
    });
  });
});
