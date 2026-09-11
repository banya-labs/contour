import { getPrismaClient } from "./client";

export type ContourDashboardListing = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  createdAt: string;
};

export type ContourDashboardClient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  createdAt: string;
};

export type ContourDashboardDeal = {
  id: string;
  title: string;
  stage: string;
  valueCents: number;
  currency: string;
  status: string;
  closedAt: string | null;
  createdAt: string;
};

export type ContourDashboardWorkItem = {
  id: string;
  title: string;
  kind: string;
  tone: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
};

export type ContourDashboardSnapshot = {
  counts: {
    listings: number;
    clients: number;
    deals: number;
    workItems: number;
  };
  listings: ContourDashboardListing[];
  clients: ContourDashboardClient[];
  deals: ContourDashboardDeal[];
  workItems: ContourDashboardWorkItem[];
};

type ContourDashboardClientApi = {
  listing: {
    count: () => Promise<number>;
    findMany: (args: {
      orderBy: { createdAt: "desc" };
      take: number;
      select: {
        id: true;
        title: true;
        propertyType: true;
        status: true;
        priceCents: true;
        currency: true;
        ownerName: true;
        createdAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        title: string;
        propertyType: string;
        status: string;
        priceCents: number;
        currency: string;
        ownerName: string | null;
        createdAt: Date;
      }>
    >;
  };
  client: {
    count: () => Promise<number>;
    findMany: (args: {
      orderBy: { createdAt: "desc" };
      take: number;
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
        status: true;
        source: true;
        createdAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        status: string;
        source: string | null;
        createdAt: Date;
      }>
    >;
  };
  deal: {
    count: () => Promise<number>;
    findMany: (args: {
      orderBy: { createdAt: "desc" };
      take: number;
      select: {
        id: true;
        title: true;
        stage: true;
        valueCents: true;
        currency: true;
        status: true;
        closedAt: true;
        createdAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        title: string;
        stage: string;
        valueCents: number;
        currency: string;
        status: string;
        closedAt: Date | null;
        createdAt: Date;
      }>
    >;
  };
  workItem: {
    count: () => Promise<number>;
    findMany: (args: {
      orderBy: { createdAt: "desc" };
      take: number;
      select: {
        id: true;
        title: true;
        kind: true;
        tone: true;
        status: true;
        dueAt: true;
        createdAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        title: string;
        kind: string;
        tone: string;
        status: string;
        dueAt: Date | null;
        createdAt: Date;
      }>
    >;
  };
};

export async function queryContourDashboardSnapshot(
  prisma: ContourDashboardClientApi,
): Promise<ContourDashboardSnapshot> {
  const [listingCount, clientCount, dealCount, workItemCount, listings, clients, deals, workItems] =
    await Promise.all([
      prisma.listing.count(),
      prisma.client.count(),
      prisma.deal.count(),
      prisma.workItem.count(),
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          propertyType: true,
          status: true,
          priceCents: true,
          currency: true,
          ownerName: true,
          createdAt: true,
        },
      }),
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          createdAt: true,
        },
      }),
      prisma.deal.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          stage: true,
          valueCents: true,
          currency: true,
          status: true,
          closedAt: true,
          createdAt: true,
        },
      }),
      prisma.workItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          kind: true,
          tone: true,
          status: true,
          dueAt: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    counts: {
      listings: listingCount,
      clients: clientCount,
      deals: dealCount,
      workItems: workItemCount,
    },
    listings: listings.map((listing) => ({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
    })),
    clients: clients.map((client) => ({
      ...client,
      createdAt: client.createdAt.toISOString(),
    })),
    deals: deals.map((deal) => ({
      ...deal,
      createdAt: deal.createdAt.toISOString(),
      closedAt: deal.closedAt ? deal.closedAt.toISOString() : null,
    })),
    workItems: workItems.map((workItem) => ({
      ...workItem,
      createdAt: workItem.createdAt.toISOString(),
      dueAt: workItem.dueAt ? workItem.dueAt.toISOString() : null,
    })),
  };
}

export async function getContourDashboardSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourDashboardSnapshot> {
  const prisma = getPrismaClient(env);
  return queryContourDashboardSnapshot(prisma);
}
