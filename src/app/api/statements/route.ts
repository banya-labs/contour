import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const statements = await db.landlordStatement.findMany({
      where: { organizationId },
      include: {
        property: {
          select: {
            title: true,
            suburb: true,
          }
        }
      },
      orderBy: [
        { statementYear: "desc" },
        { statementMonth: "desc" }
      ]
    });

    return NextResponse.json({ success: true, statements });
  }
});

const postHandler = createApiHandler({
  bodySchema: z.object({
    id: z.string(),
    status: z.enum(["DRAFT", "APPROVED_BY_MANAGER", "SENT_TO_LANDLORD", "PAID_OUT"]),
  }),
  handler: async (req, ctx) => {
    const { organizationId, body } = ctx;

    const updated = await db.landlordStatement.update({
      where: { id: body.id, organizationId },
      data: {
        status: body.status,
        approvedAt: body.status === "PAID_OUT" ? new Date() : undefined,
      }
    });

    return NextResponse.json({ success: true, statement: updated });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
