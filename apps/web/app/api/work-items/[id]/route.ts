import "../../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@contour/db";

type WorkItemUpdatePayload = {
  status?: string;
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as WorkItemUpdatePayload;
  const status = toStringValue(body.status);

  if (!["open", "in_progress", "done", "blocked"].includes(status)) {
    return NextResponse.json({ error: "Invalid work item status." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const workItem = await prisma.workItem.update({
    where: { id },
    data: {
      status: status as "open" | "in_progress" | "done" | "blocked",
    },
    select: {
      id: true,
      status: true,
    },
  });

  return NextResponse.json({ workItem });
}
