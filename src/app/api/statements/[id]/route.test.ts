import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import type { ApiContext } from "@/lib/api-handler";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), options: { requirePermissions: [] as string[] } }));
vi.mock("@/lib/db", () => ({ db: { landlordStatement: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: { requirePermissions: string[]; handler: (req: NextRequest, ctx: ApiContext) => Promise<NextResponse> }) => {
  mocks.options.requirePermissions = options.requirePermissions;
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => options.handler(req, { params: await context.params, organizationId: "org-a" });
} }));
import { GET } from "./route";

describe("landlord statement viewer access", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requires statement read permission and scopes the saved statement to the active organization", async () => {
    mocks.findFirst.mockResolvedValue({ id: "stmt-1", landlordName: "Fixture Landlord" });
    const response = await GET(new NextRequest("https://contour.test/api/statements/stmt-1"), { params: Promise.resolve({ id: "stmt-1" }) });
    expect(mocks.options.requirePermissions).toEqual(["statements.read"]);
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({ id: "stmt-1", organizationId: "org-a" });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect((await response.json()).statement.id).toBe("stmt-1");
  });
  it("returns a non-disclosing 404 for a missing or another workspace's statement", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await GET(new NextRequest("https://contour.test/api/statements/foreign"), { params: Promise.resolve({ id: "foreign" }) });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ success: false, error: "Statement not found." });
  });
});
