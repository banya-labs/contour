import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const createDocRequestSchema = z.object({
  title: z.string().min(3),
  message: z.string().optional(),
  propertyId: z.string().optional().nullable(),
  inquiryId: z.string().optional().nullable(),
  requiredTypes: z.array(z.enum([
    "TITLE_DEED",
    "NRC_PASSPORT_ID",
    "MANDATE_AGREEMENT",
    "LEASE_CONTRACT",
    "SITE_SURVEY_DIAGRAM",
    "PACRA_CERTIFICATE",
    "VALUATION_REPORT",
    "PROOF_OF_RESIDENCE",
    "PAYMENT_RECEIPT",
    "CLIENT_CORRESPONDENCE",
    "OTHER",
  ])).optional().default([]),
  customDocuments: z.string().optional().nullable(),
  maxFiles: z.number().int().min(1).max(10).default(5),
  expiryHours: z.number().int().min(1).max(720).default(72), // default 3 days
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4-8 digits").optional().nullable(),
});

export const GET = createApiHandler({
  requireAuth: true,
  handler: async (_req, { organizationId }) => {
    const orgId = organizationId!;

    const requests = await db.documentRequest.findMany({
      where: { organizationId: orgId },
      include: {
        property: {
          select: { id: true, title: true, suburb: true },
        },
        inquiry: {
          select: { id: true, clientName: true, clientPhone: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        documents: {
          select: { id: true, title: true, docType: true, isVerified: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  },
});

export const POST = createApiHandler({
  requireAuth: true,
  bodySchema: createDocRequestSchema,
  handler: async (_req, { organizationId, userId, body }) => {
    const orgId = organizationId!;
    const data = body;

    // Generate secure 32-byte cryptographic token
    const token = crypto.randomBytes(24).toString("hex");

    // Optional PIN hash
    let pinHash: string | null = null;
    if (data.pin) {
      pinHash = crypto.createHash("sha256").update(data.pin).digest("hex");
    }

    const expiryHours = data.expiryHours ?? 72;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const effectiveTypes = data.requiredTypes && data.requiredTypes.length > 0
      ? data.requiredTypes
      : ["OTHER" as const];

    // Combine custom documents with message if provided
    let combinedMessage = data.message || null;
    if (data.customDocuments?.trim()) {
      const customPrefix = `📄 Requested Document(s):\n• ${data.customDocuments.trim()}`;
      combinedMessage = combinedMessage
        ? `${combinedMessage}\n\n${customPrefix}`
        : customPrefix;
    }

    const docRequest = await db.documentRequest.create({
      data: {
        organizationId: orgId,
        propertyId: data.propertyId || null,
        inquiryId: data.inquiryId || null,
        requestedById: userId!,
        title: data.title,
        message: combinedMessage,
        requiredTypes: effectiveTypes,
        maxFiles: data.maxFiles,
        token,
        pinHash,
        expiresAt,
        status: "PENDING",
      },
      include: {
        property: { select: { id: true, title: true, suburb: true } },
        inquiry: { select: { id: true, clientName: true, clientPhone: true } },
      },
    });

    // Construct portal URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
    const shareableUrl = `${appUrl}/upload/${token}`;

    // Format pre-composed WhatsApp message for Zambian clients
    const clientGreeting = docRequest.inquiry?.clientName ? `Dear ${docRequest.inquiry.clientName}` : "Hello";
    const propertyNotice = docRequest.property?.title ? ` regarding "${docRequest.property.title}"` : "";
    const pinNotice = data.pin ? `\n🔒 Your Access PIN: *${data.pin}*` : "";
    const customDocsNotice = data.customDocuments?.trim()
      ? `\n📄 Requested Documents: *${data.customDocuments.trim()}*`
      : "";

    const whatsappText = `${clientGreeting},\n\nPlease upload your verification documents${propertyNotice}${customDocsNotice} using our secure portal:\n👉 ${shareableUrl}${pinNotice}\n\n*Note:* This link expires in ${data.expiryHours} hours and is protected under the Zambia Data Protection Act No. 3 of 2021. Thank you.`;

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "CLIENT_DOCUMENT_REQUEST_CREATED",
          entityType: "DocumentRequest",
          entityId: docRequest.id,
          details: {
            title: docRequest.title,
            propertyId: docRequest.propertyId,
            inquiryId: docRequest.inquiryId,
            expiresAt: expiresAt.toISOString(),
            hasPin: !!data.pin,
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      request: docRequest,
      shareableUrl,
      whatsappText,
      hasPin: !!data.pin,
    }, { status: 201 });
  },
});
