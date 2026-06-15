import "../../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@contour/db";

type InsightUpdatePayload = {
  status?: string;
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as InsightUpdatePayload;
  const status = toStringValue(body.status);

  if (!["open", "acknowledged", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid insight status." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const insight = await prisma.insight.update({
    where: { id },
    data: {
      status: status as "open" | "acknowledged" | "resolved" | "dismissed",
    },
    select: {
      id: true,
      status: true,
    },
  });

  return NextResponse.json({ insight });
}
