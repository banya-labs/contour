import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { clearLocalOfflineCache } from "./powersync";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  plugins: [organizationClient()],
});

const rawSignOut = authClient.signOut.bind(authClient);

authClient.signOut = (async (...args: Parameters<typeof rawSignOut>) => {
  clearLocalOfflineCache();
  return rawSignOut(...args);
}) as typeof rawSignOut;

export const signOut = authClient.signOut;
export const { signIn, signUp, useSession } = authClient;

