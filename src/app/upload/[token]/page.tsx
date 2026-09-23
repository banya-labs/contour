"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Building,
  Scale,
  Calendar,
} from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";

interface RequestDetails {
  id: string;
  title: string;
  message?: string | null;
  requiredTypes: string[];
  maxFiles: number;
  maxSizeMbPerFile: number;
  expiresAt: string;
  status: string;
  hasPin: boolean;
  agencyName: string;
  propertyTitle?: string | null;
  propertySuburb?: string | null;
  clientName?: string | null;
}

export default function ClientUploadPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PIN state
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Files & Consent state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Submission state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch request metadata
  useEffect(() => {
    async function loadRequest() {
      if (!token) return;
      try {
        const res = await fetch(`/api/upload/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load upload request");
        }
        setRequest(data.request);
        if (!data.request.hasPin) {
          setPinVerified(true);
        }
        if (data.request.clientName) {
          setClientName(data.request.clientName);
        }
      } catch (err: any) {
        setError(err.message || "Invalid or expired link");
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [token]);

  // Handle PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingPin(true);
    setPinError("");
    try {
      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-pin", pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || "Incorrect access PIN");
      }
      setPinVerified(true);
    } catch (err: any) {
      setPinError(err.message || "PIN verification failed");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, request?.maxFiles || 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Files directly to MinIO and complete ingestion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select at least one document file");
      return;
    }
    if (!consentAgreed) {
      setError("You must agree to the data protection declaration to continue");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedFileRecords = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}...`);

        // 1. Request presigned upload URL from server
        const presignRes = await fetch(`/api/upload/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "presign",
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            category: request?.requiredTypes[0] || "NRC_PASSPORT_ID",
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok || !presignData.uploadUrl) {
          throw new Error(presignData.error || "Failed to obtain secure storage slot");
        }

        // 2. Stream bytes directly to MinIO
        const bytes = await file.arrayBuffer();
        const storageRes = await fetch(presignData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: bytes,
          });
        if (!storageRes.ok) {
          throw new Error(`Secure storage rejected ${file.name} (${storageRes.status})`);
        }

        uploadedFileRecords.push({
          objectKey: presignData.objectKey,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
          docType: request?.requiredTypes[0] || "NRC_PASSPORT_ID",
        });
      }

      // 3. Finalize upload & capture statutory consent
      setUploadProgress("Recording legal custody & attaching to deal...");
      const completeRes = await fetch(`/api/upload/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          files: uploadedFileRecords,
          consent: {
            name: clientName,
            phone: clientPhone,
            agreed: true,
          },
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.error || "Failed to finalize document receipt");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to upload documents");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4 text-center">
        <SectionPendingState label="Checking secure upload link…" description="Confirming this request and its security controls." />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Portal Link Unavailable</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {error || "This document upload link has expired or is invalid. Please request a new link from your real estate agent."}
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-stone-400">Contour Document Vault · Zambia DPA 2021</span>
          </div>
        </div>
      </div>
    );
  }

  if (request.status === "EXPIRED") {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Link Expired</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            This secure upload link expired on {new Date(request.expiresAt).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" })} in accordance with data retention standards. Please contact {request.agencyName} for an updated link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-xl w-full mx-auto space-y-6 pt-4 pb-12">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center pb-1">
            <ContourLogo size="sm" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Building className="w-3.5 h-3.5" />
            <span>{request.agencyName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-stone-900 dark:text-stone-100">
            {request.title}
          </h1>
          {request.propertyTitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Regarding: <strong>{request.propertyTitle}</strong> {request.propertySuburb ? `(${request.propertySuburb})` : ""}
            </p>
          )}
        </div>

        {/* PIN Challenge if not yet unlocked */}
        {!pinVerified ? (
          <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Access PIN Required</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Please enter the security PIN provided by your agent to access this upload portal.
                </p>
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md text-xs text-red-600">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Enter 4–8 digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-lg tracking-widest font-mono py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="submit"
                disabled={verifyingPin || !pin}
                className="w-full py-2.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <PendingButtonContent pending={verifyingPin} pendingLabel="Verifying access code…">Unlock Portal</PendingButtonContent>
              </button>
            </form>
          </div>
        ) : submitted ? (
          /* Submission Receipt State */
          <div className="p-8 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
              Documents Received & Encrypted
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
              Thank you! Your documents have been safely ingested into {request.agencyName}&apos;s legal custody vault. Your assigned agent has been notified and the files are attached to your transaction record.
            </p>
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-[11px] text-stone-500 font-mono text-left space-y-1">
              <div>✅ Receipt Timestamp: {new Date().toISOString()}</div>
              <div>✅ Custody Standard: Zambia Data Protection Act No. 3 of 2021</div>
              <div>✅ Encryption: AES-256 Tenant Partition</div>
            </div>
          </div>
        ) : (
          /* Main Upload Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Request Message */}
            {request.message && (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {request.message}
              </div>
            )}

            {/* Client Details */}
            <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                1. Your Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Your Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Banda"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Phone Number (WhatsApp)
                  </label>
                  <PhoneNumberInput
                    value={clientPhone}
                    onChange={setClientPhone}
                    label=""
                  />
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                2. Select Verification Documents
              </h3>
              <p className="text-xs text-stone-500">
                Please attach clear photos or PDF scans (NRC, Passport, ZESCO bill, or PACRA printout). Max {request.maxFiles} files, up to {request.maxSizeMbPerFile}MB each.
              </p>

              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-stone-50/50 dark:bg-stone-800/20">
                <input
                  type="file"
                  multiple
                  id="client-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="client-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Tap to take photo or choose files
                  </span>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Supported formats: PDF, JPG, PNG
                  </p>
                </label>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {selectedFiles.map((file, idx) => {
                    const isImg = file.type.startsWith("image/");
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800/60 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isImg ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-8 h-8 rounded object-cover border border-stone-300 dark:border-stone-700 shrink-0"
                            />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                          <span className="text-stone-400 font-mono text-[10px]">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-stone-400 hover:text-red-500 px-2 py-0.5 text-xs font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                </div>
              )}
            </div>

            {/* Zambia DPA Statutory Consent Checkbox */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent-check"
                  required
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="consent-check" className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed cursor-pointer">
                  <strong>Statutory Consent Declaration (Zambia DPA No. 3 of 2021, Section 21):</strong> I hereby consent to {request.agencyName} collecting and processing my submitted identity and property documents solely for the purpose of completing this real estate transaction in accordance with the laws of Zambia.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0 || !consentAgreed}
              className="w-full py-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PendingButtonContent pending={uploading} pendingLabel={uploadProgress || `Uploading ${selectedFiles[0]?.name || "document"}…`}>Upload Documents Safely</PendingButtonContent>
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-stone-400 dark:text-stone-500 py-4 border-t border-stone-200 dark:border-stone-800/60 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>Protected by Contour Document Vault · Governed by the Laws of Zambia</span>
        <span className="hidden sm:inline">·</span>
        <div className="flex items-center gap-3">
          <Link href="/privacy" target="_blank" className="underline hover:text-stone-700 dark:hover:text-stone-300">
            Privacy Policy
          </Link>
          <Link href="/terms" target="_blank" className="underline hover:text-stone-700 dark:hover:text-stone-300">
            Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}
