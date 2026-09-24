import { createAuthClient } from "better-auth/react";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { clearLocalOfflineCache } from "./powersync";
import { emitWorkspaceMutation } from "./workspace-events";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  plugins: [organizationClient(), twoFactorClient()],
});

/**
 * Safe signOut wrapper — clears local caches before calling better-auth's signOut.
 * IMPORTANT: Do NOT mutate authClient.signOut directly — it corrupts the Proxy
 * and causes '[object Promise]' is not a valid HTTP method errors.
 */
export async function contourSignOut(
  ...args: Parameters<typeof authClient.signOut>
) {
  clearLocalOfflineCache();
  emitWorkspaceMutation(["tenant-reset"]);
  if (typeof document !== "undefined") {
    document.cookie =
      "contour_last_page=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  return authClient.signOut(...args);
}

export const signOut = contourSignOut;
export const { signIn, signUp, useSession } = authClient;


