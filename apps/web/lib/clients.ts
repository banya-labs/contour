"use server";

import { redirect } from "next/navigation";
import {
  createContourClient,
  getPrismaClient,
  parseContourClientFormData,
  updateContourClient,
} from "@contour/db";

export async function saveContourClientAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const input = parseContourClientFormData(formData);
  const prisma = getPrismaClient();

  if (clientId) {
    const client = await updateContourClient(prisma, clientId, input);
    redirect(`/clients/${client.id}`);
  }

  const client = await createContourClient(prisma, input);
  redirect(`/clients/${client.id}`);
}
