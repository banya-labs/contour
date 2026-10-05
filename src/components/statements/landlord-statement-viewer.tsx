"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, FileText, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { formatCurrency } from "@/lib/utils";
import { loadLandlordStatement, STATEMENT_STATUS_LABELS, type LandlordStatementDocument } from "@/lib/statements/viewer";

export function LandlordStatementViewer({ statementId }: { statementId: string }) {
  const [statement, setStatement] = useState<LandlordStatementDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [progress, setProgress] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);
  const exportInFlight = useRef(false);

  useEffect(() => {
    setZoom(Math.max(35, Math.min(100, Math.floor((window.innerWidth - 32) / (210 * 96 / 25.4) * 100))));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setStatement(null); setLoadError(""); setExportError("");
    void loadLandlordStatement(statementId, fetch, controller.signal)
      .then((saved) => { if (!controller.signal.aborted) setStatement(saved); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Unable to load the statement."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [statementId, retryNonce]);

  const downloadPdf = async () => {
    if (!statement || !pageRef.current || exportInFlight.current) return;
    exportInFlight.current = true; setExporting(true); setExportError(""); setProgress("Preparing PDF…");
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
      await document.fonts.ready;
      setProgress("Rendering statement…");
      const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", onclone: (document) => {
        const page = document.querySelector<HTMLElement>(".landlord-statement-page");
        if (page) page.style.transform = "none";
      } });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      const safeName = (statement.property?.title || "Property").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
      pdf.save(`Landlord_Statement_${safeName}_${statement.statementYear}-${String(statement.statementMonth).padStart(2, "0")}.pdf`);
    } catch {
      setExportError("Unable to download the PDF. Please try again, or use Print to save a PDF from your browser.");
    } finally {
      exportInFlight.current = false; setExporting(false); setProgress("");
    }
  };

  if (loading) return <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#2A2D32] text-white"><ContourSunLoader size="lg" label="Preparing landlord statement…" /><p className="mt-4 text-sm">Loading the saved rental ledger…</p></div>;
  if (!statement) return <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-[#2A2D32] px-6 text-center text-white"><p role="alert">{loadError || "Statement unavailable."}</p><button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="min-h-11 bg-[#16382B] px-5 py-2 font-semibold">Retry loading statement</button><Link href="/dashboard/leases?tab=statements" className="underline">Return to landlord statements</Link></div>;

  const money = (amount: string | number) => formatCurrency(Number(amount), statement.currency);
  const period = new Date(statement.statementYear, statement.statementMonth - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const organization = statement.organization;
  const status = STATEMENT_STATUS_LABELS[statement.status] || statement.status.replace(/_/g, " ");
  const rows = [
    ["Rent due for the period", statement.rentDue],
    ["Gross rent collected", statement.grossRentCollected],
    ["Agency fee deducted", statement.agencyFeeDeducted],
    ["Maintenance deducted", statement.maintenanceDeducted],
  ] as const;

  return <div className="landlord-statement-viewer fixed inset-0 z-[80] flex flex-col bg-[#2A2D32] font-geist text-[#1C1C1A] print:static print:block print:bg-white">
    <style>{`@page{size:A4 portrait;margin:0} @media print{body:has(.landlord-statement-viewer){visibility:hidden} .landlord-statement-viewer{visibility:visible;position:absolute!important;inset:0!important;width:210mm!important;height:auto!important;overflow:visible!important} .landlord-statement-page{transform:none!important;width:210mm!important;height:297mm!important;margin:0!important;box-shadow:none!important} .landlord-statement-scroll{padding:0!important;overflow:visible!important;display:block!important} .landlord-statement-wrap{width:210mm!important;height:297mm!important}}`}</style>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#1E2023] px-4 py-3 text-white print:hidden">
      <div className="flex min-w-0 items-center gap-3"><Link href="/dashboard/leases?tab=statements" className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-200"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to statements</span></Link><FileText className="h-5 w-5 text-emerald-400" /><div className="min-w-0"><p className="truncate text-sm font-semibold">Landlord statement · {period}</p><p className="truncate text-xs text-neutral-300">{statement.property?.title || "Managed property"}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-1 sm:flex"><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(35, value - 10))} className="min-h-11 px-2"><ZoomOut className="h-4 w-4" /></button><span className="w-12 text-center text-xs">{zoom}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(150, value + 10))} className="min-h-11 px-2"><ZoomIn className="h-4 w-4" /></button></div>
        <button type="button" disabled={exporting} onClick={() => void downloadPdf()} className="inline-flex min-h-11 items-center gap-2 bg-emerald-600 px-4 text-sm font-semibold disabled:opacity-60">{exporting ? <ContourSunLoader size="sm" decorative label="Generating PDF…" /> : <Download className="h-4 w-4" />} {exporting ? progress : "Download PDF"}</button>
        <button type="button" disabled={exporting} onClick={() => { setExportError(""); window.print(); }} className="inline-flex min-h-11 items-center gap-2 bg-[#16382B] px-4 text-sm font-semibold disabled:opacity-60"><Printer className="h-4 w-4" />Print statement</button>
      </div>
    </div>
    {exportError && <div role="alert" className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">{exportError}</div>}
    <div className="landlord-statement-scroll flex-1 overflow-auto p-4 sm:p-8">
      <div className="landlord-statement-wrap mx-auto" style={{ width: `${210 * zoom / 100}mm`, height: `${297 * zoom / 100}mm` }}>
        <div ref={pageRef} className="landlord-statement-page relative flex flex-col bg-white p-[18mm] shadow-xl" style={{ width: "210mm", height: "297mm", transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
          <header className="flex items-start justify-between gap-8 border-b-2 border-[#16382B] pb-7">
            <div className="min-w-0"><div className="mb-3">{organization.logo ? <Image src={organization.logo} alt={`${organization.name} logo`} width={176} height={56} unoptimized loading="eager" crossOrigin="anonymous" className="max-h-14 max-w-44 object-contain" /> : <ContourLogo size="lg" />}</div><h1 className="break-words text-xl font-semibold text-[#16382B]">{organization.name}</h1><div className="mt-2 space-y-1 text-xs text-[#666158]">{organization.profile?.primaryOfficeAddress && <p>{organization.profile.primaryOfficeAddress}</p>}{organization.profile?.primaryPhone && <p>{organization.profile.primaryPhone}</p>}{organization.profile?.primaryEmail && <p>{organization.profile.primaryEmail}</p>}</div></div>
            <div className="shrink-0 text-right"><p className="text-xs font-semibold uppercase tracking-wide text-[#16382B]">Landlord remittance</p><p className="mt-2 text-xl font-semibold">{period}</p><p className="mt-2 text-xs text-[#666158]">{statement.currency} statement</p></div>
          </header>
          <section className="py-7"><h2 className="font-serif text-3xl font-bold">Landlord statement</h2><div className="mt-5 grid grid-cols-2 gap-6 border-b border-[#ECE7DE] pb-5"><div><p className="text-xs text-[#666158]">Prepared for</p><p className="mt-1 break-words text-lg font-semibold">{statement.landlordName}</p></div><div><p className="text-xs text-[#666158]">Managed property</p><p className="mt-1 break-words text-base font-semibold">{statement.property?.title || "Managed property"}</p><p className="mt-1 text-xs text-[#666158]">{[statement.property?.suburb, statement.property?.city].filter(Boolean).join(", ")}</p></div></div><p className="mt-4 text-sm font-semibold text-[#16382B]">{status}</p>{statement.status === "DRAFT" && <p className="mt-1 text-xs text-[#666158]">This draft is pending management approval and does not confirm a landlord payout.</p>}</section>
          <section><h3 className="mb-3 text-base font-semibold">Rental account summary</h3><table className="w-full border-collapse text-sm"><thead><tr className="bg-[#F8F6F0]"><th className="p-3 text-left font-semibold">Description</th><th className="p-3 text-right font-semibold">Amount ({statement.currency})</th></tr></thead><tbody>{rows.map(([label, amount]) => <tr key={label} className="border-b border-[#ECE7DE]"><td className="py-4">{label}</td><td className="py-4 text-right font-mono">{money(amount)}</td></tr>)}</tbody></table><div className="mt-6 flex items-center justify-between gap-4 border-t-2 border-[#16382B] bg-[#F8F6F0] px-4 py-5 text-[#16382B]"><p className="text-lg font-semibold">Net landlord payout</p><p className="text-2xl font-bold">{money(statement.netLandlordPayout)}</p></div></section>
          <section className="mt-7"><h3 className="mb-3 text-base font-semibold">Tenant arrears</h3><div className="flex justify-between border-b border-[#ECE7DE] py-3 text-sm"><span>Arrears brought forward</span><span className="font-mono">{money(statement.arrearsBroughtForward)}</span></div><div className="flex justify-between border-b border-[#ECE7DE] py-3 text-sm"><span>Closing arrears</span><span className="font-mono">{money(statement.arrearsClosing)}</span></div><p className="mt-3 text-xs leading-relaxed text-[#666158]">Arrears are shown separately from the net payout. This statement uses the confirmed rent payments and approved maintenance expenses recorded when it was generated.</p></section>
          <footer className="mt-auto border-t border-[#ECE7DE] pt-5 text-xs text-[#666158]"><div className="flex justify-between gap-4"><span>Generated {new Date(statement.createdAt).toLocaleDateString("en-GB")}</span><span>Page 1 of 1</span></div><p className="mt-2 break-all">Statement reference: {statement.id}</p><p className="mt-2">Prepared with Contour · {status}</p></footer>
        </div>
      </div>
    </div>
  </div>;
}
