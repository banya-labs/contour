import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Pool, type PoolClient } from "pg";
import { getContourDatabaseConfig } from "@contour/config";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..", "..");

for (const filePath of [
  path.resolve(repoRoot, ".env.development.local"),
  path.resolve(repoRoot, ".env.local"),
]) {
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

type SeedUser = {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  role: "admin" | "agent" | "finance" | "legal" | "auditor";
};

type SeedIds = {
  users: Record<SeedUser["role"], string>;
  listings: string[];
  clients: string[];
  deals: string[];
  workItems: string[];
};

const seedUsers: SeedUser[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    clerkUserId: "demo-admin",
    email: "admin@contour.local",
    fullName: "Demo Admin",
    role: "admin",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    clerkUserId: "demo-agent",
    email: "agent@contour.local",
    fullName: "Demo Agent",
    role: "agent",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    clerkUserId: "demo-finance",
    email: "finance@contour.local",
    fullName: "Demo Finance",
    role: "finance",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    clerkUserId: "demo-legal",
    email: "legal@contour.local",
    fullName: "Demo Legal",
    role: "legal",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    clerkUserId: "demo-auditor",
    email: "auditor@contour.local",
    fullName: "Demo Auditor",
    role: "auditor",
  },
];

const seededAt = new Date("2026-06-13T09:00:00.000Z");

function tableSql(table: string) {
  return `"${table}"`;
}

async function countRows(client: PoolClient, table: string) {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::int AS count FROM ${tableSql(table)}`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function selectIds(client: PoolClient, table: string, limit = 4) {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM ${tableSql(table)} ORDER BY created_at ASC LIMIT $1`,
    [limit],
  );
  return rows.map((row) => row.id);
}

async function upsertDemoUsers(client: PoolClient): Promise<SeedIds["users"]> {
  const users = {} as SeedIds["users"];

  for (const user of seedUsers) {
    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO users (id, clerk_user_id, email, full_name, role, is_active, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, $6)
        ON CONFLICT (clerk_user_id) DO UPDATE
          SET email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              role = EXCLUDED.role,
              is_active = EXCLUDED.is_active,
              updated_at = EXCLUDED.updated_at
        RETURNING id
      `,
      [
        user.id,
        user.clerkUserId,
        user.email,
        user.fullName,
        user.role,
        seededAt,
      ],
    );

    users[user.role] = rows[0]!.id;
  }

  return users;
}

async function seedListingsIfEmpty(
  client: PoolClient,
  users: SeedIds["users"],
): Promise<string[]> {
  if ((await countRows(client, "listings")) > 0) {
    return selectIds(client, "listings", 4);
  }

  const rows = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: "M. Chanda",
      listingCode: "LST-0001",
      type: "property",
      availabilityStatus: "available",
      locationArea: "Lusaka West",
      address: "14 Lusaka West, Lusaka",
      askingPriceAmount: "1800000.00",
      askingPriceCurrency: "ZMW",
      bedrooms: 4,
      bathrooms: 3,
      landSizeHa: null,
      zoning: "residential",
      landDesignation: null,
      assignedAgentUserId: users.agent,
      internalNotes: "Premium family home",
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      title: "Woodlands 09",
      propertyType: "Property",
      status: "reserved",
      priceCents: 18500000,
      currency: "USD",
      ownerName: "N. Banda",
      listingCode: "LST-0002",
      type: "property",
      availabilityStatus: "reserved",
      locationArea: "Woodlands",
      address: "9 Woodlands Extension, Lusaka",
      askingPriceAmount: "185000.00",
      askingPriceCurrency: "USD",
      bedrooms: 3,
      bathrooms: 2,
      landSizeHa: null,
      zoning: "commercial",
      landDesignation: null,
      assignedAgentUserId: users.agent,
      internalNotes: "Reserved pending paperwork",
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      title: "Ndola North 24",
      propertyType: "Vacant land",
      status: "under_maintenance",
      priceCents: 46000000,
      currency: "ZMW",
      ownerName: "Estate Trust",
      listingCode: "LST-0003",
      type: "vacant_land",
      availabilityStatus: "under_maintenance",
      locationArea: "Ndola North",
      address: "24 Ndola North, Ndola",
      askingPriceAmount: "460000.00",
      askingPriceCurrency: "ZMW",
      bedrooms: null,
      bathrooms: null,
      landSizeHa: "0.4800",
      zoning: "agricultural",
      landDesignation: "customary_land",
      assignedAgentUserId: users.agent,
      internalNotes: "Awaiting site cleanup",
    },
    {
      id: "10000000-0000-4000-8000-000000000004",
      title: "Livingstone Plot 88",
      propertyType: "Vacant land",
      status: "sold",
      priceCents: 5200000,
      currency: "USD",
      ownerName: "T. Phiri",
      listingCode: "LST-0004",
      type: "vacant_land",
      availabilityStatus: "sold",
      locationArea: "Livingstone",
      address: "Plot 88, Livingstone",
      askingPriceAmount: "52000.00",
      askingPriceCurrency: "USD",
      bedrooms: null,
      bathrooms: null,
      landSizeHa: "0.1200",
      zoning: "mixed",
      landDesignation: "state_land",
      assignedAgentUserId: users.agent,
      internalNotes: "Closed sale",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO listings (
          id, title, property_type, status, price_cents, currency, owner_name,
          listing_code, type, availability_status, location_area, address,
          asking_price_amount, asking_price_currency, bedrooms, bathrooms,
          land_size_ha, zoning, land_designation, assigned_agent_user_id,
          internal_notes, created_by_user_id, last_modified_by_user_id, created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )
      `,
      [
        row.id,
        row.title,
        row.propertyType,
        row.status,
        row.priceCents,
        row.currency,
        row.ownerName,
        row.listingCode,
        row.type,
        row.availabilityStatus,
        row.locationArea,
        row.address,
        row.askingPriceAmount,
        row.askingPriceCurrency,
        row.bedrooms,
        row.bathrooms,
        row.landSizeHa,
        row.zoning,
        row.landDesignation,
        row.assignedAgentUserId,
        row.internalNotes,
        users.admin,
        users.admin,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedClientsIfEmpty(
  client: PoolClient,
  users: SeedIds["users"],
): Promise<string[]> {
  if ((await countRows(client, "clients")) > 0) {
    return selectIds(client, "clients", 4);
  }

  const rows = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      fullName: "M. Chanda",
      email: "m.chanda@example.com",
      phone: "+260970000001",
      status: "active",
      source: "Referral",
      segment: "active_tenant",
      nrcNumber: "123456/11/1",
      passportNumber: null,
      tpin: "TPIN-0001",
      nationality: "Zambian",
      budgetMinAmount: "1200000.00",
      budgetMaxAmount: "2200000.00",
      budgetCurrency: "ZMW",
      notes: "Prefers Lusaka west side homes.",
      preferredLocation: "Lusaka West",
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      fullName: "N. Banda",
      email: "n.banda@example.com",
      phone: "+260970000002",
      status: "lead",
      source: "Website",
      segment: "prospective_buyer",
      nrcNumber: "223456/11/1",
      passportNumber: null,
      tpin: "TPIN-0002",
      nationality: "Zambian",
      budgetMinAmount: "1500000.00",
      budgetMaxAmount: "2500000.00",
      budgetCurrency: "USD",
      notes: "Shortlist in Woodlands and Kabulonga.",
      preferredLocation: "Woodlands",
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      fullName: "Estate Trust",
      email: "trust@example.com",
      phone: "+260970000003",
      status: "archived",
      source: "Legacy import",
      segment: "land_owner_seller",
      nrcNumber: null,
      passportNumber: null,
      tpin: "TPIN-0003",
      nationality: "Zambian",
      budgetMinAmount: null,
      budgetMaxAmount: null,
      budgetCurrency: "ZMW",
      notes: "Long-term seller contact.",
      preferredLocation: "Ndola North",
    },
    {
      id: "20000000-0000-4000-8000-000000000004",
      fullName: "T. Phiri",
      email: "t.phiri@example.com",
      phone: "+260970000004",
      status: "active",
      source: "Walk-in",
      segment: "past_lead",
      nrcNumber: "423456/11/1",
      passportNumber: null,
      tpin: "TPIN-0004",
      nationality: "Zambian",
      budgetMinAmount: "40000.00",
      budgetMaxAmount: "100000.00",
      budgetCurrency: "USD",
      notes: "Interested in plot flips.",
      preferredLocation: "Livingstone",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO clients (
          id, full_name, email, phone, status, source, segment, nrc_number,
          passport_number, tpin, nationality, budget_min_amount, budget_max_amount,
          budget_currency, notes, created_by_user_id, last_modified_by_user_id,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19
        )
      `,
      [
        row.id,
        row.fullName,
        row.email,
        row.phone,
        row.status,
        row.source,
        row.segment,
        row.nrcNumber,
        row.passportNumber,
        row.tpin,
        row.nationality,
        row.budgetMinAmount,
        row.budgetMaxAmount,
        row.budgetCurrency,
        row.notes,
        users.agent,
        users.admin,
        seededAt,
        seededAt,
      ],
    );
  }
  return rows.map((row) => row.id);
}

async function seedClientPreferredLocations(
  client: PoolClient,
  clientIds: string[],
  rows?: Array<{ preferredLocation: string }>,
) {
  const locations = rows ?? [];
  if (clientIds.length === 0) {
    return;
  }

  const preferredLocations = locations.length
    ? locations.map((row) => row.preferredLocation)
    : ["Lusaka West", "Woodlands", "Ndola North", "Livingstone"];

  for (let index = 0; index < clientIds.length; index += 1) {
    const clientId = clientIds[index]!;
    const location = preferredLocations[index % preferredLocations.length]!;
    await client.query(
      `
        INSERT INTO client_preferred_locations (client_id, location_area)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [clientId, location],
    );
  }
}

async function seedDealsIfEmpty(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
): Promise<string[]> {
  if ((await countRows(client, "deals")) > 0) {
    return selectIds(client, "deals", 4);
  }

  const rows = [
    {
      id: "30000000-0000-4000-8000-000000000001",
      title: "Lusaka West 14",
      dealName: "Lusaka West 14 Purchase",
      stage: "negotiating",
      dealType: "sale",
      valueCents: 180000000,
      currency: "ZMW",
      status: "open",
      closedAt: null,
      listingId: listingIds[0],
      clientId: clientIds[0],
      agentUserId: users.agent,
      offerAmount: "1800000.00",
      offerCurrency: "ZMW",
      expectedCloseAt: "2026-07-01T00:00:00.000Z",
      commissionPercent: "3.50",
      commissionAmount: "63000.00",
      notes: "Strong buyer intent.",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      title: "Woodlands 09",
      dealName: "Woodlands 09 Sale",
      stage: "contract",
      dealType: "sale",
      valueCents: 18500000,
      currency: "USD",
      status: "open",
      closedAt: null,
      listingId: listingIds[1],
      clientId: clientIds[1],
      agentUserId: users.agent,
      offerAmount: "185000.00",
      offerCurrency: "USD",
      expectedCloseAt: "2026-07-08T00:00:00.000Z",
      commissionPercent: "2.50",
      commissionAmount: "4625.00",
      notes: "Awaiting contract review.",
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      title: "Ndola North 24",
      dealName: "Ndola North 24 Land Transfer",
      stage: "viewing",
      dealType: "installment",
      valueCents: 46000000,
      currency: "ZMW",
      status: "won",
      closedAt: new Date("2026-06-12T10:30:00.000Z"),
      listingId: listingIds[2],
      clientId: clientIds[2],
      agentUserId: users.agent,
      offerAmount: "460000.00",
      offerCurrency: "ZMW",
      expectedCloseAt: "2026-06-20T00:00:00.000Z",
      commissionPercent: "4.00",
      commissionAmount: "18400.00",
      notes: "Completed transfer.",
    },
    {
      id: "30000000-0000-4000-8000-000000000004",
      title: "Livingstone Plot 88",
      dealName: "Livingstone Plot 88 Exit",
      stage: "new",
      dealType: "rental",
      valueCents: 5200000,
      currency: "USD",
      status: "lost",
      closedAt: null,
      listingId: listingIds[3],
      clientId: clientIds[3],
      agentUserId: users.agent,
      offerAmount: "52000.00",
      offerCurrency: "USD",
      expectedCloseAt: "2026-07-15T00:00:00.000Z",
      commissionPercent: "2.00",
      commissionAmount: "1040.00",
      notes: "Lost to a cash buyer.",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO deals (
          id, title, stage, value_cents, currency, status, closed_at,
          listing_id, client_id, assigned_user_id, deal_name, deal_type,
          offer_amount, offer_currency, expected_close_at, agent_user_id,
          commission_percent, commission_amount, notes,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19,
          $20, $21
        )
      `,
      [
        row.id,
        row.title,
        row.stage,
        row.valueCents,
        row.currency,
        row.status,
        row.closedAt,
        row.listingId,
        row.clientId,
        row.agentUserId,
        row.dealName,
        row.dealType,
        row.offerAmount,
        row.offerCurrency,
        row.expectedCloseAt,
        row.agentUserId,
        row.commissionPercent,
        row.commissionAmount,
        row.notes,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedWorkItemsIfEmpty(
  client: PoolClient,
  users: SeedIds["users"],
): Promise<string[]> {
  if ((await countRows(client, "work_items")) > 0) {
    return selectIds(client, "work_items", 4);
  }

  const rows = [
    {
      id: "40000000-0000-4000-8000-000000000001",
      title: "Verify title deed for Lusaka West 14",
      kind: "Document request",
      workType: "document_request",
      description: "Collect and verify the title deed before contract finalization.",
      tone: "warning",
      status: "open",
      priority: "high",
      ownerUserId: users.legal,
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      title: "Follow up on Woodlands 09 viewing",
      kind: "Follow-up",
      workType: "follow_up",
      description: "Call the buyer and confirm the next viewing slot.",
      tone: "info",
      status: "in_progress",
      priority: "medium",
      ownerUserId: users.agent,
    },
    {
      id: "40000000-0000-4000-8000-000000000003",
      title: "Review duplicate client suspicion",
      kind: "Audit check",
      workType: "audit_check",
      description: "Check for duplicate contact records before next outreach.",
      tone: "danger",
      status: "blocked",
      priority: "high",
      ownerUserId: users.admin,
    },
    {
      id: "40000000-0000-4000-8000-000000000004",
      title: "Resolve sync failure on desktop device",
      kind: "Sync health",
      workType: "sync_health",
      description: "Investigate the last failed push from the desktop client.",
      tone: "info",
      status: "open",
      priority: "medium",
      ownerUserId: users.finance,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO work_items (
          id, title, kind, tone, status, due_at, assigned_user_id,
          created_by_user_id, work_type, description, priority, owner_user_id,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14
        )
      `,
      [
        row.id,
        row.title,
        row.kind,
        row.tone,
        row.status,
        new Date("2026-06-18T09:00:00.000Z"),
        row.ownerUserId,
        users.admin,
        row.workType,
        row.description,
        row.priority,
        row.ownerUserId,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedListingUtilities(client: PoolClient, listingIds: string[]) {
  const utilities: Array<[string, string]> = [
    [listingIds[0], "water"],
    [listingIds[0], "electricity"],
    [listingIds[1], "electricity"],
    [listingIds[1], "internet"],
    [listingIds[2], "water"],
    [listingIds[2], "sewer"],
    [listingIds[3], "electricity"],
  ];

  for (const [listingId, utility] of utilities) {
    await client.query(
      `
        INSERT INTO listing_utilities (listing_id, utility)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [listingId, utility],
    );
  }
}

async function seedDealListings(
  client: PoolClient,
  dealIds: string[],
  listingIds: string[],
) {
  const pairs: Array<[string, string]> = [
    [dealIds[0], listingIds[0]],
    [dealIds[1], listingIds[1]],
    [dealIds[2], listingIds[2]],
    [dealIds[3], listingIds[3]],
  ];

  for (const [dealId, listingId] of pairs) {
    await client.query(
      `
        INSERT INTO deal_listings (deal_id, listing_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [dealId, listingId],
    );
  }
}

async function seedInteractions(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
  dealIds: string[],
) {
  const rows = [
    {
      id: "50000000-0000-4000-8000-000000000001",
      summary: "Walkthrough completed for Lusaka West 14",
      clientId: clientIds[0],
      listingId: listingIds[0],
      dealId: dealIds[0],
      type: "site_visit",
      outcome: "Buyer requested a contract draft.",
      interactionAt: "2026-06-12T08:30:00.000Z",
      nextStep: "Send contract draft.",
      nextFollowUpAt: "2026-06-14T08:30:00.000Z",
      agentUserId: users.agent,
    },
    {
      id: "50000000-0000-4000-8000-000000000002",
      summary: "Client asked for updated payment terms",
      clientId: clientIds[1],
      listingId: listingIds[1],
      dealId: dealIds[1],
      type: "whatsapp",
      outcome: "Terms shared and acknowledged.",
      interactionAt: "2026-06-12T09:10:00.000Z",
      nextStep: "Confirm signature appointment.",
      nextFollowUpAt: "2026-06-15T09:00:00.000Z",
      agentUserId: users.agent,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO interactions (
          id, summary, client_id, listing_id, deal_id, type, outcome,
          interaction_at, next_step, next_follow_up_at, agent_user_id,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.summary,
        row.clientId,
        row.listingId,
        row.dealId,
        row.type,
        row.outcome,
        row.interactionAt,
        row.nextStep,
        row.nextFollowUpAt,
        row.agentUserId,
        seededAt,
        seededAt,
      ],
    );
  }
}

async function seedPaymentPlans(
  client: PoolClient,
  users: SeedIds["users"],
  dealIds: string[],
  clientIds: string[],
) {
  const rows = [
    {
      id: "60000000-0000-4000-8000-000000000001",
      planName: "Lusaka West 14 12-month plan",
      dealId: dealIds[0],
      clientId: clientIds[0],
      principalAmount: "1800000.00",
      downPaymentAmount: "300000.00",
      currency: "ZMW",
      frequency: "monthly",
      periods: 12,
      startDate: "2026-06-15",
      status: "active",
      lastModifiedByUserId: users.finance,
    },
    {
      id: "60000000-0000-4000-8000-000000000002",
      planName: "Woodlands 09 short plan",
      dealId: dealIds[1],
      clientId: clientIds[1],
      principalAmount: "185000.00",
      downPaymentAmount: "50000.00",
      currency: "USD",
      frequency: "monthly",
      periods: 6,
      startDate: "2026-06-20",
      status: "active",
      lastModifiedByUserId: users.finance,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO payment_plans (
          id, plan_name, deal_id, client_id, principal_amount,
          down_payment_amount, currency, frequency, periods, start_date, status,
          last_modified_by_user_id, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.planName,
        row.dealId,
        row.clientId,
        row.principalAmount,
        row.downPaymentAmount,
        row.currency,
        row.frequency,
        row.periods,
        row.startDate,
        row.status,
        row.lastModifiedByUserId,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedInstallmentScheduleItems(
  client: PoolClient,
  paymentPlanIds: string[],
) {
  const rows = [
    {
      id: "61000000-0000-4000-8000-000000000001",
      paymentPlanId: paymentPlanIds[0],
      installmentNumber: 1,
      dueDate: "2026-07-15",
      amountDue: "150000.00",
      amountPaid: "0.00",
      paidAt: null,
      status: "due",
    },
    {
      id: "61000000-0000-4000-8000-000000000002",
      paymentPlanId: paymentPlanIds[0],
      installmentNumber: 2,
      dueDate: "2026-08-15",
      amountDue: "150000.00",
      amountPaid: "0.00",
      paidAt: null,
      status: "due",
    },
    {
      id: "61000000-0000-4000-8000-000000000003",
      paymentPlanId: paymentPlanIds[1],
      installmentNumber: 1,
      dueDate: "2026-07-20",
      amountDue: "35000.00",
      amountPaid: "0.00",
      paidAt: null,
      status: "overdue",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO installment_schedule_items (
          id, payment_plan_id, installment_number, due_date, amount_due,
          amount_paid, paid_at, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.paymentPlanId,
        row.installmentNumber,
        row.dueDate,
        row.amountDue,
        row.amountPaid,
        row.paidAt,
        row.status,
        seededAt,
        seededAt,
      ],
    );
  }
}

async function seedRentalLeases(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
) {
  const rows = [
    {
      id: "70000000-0000-4000-8000-000000000001",
      leaseName: "Woodlands 09 Lease",
      tenantClientId: clientIds[1],
      listingId: listingIds[1],
      startDate: "2026-07-01",
      endDate: "2027-06-30",
      rentAmount: "9000.00",
      currency: "USD",
      billingDay: 1,
      depositAmount: "2000.00",
      status: "active",
      lastModifiedByUserId: users.finance,
    },
    {
      id: "70000000-0000-4000-8000-000000000002",
      leaseName: "Livingstone Plot 88 Lease",
      tenantClientId: clientIds[3],
      listingId: listingIds[3],
      startDate: "2026-07-05",
      endDate: null,
      rentAmount: "3500.00",
      currency: "USD",
      billingDay: 5,
      depositAmount: "1000.00",
      status: "active",
      lastModifiedByUserId: users.finance,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO rental_leases (
          id, lease_name, tenant_client_id, listing_id, start_date, end_date,
          rent_amount, currency, billing_day, deposit_amount, status,
          last_modified_by_user_id, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.leaseName,
        row.tenantClientId,
        row.listingId,
        row.startDate,
        row.endDate,
        row.rentAmount,
        row.currency,
        row.billingDay,
        row.depositAmount,
        row.status,
        row.lastModifiedByUserId,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedRentalCharges(client: PoolClient, leaseIds: string[]) {
  const rows = [
    {
      id: "71000000-0000-4000-8000-000000000001",
      leaseId: leaseIds[0],
      periodMonth: "2026-07-01",
      dueDate: "2026-07-01",
      amount: "9000.00",
      currency: "USD",
      status: "due",
    },
    {
      id: "71000000-0000-4000-8000-000000000002",
      leaseId: leaseIds[1],
      periodMonth: "2026-07-01",
      dueDate: "2026-07-05",
      amount: "3500.00",
      currency: "USD",
      status: "overdue",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO rental_charges (
          id, lease_id, period_month, due_date, amount, currency, status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.leaseId,
        row.periodMonth,
        row.dueDate,
        row.amount,
        row.currency,
        row.status,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedPayments(
  client: PoolClient,
  users: SeedIds["users"],
  clientIds: string[],
  dealIds: string[],
  paymentPlanIds: string[],
  installmentIds: string[],
  leaseIds: string[],
  rentalChargeIds: string[],
) {
  const rows = [
    {
      id: "72000000-0000-4000-8000-000000000001",
      receiptNumber: "RCPT-0001",
      clientId: clientIds[0],
      dealId: dealIds[0],
      paymentPlanId: paymentPlanIds[0],
      installmentScheduleItemId: installmentIds[0],
      leaseId: null,
      rentalChargeId: null,
      paidAt: "2026-07-15T08:00:00.000Z",
      amount: "150000.00",
      currency: "ZMW",
      method: "bank",
      notes: "Monthly installment payment.",
      recordedByUserId: users.finance,
    },
    {
      id: "72000000-0000-4000-8000-000000000002",
      receiptNumber: "RCPT-0002",
      clientId: clientIds[1],
      dealId: dealIds[1],
      paymentPlanId: paymentPlanIds[1],
      installmentScheduleItemId: installmentIds[2],
      leaseId: leaseIds[0],
      rentalChargeId: rentalChargeIds[0],
      paidAt: "2026-07-20T08:00:00.000Z",
      amount: "3500.00",
      currency: "USD",
      method: "cash",
      notes: "Rental charge paid late.",
      recordedByUserId: users.finance,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO payments (
          id, receipt_number, client_id, deal_id, payment_plan_id,
          installment_schedule_item_id, lease_id, rental_charge_id, paid_at,
          amount, currency, method, notes, recorded_by_user_id,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.receiptNumber,
        row.clientId,
        row.dealId,
        row.paymentPlanId,
        row.installmentScheduleItemId,
        row.leaseId,
        row.rentalChargeId,
        row.paidAt,
        row.amount,
        row.currency,
        row.method,
        row.notes,
        row.recordedByUserId,
        seededAt,
        seededAt,
      ],
    );
  }
}

async function seedDocuments(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
  dealIds: string[],
) {
  const rows = [
    {
      id: "73000000-0000-4000-8000-000000000001",
      documentName: "Lusaka West 14 Title Deed",
      category: "title_deed",
      listingId: listingIds[0],
      clientId: clientIds[0],
      dealId: dealIds[0],
      blobUrl: "https://blob.local/documents/lusaka-west-14-title-deed.pdf",
      blobKey: "documents/lusaka-west-14-title-deed.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 182300,
      isVerified: true,
      verifiedAt: "2026-06-12T12:30:00.000Z",
      verifiedByUserId: users.legal,
      notes: "Verified for contract stage.",
      uploadedByUserId: users.agent,
    },
    {
      id: "73000000-0000-4000-8000-000000000002",
      documentName: "Woodlands 09 Offer Letter",
      category: "offer_letter",
      listingId: listingIds[1],
      clientId: clientIds[1],
      dealId: dealIds[1],
      blobUrl: "https://blob.local/documents/woodlands-09-offer-letter.pdf",
      blobKey: "documents/woodlands-09-offer-letter.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 113400,
      isVerified: false,
      verifiedAt: null,
      verifiedByUserId: null,
      notes: "Pending buyer signature.",
      uploadedByUserId: users.agent,
    },
    {
      id: "73000000-0000-4000-8000-000000000003",
      documentName: "Ndola North 24 Survey Diagram",
      category: "survey_diagram",
      listingId: listingIds[2],
      clientId: null,
      dealId: null,
      blobUrl: "https://blob.local/documents/ndola-north-24-survey-diagram.pdf",
      blobKey: "documents/ndola-north-24-survey-diagram.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 95500,
      isVerified: true,
      verifiedAt: "2026-06-11T11:00:00.000Z",
      verifiedByUserId: users.legal,
      notes: "Site diagram archived.",
      uploadedByUserId: users.admin,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO documents (
          id, document_name, category, listing_id, client_id, deal_id, blob_url,
          blob_key, mime_type, file_size_bytes, is_verified, verified_at,
          verified_by_user_id, notes, uploaded_by_user_id, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.documentName,
        row.category,
        row.listingId,
        row.clientId,
        row.dealId,
        row.blobUrl,
        row.blobKey,
        row.mimeType,
        row.fileSizeBytes,
        row.isVerified,
        row.verifiedAt,
        row.verifiedByUserId,
        row.notes,
        row.uploadedByUserId,
        seededAt,
        seededAt,
      ],
    );
  }
}

async function seedInsights(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
  dealIds: string[],
) {
  const rows = [
    {
      id: "74000000-0000-4000-8000-000000000001",
      insightType: "stale_listing",
      severity: "warn",
      title: "Review stale listing",
      description: "Lusaka West 14 needs a fresh status check.",
      ownerUserId: users.agent,
      status: "open",
      entityType: "listing",
      entityId: listingIds[0],
      evidence: { daysSinceUpdate: 14 },
      recommendedAction: "Contact owner and refresh photos.",
      dueAt: "2026-06-20T09:00:00.000Z",
    },
    {
      id: "74000000-0000-4000-8000-000000000002",
      insightType: "follow_up_gap",
      severity: "critical",
      title: "Client follow-up gap",
      description: "Buyer has not been contacted in seven days.",
      ownerUserId: users.agent,
      status: "open",
      entityType: "client",
      entityId: clientIds[1],
      evidence: { daysSinceInteraction: 7 },
      recommendedAction: "Send a WhatsApp follow-up.",
      dueAt: "2026-06-18T09:00:00.000Z",
    },
    {
      id: "74000000-0000-4000-8000-000000000003",
      insightType: "missing_document",
      severity: "warn",
      title: "Missing title deed attachment",
      description: "Deal is moving to contract but the deed is not attached.",
      ownerUserId: users.legal,
      status: "acknowledged",
      entityType: "deal",
      entityId: dealIds[1],
      evidence: { required: ["title_deed"] },
      recommendedAction: "Upload the title deed to the document vault.",
      dueAt: "2026-06-19T09:00:00.000Z",
    },
    {
      id: "74000000-0000-4000-8000-000000000004",
      insightType: "duplicate_client",
      severity: "info",
      title: "Duplicate client review",
      description: "Potential duplicate exists between imported contacts.",
      ownerUserId: users.admin,
      status: "dismissed",
      entityType: "client",
      entityId: clientIds[2],
      evidence: { duplicateGroup: "legacy-import-01" },
      recommendedAction: "Merge or archive the duplicate record.",
      dueAt: null,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO insights (
          id, insight_type, severity, title, description, owner_user_id,
          status, entity_type, entity_id, evidence, recommended_action, due_at,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.insightType,
        row.severity,
        row.title,
        row.description,
        row.ownerUserId,
        row.status,
        row.entityType,
        row.entityId,
        JSON.stringify(row.evidence),
        row.recommendedAction,
        row.dueAt,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedSyncDevices(client: PoolClient, users: SeedIds["users"]) {
  const rows = [
    {
      id: "75000000-0000-4000-8000-000000000001",
      deviceId: "demo-desktop-001",
      userId: users.agent,
      deviceType: "electron_desktop",
      appVersion: "0.1.0",
      lastSeenAt: "2026-06-13T08:55:00.000Z",
    },
    {
      id: "75000000-0000-4000-8000-000000000002",
      deviceId: "demo-desktop-002",
      userId: users.finance,
      deviceType: "electron_desktop",
      appVersion: "0.1.0",
      lastSeenAt: "2026-06-13T08:50:00.000Z",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO sync_devices (
          id, device_id, user_id, device_type, app_version, last_seen_at,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.deviceId,
        row.userId,
        row.deviceType,
        row.appVersion,
        row.lastSeenAt,
        seededAt,
        seededAt,
      ],
    );
  }

  return rows.map((row) => row.id);
}

async function seedSyncState(client: PoolClient, deviceIds: string[]) {
  const rows = [
    {
      deviceId: deviceIds[0],
      lastSyncToken: "sync-token-001",
      lastSyncAt: "2026-06-13T08:56:00.000Z",
      lastErrorCode: null,
      lastErrorAt: null,
      consecutiveFailures: 0,
    },
    {
      deviceId: deviceIds[1],
      lastSyncToken: "sync-token-002",
      lastSyncAt: "2026-06-13T08:51:00.000Z",
      lastErrorCode: "retry_pending",
      lastErrorAt: "2026-06-13T08:40:00.000Z",
      consecutiveFailures: 1,
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO sync_state (
          device_id, last_sync_token, last_sync_at, last_error_code, last_error_at,
          consecutive_failures, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (device_id) DO NOTHING
      `,
      [
        row.deviceId,
        row.lastSyncToken,
        row.lastSyncAt,
        row.lastErrorCode,
        row.lastErrorAt,
        row.consecutiveFailures,
        seededAt,
      ],
    );
  }
}

async function seedEvents(
  client: PoolClient,
  users: SeedIds["users"],
  listingIds: string[],
  clientIds: string[],
  dealIds: string[],
  workItemIds: string[],
) {
  const rows = [
    {
      id: "76000000-0000-4000-8000-000000000001",
      eventType: "listing.seeded",
      occurredAt: "2026-06-12T09:00:00.000Z",
      actorUserId: users.admin,
      entityType: "listing",
      entityId: listingIds[0],
      metadata: { source: "seed" },
    },
    {
      id: "76000000-0000-4000-8000-000000000002",
      eventType: "client.seeded",
      occurredAt: "2026-06-12T09:05:00.000Z",
      actorUserId: users.agent,
      entityType: "client",
      entityId: clientIds[0],
      metadata: { source: "seed" },
    },
    {
      id: "76000000-0000-4000-8000-000000000003",
      eventType: "deal.seeded",
      occurredAt: "2026-06-12T09:10:00.000Z",
      actorUserId: users.agent,
      entityType: "deal",
      entityId: dealIds[0],
      metadata: { source: "seed" },
    },
    {
      id: "76000000-0000-4000-8000-000000000004",
      eventType: "work_item.seeded",
      occurredAt: "2026-06-12T09:15:00.000Z",
      actorUserId: users.admin,
      entityType: "work_item",
      entityId: workItemIds[0],
      metadata: { source: "seed" },
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO events (
          id, event_type, occurred_at, actor_user_id, entity_type, entity_id,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.eventType,
        row.occurredAt,
        row.actorUserId,
        row.entityType,
        row.entityId,
        JSON.stringify(row.metadata),
      ],
    );
  }
}

async function seedAuditLog(client: PoolClient, users: SeedIds["users"]) {
  const rows = [
    {
      id: "77000000-0000-4000-8000-000000000001",
      action: "insert",
      actorUserId: users.admin,
      entityType: "user",
      entityId: users.admin,
      beforeData: null,
      afterData: { role: "admin" },
      requestId: "seed-request-001",
      source: "seed",
      ipAddress: "127.0.0.1",
      userAgent: "Contour seed",
    },
    {
      id: "77000000-0000-4000-8000-000000000002",
      action: "insert",
      actorUserId: users.agent,
      entityType: "listing",
      entityId: "10000000-0000-4000-8000-000000000001",
      beforeData: null,
      afterData: { title: "Lusaka West 14" },
      requestId: "seed-request-002",
      source: "seed",
      ipAddress: "127.0.0.1",
      userAgent: "Contour seed",
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO audit_log (
          id, action, actor_user_id, entity_type, entity_id, before_data,
          after_data, request_id, source, ip_address, user_agent, occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        row.id,
        row.action,
        row.actorUserId,
        row.entityType,
        row.entityId,
        row.beforeData,
        JSON.stringify(row.afterData),
        row.requestId,
        row.source,
        row.ipAddress,
        row.userAgent,
        seededAt,
      ],
    );
  }
}

async function main() {
  const databaseConfig = getContourDatabaseConfig();
  const pool = new Pool({
    connectionString: databaseConfig.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 60000,
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const users = await upsertDemoUsers(client);
    const listingIds = await seedListingsIfEmpty(client, users);
    const clientIds = await seedClientsIfEmpty(client, users);
    const dealIds = await seedDealsIfEmpty(client, users, listingIds, clientIds);
    const workItemIds = await seedWorkItemsIfEmpty(client, users);

    await seedListingUtilities(client, listingIds);
    await seedClientPreferredLocations(client, clientIds);
    await seedDealListings(client, dealIds, listingIds);
    await seedInteractions(client, users, listingIds, clientIds, dealIds);
    const paymentPlanIds = await seedPaymentPlans(client, users, dealIds, clientIds);
    await seedInstallmentScheduleItems(client, paymentPlanIds);
    const leaseIds = await seedRentalLeases(client, users, listingIds, clientIds);
    const rentalChargeIds = await seedRentalCharges(client, leaseIds);
    await seedPayments(
      client,
      users,
      clientIds,
      dealIds,
      paymentPlanIds,
      ["61000000-0000-4000-8000-000000000001", "61000000-0000-4000-8000-000000000002", "61000000-0000-4000-8000-000000000003"],
      leaseIds,
      rentalChargeIds,
    );
    await seedDocuments(client, users, listingIds, clientIds, dealIds);
    await seedInsights(client, users, listingIds, clientIds, dealIds);
    const syncDeviceIds = await seedSyncDevices(client, users);
    await seedSyncState(client, syncDeviceIds);
    await seedEvents(client, users, listingIds, clientIds, dealIds, workItemIds);
    await seedAuditLog(client, users);

    await client.query("COMMIT");
    console.log("Contour seed applied: canonical CRM tables loaded.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

void main();
