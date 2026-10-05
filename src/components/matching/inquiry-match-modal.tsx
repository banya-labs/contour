import { CheckCircle2, X } from "lucide-react";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { propertyTypeLabel } from "@/lib/property-types";

export type InquiryMatch = {
  propertyId: string;
  score: number;
  reasons: string[];
  hardFailures?: string[];
  isMatch?: boolean;
  property?: {
    id: string;
    title: string;
    suburb?: string | null;
    listingType?: string | null;
    currency?: string | null;
    askingPrice?: number | string | null;
    rentalPrice?: number | string | null;
    price?: number | string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  };
};

type InquiryMatchModalProps = {
  inquiry: { name?: string | null; preferredArea?: string | null } | null;
  matches: InquiryMatch[];
  threshold: number;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
};

const formatPrice = (match: InquiryMatch) => {
  const property = match.property;
  const value = property?.price ?? (property?.listingType === "FOR_RENT" ? property.rentalPrice : property?.askingPrice);
  if (value == null) return "Price on request";
  return `${property?.currency || "ZMW"} ${Number(value).toLocaleString("en-ZM")}`;
};

export function InquiryMatchModal({ inquiry, matches, threshold, loading, error, onClose }: InquiryMatchModalProps) {
  if (!inquiry) return null;

  const qualifyingMatches = matches.filter((match) => match.isMatch !== false && match.score >= threshold);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Inquiry property matches">
      <div className="bg-white border border-editorial-border w-full max-w-md max-h-[86vh] overflow-y-auto p-5 space-y-4 text-editorial-black shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-editorial-border pb-3">
          <div>
            <span className="text-[10px] font-mono text-contour-red uppercase font-bold">Property matches</span>
            <h3 className="text-base font-heading font-semibold mt-0.5">{inquiry.name || "Inquiry"}</h3>
            <p className="text-[11px] text-editorial-muted font-mono mt-1">Across the organization&apos;s active listings</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close property matches" className="p-1.5 text-editorial-muted hover:text-editorial-black">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <SectionPendingState label="Checking active properties…" />
        ) : error ? (
          <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>
        ) : qualifyingMatches.length === 0 ? (
          <div className="border border-editorial-border bg-neutral-50 p-4 text-center">
            <p className="text-sm font-heading font-semibold">No qualifying matches yet</p>
            <p className="text-xs text-editorial-muted mt-1">Try updating the inquiry requirements or check again after a listing is added.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-editorial-muted"><span className="font-bold text-editorial-black">{qualifyingMatches.length}</span> matching {qualifyingMatches.length === 1 ? "property" : "properties"}</p>
            {qualifyingMatches.map((match) => (
              <div key={match.propertyId} className="border border-editorial-border bg-neutral-50 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-heading font-semibold truncate">{match.property?.title || "Property"}</h4>
                    <p className="text-[11px] text-editorial-muted font-mono">{match.property?.suburb || "Location pending"} • {propertyTypeLabel(match.property?.propertyType)} • {formatPrice(match)}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-1">{match.score}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(match.reasons || []).map((reason) => <span key={reason} className="inline-flex items-center gap-1 text-[10px] text-editorial-muted bg-white border border-editorial-border px-1.5 py-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" />{reason}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} className="w-full py-2.5 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors">Close</button>
      </div>
    </div>
  );
}
