import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { normalizeWhatsAppPhone } from "@/lib/phone-input";

const phoneSchema = z.object({ phone: z.string().nullable() });

export const GET = createApiHandler({
  requireAuth: true,
  handler: async (_req, { userId }) => {
    if (!userId) return NextResponse.json({ success: false, error: "Authenticated user required." }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: userId }, select: { phone: true } });
    return NextResponse.json({ success: true, phone: user?.phone ?? null });
  },
});

export const PATCH = createApiHandler({
  requireAuth: true,
  bodySchema: phoneSchema,
  handler: async (_req, { body, userId }) => {
    if (!userId) return NextResponse.json({ success: false, error: "Authenticated user required." }, { status: 401 });
    try {
      const phone = normalizeWhatsAppPhone(body.phone);
      await db.user.update({ where: { id: userId }, data: { phone } });
      return NextResponse.json({ success: true, phone });
    } catch (error) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Enter a valid WhatsApp number." }, { status: 400 });
    }
  },
});
