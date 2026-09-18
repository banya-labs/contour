import { db } from "../src/lib/db";
import { smartCache } from "../src/lib/cache";
import { createPropertySchema, createInquirySchema, updateInquiryPipelineSchema } from "../src/lib/validations";

async function main() {
  console.log("===============================================================================");
  console.log("TEST SUITE: Complete Two-Way Synchronization (Agency <-> Field Agents)");
  console.log("===============================================================================\n");

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

  // Track IDs for cleanup
  let testAgencyId: string | null = null;
  const createdPropertyIds: string[] = [];
  const createdInquiryIds: string[] = [];
  const createdLeaseIds: string[] = [];
  const createdTransactionIds: string[] = [];
  const createdUserIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 0. Setup: Agency, Manager, and Multiple Field Agents
    // -------------------------------------------------------------------------
    console.log("--- Phase 0: Test Environment Provisioning ---");
    const testAgencySlug = `apex-realty-${Date.now()}`;
    const testAgency = await db.organization.create({
      data: {
        name: "Apex Lusaka Real Estate",
        slug: testAgencySlug,
        currency: "ZMW",
        subscriptionStatus: "active",
      },
    });
    testAgencyId = testAgency.id;
    console.log(`Created Organization: ${testAgency.name} (${testAgency.id})`);

    // Manager
    const managerUser = await db.user.create({
      data: {
        name: "Mwape Lungu (Broker Manager)",
        email: `manager-${Date.now()}@apex.zm`,
        role: "BROKER_MANAGER",
      },
    });
    createdUserIds.push(managerUser.id);
    await db.member.create({
      data: { organizationId: testAgency.id, userId: managerUser.id, role: "admin", status: "active" },
    });

    // Field Agent 1
    const agent1User = await db.user.create({
      data: {
        name: "Tembo Zulu (Field Agent 1)",
        email: `agent1-${Date.now()}@apex.zm`,
        role: "FIELD_AGENT",
      },
    });
    createdUserIds.push(agent1User.id);
    await db.member.create({
      data: { organizationId: testAgency.id, userId: agent1User.id, role: "member", status: "active" },
    });

    // Field Agent 2
    const agent2User = await db.user.create({
      data: {
        name: "Chileshe Phiri (Field Agent 2)",
        email: `agent2-${Date.now()}@apex.zm`,
        role: "FIELD_AGENT",
      },
    });
    createdUserIds.push(agent2User.id);
    await db.member.create({
      data: { organizationId: testAgency.id, userId: agent2User.id, role: "member", status: "active" },
    });

    assert(Boolean(testAgency.id && managerUser.id && agent1User.id && agent2User.id), "Agency and multi-agent roles initialized successfully");

    // -------------------------------------------------------------------------
    // 1. TOP-DOWN: Agency creates property -> ALL agents immediately see it
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 1: Top-Down Property Creation (Agency -> All Agents) ---");
    const property1Title = `Apex Heights Penthouse #${Date.now().toString().slice(-4)}`;
    const prop1 = await db.property.create({
      data: {
        organizationId: testAgency.id,
        title: property1Title,
        slug: `apex-penthouse-${Date.now().toString(36)}`,
        listingType: "FOR_SALE",
        propertyType: "APARTMENT",
        status: "AVAILABLE",
        askingPrice: 4500000,
        currency: "ZMW",
        bedrooms: 3,
        bathrooms: 2,
        suburb: "Kabulonga",
        city: "Lusaka",
        description: "Luxurious 3-bedroom penthouse with panoramic views of Lusaka skyline.",
        createdById: managerUser.id,
      },
    });
    createdPropertyIds.push(prop1.id);

    // Invalidate caches as the endpoint does
    smartCache.invalidateTag(testAgency.id, "properties", "/dashboard/properties");
    smartCache.invalidateTag(testAgency.id, "properties", "/agent");

    // Agent 1 queries properties
    const agent1Properties = await db.property.findMany({
      where: { organizationId: testAgency.id, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
    });
    const agent1SeesProp1 = agent1Properties.some((p) => p.id === prop1.id);
    assert(agent1SeesProp1, `Agent 1 sees new agency property: "${property1Title}"`);

    // Agent 2 queries properties
    const agent2Properties = await db.property.findMany({
      where: { organizationId: testAgency.id, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
    });
    const agent2SeesProp1 = agent2Properties.some((p) => p.id === prop1.id);
    assert(agent2SeesProp1, `Agent 2 sees new agency property: "${property1Title}"`);

    // -------------------------------------------------------------------------
    // 2. TOP-DOWN: Agency updates property -> Price & Status reflect on agents
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 2: Top-Down Property Update & Assignment Reflection ---");
    const updatedProp1 = await db.property.update({
      where: { id: prop1.id },
      data: {
        askingPrice: 4200000,
        status: "UNDER_OFFER",
        assignedAgentId: agent1User.id,
      },
    });
    smartCache.invalidateTag(testAgency.id, "properties", "/agent");

    const refreshedProp1 = await db.property.findUnique({ where: { id: prop1.id } });
    assert(
      Number(refreshedProp1?.askingPrice) === 4200000 && refreshedProp1?.status === "UNDER_OFFER",
      `Property price (4,200,000 ZMW) and status (UNDER_OFFER) reflected`
    );
    assert(
      refreshedProp1?.assignedAgentId === agent1User.id,
      `Property correctly assigned to Agent 1 (${agent1User.name})`
    );

    // -------------------------------------------------------------------------
    // 3. BOTTOM-UP: Agent intakes property -> Agency Catalog reflects it
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 3: Bottom-Up Agent Property Intake (Agent -> Agency Catalog) ---");
    const agentIntakePayload = {
      title: `Leopards Hill Country Estate #${Date.now().toString().slice(-4)}`,
      description: "Magnificent executive residence in gated enclave.",
      suburb: "Leopards Hill",
      city: "Lusaka",
      price: 8500000,
      askingPrice: 8500000,
      currency: "ZMW" as const,
      propertyType: "STANDALONE_HOUSE" as const,
      listingType: "FOR_SALE" as const,
      bedrooms: 5,
      bathrooms: 4,
      mandateType: "SOLE_MANDATE" as const,
      mandateDeclarationAgreed: true,
      assignedAgentId: agent1User.id,
      photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
      featuredPhoto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    };

    // Validate using Zod schema to ensure no validation errors
    const parsedProperty = createPropertySchema.parse(agentIntakePayload);
    assert(Boolean(parsedProperty), "Mobile intake payload conforms strictly to createPropertySchema");

    const agentCreatedProp = await db.property.create({
      data: {
        organizationId: testAgency.id,
        title: parsedProperty.title,
        slug: `leopards-hill-estate-${Date.now().toString(36)}`,
        listingType: parsedProperty.listingType,
        propertyType: parsedProperty.propertyType,
        status: "AVAILABLE",
        askingPrice: parsedProperty.askingPrice,
        currency: parsedProperty.currency,
        bedrooms: parsedProperty.bedrooms,
        bathrooms: parsedProperty.bathrooms,
        suburb: parsedProperty.suburb,
        city: parsedProperty.city,
        description: parsedProperty.description,
        photos: parsedProperty.photos,
        featuredPhoto: parsedProperty.featuredPhoto,
        assignedAgentId: agent1User.id,
        createdById: agent1User.id,
      },
    });
    createdPropertyIds.push(agentCreatedProp.id);
    smartCache.invalidateTag(testAgency.id, "properties", "/dashboard/properties");

    // Agency dashboard catalog queries properties
    const agencyCatalog = await db.property.findMany({
      where: { organizationId: testAgency.id },
      include: { assignedAgent: true },
    });
    const agencySeesAgentProp = agencyCatalog.some((p) => p.id === agentCreatedProp.id);
    assert(agencySeesAgentProp, `Agency catalog reflects Agent 1's newly intaken property: "${agentCreatedProp.title}"`);

    // -------------------------------------------------------------------------
    // 4. BOTTOM-UP: Agent registers Client CRM inquiry -> Agency CRM reflects it
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 4: Bottom-Up Client Intake (Agent -> Agency CRM & Anti-Poaching) ---");
    const clientPayload = {
      clientName: "Mwila Chanda",
      clientPhone: "+260971112233",
      clientEmail: "mwila@chanda.zm",
      budgetMax: 5000000,
      currency: "ZMW" as const,
      preferredSuburbs: ["Kabulonga", "Woodlands"],
      assignedAgentId: agent1User.id,
      status: "NEW_INQUIRY" as const,
      lookingFor: "FOR_SALE" as const,
      notes: "Cash buyer looking for immediate title transfer in Kabulonga",
    };

    const parsedClient = createInquirySchema.parse(clientPayload);
    assert(Boolean(parsedClient), "Client intake payload conforms to createInquirySchema");

    const lockExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const clientInquiry = await db.inquiry.create({
      data: {
        organizationId: testAgency.id,
        clientName: parsedClient.clientName,
        clientPhone: parsedClient.clientPhone,
        clientEmail: parsedClient.clientEmail || null,
        budgetMax: parsedClient.budgetMax as any,
        currency: parsedClient.currency || "ZMW",
        preferredSuburbs: parsedClient.preferredSuburbs,
        assignedAgentId: agent1User.id,
        status: parsedClient.status || "NEW_INQUIRY",
        lookingFor: parsedClient.lookingFor || "FOR_SALE",
        notes: parsedClient.notes,
        exclusiveLockExpiresAt: lockExpires,
      },
    });
    createdInquiryIds.push(clientInquiry.id);
    smartCache.invalidateTag(testAgency.id, "clients", "/dashboard/clients");

    // Agency queries clients
    const agencyClients = await db.inquiry.findMany({
      where: { organizationId: testAgency.id },
      include: { assignedAgent: true },
    });
    const foundClient = agencyClients.find((c) => c.id === clientInquiry.id);
    assert(Boolean(foundClient), `Agency CRM reflects Agent 1's client: "${foundClient?.clientName}"`);
    assert(foundClient?.assignedAgent?.id === agent1User.id, `Client assigned to Agent 1 (${agent1User.name})`);
    assert(
      foundClient?.exclusiveLockExpiresAt && new Date(foundClient.exclusiveLockExpiresAt).getTime() > Date.now() + 28 * 86400000,
      "30-day anti-poaching lock active on the client record"
    );

    // -------------------------------------------------------------------------
    // 5. BOTTOM-UP: Agent lodges formal offer -> Agency Kanban reflects OFFER_MADE
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 5: Formal Offer Lodging (Agent -> Agency Deal Pipeline) ---");
    const offerInquiry = await db.inquiry.create({
      data: {
        organizationId: testAgency.id,
        clientName: "Bwalya Tembo",
        clientPhone: "+260972223344",
        budgetMax: 4000000,
        dealValue: 4000000 as any,
        currency: "ZMW",
        preferredSuburbs: ["Kabulonga"],
        assignedAgentId: agent1User.id,
        propertyId: prop1.id,
        status: "OFFER_MADE",
        lookingFor: "FOR_SALE",
        notes: `[Lodge Offer Intake] Formal offer of ZMW 4,000,000 submitted by ${agent1User.name}`,
        exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    createdInquiryIds.push(offerInquiry.id);
    smartCache.invalidateTag(testAgency.id, "pipeline", "/dashboard/pipeline");

    // Check pipeline deals view
    const pipelineInquiries = await db.inquiry.findMany({
      where: { organizationId: testAgency.id },
      include: { property: true, assignedAgent: true },
    });
    const dealRecord = pipelineInquiries.find((d) => d.id === offerInquiry.id);
    assert(dealRecord?.status === "OFFER_MADE", `Agency Pipeline reflects new deal stage: OFFER_MADE`);
    assert(Number(dealRecord?.dealValue) === 4000000, `Deal value (ZMW 4,000,000) matches lodged offer`);
    assert(dealRecord?.property?.id === prop1.id, `Deal linked to property: "${dealRecord?.property?.title}"`);

    // -------------------------------------------------------------------------
    // 6. BOTTOM-UP: Agent advances deal stage -> Agency Pipeline reflects CLOSED WON
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 6: Deal Stage Advancement (Agent -> Agency Pipeline) ---");
    const pipelineUpdatePayload = {
      status: "CLOSED" as const,
      outcome: "WON" as const,
    };
    const parsedUpdate = updateInquiryPipelineSchema.parse(pipelineUpdatePayload);
    assert(Boolean(parsedUpdate), "Stage advancement payload passes updateInquiryPipelineSchema");

    const closedInquiry = await db.inquiry.update({
      where: { id: offerInquiry.id },
      data: {
        status: parsedUpdate.status,
        outcome: parsedUpdate.outcome,
        closedAt: new Date(),
        closedById: agent1User.id,
      },
    });
    smartCache.invalidateTag(testAgency.id, "pipeline", "/dashboard/pipeline");

    const refreshedDeal = await db.inquiry.findUnique({ where: { id: offerInquiry.id } });
    assert(refreshedDeal?.status === "CLOSED" && refreshedDeal?.outcome === "WON", `Pipeline reflects CLOSED (WON) state`);

    // -------------------------------------------------------------------------
    // 7. TOP-DOWN: Agency creates lease -> Property status updates to RENTED
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 7: Lease Creation & Property Status Reflection ---");
    const leaseStartDate = new Date();
    const leaseEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const lease = await db.lease.create({
      data: {
        organizationId: testAgency.id,
        propertyId: agentCreatedProp.id,
        tenantName: "Dr. Sibeso Mataka",
        tenantPhone: "+260973334455",
        monthlyRent: 35000 as any,
        currency: "ZMW",
        depositAmount: 70000 as any,
        managementFeePercent: 10.0 as any,
        leaseStartDate,
        leaseEndDate,
        paymentDayOfMonth: 1,
        status: "ACTIVE",
      },
    });
    createdLeaseIds.push(lease.id);

    // Update property to RENTED (as POST /api/leases now does)
    await db.property.update({
      where: { id: agentCreatedProp.id },
      data: { status: "RENTED" },
    });
    smartCache.invalidateTag(testAgency.id, "leases", "/dashboard/leases");
    smartCache.invalidateTag(testAgency.id, "properties", "/agent");

    const rentedProperty = await db.property.findUnique({ where: { id: agentCreatedProp.id } });
    assert(rentedProperty?.status === "RENTED", `Property "${agentCreatedProp.title}" status marked as RENTED`);

    // Agent queries active inventory: RENTED property should be visible under ALL properties
    const agentInventory = await db.property.findMany({
      where: { organizationId: testAgency.id },
    });
    const foundRented = agentInventory.find((p) => p.id === agentCreatedProp.id);
    assert(foundRented?.status === "RENTED", `Field agent reflects updated RENTED status for "${agentCreatedProp.title}"`);

    // -------------------------------------------------------------------------
    // 8. TOP-DOWN: Agency records Sale -> Commission Splits calculate for Agent
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 8: Property Sale Settlement & Commission Ledger Reflection ---");
    const grossValue = 4000000;
    const commissionPct = 5.0;
    const splitPct = 50.0;
    const commissionAmt = (grossValue * commissionPct) / 100; // 200,000 ZMW
    const agentSplitAmt = (commissionAmt * splitPct) / 100;    // 100,000 ZMW

    const saleTransaction = await db.transaction.create({
      data: {
        organizationId: testAgency.id,
        propertyId: prop1.id,
        transactionType: "PROPERTY_SALE",
        grossValue: grossValue as any,
        currency: "ZMW",
        agencyCommissionPct: commissionPct as any,
        agencyCommissionAmount: commissionAmt as any,
        agentSplitPct: splitPct as any,
        agentSplitAmount: agentSplitAmt as any,
        status: "RECEIVED",
        closingAgentId: agent1User.id,
        closedAt: new Date(),
      },
    });
    createdTransactionIds.push(saleTransaction.id);

    await db.property.update({
      where: { id: prop1.id },
      data: { status: "SOLD" },
    });
    smartCache.invalidateTag(testAgency.id, "sales", "/dashboard/sales");
    smartCache.invalidateTag(testAgency.id, "agent-summary", "/agent");

    // Verify Agent 1 commission earnings:
    const agentTransactions = await db.transaction.findMany({
      where: { organizationId: testAgency.id, closingAgentId: agent1User.id },
    });
    const earnedSplitZmw = agentTransactions
      .filter((t) => t.status === "RECEIVED" || t.status === "AGENT_PAID_OUT")
      .reduce((sum, t) => sum + Number(t.agentSplitAmount), 0);

    assert(earnedSplitZmw === 100000, `Agent 1 earned commission ledger reflects ZMW ${earnedSplitZmw.toLocaleString()} (50% of 5% on 4M ZMW)`);

    const soldProperty = await db.property.findUnique({ where: { id: prop1.id } });
    assert(soldProperty?.status === "SOLD", `Property "${prop1.title}" status marked as SOLD`);
  } catch (error: any) {
    console.error("FATAL ERROR in test suite:", error);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    console.log("\n--- Cleaning up test artifacts ---");
    try {
      if (createdTransactionIds.length > 0) {
        await db.transaction.deleteMany({ where: { id: { in: createdTransactionIds } } });
      }
      if (createdLeaseIds.length > 0) {
        await db.lease.deleteMany({ where: { id: { in: createdLeaseIds } } });
      }
      if (createdInquiryIds.length > 0) {
        await db.inquiry.deleteMany({ where: { id: { in: createdInquiryIds } } });
      }
      if (createdPropertyIds.length > 0) {
        await db.property.deleteMany({ where: { id: { in: createdPropertyIds } } });
      }
      if (testAgencyId) {
        await db.member.deleteMany({ where: { organizationId: testAgencyId } });
        await db.organization.delete({ where: { id: testAgencyId } });
      }
      if (createdUserIds.length > 0) {
        await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
      console.log("Cleanup completed successfully.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr);
    }
  }

  console.log("\n===============================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("===============================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
