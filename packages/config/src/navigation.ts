export const contourCockpits = [
  {
    key: "portfolio",
    label: "Portfolio",
    summary: "Inventory, listings, clients, and document readiness.",
  },
  {
    key: "revenue",
    label: "Revenue",
    summary: "Deals, payment plans, rentals, and arrears.",
  },
  {
    key: "action",
    label: "Action",
    summary: "Insights, work queue, sync status, and follow-ups.",
  },
] as const;

export const contourNavigation = [
  {
    label: "Portfolio",
    items: [{ label: "Inventory" }, { label: "Clients" }],
  },
  {
    label: "Revenue",
    items: [{ label: "Deals" }, { label: "Collections" }],
  },
  {
    label: "Action",
    items: [{ label: "Insights" }, { label: "Work Queue" }],
  },
] as const;
