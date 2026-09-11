/**
 * Zambia Data Protection Act No. 3 of 2021 (DPA) Compliance Engine
 * 
 * Statutory framework:
 * - Regulator: Office of the Data Protection Commissioner (ODPC), Lusaka, Zambia
 * - Electronic Communications & Transactions (ECT) Act No. 4 of 2021
 * - Lands and Deeds Registry Act (Cap 185)
 */

import { db } from "@/lib/db";

export interface ConsentRecordParams {
  documentRequestId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
}

/**
 * Capture explicit, uncoerced consent per Section 21 of the Zambia DPA 2021
 */
export async function recordClientConsent(params: ConsentRecordParams) {
  const timestamp = new Date();

  // 1. Update DocumentRequest with consent record
  const updatedRequest = await db.documentRequest.update({
    where: { id: params.documentRequestId },
    data: {
      clientName: params.clientName,
      clientPhone: params.clientPhone,
      clientEmail: params.clientEmail,
      consentGiven: true,
      consentTimestamp: timestamp,
      consentIp: params.ipAddress || "UNKNOWN",
      consentUserAgent: params.userAgent || "UNKNOWN",
    },
  });

  // 2. Write immutable audit log entry
  try {
    await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        action: "ZAMBIA_DPA_CONSENT_CAPTURED",
        entityType: "DocumentRequest",
        entityId: params.documentRequestId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: {
          statutoryAct: "Zambia Data Protection Act No. 3 of 2021 (Section 21)",
          clientName: params.clientName ? maskName(params.clientName) : undefined,
          clientPhone: params.clientPhone ? maskPhoneNumber(params.clientPhone) : undefined,
          consentTimestamp: timestamp.toISOString(),
          purpose: "REAL_ESTATE_KYC_AND_CONVEYANCING_DOCUMENTATION",
        },
      },
    });
  } catch (err) {
    console.error("Audit log error for consent capture:", err);
  }

  return updatedRequest;
}

/**
 * Masks Zambian NRC Numbers (e.g. 123456/11/1 -> 123*** / ** / 1)
 */
export function maskNRC(nrc: string | null | undefined): string {
  if (!nrc) return "";
  const cleaned = nrc.trim();
  const match = cleaned.match(/^(\d{3})(\d{3})\/(\d{2})\/(\d)$/);
  if (match) {
    return `${match[1]}***/**/${match[4]}`;
  }
  if (cleaned.length > 4) {
    return cleaned.slice(0, 3) + "****" + cleaned.slice(-2);
  }
  return "***";
}

/**
 * Masks Phone Numbers (e.g. "+260971234567" -> "+260***4567")
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length > 7) {
    return cleaned.slice(0, 4) + "****" + cleaned.slice(-3);
  }
  return "****";
}

/**
 * Masks full names for confidential logging (e.g. "Seward Richard" -> "S**** R****")
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => (part.length > 1 ? part[0] + "*".repeat(part.length - 1) : part))
    .join(" ");
}

/**
 * Data Subject Access Request (DSAR) Generator per Section 28 of Zambia DPA 2021
 */
export async function generateDSARRecord(organizationId: string, clientIdentifier: string) {
  const docs = await db.vaultDocument.findMany({
    where: {
      organizationId,
      isDeleted: false,
      OR: [
        { nrcNumber: { contains: clientIdentifier } },
        { uploadedBy: { contains: clientIdentifier } },
        {
          documentRequest: {
            OR: [
              { clientEmail: clientIdentifier },
              { clientPhone: clientIdentifier },
              { clientName: { contains: clientIdentifier } },
            ],
          },
        },
      ],
    },
    include: {
      property: {
        select: { id: true, title: true, suburb: true },
      },
    },
  });

  return {
    statutoryNotice: "Data Subject Access Request (DSAR) Report - Zambia DPA No. 3 of 2021",
    supervisoryAuthority: "Office of the Data Protection Commissioner (ODPC), Lusaka, Zambia",
    generatedAt: new Date().toISOString(),
    organizationId,
    clientIdentifier,
    totalDocuments: docs.length,
    documents: docs.map((d) => ({
      documentId: d.id,
      title: d.title,
      category: d.docType,
      classification: d.classification,
      fileName: d.originalFileName,
      fileSize: d.fileSize,
      uploadedAt: d.createdAt,
      property: d.property ? `${d.property.title} (${d.property.suburb})` : "General Vault",
      ministryLandsFolio: d.registryFolio,
      isVerified: d.isVerified,
    })),
  };
}
