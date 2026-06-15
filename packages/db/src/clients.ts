import type { ClientStatus, PrismaClient } from "@prisma/client";

type ContourClientRecord = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContourClientSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContourClientInput = {
  fullName: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  source: string | null;
};

type ContourClientQueryClient = PrismaClient;

const contourClientSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} as const;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toNullable(value: string) {
  return value ? value : null;
}

function toClientSummary(client: ContourClientRecord): ContourClientSummary {
  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    status: client.status,
    source: client.source,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export function parseContourClientFormData(formData: FormData): ContourClientInput {
  const fullName = readString(formData, "fullName");
  const email = readString(formData, "email");
  const phone = readString(formData, "phone");
  const status = readString(formData, "status");
  const source = readString(formData, "source");

  if (!fullName) {
    throw new Error("Client full name is required");
  }
  if (!status) {
    throw new Error("Client status is required");
  }

  const validStatuses: ClientStatus[] = ["lead", "active", "archived"];

  if (!validStatuses.includes(status as ClientStatus)) {
    throw new Error("Client status is invalid");
  }

  return {
    fullName,
    email: toNullable(email),
    phone: toNullable(phone),
    status: status as ClientStatus,
    source: toNullable(source),
  };
}

export async function listContourClients(
  prisma: ContourClientQueryClient,
  limit = 50,
): Promise<ContourClientSummary[]> {
  const rows = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: contourClientSelect,
  });

  return rows.map((client) => toClientSummary(client as ContourClientRecord));
}

export async function getContourClient(
  prisma: ContourClientQueryClient,
  id: string,
): Promise<ContourClientSummary | null> {
  const row = await prisma.client.findUnique({
    where: { id },
    select: contourClientSelect,
  });

  return row ? toClientSummary(row as ContourClientRecord) : null;
}

export async function createContourClient(
  prisma: ContourClientQueryClient,
  input: ContourClientInput,
): Promise<ContourClientSummary> {
  const row = await prisma.client.create({
    data: input,
    select: contourClientSelect,
  });

  return toClientSummary(row as ContourClientRecord);
}

export async function updateContourClient(
  prisma: ContourClientQueryClient,
  id: string,
  input: ContourClientInput,
): Promise<ContourClientSummary> {
  const row = await prisma.client.update({
    where: { id },
    data: input,
    select: contourClientSelect,
  });

  return toClientSummary(row as ContourClientRecord);
}

export async function findContourClientDuplicateHints(
  prisma: ContourClientQueryClient,
  input: { email: string | null; phone: string | null; excludeId?: string },
) {
  const filters: Array<{ email?: string; phone?: string }> = [];

  if (input.email) {
    filters.push({ email: input.email });
  }
  if (input.phone) {
    filters.push({ phone: input.phone });
  }

  if (!filters.length) {
    return [];
  }

  return prisma.client.findMany({
    where: {
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      OR: filters,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
    take: 5,
  });
}
