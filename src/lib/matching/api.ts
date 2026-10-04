import { NextResponse } from "next/server";
import type { ApiContext } from "../api-handler";
import { MatchingError } from "./service";
import type { MatchingScope } from "./visibility";
export function matchingScope(context: ApiContext): MatchingScope {
  if (!context.organizationId || !context.userId) throw new MatchingError("Authentication required", 401);
  return { organizationId: context.organizationId, userId: context.userId, permissions: context.permissions || [] };
}
export async function matchingResponse(run: () => Promise<unknown>) {
  try { return NextResponse.json({ success: true, ...await run() as object }); }
  catch (error) { if (error instanceof MatchingError) return NextResponse.json({ success: false, error: error.message }, { status: error.status }); throw error; }
}
