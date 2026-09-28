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

export function getControlPlanePrimaryItems() {
  return CONTROL_PLANE_NAVIGATION.primary;
}

export function isControlPlaneItemActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}
