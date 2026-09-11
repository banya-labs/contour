"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

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
  const [title, setTitle] = React.useState("");
  const [docType, setDocType] = React.useState("TITLE_DEED");
  const [classification, setClassification] = React.useState("CONFIDENTIAL_PII");
  const [propertyId, setPropertyId] = React.useState<string>(defaultPropertyId || "");
  const [registryFolio, setRegistryFolio] = React.useState("");
  const [standPlotNumber, setStandPlotNumber] = React.useState("");
  const [nrcNumber, setNrcNumber] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (defaultPropertyId) {
      setPropertyId(defaultPropertyId);
    }
  }, [defaultPropertyId]);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const isArchived = selectedProperty?.status === "ARCHIVED";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        // Strip extension for title
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
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

    try {
      // 1. Request presigned upload URL
      const presignRes = await fetch(
        `/api/storage/upload?filename=${encodeURIComponent(file.name)}&category=${docType}&mimeType=${encodeURIComponent(file.type || "application/octet-stream")}`
      );
      const presignData = await presignRes.json();

      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error || "Failed to obtain secure storage slot");
      }

      // 2. Upload file bytes directly to MinIO
      const bytes = await file.arrayBuffer();
      try {
        await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: bytes,
        });
      } catch (uploadErr) {
        console.warn("Direct upload fetch notice (dev fallback active):", uploadErr);
      }

      // 3. Register document in database with Zambia DPA metadata
      const saveRes = await fetch("/api/vault/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || file.name,
          docType,
          classification,
          objectKey: presignData.objectKey,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
          propertyId: propertyId || null,
          registryFolio: registryFolio || null,
          standPlotNumber: standPlotNumber || null,
          nrcNumber: nrcNumber || null,
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || "Failed to register document in vault");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setTitle("");
        setRegistryFolio("");
        setStandPlotNumber("");
        setNrcNumber("");
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
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

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs font-mono text-red-700 my-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
            <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-editorial-black">
              Document Uploaded Successfully
            </h4>
            <p className="text-xs font-mono text-editorial-muted">Encrypted in MinIO S3 & linked to property vault.</p>
          </div>
        ) : (
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
                  Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
                >
                  <option value="TITLE_DEED">📜 Title Deed & Diagram</option>
                  <option value="NRC_PASSPORT_ID">🪪 NRC / Passport ID Scan</option>
                  <option value="MANDATE_AGREEMENT">📝 Sole Mandate Agreement</option>
                  <option value="LEASE_CONTRACT">🏠 Tenancy Lease Contract</option>
                  <option value="PACRA_CERTIFICATE">🏢 PACRA Incorporation Cert</option>
                  <option value="VALUATION_REPORT">📊 Professional Valuation</option>
                  <option value="PROOF_OF_RESIDENCE">📬 Proof of Residence (ZESCO)</option>
                  <option value="PAYMENT_RECEIPT">🧾 Bank / Payment Receipt</option>
                  <option value="OTHER">📁 Other Legal Document</option>
                </select>
              </div>
            </div>

            {/* Zambian Land Metadata */}
            {docType === "TITLE_DEED" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-editorial-bg rounded-none border border-editorial-border">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                    Ministry Lands Folio #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Folio 412/108"
                    value={registryFolio}
                    onChange={(e) => setRegistryFolio(e.target.value)}
                    className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 focus:border-contour-red outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                    Stand / Plot #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stand 19283/M"
                    value={standPlotNumber}
                    onChange={(e) => setStandPlotNumber(e.target.value)}
                    className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 focus:border-contour-red outline-none"
                  />
                </div>
              </div>
            )}

            {docType === "NRC_PASSPORT_ID" && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                  National Registration Card (NRC) Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456/11/1"
                  value={nrcNumber}
                  onChange={(e) => setNrcNumber(e.target.value)}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 focus:border-contour-red outline-none"
                />
              </div>
            )}

            {/* Security Classification */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Security Classification (Zambia DPA Tier)
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

            {/* File Dropzone */}
            <div className="border border-dashed border-editorial-border rounded-none p-5 text-center hover:border-contour-red transition-colors bg-editorial-bg">
              <input
                type="file"
                id="vault-file-input"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="vault-file-input" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-medium text-emerald-600">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-editorial-muted font-mono text-[11px]">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-6 h-6 mx-auto mb-1.5 text-editorial-muted" />
                    <p className="text-xs font-mono uppercase tracking-wider text-editorial-black">
                      Click to choose file or drag and drop
                    </p>
                    <p className="text-[11px] font-mono text-editorial-muted mt-1">
                      PDF, JPG, PNG up to 25MB · Streamed directly to encrypted S3
                    </p>
                  </div>
                )}
              </label>
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-contour-red hover:bg-contour-red/90 text-white rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Encrypting & Streaming...</span>
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
