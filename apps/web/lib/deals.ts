"use server";

import { redirect } from "next/navigation";
import {
  createContourDeal,
  getPrismaClient,
  parseContourDealFormData,
  updateContourDeal,
} from "@contour/db";

export async function saveContourDealAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "").trim();
  const input = parseContourDealFormData(formData);
  const prisma = getPrismaClient();

  if (dealId) {
    const deal = await updateContourDeal(prisma, dealId, input);
    redirect(`/deals/${deal.id}`);
  }

  const deal = await createContourDeal(prisma, input);
  redirect(`/deals/${deal.id}`);
}
