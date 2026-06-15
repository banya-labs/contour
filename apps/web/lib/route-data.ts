import { unstable_cache } from "next/cache";
import { getContourDashboardSnapshot, getPrismaClient, listContourListings } from "@contour/db";

export const getCachedDashboardSnapshot = unstable_cache(
  async () => getContourDashboardSnapshot().catch(() => null),
  ["contour-dashboard-snapshot"],
  {
    revalidate: 15,
  },
);

export const getCachedLookupOptions = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    const [listings, clients] = await Promise.all([
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
        },
      }),
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          fullName: true,
        },
      }),
    ]);

    return {
      listings: listings.map((listing) => ({ id: listing.id, label: listing.title })),
      clients: clients.map((client) => ({ id: client.id, label: client.fullName })),
    };
  },
  ["contour-lookup-options"],
  {
    revalidate: 30,
  },
);

export const getCachedListingsPageData = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    return listContourListings(prisma, 100);
  },
  ["contour-listings-page-data"],
  {
    revalidate: 30,
  },
);

export const getCachedClientsPageData = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    const [clients, totalClients, activeClients, linkedDeals] = await Promise.all([
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          deals: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.client.count(),
      prisma.client.count({ where: { status: "active" } }),
      prisma.deal.count(),
    ]);

    return { clients, totalClients, activeClients, linkedDeals };
  },
  ["contour-clients-page-data"],
  {
    revalidate: 30,
  },
);

export const getCachedInsightsPageData = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    const [insights, openCount, resolvedCount] = await Promise.all([
      prisma.insight.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          ownerUser: { select: { fullName: true } },
        },
      }),
      prisma.insight.count({ where: { status: "open" } }),
      prisma.insight.count({ where: { status: "resolved" } }),
    ]);

    return { insights, openCount, resolvedCount };
  },
  ["contour-insights-page-data"],
  {
    revalidate: 30,
  },
);

export const getCachedActivityPageData = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    const [events, auditLogs] = await Promise.all([
      prisma.event.findMany({
        orderBy: { occurredAt: "desc" },
        take: 25,
        include: {
          actor: { select: { fullName: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { occurredAt: "desc" },
        take: 25,
        include: {
          actor: { select: { fullName: true } },
        },
      }),
    ]);

    return { events, auditLogs };
  },
  ["contour-activity-page-data"],
  {
    revalidate: 15,
  },
);

export const getCachedWorkItemsPageData = unstable_cache(
  async () => {
    const prisma = getPrismaClient();
    const [workItems, openCount, blockedCount] = await Promise.all([
      prisma.workItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          ownerUser: { select: { fullName: true } },
          relatedInsight: { select: { title: true } },
        },
      }),
      prisma.workItem.count({ where: { status: { not: "done" } } }),
      prisma.workItem.count({ where: { status: "blocked" } }),
    ]);

    return { workItems, openCount, blockedCount };
  },
  ["contour-work-items-page-data"],
  {
    revalidate: 15,
  },
);

export async function getCachedFinancePageData() {
  const prisma = getPrismaClient();
  const [paymentPlans, leases, payments, charges, overdueCharges] = await Promise.all([
    prisma.paymentPlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        deal: { select: { title: true } },
        client: { select: { fullName: true } },
        installmentScheduleItems: { select: { id: true, status: true } },
      },
    }),
    prisma.rentalLease.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        listing: { select: { title: true } },
        tenantClient: { select: { fullName: true } },
        rentalCharges: { select: { id: true, status: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 10,
      include: {
        client: { select: { fullName: true } },
        deal: { select: { title: true } },
      },
    }),
    prisma.rentalCharge.count(),
    prisma.rentalCharge.count({ where: { status: "overdue" } }),
  ]);

  return { paymentPlans, leases, payments, charges, overdueCharges };
}

export async function getCachedFinanceLeasesPageData() {
  const prisma = getPrismaClient();
  return prisma.rentalLease.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      listing: { select: { id: true, title: true } },
      tenantClient: { select: { id: true, fullName: true } },
      rentalCharges: { select: { id: true, status: true } },
    },
  });
}
