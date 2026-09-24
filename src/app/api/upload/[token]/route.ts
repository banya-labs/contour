import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { s3Storage, StorageCategory } from "@/lib/storage/s3";
import { recordClientConsent } from "@/lib/zambia-dpa";
import { isDocumentRequestConsumed, ONE_TIME_UPLOAD_CONSUMED_MESSAGE } from "@/lib/document-request-status";

// ── GET /api/upload/[token] ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const docRequest = await db.documentRequest.findUnique({
      where: { token },
      include: {
        organization: {
          select: { name: true, logo: true },
        },
        property: {
          select: { id: true, title: true, suburb: true, status: true },
        },
        inquiry: {
          select: { id: true, clientName: true, clientPhone: true },
        },
        documents: {
          select: { id: true, title: true, originalFileName: true, createdAt: true },
        },
      },
    });

    if (!docRequest) {
      return NextResponse.json({ error: "Invalid or expired document request link" }, { status: 404 });
    }

    const isExpired = new Date() > new Date(docRequest.expiresAt) || docRequest.status === "EXPIRED";
    const isConsumed = isDocumentRequestConsumed(docRequest.status);

    return NextResponse.json({
      success: true,
      request: {
        id: docRequest.id,
        title: docRequest.title,
        message: docRequest.message,
        requiredTypes: docRequest.requiredTypes,
        maxFiles: docRequest.maxFiles,
        maxSizeMbPerFile: docRequest.maxSizeMbPerFile,
        expiresAt: docRequest.expiresAt,
        status: isExpired ? "EXPIRED" : docRequest.status,
        accessMessage: isConsumed ? ONE_TIME_UPLOAD_CONSUMED_MESSAGE : null,
        hasPin: !!docRequest.pinHash,
        agencyName: docRequest.organization.name,
        propertyTitle: docRequest.property?.title || null,
        propertySuburb: docRequest.property?.suburb || null,
        clientName: docRequest.inquiry?.clientName || docRequest.clientName || null,
        uploadedDocuments: docRequest.documents,
      },
    });
  } catch (error: any) {
    console.error("GET /api/upload/[token] error:", error);
    return NextResponse.json(
      { error: "Failed to load document request", details: error.message },
      { status: 500 }
    );
  }
}

// ── POST /api/upload/[token] ─────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const docRequest = await db.documentRequest.findUnique({
      where: { token },
      include: {
        organization: true,
        property: true,
        inquiry: true,
      },
    });

    if (!docRequest) {
      return NextResponse.json({ error: "Invalid document request" }, { status: 404 });
    }

    if (new Date() > new Date(docRequest.expiresAt) || docRequest.status === "EXPIRED") {
      return NextResponse.json({ error: "This document request link has expired" }, { status: 410 });
    }

    if (isDocumentRequestConsumed(docRequest.status)) {
      return NextResponse.json({ error: ONE_TIME_UPLOAD_CONSUMED_MESSAGE }, { status: 410 });
    }

    // Action 1: Verify PIN
    if (action === "verify-pin") {
      const { pin } = body;
      if (!docRequest.pinHash) {
        return NextResponse.json({ success: true, verified: true });
      }

      if (!pin) {
        return NextResponse.json({ error: "PIN is required" }, { status: 400 });
      }

      const inputHash = crypto.createHash("sha256").update(String(pin).trim()).digest("hex");
      if (inputHash !== docRequest.pinHash) {
        return NextResponse.json({ error: "Incorrect access PIN. Please check and try again." }, { status: 401 });
      }

      return NextResponse.json({ success: true, verified: true });
    }

    // Action 2: Generate Presigned S3 Upload URL
    if (action === "presign") {
      const { filename, mimeType, category = "NRC_PASSPORT_ID" } = body;

      if (!filename) {
        return NextResponse.json({ error: "filename is required" }, { status: 400 });
      }

      const VALID_CATEGORIES = [
        "ORGANIZATION_LOGO",
        "PROPERTY_PHOTO",
        "SITE_SURVEY_DIAGRAM",
        "TITLE_DEED",
        "NRC_PASSPORT_ID",
        "MANDATE_AGREEMENT",
        "LEASE_CONTRACT",
      ];
      const safeCategory: StorageCategory = VALID_CATEGORIES.includes(category)
        ? (category as StorageCategory)
        : "NRC_PASSPORT_ID";
      const { uploadUrl, objectKey, publicCdnUrl } = await s3Storage.getPresignedUploadUrl(
        docRequest.organizationId,
        safeCategory,
        filename,
        mimeType || "application/octet-stream"
      );

      return NextResponse.json({
        success: true,
        uploadUrl,
        objectKey,
        publicCdnUrl,
      });
    }

    // Action 3: Complete Upload & Record Ingestion
    if (action === "complete") {
      const { files, consent } = body;

      if (!Array.isArray(files) || files.length === 0) {
        return NextResponse.json({ error: "At least one uploaded file is required" }, { status: 400 });
      }

      if (!consent?.agreed) {
        return NextResponse.json(
          { error: "Explicit consent under Zambia DPA 2021 is required to upload documents" },
          { status: 400 }
        );
      }

      // Consume the capability before writing any documents. The conditional
      // update makes finalization single-use even if two requests arrive together.
      const consumed = await db.documentRequest.updateMany({
        where: { id: docRequest.id, status: "PENDING" },
        data: { status: "FULFILLED" },
      });
      if (consumed.count !== 1) {
        return NextResponse.json({ error: ONE_TIME_UPLOAD_CONSUMED_MESSAGE }, { status: 410 });
      }

      const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "REMOTE_CLIENT";
      const userAgent = req.headers.get("user-agent") || "UNKNOWN";

      // 1. Record DPA statutory consent
      await recordClientConsent({
        documentRequestId: docRequest.id,
        clientName: consent.name || docRequest.inquiry?.clientName || "Portal Client",
        clientPhone: consent.phone || docRequest.inquiry?.clientPhone || "",
        clientEmail: consent.email || "",
        ipAddress: clientIp,
        userAgent,
        organizationId: docRequest.organizationId,
      });

      // 2. Create VaultDocument records for each uploaded file
      const createdDocs = [];
      for (const f of files) {
        const doc = await db.vaultDocument.create({
          data: {
            organizationId: docRequest.organizationId,
            propertyId: docRequest.propertyId || null,
            documentRequestId: docRequest.id,
            title: f.title || f.originalFileName,
            docType: f.docType || "NRC_PASSPORT_ID",
            classification: "CONFIDENTIAL_PII",
            objectKey: f.objectKey,
            originalFileName: f.originalFileName,
            fileSize: f.fileSize || 1024,
            mimeType: f.mimeType || "application/octet-stream",
            fileType: f.originalFileName.split(".").pop()?.toUpperCase() || "PDF",
            uploadedBy: `Client: ${consent.name || docRequest.inquiry?.clientName || "Verified Guest"}`,
            uploadedByType: "CLIENT",
            isVerified: false,
          },
        });
        createdDocs.push(doc);
      }

      // 3. If linked to Inquiry / Deal, append note to Inquiry
      if (docRequest.inquiryId) {
        try {
          const inquiry = await db.inquiry.findUnique({
            where: { id: docRequest.inquiryId },
          });
          if (inquiry) {
            const timestampStr = new Date().toLocaleDateString("en-ZM", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const newNote = `[${timestampStr}] Client uploaded ${files.length} verification document(s) via secure portal link (Req: "${docRequest.title}").`;
            await db.inquiry.update({
              where: { id: docRequest.inquiryId },
              data: {
                notes: inquiry.notes ? `${inquiry.notes}\n${newNote}` : newNote,
              },
            });
          }
        } catch (inqErr) {
          console.warn("Inquiry update note warning:", inqErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Documents securely received and attached to property vault.",
        uploadedCount: createdDocs.length,
        documents: createdDocs,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/upload/[token] error:", error);
    return NextResponse.json(
      { error: "Upload processing failed", details: error.message },
      { status: 500 }
    );
  }
}
