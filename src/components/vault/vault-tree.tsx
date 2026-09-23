"use client";

import * as React from "react";
import {
  Files,
  FolderItem,
  FolderTrigger,
  FolderContent,
  SubFiles,
  FileItem,
  VaultStatus,
} from "@/components/ui/files";
import {
  Download,
  Trash2,
  ShieldCheck,
  Plus,
  Lock,
  FileText,
  FileCheck2,
  Building,
  ExternalLink,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  Users,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { VaultMember } from "./folder-collaborators-modal";

export interface VaultDoc {
  id: string;
  title: string;
  docType: string;
  classification: string;
  objectKey: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
  description?: string | null;
  propertyId?: string | null;
  registryFolio?: string | null;
  standPlotNumber?: string | null;
  nrcNumber?: string | null;
  uploadedBy: string;
  uploadedByType: string;
  isVerified: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  sha256Checksum?: string | null;
  createdAt: string;
  updatedAt?: string;
  property?: {
    id: string;
    title: string;
    suburb: string;
    status: string;
    titleDeedNumber?: string | null;
  } | null;
  documentRequest?: {
    id: string;
    title: string;
    clientName?: string | null;
    status: string;
  } | null;
}

export interface PropertyItem {
  id: string;
  title: string;
  suburb: string;
  status: string;
  titleDeedNumber?: string | null;
  standPlotNumber?: string | null;
  assignedAgentId?: string | null;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  } | null;
}

interface VaultTreeProps {
  documents: VaultDoc[];
  properties: PropertyItem[];
  members?: VaultMember[];
  searchQuery: string;
  selectedCategory: string;
  onOpenUpload: (propertyId?: string) => void;
  onOpenCollaborators?: (property: PropertyItem) => void;
  onSelectDocument?: (doc: VaultDoc) => void;
  onRefresh: () => void;
}

export function VaultTree({
  documents,
  properties,
  members = [],
  searchQuery,
  selectedCategory,
  onOpenUpload,
  onOpenCollaborators,
  onSelectDocument,
  onRefresh,
}: VaultTreeProps) {
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Filter documents by search and category
  const filteredDocs = React.useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.registryFolio && doc.registryFolio.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.property && doc.property.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || doc.docType === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategory]);

  // Group filtered documents by propertyId (null = org documents)
  const orgDocs = filteredDocs.filter((d) => !d.propertyId);
  const docsByProperty = React.useMemo(() => {
    const map = new Map<string, VaultDoc[]>();
    filteredDocs.forEach((d) => {
      if (d.propertyId) {
        const list = map.get(d.propertyId) || [];
        list.push(d);
        map.set(d.propertyId, list);
      }
    });
    return map;
  }, [filteredDocs]);

  // Filter properties by search query (matching property metadata or matching documents)
  const filteredProperties = React.useMemo(() => {
    if (!searchQuery) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter((p) => {
      const matchProp =
        p.title.toLowerCase().includes(q) ||
        p.suburb.toLowerCase().includes(q) ||
        (p.titleDeedNumber && p.titleDeedNumber.toLowerCase().includes(q));
      const hasMatchingDoc = (docsByProperty.get(p.id) || []).length > 0;
      return matchProp || hasMatchingDoc;
    });
  }, [properties, searchQuery, docsByProperty]);

  // Handle Download (Presigned URL)
  const handleDownload = async (docId: string, title: string) => {
    setDownloadingId(docId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/vault/documents/${docId}/download`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate download link");
      }
      // Trigger native download via direct attachment link (bypasses browser popup blockers)
      const link = document.createElement("a");
      link.href = data.directDownloadUrl || data.downloadUrl || `/api/vault/documents/${docId}/download?direct=true`;
      link.download = title || "document";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMsg(`Download error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Soft-Delete
  const handleDelete = async (docId: string, propertyStatus?: string) => {
    if (propertyStatus === "ARCHIVED") {
      setErrorMsg("This property is archived. Documents cannot be deleted from a locked vault.");
      return;
    }

    if (!confirm("Are you sure you want to soft-delete this document? It will be archived per Zambia DPA retention rules.")) {
      return;
    }

    setDeletingId(docId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/vault/documents/${docId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete document");
      }
      onRefresh();
    } catch (err: any) {
      setErrorMsg(`Delete error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Lands Verification
  const handleVerify = async (docId: string) => {
    setVerifyingId(docId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/vault/documents/${docId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify document");
      }
      onRefresh();
    } catch (err: any) {
      setErrorMsg(`Verification error: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocIcon = (type: string) => {
    if (type.includes("IMAGE") || type === "JPG" || type === "PNG") return FileImage;
    if (type.includes("SHEET") || type === "XLS" || type === "CSV") return FileSpreadsheet;
    return FileText;
  };

  return (
    <div className="space-y-3 font-geist">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-[#fff5f3] border border-contour-red/30 rounded-none text-xs text-contour-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Files defaultOpen={["org-legal", ...filteredProperties.slice(0, 3).map((p) => p.id)]}>
        {/* 1. Global Agency Legal & Governance Folder */}
        <FolderItem value="org-legal">
          <FolderTrigger
            vaultStatus="active"
            badgeCount={orgDocs.length}
            actions={
              <button
                type="button"
                onClick={() => onOpenUpload(undefined)}
                title="Upload Agency Document"
                className="px-2 py-0.5 border border-editorial-border hover:border-editorial-black bg-white hover:bg-neutral-50 text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-black transition-colors rounded-none flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-contour-red" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            }
          >
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
              Agency Governance & Legal Compliance (ODPC / PACRA)
            </span>
          </FolderTrigger>

          <FolderContent>
            <SubFiles>
              {orgDocs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-editorial-muted italic">
                  No agency-level compliance documents uploaded yet.
                </div>
              ) : (
                orgDocs.map((doc) => (
                  <FileItem
                    key={doc.id}
                    icon={FileCheck2}
                    vaultStatus={doc.isVerified ? "verified" : "unverified"}
                    classification={doc.classification}
                    size={formatFileSize(doc.fileSize)}
                    onClick={() => onSelectDocument?.(doc)}
                    actions={
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.id, doc.title)}
                          disabled={downloadingId === doc.id}
                          title="Download 15-min Presigned URL"
                          className="p-1 hover:bg-[#fff5f3] text-editorial-muted hover:text-editorial-black rounded-none transition-colors border border-transparent hover:border-editorial-border"
                        >
                          {downloadingId === doc.id ? (
                            <ContourSunLoader size="sm" label="Preparing download…" decorative />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          title="Soft-delete document"
                          className="p-1 hover:bg-red-50 text-editorial-muted hover:text-contour-red rounded-none transition-colors border border-transparent hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    }
                  >
                    <span className="font-medium text-editorial-black">{doc.title}</span>
                    <span className="text-[10px] font-mono text-editorial-muted ml-1">({doc.originalFileName})</span>
                  </FileItem>
                ))
              )}
            </SubFiles>
          </FolderContent>
        </FolderItem>

        {/* 2. Automated Property Folders */}
        {filteredProperties.map((property) => {
          const isArchived = property.status === "ARCHIVED";
          const propDocs = docsByProperty.get(property.id) || [];

          // Calculate collaborators count for this property
          const orgAdmins = members.filter(
            (m) =>
              m.role === "SUPER_ADMIN" ||
              m.role === "BROKER_MANAGER" ||
              m.vaultGrant?.accessLevel === "FULL_VAULT"
          );
          const assignedAgent = members.find((m) => m.id === property.assignedAgentId);
          const directCollaborators = members.filter(
            (m) =>
              !orgAdmins.some((a) => a.id === m.id) &&
              (!assignedAgent || assignedAgent.id !== m.id) &&
              m.vaultGrant?.propertyIds?.includes(property.id)
          );
          const totalCollabsCount =
            orgAdmins.length + (assignedAgent ? 1 : 0) + directCollaborators.length;

          // Group by category subfolders
          const titleDeeds = propDocs.filter((d) => d.docType === "TITLE_DEED" || d.docType === "SITE_SURVEY_DIAGRAM");
          const kycDocs = propDocs.filter((d) => d.docType === "NRC_PASSPORT_ID" || d.docType === "PROOF_OF_RESIDENCE" || d.docType === "PACRA_CERTIFICATE");
          const mandates = propDocs.filter((d) => d.docType === "MANDATE_AGREEMENT" || d.docType === "VALUATION_REPORT");
          const leases = propDocs.filter((d) => d.docType === "LEASE_CONTRACT");
          const clientUploads = propDocs.filter((d) => d.uploadedByType === "CLIENT");
          const generalDocs = propDocs.filter(
            (d) =>
              !titleDeeds.includes(d) &&
              !kycDocs.includes(d) &&
              !mandates.includes(d) &&
              !leases.includes(d) &&
              !clientUploads.includes(d)
          );

          return (
            <FolderItem
              key={property.id}
              value={property.id}
              isArchived={isArchived}
            >
              <FolderTrigger
                vaultStatus={isArchived ? "archived" : "active"}
                badgeCount={propDocs.length}
                actions={
                  <div className="flex items-center gap-1.5">
                    {/* Collaborators Button */}
                    <button
                      type="button"
                      onClick={() => onOpenCollaborators?.(property)}
                      title="View & Manage Collaborators with access to this folder"
                      className="flex items-center gap-1 px-2 py-0.5 border border-editorial-border hover:border-editorial-black bg-white hover:bg-neutral-50 text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-black transition-colors rounded-none"
                    >
                      <Users className="w-3 h-3 text-contour-red" />
                      <span className="hidden sm:inline">Access</span>
                      <span className="font-mono text-[9px] text-editorial-muted">({totalCollabsCount})</span>
                    </button>

                    {/* Upload to property vault */}
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => onOpenUpload(property.id)}
                        title="Upload to this property vault"
                        className="flex items-center gap-1 px-2 py-0.5 bg-editorial-black hover:bg-contour-red text-white text-[10px] font-heading font-semibold uppercase tracking-wider transition-colors rounded-none"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Upload</span>
                      </button>
                    )}
                  </div>
                }
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={isArchived ? "line-through text-editorial-muted" : "font-heading font-bold text-xs uppercase tracking-wider text-editorial-black"}>
                    {property.title}
                  </span>
                  <span className="text-[10px] font-mono text-editorial-muted">[{property.suburb}]</span>
                  {isArchived && (
                    <span className="text-[9px] font-mono uppercase bg-neutral-100 text-editorial-muted px-1.5 py-0.2 border border-editorial-border rounded-none">
                      ARCHIVED - READ ONLY
                    </span>
                  )}
                </div>
              </FolderTrigger>

              <FolderContent>
                <SubFiles>
                  {isArchived && (
                    <div className="flex items-center gap-1.5 px-3 py-2 mb-1 bg-neutral-50 border border-editorial-border rounded-none text-xs text-editorial-muted">
                      <Lock className="w-3.5 h-3.5 text-editorial-muted shrink-0" />
                      <span>
                        Property archived. Vault locked into statutory custodial mode (Zambia DPA Section 26). Uploads and deletions disabled; historical files remain downloadable.
                      </span>
                    </div>
                  )}

                  {propDocs.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-editorial-muted italic flex items-center justify-between">
                      <span>No documents in this property vault yet.</span>
                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() => onOpenUpload(property.id)}
                          className="text-contour-red hover:underline flex items-center gap-1 font-heading text-xs uppercase tracking-wider font-semibold"
                        >
                          <Plus className="w-3 h-3" /> Upload first document
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Subfolder 01: Title Deeds */}
                      {titleDeeds.length > 0 && (
                        <FolderItem value={`${property.id}-title`}>
                          <FolderTrigger badgeCount={titleDeeds.length}>
                            <span>01. Title Deeds & Ministry of Lands Records</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {titleDeeds.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {/* Subfolder 02: KYC Scans */}
                      {kycDocs.length > 0 && (
                        <FolderItem value={`${property.id}-kyc`}>
                          <FolderTrigger badgeCount={kycDocs.length}>
                            <span>02. Landlord & Client KYC Scans (NRC/Passport)</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {kycDocs.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {/* Subfolder 03: Mandates */}
                      {mandates.length > 0 && (
                        <FolderItem value={`${property.id}-mandates`}>
                          <FolderTrigger badgeCount={mandates.length}>
                            <span>03. Sole Mandates & Valuations</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {mandates.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {/* Subfolder 04: Leases */}
                      {leases.length > 0 && (
                        <FolderItem value={`${property.id}-leases`}>
                          <FolderTrigger badgeCount={leases.length}>
                            <span>04. Tenancy Leases & Contracts</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {leases.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {/* Subfolder 05: Client Uploads */}
                      {clientUploads.length > 0 && (
                        <FolderItem value={`${property.id}-client`}>
                          <FolderTrigger badgeCount={clientUploads.length}>
                            <span>05. Client Upload Portal Ingests</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {clientUploads.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}

                      {/* Subfolder 06: General */}
                      {generalDocs.length > 0 && (
                        <FolderItem value={`${property.id}-general`}>
                          <FolderTrigger badgeCount={generalDocs.length}>
                            <span>06. Receipts & Correspondence</span>
                          </FolderTrigger>
                          <FolderContent>
                            <SubFiles>
                              {generalDocs.map((d) => renderFileRow(d, property.status))}
                            </SubFiles>
                          </FolderContent>
                        </FolderItem>
                      )}
                    </>
                  )}
                </SubFiles>
              </FolderContent>
            </FolderItem>
          );
        })}
      </Files>
    </div>
  );

  function renderFileRow(doc: VaultDoc, propertyStatus?: string) {
    const isArchived = propertyStatus === "ARCHIVED";
    const IconComponent = getDocIcon(doc.fileType);

    return (
      <FileItem
        key={doc.id}
        icon={IconComponent}
        vaultStatus={doc.isVerified ? "verified" : "unverified"}
        classification={doc.classification}
        size={formatFileSize(doc.fileSize)}
        onClick={() => onSelectDocument?.(doc)}
        actions={
          <div className="flex items-center gap-1">
            {/* Download button - ALWAYS enabled even if archived! */}
            <button
              type="button"
              onClick={() => handleDownload(doc.id, doc.title)}
              disabled={downloadingId === doc.id}
              title="Download 15-min Presigned URL"
              className="p-1 hover:bg-[#fff5f3] text-editorial-muted hover:text-editorial-black rounded-none transition-colors border border-transparent hover:border-editorial-border"
            >
              {downloadingId === doc.id ? (
                <ContourSunLoader size="sm" label="Preparing download…" decorative />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Verify button - only if not verified and not archived */}
            {!doc.isVerified && !isArchived && (
              <button
                type="button"
                onClick={() => handleVerify(doc.id)}
                disabled={verifyingId === doc.id}
                title="Mark Verified (Lands Registry confirmed)"
                className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 rounded-none transition-colors border border-transparent hover:border-emerald-300"
              >
                {verifyingId === doc.id ? (
                  <ContourSunLoader size="sm" label="Verifying document…" decorative />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Delete button - DISABLED if archived */}
            {!isArchived && (
              <button
                type="button"
                onClick={() => handleDelete(doc.id, propertyStatus)}
                disabled={deletingId === doc.id}
                title="Soft-delete document"
                className="p-1 hover:bg-red-50 text-editorial-muted hover:text-contour-red rounded-none transition-colors border border-transparent hover:border-red-200"
              >
                {deletingId === doc.id ? (
                  <ContourSunLoader size="sm" label="Deleting document…" decorative />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 truncate">
          <span className="font-medium text-editorial-black">{doc.title}</span>
          {doc.registryFolio && (
            <span className="text-[10px] font-mono text-editorial-muted bg-neutral-100 border border-editorial-border px-1 py-0.2 rounded-none">
              Folio {doc.registryFolio}
            </span>
          )}
          {doc.uploadedByType === "CLIENT" && (
            <span className="text-[10px] font-mono text-contour-red bg-[#fff5f3] border border-contour-red/30 px-1 py-0.2 rounded-none">
              Client Portal
            </span>
          )}
        </div>
      </FileItem>
    );
  }
}
