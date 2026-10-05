"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Printer, ZoomIn, ZoomOut, ArrowLeft } from "lucide-react";
import { ContourLogo } from "@/components/brand/contour-logo";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { OperationProgress } from "@/components/ui/operation-progress";
import { prepareStatement, snapshotSchema, statementUrl, type GenerationInput, type StatementSnapshot } from "@/lib/statements/document";
import { landlordSnapshot } from "@/lib/statements/legacy-landlord";

type Saved = { id: string; revision: number; snapshot: StatementSnapshot; generationInput: GenerationInput | null };
export function statementPages(snapshot: StatementSnapshot, rowsPerPage = 8, mergeFirst = true, detailsPerPage = 8) {
  const pages: Array<{ details: StatementSnapshot["details"]; section?: StatementSnapshot["sections"][number] }> = [];
  for (let i = 0; i < snapshot.details.length; i += detailsPerPage) pages.push({ details: snapshot.details.slice(i, i + detailsPerPage) });
  const longNotices = snapshot.notices.filter(notice => notice.length > 300 || notice.split("\n").length > 4);
  const sections = [...snapshot.sections, ...(longNotices.length ? [{ title: "Statement notes", columns: ["Notes"], rows: longNotices.map(notice => [notice]) }] : [])];
  for (const section of sections) {
    if (!section.rows.length) pages.push({ details: [], section: { ...section, rows: [["No records for this period", ...section.columns.slice(1).map(() => "—")]] } });
    for (let i = 0; i < section.rows.length; i += rowsPerPage) pages.push({ details: [], section: { ...section, title: section.title + (i ? " (continued)" : ""), rows: section.rows.slice(i, i + rowsPerPage) } });
  }
  if (mergeFirst && pages.length > 1 && pages[0].details.length && pages[1].section) { pages[0].section = pages[1].section; pages.splice(1, 1); }
  return pages.length ? pages : [{ details: [] }];
}
export function StatementViewer({ documentId, legacyLandlord = false }: { documentId: string; legacyLandlord?: boolean }) {
  const [saved, setSaved] = useState<Saved | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0), [busy, setBusy] = useState(false), [progress, setProgress] = useState(""), [zoom, setZoom] = useState(100);
  const pagesRef = useRef<HTMLDivElement>(null), lock = useRef(false);
  const [pdfProgress, setPdfProgress] = useState<{ completed: number; total: number } | null>(null);
  const legacyInput = useRef<{ propertyId: string; statementMonth: number; statementYear: number; currency: string } | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(8), [mergeFirst, setMergeFirst] = useState(true);
  const [detailsPerPage, setDetailsPerPage] = useState(8), [layoutReady, setLayoutReady] = useState(false);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLayoutReady(false);
    void Promise.all([document.fonts.ready, ...[...(pagesRef.current?.querySelectorAll("img") || [])].map(img => img.decode().catch(() => undefined))]).then(() => requestAnimationFrame(() => {
      if (!active || !pagesRef.current) return;
      const overflowing = [...pagesRef.current.querySelectorAll<HTMLElement>(".statement-paper")].some(p => p.scrollHeight > p.clientHeight + 2);
      if (overflowing && mergeFirst) setMergeFirst(false);
      else if (overflowing && rowsPerPage > 1) setRowsPerPage(v => v - 1);
      else if (overflowing && detailsPerPage > 1) setDetailsPerPage(v => v - 1);
      else if (overflowing) setError("This statement contains text that cannot fit on an A4 page. Shorten the statement details before generating a new revision.");
      else setLayoutReady(true);
    }));
    return () => { active = false; };
  }, [saved, rowsPerPage, mergeFirst, detailsPerPage]);
  useEffect(() => { const fit = () => setZoom(Math.max(30, Math.min(100, Math.floor((innerWidth - 32) / (210 * 96 / 25.4) * 100)))); fit(); addEventListener("resize", fit); return () => removeEventListener("resize", fit); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setSaved(null);
    void fetch(`${legacyLandlord ? "/api/statements" : "/api/statement-documents"}/${encodeURIComponent(documentId)}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || "Unable to load statement.");
      if (!controller.signal.aborted) { if (legacyLandlord && data.statement.propertyId) legacyInput.current = data.statement; setSaved(legacyLandlord ? { id: documentId, revision: data.statement.revision || 1, snapshot: landlordSnapshot(data.statement), generationInput: null } : { ...data, snapshot: snapshotSchema.parse(data.snapshot) }); }
    }).catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load statement."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [documentId, retry, legacyLandlord]);
  const download = async () => {
    if (!saved || !pagesRef.current || lock.current || !layoutReady) return;
    lock.current = true; setBusy(true); setError("");
    try {
      setProgress("Preparing PDF…"); const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]); await document.fonts.ready;
      await Promise.all([...pagesRef.current.querySelectorAll("img")].map(img => img.decode().catch(() => undefined)));
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pages = [...pagesRef.current.querySelectorAll<HTMLElement>(".statement-paper")];
      setPdfProgress({ completed: 0, total: pages.length });
      for (let i = 0; i < pages.length; i++) {
        setProgress(`Rendering page ${i + 1} of ${pages.length}…`);
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, logging: false, backgroundColor: "#fff", onclone: doc => { doc.querySelectorAll<HTMLElement>(".statement-paper").forEach(p => { p.style.transform = "none"; }); } });
        if (i) pdf.addPage(); pdf.addImage(canvas.toDataURL("image/jpeg", .95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
        setPdfProgress({ completed: i + 1, total: pages.length });
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      pdf.save(`${saved.snapshot.title.replace(/[^a-zA-Z0-9]/g, "_")}_${saved.id}_v${saved.revision}.pdf`);
    } catch { setError("Unable to download this PDF. Retry, or use Print to save a PDF in your browser."); }
    finally { setBusy(false); setProgress(""); setPdfProgress(null); lock.current = false; }
  };
  const regenerate = async () => {
    if (!saved || (!saved.generationInput && !legacyInput.current) || lock.current) return; lock.current = true; setBusy(true); setError(""); setProgress("Generating a fresh revision…");
    try {
      if (legacyLandlord && legacyInput.current) { const response = await fetch("/api/statements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: legacyInput.current.propertyId, statementMonth: legacyInput.current.statementMonth, statementYear: legacyInput.current.statementYear, currency: legacyInput.current.currency, regenerate: true }) }); const data = await response.json(); if (!response.ok || !data.statement?.id) throw new Error(data.error || "Unable to regenerate landlord statement."); location.assign(`/dashboard/statements/${encodeURIComponent(data.statement.id)}/print`); }
      else if (saved.generationInput) { const id = await prepareStatement({ ...saved.generationInput, idempotencyKey: crypto.randomUUID() }); location.assign(statementUrl(id)); }
    }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to generate revision."); setBusy(false); lock.current = false; }
  };
  const back = saved?.snapshot.kind === "AGENT_COMMISSION" ? "/agent" : saved?.snapshot.kind.startsWith("SALE") ? "/dashboard/sales" : "/dashboard/leases";
  if (loading) return <main className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2A2D32] text-white"><ContourSunLoader size="lg" label="Loading saved statement…" /></main>;
  if (!saved) return <main className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-[#2A2D32] px-6 text-center text-white"><p role="alert">{error}</p><button className="min-h-11 bg-[#16382B] px-5" onClick={() => setRetry(v => v + 1)}>Retry loading statement</button><Link href="/agent" className="underline">Return to workspace</Link></main>;
  const { snapshot } = saved, pages = statementPages(snapshot, rowsPerPage, mergeFirst, detailsPerPage);
  return <main className="statement-viewer fixed inset-0 z-[90] flex flex-col bg-[#2A2D32] font-geist text-[#1C1C1A]">
    <style>{`@page{size:A4 portrait;margin:0}@media print{body:has(.statement-viewer){visibility:hidden}.statement-viewer{visibility:visible!important;position:absolute!important;inset:0!important;width:210mm!important;display:block!important;overflow:visible!important}.statement-scroll,.statement-pages{padding:0!important;overflow:visible!important;display:block!important}.statement-wrap{width:210mm!important;height:297mm!important;margin:0!important;break-after:page}.statement-wrap:last-child{break-after:auto}.statement-paper{transform:none!important;box-shadow:none!important}}`}</style>
    <nav aria-label="Statement controls" className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#1E2023] px-4 py-3 text-white print:hidden">
      <div className="flex items-center gap-3"><Link href={back} aria-label="Back to workspace" className="flex min-h-11 items-center gap-2"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span></Link><div><h1 className="text-sm font-semibold">{snapshot.title}</h1><p className="text-xs text-neutral-300">{snapshot.period} · Revision {saved.revision}</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><div className="hidden items-center sm:flex"><button aria-label="Zoom out" className="min-h-11 px-2" onClick={() => setZoom(v => Math.max(30, v - 10))}><ZoomOut className="h-4 w-4" /></button><span className="text-xs">{zoom}%</span><button aria-label="Zoom in" className="min-h-11 px-2" onClick={() => setZoom(v => Math.min(150, v + 10))}><ZoomIn className="h-4 w-4" /></button></div><button disabled={busy || !layoutReady} className="min-h-11 bg-emerald-600 px-4 text-sm font-semibold disabled:opacity-60" onClick={() => void download()}><Download className="mr-2 inline h-4 w-4" />{busy ? progress : "Download PDF"}</button><button disabled={busy || !layoutReady} className="min-h-11 bg-[#16382B] px-4 text-sm font-semibold disabled:opacity-60" onClick={() => window.print()}><Printer className="mr-2 inline h-4 w-4" />Print statement</button>{(saved.generationInput || legacyInput.current) && <button disabled={busy} className="min-h-11 border border-white/30 px-3 text-xs disabled:opacity-60" onClick={() => void regenerate()}>Generate updated revision</button>}</div>
    </nav>
    {error && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800 print:hidden">{error}</p>}
    {(busy || !layoutReady) && <div className="bg-[#1E2023] text-white print:hidden"><OperationProgress label={busy ? progress || "Preparing statement…" : "Fitting statement pages…"} completed={pdfProgress?.completed} total={pdfProgress?.total} /></div>}
    <div className="statement-scroll flex-1 overflow-auto p-4 sm:p-8"><div ref={pagesRef} className="statement-pages">
      {pages.map((page, i) => <div className="statement-wrap mx-auto mb-8" key={i} style={{ width: `${210 * zoom / 100}mm`, height: `${297 * zoom / 100}mm` }}><div className="statement-paper flex flex-col bg-white p-[18mm] shadow-xl" style={{ width: "210mm", height: "297mm", transform: `scale(${zoom / 100})`, transformOrigin: "top left", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#16382B] pb-5"><div className="min-w-0"><div className="flex h-12 items-center">{snapshot.organization.logo && snapshot.organization.logo !== failedLogo ? <Image src={snapshot.organization.logo} alt={`${snapshot.organization.name} logo`} width={176} height={48} unoptimized crossOrigin="anonymous" onError={() => setFailedLogo(snapshot.organization.logo)} className="max-h-12 object-contain" /> : <ContourLogo iconOnly size="lg" className="!text-[48px]" />}</div><h2 className="mt-3 break-words text-lg font-semibold text-[#16382B]">{snapshot.organization.name}</h2><p className="mt-2 whitespace-pre-wrap text-xs text-[#666158]">{[snapshot.organization.address, snapshot.organization.phone, snapshot.organization.email].filter(Boolean).join("\n")}</p></div><p className="max-w-[65mm] text-right text-xs text-[#666158]">{snapshot.period}<br />As of {new Date(snapshot.asOf).toLocaleString("en-GB")}</p></header>
        <h2 className="my-5 font-serif text-2xl font-bold">{snapshot.title}</h2>
        {page.details.length > 0 && <dl className="space-y-4">{page.details.map(([label, value], j) => <div key={j} className="grid grid-cols-[2fr_3fr] gap-2 border-b border-[#ECE7DE] pb-3 text-sm"><dt className="text-[#666158]">{label}</dt><dd className="whitespace-pre-wrap break-words font-semibold">{value.replace(/\s+/g, " ")}</dd></div>)}</dl>}
        {page.section && <section><h3 className="mb-4 text-base font-semibold">{page.section.title}</h3><table className="w-full table-fixed border-collapse text-xs leading-relaxed"><thead className="bg-[#F8F6F0]"><tr>{page.section.columns.map((label, j) => <th className="p-2 text-left font-semibold" key={j}>{label}</th>)}</tr></thead><tbody>{page.section.rows.map((row, j) => <tr key={j} className="border-b border-[#ECE7DE]">{row.map((cell, k) => <td key={k} className="whitespace-pre-wrap break-words px-2 py-3 align-top">{cell.replace(/\s+/g, " ")}</td>)}</tr>)}</tbody></table></section>}
        <footer className="mt-auto border-t border-[#ECE7DE] pt-4 text-[10px] leading-relaxed text-[#666158]">{snapshot.notices.filter(notice => notice.length <= 300 && notice.split("\n").length <= 4).map((notice, j) => <p key={j} className="mb-2 whitespace-pre-wrap">{notice.replace(/\s+/g, " ")}</p>)}<div className="flex justify-between gap-4"><span>Reference {saved.id} · Revision {saved.revision}</span><span>Page {i + 1} of {pages.length}</span></div><div className="mt-3 flex items-center gap-2"><span>Prepared with</span><ContourLogo size="sm" variant="light" /></div></footer>
      </div></div>)}
    </div></div>
  </main>;
}
