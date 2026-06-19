"use server";

import { revalidateTag } from "next/cache";
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
    revalidateTag("contour-dashboard", "max");
    revalidateTag("contour-clients-page-data", "max");
    redirect(`/deals/${deal.id}`);
  }

  const deal = await createContourDeal(prisma, input);
  revalidateTag("contour-dashboard", "max");
  revalidateTag("contour-clients-page-data", "max");
  redirect(`/deals/${deal.id}`);
}
