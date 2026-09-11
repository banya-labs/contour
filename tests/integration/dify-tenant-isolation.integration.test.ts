import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

vi.mock("@/lib/dify-auth", () => ({
  authenticateDifyRequest: vi.fn(),
}));

describe.skipIf(!hasTestDatabase)("Dify tenant isolation", () => {
  let db: typeof import("@/lib/db").db;
  let postProperties: typeof import("@/app/api/dify/tools/properties/route").POST;
  let authenticateDifyRequest: typeof import("@/lib/dify-auth").authenticateDifyRequest;
  let organizationA: string;
  let organizationB: string;
  let userA: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    ({ db } = await import("@/lib/db"));
    ({ POST: postProperties } = await import("@/app/api/dify/tools/properties/route"));
    ({ authenticateDifyRequest } = await import("@/lib/dify-auth"));

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({
      data: { name: `Tenant test user ${suffix}`, email: `tenant-test-${suffix}@example.test` },
    });
    const [orgA, orgB] = await Promise.all([
      db.organization.create({ data: { name: `Tenant A ${suffix}`, slug: `tenant-a-${suffix}` } }),
      db.organization.create({ data: { name: `Tenant B ${suffix}`, slug: `tenant-b-${suffix}` } }),
    ]);

    organizationA = orgA.id;
    organizationB = orgB.id;
    userA = user.id;

    await db.member.create({ data: { organizationId: organizationA, userId: userA, role: "owner" } });
    await db.property.createMany({
      data: [
        {
          organizationId: organizationA,
          title: "Tenant A Listing",
          slug: `tenant-a-listing-${suffix}`,
          description: "Only visible to tenant A",
          suburb: "Kabulonga",
          createdById: userA,
        },
        {
          organizationId: organizationB,
          title: "Tenant B Listing",
          slug: `tenant-b-listing-${suffix}`,
          description: "Must never cross the tenant boundary",
          suburb: "Woodlands",
          createdById: userA,
        },
      ],
    });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: [organizationA, organizationB] } } });
    await db.user.delete({ where: { id: userA } });
    await db.$disconnect();
  });

  it("ignores a client-supplied organization and returns only the authenticated tenant's listings", async () => {
    vi.mocked(authenticateDifyRequest).mockResolvedValue({
      context: { organizationId: organizationA, userId: userA, role: "owner" },
      errorResponse: null,
    });

    const request = new NextRequest("http://localhost/api/dify/tools/properties", {
      method: "POST",
      body: JSON.stringify({ organization_id: organizationB, limit: 50 }),
      headers: { "content-type": "application/json" },
    });

    const response = await postProperties(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.properties).toHaveLength(1);
    expect(body.properties[0].title).toBe("Tenant A Listing");
    expect(body.properties.some((property: { title: string }) => property.title === "Tenant B Listing")).toBe(false);
  });
});
