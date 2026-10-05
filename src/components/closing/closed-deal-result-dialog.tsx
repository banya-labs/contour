"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { ClosedDealResult } from "@/lib/closed-deal-result";

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="min-w-0"><dt className="text-[10px] uppercase tracking-wider text-editorial-muted">{label}</dt><dd className="mt-1 text-sm break-words whitespace-pre-wrap">{value ?? "Not recorded"}</dd></div>;
}

export function ClosedDealResultDialog({ result, onClose }: { result: ClosedDealResult; onClose: () => void }) {
  const won = result.outcome === "WON";
  const sale = result.transactionType === "PROPERTY_SALE";
  const Icon = won ? CheckCircle2 : XCircle;
  return (
    <Dialog open layer={90} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto block p-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <header className={`p-5 pr-16 border-b ${won ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <Icon aria-hidden="true" className={`h-8 w-8 mb-3 ${won ? "text-emerald-700" : "text-red-700"}`} />
          <DialogTitle className="text-xl normal-case">{sale ? "Sale" : "Deal"} closed — {won ? "Won" : "Lost"}</DialogTitle>
          <DialogDescription className="mt-2">The outcome has been saved. Review the details, then close this confirmation.</DialogDescription>
        </header>
        <div className="p-5 space-y-5">
          <section aria-label="Closing details">
            <h3 className="font-heading font-bold mb-3">Closing details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Outcome" value={won ? "Won" : "Lost"} />
              <Detail label={won && sale ? "Sale value" : "Deal value"} value={result.dealValue === null ? null : `${result.currency} · ${formatCurrency(result.dealValue, result.currency)}`} />
              <Detail label="Closed on" value={new Date(result.closedAt).toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" })} />
              <Detail label="Assigned agent" value={result.agentName} />
              <Detail label="Deal reference" value={result.inquiryId} />
            </dl>
            {!won && <dl className="mt-4 p-3 border border-red-200 bg-red-50"><Detail label="Reason lost" value={result.lostReason} /></dl>}
            {won && result.competingInquiriesClosed > 0 && <p className="mt-4 text-xs text-editorial-muted">{result.competingInquiriesClosed} other {result.competingInquiriesClosed === 1 ? "inquiry was" : "inquiries were"} closed as lost for this property.</p>}
          </section>
          <section aria-label="Property details" className="border-t border-editorial-border pt-4">
            <h3 className="font-heading font-bold mb-3">Property details</h3>
            {result.property ? <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Property" value={result.property.title} />
              <Detail label="Location" value={[result.property.suburb, result.property.city].filter(Boolean).join(", ")} />
              <Detail label="Property type" value={result.property.propertyType.replaceAll("_", " ").toLowerCase()} />
              <Detail label="Asking price" value={result.property.askingPrice === null ? null : `${result.property.currency} · ${formatCurrency(result.property.askingPrice, result.property.currency)}`} />
              <Detail label="Bedrooms" value={result.property.bedrooms} />
              <Detail label="Bathrooms" value={result.property.bathrooms} />
              <Detail label="Plot size" value={result.property.plotSizeSqm === null ? null : `${result.property.plotSizeSqm} m²`} />
              <Detail label="Property reference" value={result.property.id} />
            </dl> : <p className="text-sm text-editorial-muted">No property linked to this deal.</p>}
          </section>
          <section aria-label="Buyer details" className="border-t border-editorial-border pt-4">
            <h3 className="font-heading font-bold mb-3">{sale ? "Buyer details" : "Client details"}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Name" value={result.buyer.name} />
              <Detail label="Phone" value={result.buyer.phone} />
              <Detail label="Email" value={result.buyer.email} />
            </dl>
          </section>
          {result.notes && <dl className="border-t border-editorial-border pt-4"><Detail label="Deal notes" value={result.notes} /></dl>}
        </div>
        <footer className="border-t border-editorial-border p-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-3 bg-editorial-black text-white text-xs font-bold uppercase tracking-wider">Close confirmation</button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
