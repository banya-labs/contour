"use client";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MatchEnvelope, MatchRow } from "@/lib/matching/client-types";
import { emitWorkspaceMutation } from "@/lib/workspace-events";

export function AssignPropertyDialog({ inquiryId, clientName, targetLabel, isOnline = true, onClose, onAssigned }: {
  inquiryId: string;
  clientName: string;
  targetLabel: string;
  isOnline?: boolean;
  onClose: () => void;
  onAssigned: (property: MatchRow["property"]) => void;
}) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<MatchEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    if (!isOnline) { setLoading(false); return () => controller.abort(); }
    void (async () => {
      try {
        const response = await fetch(`/api/agent/matching/inquiries/${inquiryId}/available-properties?page=${page}&pageSize=20`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Unable to load available properties.");
        if (!controller.signal.aborted) setData(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load available properties.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [inquiryId, page, revision, isOnline]);

  const assign = async (match: MatchRow) => {
    if (busy || loading || !isOnline) return;
    setBusy(match.propertyId);
    setError("");
    try {
      const response = await fetch("/api/agent/matching/attach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, propertyId: match.propertyId, expectedPropertyId: data?.inquiry?.propertyId ?? null }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to assign this property.");
      emitWorkspaceMutation(["pipeline", "clients", "dashboard", "agent", "properties"], inquiryId);
      onAssigned(match.property);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign this property.");
    } finally { setBusy(null); }
  };

  return <Dialog open layer={80} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto" onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
      <div className="pr-9">
        <DialogTitle>Assign property to continue</DialogTitle>
        <DialogDescription className="mt-2">Choose a property for {clientName} before moving to {targetLabel}. Available properties are ranked by match percentage, highest first.</DialogDescription>
      </div>
      {!isOnline && <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm">Reconnect to load available properties and assign one. The inquiry has not progressed.</p>}
      {loading && <SectionPendingState compact label="Checking available properties…" />}
      {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!loading && !error && isOnline && data?.total === 0 && <div className="border border-editorial-border bg-neutral-50 p-4">
        <p className="font-heading font-bold">No available properties</p>
        <p className="mt-1 text-sm text-editorial-muted">There are no available properties in this workspace. Add or make a property available before progressing this inquiry. Lost and Cancelled remain available without a property.</p>
      </div>}
      {isOnline && data && data.total > 0 && <>
        <p className="text-xs text-editorial-muted">{data.total} available properties · Page {page}</p>
        <div className="space-y-3">{data.results.map((match) => <article key={match.propertyId} className="border border-editorial-border p-3 space-y-2" aria-label={`${match.property.title}, ${match.score}% match`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-heading font-bold break-words">{match.property.title}</h3><p className="text-xs text-editorial-muted">{match.property.suburb || "Location not specified"} · {match.property.listingType === "FOR_RENT" ? "To rent" : match.property.listingType === "BOTH" ? "Sale / rent" : "For sale"}{match.effectivePrice != null ? ` · ${match.property.currency} ${match.effectivePrice.toLocaleString("en-ZM")}` : ""}</p></div><span className="shrink-0 font-mono font-bold text-contour-red">{match.score}% match</span></div>
          {match.reasons.length > 0 && <p className="text-xs">{match.reasons.join(" · ")}</p>}
          {match.unmetPreferences.length > 0 && <p className="text-xs text-amber-800">Preferences unmet: {match.unmetPreferences.join(" · ")}</p>}
          {match.hardFailures.length > 0 && <p className="text-xs text-red-700">Cannot assign: {match.hardFailures.join(" · ")}</p>}
          <button type="button" disabled={loading || Boolean(error) || busy !== null || match.hardFailures.length > 0} onClick={() => void assign(match)} className="min-h-11 w-full sm:w-auto px-4 py-2 bg-editorial-black text-white text-xs font-heading font-bold uppercase disabled:opacity-50"><PendingButtonContent pending={busy === match.propertyId} pendingLabel="Assigning…">Assign and continue</PendingButtonContent></button>
        </article>)}</div>
        <div className="flex items-center justify-between gap-3"><button type="button" disabled={page === 1 || loading || busy !== null} onClick={() => setPage(page - 1)} className="min-h-11 border px-3 py-2 text-xs disabled:opacity-50">Previous</button><button type="button" disabled={!data.hasMore || loading || busy !== null} onClick={() => setPage(page + 1)} className="min-h-11 border px-3 py-2 text-xs disabled:opacity-50">Next</button></div>
      </>}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-3"><button type="button" disabled={!isOnline || loading || busy !== null} onClick={() => setRevision(revision + 1)} className="min-h-11 border px-4 py-2 text-xs disabled:opacity-50">Refresh properties</button><button type="button" disabled={busy !== null} onClick={onClose} className="min-h-11 border px-4 py-2 text-xs disabled:opacity-50">Cancel</button></div>
    </DialogContent>
  </Dialog>;
}
