export type ContourNavigationItem = {
  label: string;
  href: string;
};

export type ContourNavigationGroup = {
  label: string;
  href?: string;
  items: ContourNavigationItem[];
};

export const contourCockpits = [
  {
    key: "portfolio",
    label: "Portfolio",
    summary: "Inventory, listings, clients, and document readiness.",
  },
  {
    key: "finance",
    label: "Finance",
    summary: "Deals, payment plans, leases, and payment receipts.",
  },
  {
    key: "action",
    label: "Action",
    summary: "Insights, work queue, sync status, and follow-ups.",
  },
] as const;

export const contourNavigation: ContourNavigationGroup[] = [
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
];
