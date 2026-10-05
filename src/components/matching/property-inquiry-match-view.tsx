"use client";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { useState } from "react";
import { usePropertyInquiryMatches } from "@/hooks/use-property-inquiry-matches";
import { formatWhatsAppDigits } from "@/lib/phone-utils";
import type { MatchRow } from "@/lib/matching/client-types";
export function PropertyInquiryMatchView({ id, title, kind = "properties", isOnline = true, onClose, onOpenContact, onOpenInquiry, onOpenProperty, onAttached, pitch }: { id: string; title: string; kind?: "properties" | "inquiries"; isOnline?: boolean; onClose: () => void; onOpenContact?: (id: string) => void; onOpenInquiry?: (inquiry: NonNullable<MatchRow["inquiry"]>) => void; onOpenProperty?: (id: string) => void; onAttached: () => void; pitch?: string }) {
  const [view, setView] = useState<"qualifying" | "near">("qualifying"), [page, setPage] = useState(1);
  const { data, loading, error, stale, refresh } = usePropertyInquiryMatches(id, kind, view, page, isOnline);
  const [busy, setBusy] = useState<string | null>(null), [mutationError, setMutationError] = useState("");
  const attach = async (match: MatchRow) => {
    if (busy || loading || !isOnline || stale) return;
    setBusy(match.propertyId + (match.inquiry?.id || "")); setMutationError("");
    try {
      const response = await fetch("/api/agent/matching/attach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inquiryId: kind === "inquiries" ? id : match.inquiry?.id, propertyId: match.propertyId, expectedPropertyId: kind === "inquiries" ? data?.inquiry?.propertyId || null : null }) });
      const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.error || "Attachment failed");
      window.dispatchEvent(new Event("contour-matching-changed")); refresh(); onAttached();
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Attachment failed"); } finally { setBusy(null); }
  };
  return <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Matching results"><section className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white p-5 space-y-4 text-editorial-black">
    <header className="flex justify-between gap-3"><div><p className="text-[10px] uppercase text-contour-red">{kind === "properties" ? "Matching buyers and renters" : "Matching properties"}</p><h2 className="font-semibold">{title}</h2></div><button type="button" disabled={Boolean(busy)} onClick={onClose} aria-label="Close matching results">Close</button></header>
    <div className="flex gap-2"><button type="button" aria-pressed={view === "qualifying"} onClick={() => { setView("qualifying"); setPage(1); }} className="border px-3 py-2 text-xs">Qualifying matches</button><button type="button" aria-pressed={view === "near"} onClick={() => { setView("near"); setPage(1); }} className="border px-3 py-2 text-xs">Near matches / rejected</button><button type="button" disabled={loading || Boolean(busy)} onClick={refresh} className="text-xs underline">Refresh</button></div>
    {loading && <SectionPendingState compact label="Checking matches…" />}{(error || mutationError) && <p role="alert" className="text-xs text-red-700">{error || mutationError}</p>}
    {stale && data && <p className="text-xs">Cached matches · last checked {new Date(data.calculatedAt).toLocaleString()}</p>}
    {data && <p className="text-xs">{data.total} results · qualifying fit is over 70%</p>}
    {data?.results.map((match) => <article key={match.inquiry?.id || match.propertyId} className="border p-3 space-y-2 text-xs">
      <div className="flex justify-between"><strong>{kind === "properties" ? match.inquiry?.contact?.name || match.inquiry?.clientName : match.property.title}</strong><strong>{match.score}% fit</strong></div>
      <p>{match.reasons.join(" · ")}</p>{match.unmetPreferences?.length > 0 && <p className="text-amber-800">Preferences unmet: {match.unmetPreferences.join(" · ")}</p>}{match.hardFailures?.length > 0 && <p className="text-red-700">Does not fit: {match.hardFailures.join(" · ")}</p>}{match.missingData?.length > 0 && <p className="text-editorial-muted">Not confirmed: {match.missingData.join(" · ")}</p>}
      <div className="flex flex-wrap gap-2">
        {match.inquiry && onOpenInquiry && <button type="button" className="border px-2 py-2" onClick={() => onOpenInquiry(match.inquiry!)}>Open inquiry</button>}
        {match.inquiry?.contactId && onOpenContact && <button type="button" className="border px-2 py-2" onClick={() => onOpenContact(match.inquiry!.contactId)}>Open contact</button>}
        {kind === "inquiries" && onOpenProperty && <button type="button" className="border px-2 py-2" onClick={() => onOpenProperty(match.propertyId)}>Open property</button>}
        {match.isMatch && <button type="button" disabled={!isOnline || stale || loading || busy !== null || data.matchingEnabled === false} onClick={() => void attach(match)} className="bg-editorial-black text-white px-2 py-2 disabled:opacity-50"><PendingButtonContent pending={busy === match.propertyId + (match.inquiry?.id || "")} pendingLabel="Attaching…">{data.matchingEnabled === false ? "Property already linked" : "Attach property"}</PendingButtonContent></button>}
        {pitch && match.inquiry?.clientPhone && <a className="border px-2 py-2" href={`https://wa.me/${formatWhatsAppDigits(match.inquiry.clientPhone)}?text=${encodeURIComponent(pitch)}`} target="_blank" rel="noopener noreferrer">WhatsApp pitch</a>}
      </div>
    </article>)}
    {!loading && !error && data?.total === 0 && <p className="text-xs">No results for this view.</p>}
    <footer className="flex justify-between"><button type="button" disabled={page === 1 || loading || Boolean(busy)} onClick={() => setPage(page-1)} className="text-xs disabled:opacity-50">Previous</button><span className="text-xs">Page {page}</span><button type="button" disabled={!data?.hasMore || loading || Boolean(busy)} onClick={() => setPage(page+1)} className="text-xs disabled:opacity-50">Next</button></footer>
  </section></div>;
}
