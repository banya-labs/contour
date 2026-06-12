import { describe, expect, it } from "vitest";
import { contourCockpits, contourNavigation } from "./navigation";

describe("contourNavigation", () => {
  it("exposes the three cockpit groups", () => {
    expect(contourCockpits.map((item) => item.key)).toEqual([
      "portfolio",
      "revenue",
      "action",
    ]);
  });

  it("includes role-aware navigation sections", () => {
    expect(contourNavigation).toMatchObject([
      {
        label: "Portfolio",
        items: [
          { label: "Inventory" },
          { label: "Clients" },
        ],
      },
      {
        label: "Revenue",
        items: [
          { label: "Deals" },
          { label: "Collections" },
        ],
      },
      {
        label: "Action",
        items: [
          { label: "Insights" },
          { label: "Work Queue" },
        ],
      },
    ]);
  });
});
