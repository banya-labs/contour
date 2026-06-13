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
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Inventory", href: "/listings" },
      { label: "Clients", href: "/clients" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Deals", href: "/deals" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    label: "Action",
    items: [
      { label: "Insights", href: "/insights" },
      { label: "Work Queue", href: "/work-items" },
    ],
  },
] as const;
