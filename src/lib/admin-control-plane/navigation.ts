export const CONTROL_PLANE_NAVIGATION = {
  primary: [
    { label: "Overview", href: "/admin" },
    { label: "Agencies", href: "/admin/agencies" },
    { label: "Subscriptions", href: "/admin/subscriptions" },
    { label: "Governance", href: "/admin/staff" },
  ],
  governance: [
    { label: "Users", href: "/admin/staff" },
    { label: "MCP Studio", href: "/admin/mcp" },
  ],
} as const;
