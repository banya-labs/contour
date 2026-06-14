import { describe, expect, it } from "vitest";
import { contourCockpits, contourNavigation } from "./navigation";

describe("contourNavigation", () => {
  it("exposes the three cockpit groups", () => {
    expect(contourCockpits.map((item) => item.key)).toEqual([
      "portfolio",
      "finance",
      "action",
    ]);
  });

  it("includes role-aware navigation sections", () => {
    expect(contourNavigation).toMatchObject([
      {
        label: "Dashboard",
        items: [{ label: "Overview", href: "/" }],
      },
      {
        label: "Portfolio",
        items: [
          { label: "Inventory", href: "/listings" },
          { label: "Clients", href: "/clients" },
        ],
      },
      {
        label: "Finance",
        href: "/finance",
        items: [
          { label: "Payment plans", href: "/finance/payment-plans" },
          { label: "Leases", href: "/finance/leases" },
          { label: "Payment Receipts", href: "/finance/payment-receipts" },
        ],
      },
      {
        label: "Action",
        items: [
          { label: "Insights", href: "/insights" },
          { label: "Work Queue", href: "/work-items" },
        ],
      },
    ]);
  });
});
