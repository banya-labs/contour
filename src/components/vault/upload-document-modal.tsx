"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, CheckCircle2, AlertTriangle, FileText, X } from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  properties: Array<{ id: string; title: string; suburb: string; status: string }>;
  defaultPropertyId?: string | null;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  properties,
  defaultPropertyId,
}: UploadDocumentModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [docType, setDocType] = React.useState("TITLE_DEED");
  const [classification, setClassification] = React.useState("CONFIDENTIAL_PII");
  const [propertyId, setPropertyId] = React.useState<string>(defaultPropertyId || "");
  const [registryFolio, setRegistryFolio] = React.useState("");
  const [standPlotNumber, setStandPlotNumber] = React.useState("");
  const [nrcNumber, setNrcNumber] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<"uploading" | "success" | "failure" | null>(null);
  const [uploadStatusMessage, setUploadStatusMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (defaultPropertyId) {
      setPropertyId(defaultPropertyId);
    }
  }, [defaultPropertyId]);

  // Clean up object URL when file changes or unmounts
  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const isArchived = selectedProperty?.status === "ARCHIVED";

  const handleFileSelect = (selected: File) => {
    if (selected.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    setFile(selected);
    setError(null);

    // If file is an image, create instant local preview URL
    const isImg =
      selected.type.startsWith("image/") ||
      Boolean(selected.name.match(/\.(jpg|jpeg|png|webp|avif)$/i));

    if (isImg) {
      setImagePreviewUrl(URL.createObjectURL(selected));
    } else {
      setImagePreviewUrl(null);
    }

    if (!title) {
      // Strip extension for title
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a document file to upload");
      return;
    }

    if (isArchived) {
      setError("This property is archived. Its vault is locked in read-only mode.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadStatus("uploading");
    setUploadStatusMessage(null);

    try {
      // Direct server-side multipart upload to prevent browser CORS/CSP blocking with MinIO
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("docType", docType);
      formData.append("classification", classification);
      if (propertyId) formData.append("propertyId", propertyId);
      if (registryFolio) formData.append("registryFolio", registryFolio);
      if (standPlotNumber) formData.append("standPlotNumber", standPlotNumber);
      if (nrcNumber) formData.append("nrcNumber", nrcNumber);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload document to vault");
      }

      setUploadStatus("success");
    } catch (err: unknown) {
      setUploadStatusMessage(err instanceof Error ? err.message : "Upload failed");
      setUploadStatus("failure");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadStatus = () => {
    if (uploadStatus === "uploading") return;

    if (uploadStatus === "success") {
      handleClearFile();
      setTitle("");
      setRegistryFolio("");
      setStandPlotNumber("");
      setNrcNumber("");
      onSuccess();
      onClose();
      setUploadStatus(null);
      return;
    }

    setUploadStatus(null);
    setUploadStatusMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] bg-white border-editorial-border text-editorial-black rounded-none shadow-2xl p-6">
        <DialogHeader className="border-b border-editorial-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-heading font-bold uppercase tracking-wider text-editorial-black">
            <Upload className="w-4 h-4 text-contour-red" />
            Upload Legal Document to Vault
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-editorial-muted">
            Encrypted storage adhering to the Zambia Data Protection Act No. 3 of 2021 and Lands & Deeds Registry Act.
          </DialogDescription>
        </DialogHeader>

        {uploadStatus ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            {uploadStatus === "uploading" ? (
              <ContourSunLoader size="lg" label="Uploading document securely…" />
            ) : uploadStatus === "success" ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-red-600" />
            )}
            <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-editorial-black">
              {uploadStatus === "uploading" ? "Uploading Document" : uploadStatus === "success" ? "Document Uploaded Successfully" : "Document Upload Failed"}
            </h4>
            <p className="max-w-sm text-xs font-mono text-editorial-muted">
              {uploadStatus === "uploading" ? "Please keep this window open while the document is encrypted and saved to the vault." : uploadStatus === "success" ? "Encrypted in MinIO S3 and linked to the property vault." : uploadStatusMessage}
            </p>
            {uploadStatus !== "uploading" && (
              <button
                type="button"
                onClick={handleCloseUploadStatus}
                className="mt-2 bg-contour-red px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-contour-red/90"
              >
                Close
              </button>
            )}
          </div>
        ) : error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs font-mono text-red-700 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!uploadStatus && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Property Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Property Vault Destination
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              >
                <option value="">🏢 General Agency Governance (No Property)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.status === "ARCHIVED"}>
                    {p.status === "ARCHIVED" ? `[🔒 ARCHIVED - LOCKED] ${p.title}` : `${p.title} (${p.suburb})`}
                  </option>
                ))}
              </select>
              {isArchived && (
                <p className="text-[11px] font-mono text-contour-red mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  This property is archived. Uploads are disabled in compliance with statutory retention.
                </p>
              )}
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certificate of Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                  Document Classification *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
                >
                  <option value="TITLE_DEED">📜 Title Deed</option>
                  <option value="NRC_PASSPORT_ID">🪪 NRC / Passport / PACRA</option>
                  <option value="MANDATE_AGREEMENT">✍️ Mandate Agreement</option>
                  <option value="SITE_SURVEY_DIAGRAM">📐 Site Survey Diagram</option>
                  <option value="LEASE_CONTRACT">📝 Lease Contract</option>
                  <option value="VALUATION_REPORT">📊 Valuation Report</option>
                  <option value="TAX_CLEARANCE">🏛️ Tax Clearance (ZRA)</option>
                  <option value="OTHER">📁 Other Legal Asset</option>
                </select>
              </div>
            </div>

            {/* Statutory Metadata Fields */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-editorial-muted mb-1">
                  Lands Folio / Registry Ref
                </label>
                <input
                  type="text"
                  placeholder="LND/84920/2024"
                  value={registryFolio}
                  onChange={(e) => setRegistryFolio(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 text-editorial-black focus:border-contour-red outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-editorial-muted mb-1">
                  Stand / Plot #
                </label>
                <input
                  type="text"
                  placeholder="Stand 4821"
                  value={standPlotNumber}
                  onChange={(e) => setStandPlotNumber(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 text-editorial-black focus:border-contour-red outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-editorial-muted mb-1">
                  NRC / Passport #
                </label>
                <input
                  type="text"
                  placeholder="123456/10/1"
                  value={nrcNumber}
                  onChange={(e) => setNrcNumber(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 text-editorial-black focus:border-contour-red outline-none"
                />
              </div>
            </div>

            {/* Access Security Tier */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Zambia DPA Security Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              >
                <option value="CONFIDENTIAL_PII">🔒 Confidential PII (NRCs, Passports, Private Deeds)</option>
                <option value="RESTRICTED_MANAGEMENT">🛡️ Restricted Management (Internal Only)</option>
                <option value="AGENT_ACCESSIBLE">👥 Field Agent Accessible (Mandates, Leases)</option>
              </select>
            </div>

            {/* File Dropzone & Live Image Preview */}
            <div className="border border-dashed border-editorial-border rounded-none p-4 text-center hover:border-contour-red transition-colors bg-editorial-bg">
              <input
                ref={fileInputRef}
                type="file"
                id="vault-file-input"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.avif,.doc,.docx"
              />

              {file ? (
                <div className="space-y-3">
                  {/* Image Preview Card if selected file is an image */}
                  {imagePreviewUrl ? (
                    <div className="relative mx-auto max-w-[280px] rounded-lg overflow-hidden border border-editorial-border bg-neutral-900 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt={file.name}
                        className="w-full h-36 object-contain bg-black/40"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                        IMAGE READY FOR VAULT
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 mx-auto bg-paper-200 border border-editorial-border flex items-center justify-center text-contour-red rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-mono font-bold text-editorial-black truncate max-w-sm mx-auto">
                      {file.name}
                    </p>
                    <p className="text-[11px] font-mono text-editorial-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "Document file"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider border border-editorial-border bg-white hover:bg-neutral-100 text-editorial-black transition-colors"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="vault-file-input" className="cursor-pointer block py-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white border border-editorial-border flex items-center justify-center text-contour-red shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-editorial-black font-semibold">
                    Click to choose file or drag and drop
                  </p>
                  <p className="text-[11px] font-mono text-editorial-muted mt-1">
                    Supports high-res JPG, PNG, WebP &amp; PDF up to 25MB
                  </p>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-editorial-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-editorial-muted hover:text-editorial-black hover:bg-editorial-bg rounded-none border border-editorial-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !file || isArchived}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-contour-red hover:bg-contour-red/90 text-white rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isUploading ? (
                  <>
                    <ContourSunLoader size="sm" label="Uploading document…" decorative />
                    <span>Uploading document…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Vault</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
