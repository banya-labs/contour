/** These transports enforce bearer, HMAC or expiring capability authentication in their route handlers. */
export function usesRouteAuthentication(pathname: string): boolean {
  return pathname === "/api/webhooks/lenco" || pathname === "/api/mcp" || pathname === "/api/mcp/sse" || pathname.startsWith("/api/dify/tools/") || pathname.startsWith("/api/upload/");
}
