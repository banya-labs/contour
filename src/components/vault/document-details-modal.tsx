"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Download,
  ExternalLink,
  Eye,
  Info,
  Calendar,
  User,
  Building,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { VaultDoc } from "./vault-tree";

interface DocumentDetailsModalProps {
  isOpen: boolean;
  doc: VaultDoc | null;
  onClose: () => void;
  onRefresh?: () => void;
}

interface DetailedDoc extends VaultDoc {
  description?: string | null;
  sha256Checksum?: string | null;
  uploaderUser?: { name: string; email: string; role?: string } | null;
  verifierUser?: { name: string; email: string } | null;
  previewUrl?: string | null;
}

export function DocumentDetailsModal({
  isOpen,
  doc,
  onClose,
  onRefresh,
}: DocumentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"METADATA" | "PREVIEW">("METADATA");
  const [details, setDetails] = useState<DetailedDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState(false);

  // Load complete document details when opened
  useEffect(() => {
    if (isOpen && doc?.id) {
      setActiveTab("METADATA");
      setActionError(null);
      setActionSuccess(null);
      setImageZoom(1);
      setImageLoadError(false);
      setImageLoading(true);
      fetchDocumentDetails(doc.id);
    } else {
      setDetails(null);
    }
  }, [isOpen, doc?.id]);

  const fetchDocumentDetails = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault/documents/${docId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDetails(data.document);
      } else {
        // Fallback to the summary passed in props
        setDetails(doc as DetailedDoc);
      }
    } catch (err: any) {
      console.error("Failed to fetch full document details:", err);
      setDetails(doc as DetailedDoc);
    } finally {
      setLoading(false);
    }
  };

  if (!doc) return null;

  const currentDoc: DetailedDoc = details || (doc as DetailedDoc);
  const mime = (currentDoc.mimeType || "").toLowerCase();
  const fileType = (currentDoc.fileType || "").toUpperCase();
  const originalName = (currentDoc.originalFileName || "").toLowerCase();

  const isPdf = mime.includes("pdf") || fileType === "PDF" || originalName.endsWith(".pdf");
  const isImage =
    mime.startsWith("image/") ||
    ["JPG", "JPEG", "PNG", "WEBP", "GIF", "SVG"].includes(fileType) ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(originalName);
  const isWord =
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    ["DOC", "DOCX"].includes(fileType) ||
    /\.(docx|doc)$/i.test(originalName);
  const isSheet =
    mime.includes("sheet") ||
    mime.includes("csv") ||
    mime.includes("excel") ||
    ["XLS", "XLSX", "CSV"].includes(fileType) ||
    /\.(xlsx|xls|csv)$/i.test(originalName);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Download handler: triggers direct download
  const handleDownload = async () => {
    setDownloading(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/vault/documents/${currentDoc.id}/download?direct=true`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to download document");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = currentDoc.originalFileName || currentDoc.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err: any) {
      setActionError(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Verification toggle handler
  const handleToggleVerify = async () => {
    setVerifying(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/vault/documents/${currentDoc.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification update failed");

      setActionSuccess("Document verification status updated successfully.");
      // Refresh details
      await fetchDocumentDetails(currentDoc.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this document from the vault? It will be soft-deleted and removed from active views.")) return;
    setDeleting(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/vault/documents/${currentDoc.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Unable to delete document");
      onRefresh?.();
      onClose();
    } catch (err: any) {
      setActionError(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const getDocTypeIcon = () => {
    if (isImage) return <FileImage className="w-5 h-5 text-purple-600" />;
    if (isWord) return <FileText className="w-5 h-5 text-blue-600" />;
    if (isSheet) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (isPdf) return <FileText className="w-5 h-5 text-contour-red" />;
    return <FileCheck2 className="w-5 h-5 text-editorial-black" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 border border-editorial-border bg-[#F5F2EC] font-geist overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 pr-14 sm:pr-16 border-b border-editorial-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 border border-editorial-border bg-neutral-50 flex items-center justify-center shrink-0 mt-0.5">
              {getDocTypeIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <DialogTitle className="text-base sm:text-lg font-heading font-bold text-editorial-black tracking-tight truncate max-w-md">
                  {currentDoc.title}
                </DialogTitle>
                {/* Verification badge */}
                {currentDoc.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Pending Verification
                  </span>
                )}
                {/* Classification badge */}
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-muted">
                  {currentDoc.classification?.replace(/_/g, " ") || "GENERAL"}
                </span>
                {/* File format badge */}
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-neutral-200 text-neutral-700">
                  {currentDoc.fileType || "FILE"}
                </span>
              </div>
              <DialogDescription className="text-xs text-editorial-muted font-mono truncate">
                {currentDoc.originalFileName} • {formatFileSize(currentDoc.fileSize)}
              </DialogDescription>
            </div>
          </div>

          {/* Quick Action Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-editorial-border self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("METADATA")}
              className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === "METADATA"
                  ? "bg-white text-editorial-black border border-editorial-border shadow-sm"
                  : "text-editorial-muted hover:text-editorial-black"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Metadata
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PREVIEW")}
              className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === "PREVIEW"
                  ? "bg-white text-contour-red border border-editorial-border shadow-sm"
                  : "text-editorial-muted hover:text-contour-red"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview File
            </button>
          </div>
        </div>

        {/* Alerts */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-xs text-contour-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#F5F2EC]">
          {loading && !details ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ContourSunLoader size="md" label="Loading document details…" decorative />
              <span className="text-xs font-mono text-editorial-muted">Retrieving document records...</span>
            </div>
          ) : activeTab === "METADATA" ? (
            /* ─────────────────────────────────────────────────────────────
               TAB 1: METADATA & PROVENANCE
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Description Section */}
              <div className="border border-editorial-border bg-white p-4">
                <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-editorial-muted mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-contour-red" />
                  Description & Context
                </div>
                <p className="text-xs text-editorial-black leading-relaxed whitespace-pre-wrap">
                  {currentDoc.description || (
                    <span className="italic text-editorial-muted">
                      No additional description was provided when this document was uploaded.
                    </span>
                  )}
                </p>
              </div>

              {/* Grid of Key Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 1: Ingestion & Upload Attribution */}
                <div className="border border-editorial-border bg-white p-4 space-y-3">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-editorial-muted border-b border-editorial-border pb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-contour-red" />
                    Upload Provenance
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-editorial-muted">Uploaded By:</span>
                      <div className="text-right">
                        <span className="font-semibold text-editorial-black">
                          {details?.uploaderUser?.name || currentDoc.uploadedBy || "System"}
                        </span>
                        {details?.uploaderUser?.role && (
                          <div className="text-[10px] font-mono text-editorial-muted">
                            Role: {details.uploaderUser.role.replace(/_/g, " ")}
                          </div>
                        )}
                        {details?.uploaderUser?.email && (
                          <div className="text-[10px] font-mono text-editorial-muted">
                            {details.uploaderUser.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Source Channel:</span>
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-neutral-100 border border-editorial-border">
                        {currentDoc.uploadedByType === "CLIENT"
                          ? "Client Upload Portal"
                          : currentDoc.uploadedByType === "STAFF"
                          ? "Internal Staff Console"
                          : currentDoc.uploadedByType || "Staff Upload"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Date & Time:</span>
                      <span className="font-mono text-[11px] text-editorial-black">
                        {formatDate(currentDoc.createdAt)}
                      </span>
                    </div>

                    {currentDoc.documentRequest && (
                      <div className="pt-2 border-t border-editorial-border text-[11px]">
                        <span className="text-editorial-muted">Linked Client Request: </span>
                        <span className="font-medium text-editorial-black">
                          {currentDoc.documentRequest.title}
                        </span>
                        {currentDoc.documentRequest.clientName && (
                          <div className="text-editorial-muted text-[10px]">
                            Client: {currentDoc.documentRequest.clientName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Box 2: Property & Land Registry (Zambia Lands & Deeds Act Cap 185) */}
                <div className="border border-editorial-border bg-white p-4 space-y-3">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-editorial-muted border-b border-editorial-border pb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-contour-red" />
                    Property & Land Registry Records
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-editorial-muted">Associated Property:</span>
                      <div className="text-right">
                        <span className="font-semibold text-editorial-black">
                          {currentDoc.property?.title || "Agency-Wide / Global Governance"}
                        </span>
                        {currentDoc.property?.suburb && (
                          <div className="text-[10px] text-editorial-muted">
                            {currentDoc.property.suburb}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Stand / Plot Number:</span>
                      <span className="font-mono text-[11px] font-medium text-editorial-black">
                        {currentDoc.standPlotNumber || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Title Deed Folio:</span>
                      <span className="font-mono text-[11px] font-medium text-editorial-black">
                        {currentDoc.registryFolio || currentDoc.property?.titleDeedNumber || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">NRC / Passport No:</span>
                      <span className="font-mono text-[11px] font-medium text-editorial-black">
                        {currentDoc.nrcNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 3: Technical & Storage Verification */}
                <div className="border border-editorial-border bg-white p-4 space-y-3">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-editorial-muted border-b border-editorial-border pb-2 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-contour-red" />
                    Technical File Specifications
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Original Filename:</span>
                      <span className="font-mono text-[11px] text-editorial-black truncate max-w-[200px]" title={currentDoc.originalFileName}>
                        {currentDoc.originalFileName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">File Size:</span>
                      <span className="font-mono text-[11px] text-editorial-black">
                        {formatFileSize(currentDoc.fileSize)} ({currentDoc.fileSize?.toLocaleString()} bytes)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">MIME Type:</span>
                      <span className="font-mono text-[11px] text-editorial-black">
                        {currentDoc.mimeType || "application/octet-stream"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">S3 Storage Key:</span>
                      <span className="font-mono text-[10px] text-editorial-muted truncate max-w-[180px]" title={currentDoc.objectKey}>
                        {currentDoc.objectKey}
                      </span>
                    </div>

                    {details?.sha256Checksum && (
                      <div className="pt-2 border-t border-editorial-border text-[10px]">
                        <span className="text-editorial-muted">SHA-256 Checksum: </span>
                        <span className="font-mono text-editorial-black break-all">
                          {details.sha256Checksum}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Box 4: Compliance & Custody Verification */}
                <div className="border border-editorial-border bg-white p-4 space-y-3">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-editorial-muted border-b border-editorial-border pb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-contour-red" />
                    Custody & Verification Status
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Verification State:</span>
                      <span className={`font-mono text-[11px] font-bold ${currentDoc.isVerified ? "text-emerald-700" : "text-amber-700"}`}>
                        {currentDoc.isVerified ? "VERIFIED & AUDITED" : "UNVERIFIED"}
                      </span>
                    </div>

                    {currentDoc.isVerified && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-editorial-muted">Verified By:</span>
                          <span className="font-medium text-editorial-black">
                            {details?.verifierUser?.name || "Authorized Staff"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-editorial-muted">Verified Date:</span>
                          <span className="font-mono text-[11px] text-editorial-black">
                            {formatDate(currentDoc.verifiedAt || currentDoc.updatedAt)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-editorial-muted">Statutory Framework:</span>
                      <span className="text-[10px] font-mono text-editorial-black">
                        Zambia DPA Act 3 of 2021
                      </span>
                    </div>

                    <div className="pt-2 border-t border-editorial-border flex justify-between items-center">
                      <span className="text-[11px] text-editorial-muted">Update Status:</span>
                      <button
                        type="button"
                        onClick={handleToggleVerify}
                        disabled={verifying}
                        className="px-2 py-1 text-[10px] font-heading font-semibold uppercase tracking-wider border border-editorial-border hover:border-editorial-black bg-neutral-50 hover:bg-neutral-100 transition-colors flex items-center gap-1"
                      >
                        {verifying ? (
                          <ContourSunLoader size="sm" label="Verifying document…" decorative />
                        ) : (
                          <RotateCw className="w-3 h-3" />
                        )}
                        <span>{currentDoc.isVerified ? "Revoke Verification" : "Mark as Verified"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Callout banner to preview */}
              <div className="border border-contour-red/30 bg-[#fff5f3] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-contour-red/30 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-contour-red" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                      Ready to view this document?
                    </h4>
                    <p className="text-xs text-editorial-muted">
                      {isPdf
                        ? "Interactive PDF previewer available directly in this window."
                        : isImage
                        ? "High-resolution image zoom and inspection view available."
                        : isWord
                        ? "Inspect Word document via Office Online viewer or download directly."
                        : "Download or preview file using secure temporary token."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("PREVIEW")}
                  className="px-4 py-2 bg-contour-red hover:bg-[#a52817] text-white font-heading text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Document Now
                </button>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               TAB 2: DOCUMENT PREVIEWER
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Controls bar for preview */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border border-editorial-border">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-heading font-semibold uppercase tracking-wider text-editorial-black">
                    Previewing:
                  </span>
                  <span className="font-mono text-editorial-muted truncate max-w-xs sm:max-w-md">
                    {currentDoc.originalFileName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isImage && (
                    <div className="flex items-center gap-1 border border-editorial-border px-1 py-0.5 bg-neutral-50 text-xs">
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                        title="Zoom Out"
                        className="p-1 hover:bg-neutral-200 transition-colors"
                      >
                        <ZoomOut className="w-3.5 h-3.5 text-editorial-black" />
                      </button>
                      <span className="font-mono text-[10px] px-1">{Math.round(imageZoom * 100)}%</span>
                      <button
                        type="button"
                        onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                        title="Zoom In"
                        className="p-1 hover:bg-neutral-200 transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-editorial-black" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageZoom(1)}
                        title="Reset Zoom"
                        className="p-1 hover:bg-neutral-200 text-[10px] font-mono text-editorial-muted ml-1"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {details?.previewUrl && (
                    <a
                      href={details.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border hover:border-editorial-black bg-neutral-50 hover:bg-neutral-100 text-editorial-black transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Full Screen
                    </a>
                  )}
                </div>
              </div>

              {/* Preview Canvas */}
              <div className="border border-editorial-border bg-neutral-900 rounded-none overflow-hidden min-h-[480px] flex items-center justify-center relative">
                {/* 1. PDF Preview */}
                {isPdf ? (
                  details?.previewUrl ? (
                    <iframe
                      src={`${details.previewUrl}#toolbar=1&navpanes=0`}
                      title={currentDoc.title}
                      className="w-full h-[580px] bg-white border-0"
                    />
                  ) : (
                    <div className="text-center p-8 text-white space-y-3">
                      <ContourSunLoader size="md" label="Loading document preview…" decorative />
                      <p className="text-xs font-mono">Generating secure 15-minute PDF preview stream...</p>
                    </div>
                  )
                ) : isImage ? (
                  /* 2. Image Preview */
                  imageLoadError ? (
                    <div className="text-center p-8 text-white space-y-3">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-xs font-mono font-bold">Unable to render direct image preview</p>
                      <p className="text-[11px] text-neutral-400 font-mono">The image may still be encrypting or storage is updating.</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImageLoadError(false);
                            setImageLoading(true);
                          }}
                          className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white text-editorial-black hover:bg-neutral-100 transition-colors"
                        >
                          Retry Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-contour-red text-white hover:bg-contour-red/90 transition-colors"
                        >
                          Download File
                        </button>
                      </div>
                    </div>
                  ) : details?.previewUrl ? (
                    <div className="w-full h-[580px] overflow-auto flex items-center justify-center p-4 bg-neutral-950/80 relative">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 z-10">
                          <ContourSunLoader size="md" label="Loading document preview…" decorative />
                        </div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={details.previewUrl}
                        alt={currentDoc.title}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageLoading(false);
                          setImageLoadError(true);
                        }}
                        style={{ transform: `scale(${imageZoom})`, transformOrigin: "center center" }}
                        className="max-h-[520px] max-w-full object-contain transition-transform duration-150 shadow-2xl border border-neutral-800"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 text-white space-y-3">
                      <ContourSunLoader size="md" label="Loading document preview…" decorative />
                      <p className="text-xs font-mono">Loading image preview stream...</p>
                    </div>
                  )
                ) : isWord ? (
                  /* 3. Word Document Preview */
                  <div className="w-full h-[580px] bg-white flex flex-col">
                    {/* Embedded Office / Google Docs viewer if URL available */}
                    {details?.previewUrl && !details.previewUrl.includes("localhost") && !details.previewUrl.includes("127.0.0.1") ? (
                      <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(details.previewUrl)}`}
                        title={currentDoc.title}
                        className="w-full flex-1 border-0"
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50 space-y-4">
                        <div className="w-16 h-16 bg-blue-50 border border-blue-200 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="max-w-md space-y-1">
                          <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
                            Microsoft Word Document (.docx / .doc)
                          </h4>
                          <p className="text-xs text-editorial-muted">
                            Word files require external Office 365 or desktop software to render complex formatting. Click below to inspect via Office Online or download directly.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download & Open in Word
                          </button>
                          {details?.previewUrl && (
                            <a
                              href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(details.previewUrl)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 border border-editorial-border hover:border-editorial-black bg-white text-editorial-black font-heading text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View in Office Online
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 4. Other Binary / Spreadsheet / Generic File */
                  <div className="w-full h-[580px] bg-neutral-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-neutral-100 border border-editorial-border flex items-center justify-center">
                      <FileCheck2 className="w-8 h-8 text-editorial-black" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">
                        {currentDoc.fileType || "DOCUMENT"} FILE
                      </h4>
                      <p className="text-xs text-editorial-muted">
                        This file format ({currentDoc.mimeType || "binary data"}) does not support inline browser rendering. You can securely download it to inspect locally.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-4 py-2 bg-contour-red hover:bg-[#a52817] text-white font-heading text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download {formatFileSize(currentDoc.fileSize)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Action Bar */}
        <div className="p-4 sm:p-5 border-t border-editorial-border bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-editorial-muted flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-editorial-muted shrink-0" />
            <span>15-min Presigned S3 Token • Zambia DPA Compliant</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-editorial-border hover:border-editorial-black bg-white text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2 bg-contour-red hover:bg-[#a52817] text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {downloading ? (
                <ContourSunLoader size="sm" label="Preparing download…" decorative />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download Document</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
