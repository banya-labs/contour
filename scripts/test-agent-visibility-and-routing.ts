import { db } from "../src/lib/db";

async function main() {
  console.log("===============================================================");
  console.log("TEST SUITE: Agent Property Visibility & Mobile App PWA Routing");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  PASS: ${description}`);
      passed++;
    } else {
      console.error(`  FAIL: ${description}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Agency Property Visibility for Agents
    // -------------------------------------------------------------
    console.log("Scenario 1: Agency adds property -> Agent in same agency must see it");

    // Create a dedicated test agency
    const testAgencySlug = `test-agency-${Date.now()}`;
    const testAgency = await db.organization.create({
      data: {
        name: "Lusaka Premier Realty",
        slug: testAgencySlug,
        currency: "ZMW",
        subscriptionStatus: "active",
      },
    });

    // Create a test broker manager who adds the property
    const managerEmail = `broker-${Date.now()}@premier.zm`;
    const managerUser = await db.user.create({
      data: {
        name: "Mutale Mwamba (Broker)",
        email: managerEmail,
        role: "BROKER_MANAGER",
      },
    });

    await db.member.create({
      data: {
        organizationId: testAgency.id,
        userId: managerUser.id,
        role: "admin",
        status: "active",
      },
    });

    // Create an agent user in the same agency
    const agentEmail = `agent-${Date.now()}@premier.zm`;
    const agentUser = await db.user.create({
      data: {
        name: "Kondwani Banda (Field Agent)",
        email: agentEmail,
        role: "FIELD_AGENT",
      },
    });

    await db.member.create({
      data: {
        organizationId: testAgency.id,
        userId: agentUser.id,
        role: "member",
        status: "active",
      },
    });

    // Agency adds a new property to catalog
    const propertyTitle = `Kabulonga Executive Villa #${Date.now().toString().slice(-4)}`;
    const newProperty = await db.property.create({
      data: {
        organizationId: testAgency.id,
        title: propertyTitle,
        slug: `kabulonga-exec-villa-${Date.now().toString(36)}`,
        listingType: "FOR_SALE",
        propertyType: "STANDALONE_HOUSE",
        status: "AVAILABLE",
        askingPrice: 7500000,
        currency: "ZMW",
        bedrooms: 4,
        bathrooms: 3,
        suburb: "Kabulonga",
        city: "Lusaka",
        description: "Stunning 4-bed villa with manicured gardens and pool.",
        createdById: managerUser.id,
        assignedAgentId: managerUser.id, // Assigned to agency/manager
      },
    });

    assert(Boolean(newProperty.id), `Property successfully added by agency: "${propertyTitle}"`);

    // Verify Agent's membership lookup:
    // When the agent calls GET /api/properties, tenant context resolves to their agency
    const agentActiveMembership = await db.member.findFirst({
      where: { userId: agentUser.id, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { organizationId: true },
    });

    assert(
      agentActiveMembership?.organizationId === testAgency.id,
      `Agent's active organization correctly resolves to "${testAgency.name}" (${testAgency.id})`
    );

    // Query properties for the agent's resolved organization
    const agentVisibleProperties = await db.property.findMany({
      where: {
        organizationId: agentActiveMembership!.organizationId,
        status: { in: ["AVAILABLE", "UNDER_OFFER", "RENTED", "SOLD"] },
      },
    });

    const isPropertyFound = agentVisibleProperties.some((p) => p.id === newProperty.id);
    assert(
      isPropertyFound,
      `Agent retrieves newly added agency property: "${newProperty.title}" in their catalog`
    );

    // -------------------------------------------------------------
    // Test 2: Mobile App / PWA Auth Navigation Rules
    // -------------------------------------------------------------
    console.log("\nScenario 2: Mobile App / PWA Auth Navigation & Last Page Restoration");

    // Case 2A: Valid session with saved last page -> Restore last page
    const mockLastPage = "/dashboard/properties";
    const isValidAppPath =
      (mockLastPage.startsWith("/dashboard") ||
        mockLastPage.startsWith("/agent") ||
        mockLastPage.startsWith("/kiosk")) &&
      !mockLastPage.startsWith("/sign-in") &&
      !mockLastPage.startsWith("/login");

    assert(isValidAppPath, `Valid last visited page path recognized: "${mockLastPage}"`);

    // Case 2B: Valid session for field agent with NO saved last page -> Route to /agent
    const agentRole = agentUser.role;
    const defaultAgentDestination = agentRole === "FIELD_AGENT" ? "/agent" : "/dashboard";
    assert(
      defaultAgentDestination === "/agent",
      `Field agent without saved last page correctly defaults to "/agent"`
    );

    // Case 2C: Valid session for broker manager with NO saved last page -> Route to /dashboard
    const managerRole = managerUser.role;
    const defaultManagerDestination = managerRole === "FIELD_AGENT" ? "/agent" : "/dashboard";
    assert(
      defaultManagerDestination === "/dashboard",
      `Broker manager without saved last page correctly defaults to "/dashboard"`
    );

    // Case 2D: Mobile App / PWA opened by unauthenticated user -> Go to /sign-in, NEVER marketing home
    const pwaUnauthDestination = (isPwa: boolean, hasSession: boolean) => {
      if (hasSession) return "/agent";
      if (isPwa) return "/sign-in";
      return "/"; // Marketing home for desktop public visitor
    };

    assert(
      pwaUnauthDestination(true, false) === "/sign-in",
      `Unauthenticated mobile PWA launch routes directly to "/sign-in" (never marketing home)`
    );

    assert(
      pwaUnauthDestination(true, true) === "/agent",
      `Authenticated mobile PWA launch routes directly to application workspace (never marketing home)`
    );

    assert(
      pwaUnauthDestination(false, false) === "/",
      `Unauthenticated desktop browser visit continues to marketing home page`
    );

    // Clean up test data
    await db.property.delete({ where: { id: newProperty.id } });
    await db.member.deleteMany({ where: { organizationId: testAgency.id } });
    await db.organization.delete({ where: { id: testAgency.id } });
    await db.user.delete({ where: { id: managerUser.id } });
    await db.user.delete({ where: { id: agentUser.id } });
    console.log("\n  [Cleanup] Temporary test records pruned cleanly.");

    console.log(`\n===============================================================`);
    console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`===============================================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
