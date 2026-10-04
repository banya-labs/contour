"use client";
import { usePropertyInquiryMatches } from "@/hooks/use-property-inquiry-matches";
export function MatchPreview({ propertyId, listingType, onOpen, isOnline = true }: { propertyId: string; listingType: string; onOpen: () => void; isOnline?: boolean }) {
  const { data, loading, error, stale } = usePropertyInquiryMatches(propertyId, "properties", "qualifying", 1, isOnline);
  const label = listingType === "FOR_RENT" ? "renters" : listingType === "BOTH" ? "inquiries" : "buyers";
  return <section className="border border-emerald-200 bg-emerald-50 p-3 space-y-2 text-editorial-black">
    <div className="flex justify-between gap-2"><h3 className="text-xs font-semibold">Matching {label}{data ? ` (${data.total})` : ""}</h3><button type="button" className="text-xs underline" onClick={onOpen}>View all matches</button></div>
    {loading && <p className="text-xs" role="status">Checking matches…</p>}
    {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
    {stale && data && <p className="text-[11px]">Cached matches · last checked {new Date(data.calculatedAt).toLocaleString()}</p>}
    {!loading && !error && data?.total === 0 && <p className="text-xs">No qualifying matches yet.</p>}
    {data?.results.slice(0, 2).map((match) => <div key={match.inquiry?.id} className="border-t border-emerald-200 pt-2 text-xs"><div className="flex justify-between"><span>{match.inquiry?.contact?.name || match.inquiry?.clientName}</span><strong>{match.score}% fit</strong></div><p className="text-[11px] mt-1">{match.reasons.join(" · ")}</p></div>)}
  </section>;
}
