"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link2, Copy, Check, MessageSquare, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

interface RequestDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  properties: Array<{ id: string; title: string; suburb: string }>;
}

export function RequestDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  properties,
}: RequestDocumentModalProps) {
  const [title, setTitle] = React.useState("Client Identification & Verification Documents");
  const [message, setMessage] = React.useState(
    "Please upload clear photos or PDF scans of your verification documents. These will be securely stored in our legal vault under the Zambia Data Protection Act."
  );
  const [propertyId, setPropertyId] = React.useState("");
  const [requiredTypes, setRequiredTypes] = React.useState<string[]>([]);
  const [customDocuments, setCustomDocuments] = React.useState("");
  const [expiryHours, setExpiryHours] = React.useState(72);
  const [pin, setPin] = React.useState("");
  const [usePin, setUsePin] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    shareableUrl: string;
    whatsappText: string;
    hasPin: boolean;
    pin?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const toggleType = (type: string) => {
    setRequiredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requiredTypes.length === 0 && !customDocuments.trim()) {
      setError("Please select at least one standard document or type a custom document to request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vault/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          propertyId: propertyId || null,
          requiredTypes,
          customDocuments: customDocuments.trim() || null,
          expiryHours,
          pin: usePin && pin ? pin.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create document request link");
      }

      setResult({
        shareableUrl: data.shareableUrl,
        whatsappText: data.whatsappText,
        hasPin: data.hasPin,
        pin: usePin && pin ? pin.trim() : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setRequiredTypes([]);
    setCustomDocuments("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[560px] bg-white border-editorial-border text-editorial-black rounded-none shadow-2xl p-6">
        <DialogHeader className="border-b border-editorial-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-heading font-bold uppercase tracking-wider text-editorial-black">
            <Link2 className="w-4 h-4 text-contour-red" />
            Request Documents from Client
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-editorial-muted">
            Send a secure, PIN-protected upload link directly to your buyer, tenant, or landlord. Uploads attach automatically to their deal.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-xs font-mono text-red-700 my-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-[#fff5f3] border-l-2 border-contour-red border-y border-r border-editorial-border rounded-none text-xs">
              <div className="flex items-center gap-2 text-contour-red font-mono font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure Upload Portal Link Ready</span>
              </div>
              <p className="text-editorial-muted text-xs">
                This link is encrypted and protected under the Zambia Data Protection Act No. 3 of 2021.
              </p>
            </div>

            {/* Portal Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-editorial-muted">
                Client Portal Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.shareableUrl}
                  className="flex-1 text-xs font-mono bg-editorial-bg border border-editorial-border rounded-none px-3 py-2 text-editorial-black select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.shareableUrl)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-editorial-black text-white hover:bg-neutral-800 rounded-none transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* PIN Display if configured */}
            {result.hasPin && result.pin && (
              <div className="p-2.5 bg-editorial-bg border border-editorial-border rounded-none flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-editorial-black">
                  <KeyRound className="w-4 h-4 text-contour-red" />
                  <span>Access PIN: <strong className="text-contour-red">{result.pin}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.pin!)}
                  className="text-[11px] text-contour-red uppercase font-mono tracking-wider underline hover:text-contour-red/80"
                >
                  Copy PIN
                </button>
              </div>
            )}

            {/* 1-Click WhatsApp Trigger */}
            <div className="pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(result.whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send to Client via WhatsApp</span>
              </a>
            </div>

            <div className="flex justify-end pt-2 border-t border-editorial-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-white hover:bg-editorial-bg text-editorial-black rounded-none border border-editorial-border transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            {/* Request Title */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Request Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              />
            </div>

            {/* Property Link */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Linked Property (Optional)
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              >
                <option value="">General Client Verification (No specific property)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.suburb})
                  </option>
                ))}
              </select>
            </div>

            {/* Standard Document Categories (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-editorial-muted">
                  Standard Documents (Optional — Click to Select)
                </label>
                {requiredTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRequiredTypes([])}
                    className="text-[10px] font-mono text-contour-red hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: "NRC_PASSPORT_ID", label: "🪪 NRC / Passport ID" },
                  { id: "PROOF_OF_RESIDENCE", label: "📬 Proof of Residence" },
                  { id: "TITLE_DEED", label: "📜 Certificate of Title" },
                  { id: "PACRA_CERTIFICATE", label: "🏢 PACRA Company Cert" },
                  { id: "PAYMENT_RECEIPT", label: "🧾 Bank Slip / Receipt" },
                  { id: "VALUATION_REPORT", label: "📊 Valuation Report" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-none border cursor-pointer transition-colors ${
                      requiredTypes.includes(item.id)
                        ? "bg-[#fff5f3] border-contour-red/50 text-editorial-black font-semibold"
                        : "border-editorial-border bg-white text-editorial-muted hover:text-editorial-black hover:bg-editorial-bg"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={requiredTypes.includes(item.id)}
                      onChange={() => toggleType(item.id)}
                      className="rounded-none text-contour-red focus:ring-0 accent-[#fa3600]"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Documents to Request (Optional) */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Custom Document(s) to Request (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ZRA Tax Clearance, Council Rates Receipt, Power of Attorney..."
                value={customDocuments}
                onChange={(e) => setCustomDocuments(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              />
              <p className="text-[10px] text-editorial-muted mt-1">
                Type any specific or custom documents you want the client to provide.
              </p>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                Instructions for Client
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-3 py-2 text-editorial-black focus:border-contour-red outline-none"
              />
            </div>

            {/* Expiry & PIN Protection */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-editorial-bg rounded-none border border-editorial-border">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                  Link Expiry
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-full text-xs font-mono rounded-none border border-editorial-border bg-white px-2.5 py-1.5 text-editorial-black focus:border-contour-red outline-none"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-editorial-muted mb-1">
                  Optional Security PIN
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pin-toggle"
                    checked={usePin}
                    onChange={(e) => setUsePin(e.target.checked)}
                    className="rounded-none text-contour-red accent-[#fa3600]"
                  />
                  <label htmlFor="pin-toggle" className="text-xs font-mono text-editorial-black cursor-pointer">
                    Require PIN
                  </label>
                </div>
                {usePin && (
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. 582914"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="mt-1.5 w-full text-xs rounded-none border border-editorial-border bg-white px-2.5 py-1 font-mono tracking-wider focus:border-contour-red outline-none"
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-editorial-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-editorial-muted hover:text-editorial-black hover:bg-editorial-bg rounded-none border border-editorial-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || requiredTypes.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-contour-red hover:bg-contour-red/90 text-white rounded-none transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <ContourSunLoader size="sm" label="Creating secure request…" decorative />
                    <span>Creating secure request…</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Generate Request Link</span>
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
