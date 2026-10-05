"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileUp, Link2 } from "lucide-react";
import { StartLeaseDialog } from "./start-lease-dialog";
import { RequestDocumentModal } from "@/components/vault/request-document-modal";
import { UploadDocumentModal } from "@/components/vault/upload-document-modal";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClosedDealResultDialog } from "./closed-deal-result-dialog";
import type { ClosedDealResult } from "@/lib/closed-deal-result";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";

type WorkflowItem = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  required: boolean;
  assigneeType: "AGENT" | "MANAGER";
  evidenceType: string;
  status: string;
  notes?: string | null;
  rejectionReason?: string | null;
};
type Workflow = { id: string; status: string; items: WorkflowItem[] };
type DealContext = {
  transactionType: "PROPERTY_SALE" | "RENTAL_PLACEMENT";
  inquiryId: string;
  client: { name: string; phone: string; email?: string | null };
  property: {
    id: string;
    title: string;
    suburb: string;
    rentalPrice?: unknown;
    currency: string;
  } | null;
  documentRequests: Array<{
    id: string;
    title: string;
    status: string;
    expiresAt: string | Date;
    documents: Array<{
      id: string;
      title: string;
      originalFileName: string;
      isVerified: boolean;
      isDeleted: boolean;
    }>;
  }>;
};

export function ClosingWorkflowPanel({
  inquiryId,
  onClose,
  onCompleted,
}: {
  inquiryId: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [closingResult, setClosingResult] = useState<ClosedDealResult | null>(null);
  const [readiness, setReadiness] = useState<{
    ready: boolean;
    pending: number;
    blocked: number;
  }>({ ready: false, pending: 0, blocked: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [evidenceValues, setEvidenceValues] = useState<Record<string, string>>(
    {},
  );
  const [deal, setDeal] = useState<DealContext | null>(null);
  const [showStartLease, setShowStartLease] = useState(false);
  const [showRequestDocuments, setShowRequestDocuments] = useState(false);
  const [evidenceItem, setEvidenceItem] = useState<WorkflowItem | null>(null);
  const evidenceLinkTask = useRef<Promise<void> | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
    const response = await fetch(`/api/clients/${inquiryId}/closing-workflow`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Unable to load closing workflow.");
    setWorkflow(data.workflow);
    setReadiness(data.readiness);
    setDeal(data.deal);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load closing workflow.");
    } finally { setLoading(false); }
  };
  useEffect(() => {
    void load();
  }, [inquiryId]);

  const updateItem = async (
    item: WorkflowItem,
    status: "SUBMITTED" | "APPROVED" | "REJECTED",
    notes?: string,
    linkedDocumentId?: string,
  ) => {
    if (pendingKey || loading) return;
    setPendingKey(item.key);
    setError("");
    try {
      const response = await fetch(
        `/api/clients/${inquiryId}/closing-workflow/items/${item.key}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            notes: notes || item.notes || undefined,
            evidenceValue: evidenceValues[item.key] || undefined,
            linkedDocumentId,
            rejectionReason:
              status === "REJECTED"
                ? notes || "Manager requested correction."
                : undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to update requirement.");
      setWorkflow((current) =>
        current
          ? {
              ...current,
              items: current.items.map((candidate) =>
                candidate.key === item.key ? data.item : candidate,
              ),
              status: data.readiness.ready ? "READY" : "OPEN",
            }
          : current,
      );
      setReadiness(data.readiness);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update requirement.",
      );
    } finally {
      setPendingKey(null);
    }
  };

  const closeWon = async () => {
    if (pendingKey || loading) return;
    setPendingKey("__close__");
    setError("");
    try {
      const response = await fetch(`/api/clients/${inquiryId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStage: "CLOSED", outcome: "WON" }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to close this deal.");
      setClosingResult(data.closingResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to close this deal.");
    } finally {
      setPendingKey(null);
    }
  };

  const closeLost = async () => {
    if (pendingKey || loading) return;
    if (lostReason.trim().length < 10) {
      setError(
        "Provide at least 10 characters explaining why the deal was lost.",
      );
      return;
    }
    setPendingKey("__close__");
    setError("");
    try {
      const response = await fetch(`/api/clients/${inquiryId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStage: "CLOSED",
          outcome: "LOST",
          reason: lostReason.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to mark this deal lost.");
      setClosingResult(data.closingResult);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to mark this deal lost.",
      );
    } finally {
      setPendingKey(null);
    }
  };

  if (closingResult) {
    return <ClosedDealResultDialog result={closingResult} onClose={() => { onCompleted(); onClose(); }} />;
  }

  return (
    <Dialog open layer={80} onOpenChange={(open) => { if (!open && !pendingKey) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto p-0 block" onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => { if (pendingKey) event.preventDefault(); }}>
        <header className="p-5 border-b border-editorial-border flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-contour-red">
              Verification & Closing
            </p>
            <DialogTitle className="font-heading text-lg font-bold mt-1 normal-case">
              Closing requirements
            </DialogTitle>
            <DialogDescription className="text-xs text-editorial-muted mt-1">
              Complete the agency requirements before closing this deal.
            </DialogDescription>
          </div>
        </header>
        {error && (
          <p role="alert" className="m-4 p-3 border border-red-300 bg-red-50 text-xs text-red-800">
            {error}
            <button type="button" disabled={loading || Boolean(pendingKey)} onClick={() => void load()} className="ml-3 underline">Reload workflow</button>
          </p>
        )}
        {loading && <SectionPendingState compact label="Loading closing requirements…" />}
        {pendingKey && <SectionPendingState compact label={pendingKey === "__close__" ? "Closing deal…" : "Saving closing requirement…"} />}
        {workflow && deal?.transactionType === "RENTAL_PLACEMENT" && (
          <div className="p-5 space-y-4">
            <div className="p-4 border border-blue-300 bg-blue-50 text-blue-900 text-sm">
              This is a rental placement. Start the lease to complete the deal;
              sale closing requirements do not apply.
            </div>
            <button
              type="button"
              onClick={() => setShowStartLease(true)}
              className="w-full px-4 py-3 bg-editorial-black text-white text-xs font-bold uppercase tracking-wider"
            >
              Start lease for {deal.client.name}
            </button>
          </div>
        )}
        {workflow && deal?.transactionType === "PROPERTY_SALE" && (
          <div className="p-5 space-y-4">
            <div
              className={`p-3 border text-xs ${readiness.ready ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}
            >
              {readiness.ready
                ? "Ready for manager close."
                : `${readiness.pending} pending, ${readiness.blocked} blocked required item(s).`}
            </div>
            <div className="flex items-center justify-between gap-3 border border-editorial-border p-3">
              <div>
                <p className="text-xs font-bold">Closing documents</p>
                <p className="text-[11px] text-editorial-muted mt-1">
                  {deal.documentRequests.reduce(
                    (count, request) => count + request.documents.length,
                    0,
                  )}{" "}
                  uploaded file(s) across {deal.documentRequests.length}{" "}
                  request(s).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestDocuments(true)}
                className="px-3 py-2 bg-editorial-black text-white text-[10px] font-bold uppercase"
              >
                Request documents
              </button>
            </div>
            {deal.documentRequests.map((request) => (
              <div
                key={request.id}
                className="border border-editorial-border p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{request.title}</p>
                  <span className="text-[10px] uppercase tracking-wider">
                    {request.status}
                  </span>
                </div>
                {request.documents.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {request.documents.map((document) => (
                      <li
                        key={document.id}
                        className="text-[11px] text-editorial-muted"
                      >
                        {document.originalFileName}
                        {document.isVerified ? " · verified" : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-editorial-muted mt-2">
                    No files uploaded yet.
                  </p>
                )}
              </div>
            ))}
            {workflow.items.map((item) => (
              <div
                key={item.key}
                className="border border-editorial-border p-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold">
                      {item.label}
                      {item.required ? " *" : ""}
                    </p>
                    <p className="text-[11px] text-editorial-muted mt-1">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold">
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 border border-editorial-border text-[10px] font-bold uppercase inline-flex items-center gap-1 text-editorial-muted">
                    <Check className="h-3 w-3" /> View check
                  </span>
                  <button
                    type="button"
                    onClick={() => setEvidenceItem(item)}
                    className="px-2 py-1 border border-editorial-border text-[10px] font-bold uppercase inline-flex items-center gap-1"
                  >
                    <FileUp className="h-3 w-3" /> Upload file
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEvidenceItem(item);
                      setShowRequestDocuments(true);
                    }}
                    className="px-2 py-1 border border-editorial-border text-[10px] font-bold uppercase inline-flex items-center gap-1"
                  >
                    <Link2 className="h-3 w-3" /> Request file
                  </button>
                </div>
                <textarea
                  value={
                    notes[item.key] ?? item.notes ?? item.rejectionReason ?? ""
                  }
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [item.key]: event.target.value,
                    }))
                  }
                  placeholder="Record evidence, reference numbers, or correction notes."
                  rows={2}
                  aria-label={`${item.label} notes`}
                  className="w-full border border-editorial-border p-2 text-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-editorial-muted">
                    Owner:{" "}
                    {item.assigneeType === "MANAGER"
                      ? "Manager"
                      : "Assigned agent"}{" "}
                    · Evidence: {item.evidenceType}
                  </span>
                  <div className="flex gap-2">
                    {item.status !== "APPROVED" && (
                      <button
                        type="button"
                        disabled={Boolean(pendingKey) || loading}
                        onClick={() =>
                          void updateItem(item, "SUBMITTED", notes[item.key])
                        }
                        className="px-2 py-1 border border-editorial-border text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        <PendingButtonContent pending={pendingKey === item.key} pendingLabel="Saving requirement…">Submit</PendingButtonContent>
                      </button>
                    )}
                    {item.status !== "APPROVED" && (
                      <>
                        <button
                          type="button"
                          disabled={Boolean(pendingKey) || loading}
                          onClick={() =>
                            void updateItem(
                              item,
                              "REJECTED",
                              notes[item.key],
                            )
                          }
                          className="px-2 py-1 border border-red-700 text-red-700 text-[10px] font-bold uppercase disabled:opacity-50"
                        >
                          <PendingButtonContent pending={pendingKey === item.key} pendingLabel="Saving requirement…">Reject</PendingButtonContent>
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(pendingKey) || loading}
                          onClick={() =>
                            void updateItem(item, "APPROVED", notes[item.key])
                          }
                          className="px-2 py-1 bg-editorial-black text-white text-[10px] font-bold uppercase disabled:opacity-50"
                        >
                          <PendingButtonContent pending={pendingKey === item.key} pendingLabel="Saving requirement…">Approve</PendingButtonContent>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <footer className="p-4 border-t border-editorial-border space-y-3">
          <textarea
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
            rows={2}
            placeholder="If this deal will not close, record why (required for Lost)."
            className="w-full border border-editorial-border p-2 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(pendingKey)}
              className="px-3 py-2 border border-editorial-border text-xs font-bold uppercase"
            >
              Close
            </button>
            <button
              type="button"
              disabled={Boolean(pendingKey) || loading || !workflow}
              onClick={() => void closeLost()}
              className="px-3 py-2 border border-red-700 text-red-700 text-xs font-bold uppercase disabled:opacity-50"
            >
              <PendingButtonContent pending={pendingKey === "__close__"} pendingLabel="Closing deal…">Mark lost</PendingButtonContent>
            </button>
            {readiness.ready && (
              <button
                type="button"
                disabled={Boolean(pendingKey) || loading}
                onClick={() => void closeWon()}
                className="px-3 py-2 bg-emerald-700 text-white text-xs font-bold uppercase disabled:opacity-50"
              >
                <PendingButtonContent pending={pendingKey === "__close__"} pendingLabel="Closing deal…">Mark won</PendingButtonContent>
              </button>
            )}
          </div>
        </footer>
        {showStartLease && deal?.transactionType === "RENTAL_PLACEMENT" && (
          <StartLeaseDialog
            context={deal}
            onClose={() => setShowStartLease(false)}
            onCompleted={onCompleted}
          />
        )}
        {showRequestDocuments && deal?.transactionType === "PROPERTY_SALE" && (
          <RequestDocumentModal
            isOpen={showRequestDocuments}
            onClose={() => {
              setShowRequestDocuments(false);
              setEvidenceItem(null);
            }}
            onSuccess={() => {
              setShowRequestDocuments(false);
              setEvidenceItem(null);
              void load();
            }}
            properties={deal.property ? [deal.property] : []}
            context={{
              inquiryId: deal.inquiryId,
              propertyId: deal.property?.id,
              clientName: deal.client.name,
            }}
            initialRequest={
              evidenceItem
                ? {
                    title: evidenceItem.label,
                    message: `Please upload the following document for this closing requirement: ${evidenceItem.label}.`,
                  }
                : undefined
            }
          />
        )}
        {evidenceItem &&
          deal?.transactionType === "PROPERTY_SALE" &&
          !showRequestDocuments && (
            <UploadDocumentModal
              isOpen={Boolean(evidenceItem)}
              onClose={() => setEvidenceItem(null)}
              onSuccess={() => {
                void (async () => {
                  await evidenceLinkTask.current;
                  evidenceLinkTask.current = null;
                  setEvidenceItem(null);
                })();
              }}
              onUploaded={(documentId) => {
                evidenceLinkTask.current = updateItem(evidenceItem, "SUBMITTED", notes[evidenceItem.key] || `Uploaded evidence for ${evidenceItem.label}.`, documentId);
              }}
              properties={
                deal.property ? [{ ...deal.property, status: "ACTIVE" }] : []
              }
              defaultPropertyId={deal.property?.id}
              defaultTitle={evidenceItem.label}
            />
          )}
      </DialogContent>
    </Dialog>
  );
}
