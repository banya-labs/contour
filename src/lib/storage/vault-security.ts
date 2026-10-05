import { readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { db } from "@/lib/db";
import { isManagementRole, type Permission } from "@/lib/authorization";
import { s3Storage } from "./s3";

export class VaultSecurityError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
export const VAULT_MAX_BYTES = 25 * 1024 * 1024;
export const PASSIVE_VAULT_MIMES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/avif"]);
const STORAGE_CATEGORIES = new Set(["organization_logo", "property_photo", "site_survey_diagram", "title_deed", "nrc_passport_id", "mandate_agreement", "lease_contract"]);
export function passiveVaultMime(value: string): string {
  const mime = value.trim().toLowerCase();
  if (!PASSIVE_VAULT_MIMES.has(mime)) throw new VaultSecurityError("Unsupported document type");
  return mime;
}
export function tenantVaultLocator(organizationId: string, key: string, allowLegacy = false): { kind: "s3" | "local"; key: string } {
  if (!organizationId || !key || /[\\\x00-\x1f%?#]/.test(key)) throw new VaultSecurityError("Invalid document locator");
  const local = key.startsWith("local:");
  const path = local ? key.slice(6) : key;
  const segments = path.split("/");
  if (segments.some((s, i) => (!s && !(local && i === 0)) || s === "." || s === "..")) throw new VaultSecurityError("Invalid document locator");
  if (local) {
    const safeOrg = organizationId.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!allowLegacy || !path.startsWith(`/uploads/vault/${safeOrg}/`) || segments.length !== 5 || !/^\d+_[a-zA-Z0-9._-]+$/.test(segments[4])) throw new VaultSecurityError("Invalid legacy document locator");
    return { kind: "local", key: path };
  }
  if (segments.length !== 3 || segments[0] !== organizationId || !STORAGE_CATEGORIES.has(segments[1]) || !/^\d+_[a-zA-Z0-9._-]+$/.test(segments[2])) throw new VaultSecurityError("Document does not belong to this workspace");
  return { kind: "s3", key };
}
type VaultActor = { organizationId?: string; userId?: string; contourRole?: string; permissions?: readonly Permission[] };
type VaultDocumentScope = { organizationId: string; propertyId: string | null; objectKey: string };
export async function assertVaultAccess(actor: VaultActor, doc: VaultDocumentScope, operation: "read" | "download" | "verify" | "delete" | "upload") {
  if (!actor.organizationId) throw new VaultSecurityError("Forbidden", 403);
  tenantVaultLocator(actor.organizationId, doc.objectKey, true);
  return assertVaultFolderAccess(actor, doc, operation);
}
export async function assertVaultFolderAccess(actor: VaultActor, doc: Pick<VaultDocumentScope, "organizationId" | "propertyId">, operation: "read" | "download" | "verify" | "delete" | "upload") {
  if (!actor.organizationId || !actor.userId || doc.organizationId !== actor.organizationId || !actor.permissions?.includes(`vault.${operation}`)) throw new VaultSecurityError("Forbidden", 403);
  const property = doc.propertyId ? await db.property.findFirst({ where: { id: doc.propertyId, organizationId: actor.organizationId }, select: { id: true, assignedAgentId: true, status: true } }) : null;
  if (doc.propertyId && !property) throw new VaultSecurityError("Property not found", 404);
  if ((operation === "upload" || operation === "delete" || operation === "verify") && property?.status === "ARCHIVED") throw new VaultSecurityError("Archived property vault is read-only", 423);
  if (isManagementRole(actor.contourRole)) return;
  const grant = await db.vaultAccessGrant.findUnique({ where: { organizationId_userId: { organizationId: actor.organizationId, userId: actor.userId } } });
  const level = grant?.accessLevel ?? "ASSIGNED_ONLY";
  const allowed = !doc.propertyId || level === "FULL_VAULT" || (level === "SPECIFIC_FOLDERS" ? grant?.propertyIds.includes(doc.propertyId) : property?.assignedAgentId === actor.userId);
  if (!allowed || (operation === "verify" && !grant?.canVerifyDocs) || (operation === "delete" && !grant?.canDeleteDocs)) throw new VaultSecurityError("Forbidden", 403);
}
export async function verifiedVaultMetadata(organizationId: string, key: string) {
  tenantVaultLocator(organizationId, key);
  const existing = await db.vaultDocument.findFirst({ where: { organizationId, objectKey: key }, select: { id: true } });
  if (existing) throw new VaultSecurityError("Document object is already registered", 409);
  if (!s3Storage.isConfigured()) throw new VaultSecurityError("Private document storage is unavailable", 503);
  let head;
  try { head = await s3Storage.headObject(key); } catch { throw new VaultSecurityError("Uploaded document is unavailable", 503); }
  const mimeType = passiveVaultMime(head.contentType);
  if (head.contentLength <= 0 || head.contentLength > VAULT_MAX_BYTES) throw new VaultSecurityError("Document size exceeds allowed limits");
  return { mimeType, fileSize: head.contentLength };
}
export async function readVaultBinary(doc: { organizationId: string; objectKey: string; mimeType: string }) {
  const locator = tenantVaultLocator(doc.organizationId, doc.objectKey, true);
  passiveVaultMime(doc.mimeType);
  try {
    if (locator.kind === "local") {
      const root = await realpath(resolve(process.cwd(), "public", "uploads", "vault", doc.organizationId.replace(/[^a-zA-Z0-9_-]/g, "_")));
      const file = await realpath(resolve(process.cwd(), "public", locator.key.slice(1)));
      if (!file.startsWith(root + sep)) throw new VaultSecurityError("Invalid document path");
      const body = await readFile(file);
      return { body, contentType: passiveVaultMime(doc.mimeType), contentLength: body.length };
    }
    if (!s3Storage.isConfigured()) throw new VaultSecurityError("Private document storage is unavailable", 503);
    const object = await s3Storage.getObject(locator.key);
    return { ...object, contentType: passiveVaultMime(object.contentType) };
  } catch (error) {
    if (error instanceof VaultSecurityError) throw error;
    throw new VaultSecurityError("Original document file is unavailable", 503);
  }
}
