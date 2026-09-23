import { createHmac } from "node:crypto";
import { env } from "@/env";
import { getSyncScope } from "./sync-scope";

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function signPowerSyncToken(input: {
  userId: string;
  organizationId: string;
  role: string;
  expiresAt: number;
}): string {
  const scope = getSyncScope(input);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: input.userId,
    iss: "contour-auth",
    aud: "powersync",
    org_id: scope.organizationId,
    role: scope.role,
    assignment_agent_id: scope.assignmentFilter?.agentId,
    exp: input.expiresAt,
  });
  const unsigned = `${header}.${payload}`;
  const secret = env.POWERSYNC_JWT_SECRET || env.BETTER_AUTH_SECRET;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
