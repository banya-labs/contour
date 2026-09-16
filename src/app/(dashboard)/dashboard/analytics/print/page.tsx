"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, ZoomIn, ZoomOut, FileText, CheckCircle2, ShieldCheck, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { ContourReportPayload } from "@/lib/analytics/types";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ContourLogo } from "@/components/brand/contour-logo";
import { getAgencySettings } from "@/lib/settings/agency-settings";

function AnalyticsPrintContent() {
  const searchParams = useSearchParams();
  const preset = searchParams?.get("preset") || "this_month";
  const fromParam = searchParams?.get("from");
  const toParam = searchParams?.get("to");
  const customTitle = searchParams?.get("title") || "Business Intelligence & Performance Report";

  const [report, setReport] = useState<ContourReportPayload | null>(null);
  const [localAgencyLogo, setLocalAgencyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState("");

  useEffect(() => {
    try {
      const s = getAgencySettings();
      if (s?.logoUrl) setLocalAgencyLogo(s.logoUrl);
    } catch {}
  }, []);

  useEffect(() => {
    async function loadReport() {
      try {
        let url = `/api/analytics/report?preset=${preset}`;
        if (fromParam && toParam) {
          url += `&from=${fromParam}&to=${toParam}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      } catch (err) {
        console.error("Failed to load print report data", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [preset, fromParam, toParam]);

  const handleGeneratePdf = async (action: "download" | "print") => {
    if (isGenerating || !report) return;
    setIsGenerating(true);
    setProgressText("Initializing PDF engine...");

    try {
      const pageElements = document.querySelectorAll<HTMLElement>(".pdf-page");
      if (!pageElements || pageElements.length === 0) {
        throw new Error("No report pages found.");
      }

      // Initialize jsPDF for A4 portrait (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        setProgressText(`Rendering page ${i + 1} of ${pageElements.length}...`);
        const pageEl = pageElements[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      const cleanOrg = (report.meta.companyName || "Agency").replace(/[^a-zA-Z0-9]/g, "_");
      const cleanPeriod = (report.period.label || "Report").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Contour_${cleanOrg}_${cleanPeriod}.pdf`;

      if (action === "download") {
        setProgressText("Saving PDF...");
        pdf.save(filename);
      } else {
        setProgressText("Opening PDF document...");
        pdf.autoPrint();
        const blobUrl = pdf.output("bloburl");
        const printWindow = window.open(blobUrl, "_blank");
        if (printWindow) {
          printWindow.focus();
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to render PDF document. Please try again or use standard browser print.");
    } finally {
      setIsGenerating(false);
      setProgressText("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2B2D31] text-xs font-mono text-neutral-300">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
        Preparing multi-page executive PDF report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#2B2D31] text-xs font-mono text-red-400">
        <p className="mb-3">Unable to extract analytics data for print generation.</p>
        <Link href="/dashboard/analytics" className="text-white underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currency = report.meta.currency || "ZMW";

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-[#2A2D32] text-[#111] font-geist antialiased selection:bg-neutral-200 flex flex-col print:static print:h-auto print:w-auto print:overflow-visible print:bg-white">
      
      {/* 1. Sticky PDF Viewer Navigation Bar */}
      <div className="shrink-0 bg-[#1E2023] text-white border-b border-white/10 px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 shadow-lg z-20 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate max-w-xs">
              {report.meta.companyName} — {report.period.label} Report
            </span>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              5 Pages • A4
            </span>
          </div>
        </div>

        {/* Viewer & Export Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-black/40 rounded border border-white/10 px-1 py-0.5 text-xs text-neutral-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              disabled={isGenerating}
              className="p-1 hover:text-white disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-white">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              disabled={isGenerating}
              className="p-1 hover:text-white disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open-Source jsPDF Download */}
          <button
            onClick={() => handleGeneratePdf("download")}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded shadow transition-all border border-emerald-400/30 cursor-pointer"
            title="Generate and download actual A4 PDF document"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{progressText || "Rendering PDF..."}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Open-Source jsPDF Print */}
          <button
            onClick={() => handleGeneratePdf("print")}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#16382B] hover:bg-[#1E4D3B] disabled:opacity-60 text-white text-xs font-semibold rounded shadow transition-all border border-emerald-500/30 cursor-pointer"
            title="Render and print actual PDF document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Document</span>
          </button>
        </div>
      </div>

      {/* 2. Vertically Scrollable Multi-Page Document Viewport */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden py-8 print:py-0 px-4 print:px-0 flex flex-col items-center">
        <div
          style={{ zoom: `${zoomLevel}%` }}
          className="transition-transform duration-150 flex flex-col items-center gap-8 print:gap-0 w-full max-w-[210mm] pb-24 print:pb-0"
        >

          {/* ================================================================= */}
          {/* PAGE 1: EXECUTIVE BRIEFING, KPIS & FINANCIAL PERFORMANCE          */}
          {/* ================================================================= */}
          <div className="pdf-page w-full max-w-[210mm] min-h-[297mm] bg-white text-[#111] p-10 sm:p-14 shadow-2xl print:shadow-none border border-neutral-300 print:border-none flex flex-col justify-between relative">
            <div>
              {/* Document Letterhead */}
              <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                  {/* Agency Brand Identity (Agency Logo or Monogram) */}
                  <div className="flex items-center gap-3.5">
                    {(report.meta.logoUrl || localAgencyLogo) ? (
                      <img
                        src={report.meta.logoUrl || localAgencyLogo!}
                        alt={report.meta.companyName}
                        className="h-14 w-auto max-w-[140px] object-contain rounded border border-neutral-200 p-1 bg-white"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-neutral-900 text-white font-heading font-black text-xl flex items-center justify-center tracking-tighter uppercase shrink-0 shadow-sm border border-neutral-700">
                        {report.meta.companyName.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-xl font-heading font-black uppercase text-black tracking-tight leading-tight">
                        {report.meta.companyName}
                      </div>
                      <div className="text-[11px] font-heading font-bold text-neutral-700 uppercase tracking-wider mt-0.5">
                        {customTitle}
                      </div>
                      <div className="text-[9.5px] font-mono text-neutral-500 mt-0.5">
                        REAL ESTATE OPERATIONS & PERFORMANCE INTELLIGENCE
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-neutral-600 shrink-0">
                    <div className="font-bold text-black text-[11px]">REF: BI-{report.period.from.replace(/-/g, "")}</div>
                    <div>{report.meta.reportType}</div>
                    <div className="text-[9px] text-emerald-800 font-semibold mt-1">● VERIFIED LEDGER DATA</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-neutral-600">Company: </span>
                    <span className="font-bold text-black">{report.meta.companyName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-neutral-600">Reporting Window: </span>
                    <span className="font-bold text-black">{report.period.from} – {report.period.to}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-600">Prepared By: </span>
                    <span>{report.meta.preparedBy}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-neutral-600">Generated: </span>
                    <span>{new Date(report.meta.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>

                <div className="mt-2 text-center text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-500">
                  *** CONFIDENTIAL • FOR MANAGEMENT & PRINCIPAL BROKER USE ONLY ***
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="mb-6">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  1. Executive Summary
                </h2>
                <p className="text-[11px] leading-relaxed text-neutral-800 mb-4">
                  {report.aiNarrative.executiveSummaryText}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Operational Activity Table */}
                  <div>
                    <h3 className="font-bold text-[10px] uppercase text-neutral-700 mb-1">Business Performance — {report.period.label}</h3>
                    <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300">
                          <th className="p-1 text-left font-bold">Operational KPI</th>
                          <th className="p-1 text-right font-bold">{report.period.label}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-mono">
                        <tr><td className="p-1 font-sans">Total Properties</td><td className="p-1 text-right">{report.executiveKpis.totalProperties}</td></tr>
                        <tr><td className="p-1 font-sans">Active Properties</td><td className="p-1 text-right">{report.executiveKpis.activeProperties}</td></tr>
                        <tr><td className="p-1 font-sans">New Properties Added</td><td className="p-1 text-right">{report.executiveKpis.newPropertiesAdded}</td></tr>
                        <tr><td className="p-1 font-sans">Properties Sold</td><td className="p-1 text-right">{report.executiveKpis.propertiesSold}</td></tr>
                        <tr><td className="p-1 font-sans">Properties Rented</td><td className="p-1 text-right">{report.executiveKpis.propertiesRented}</td></tr>
                        <tr><td className="p-1 font-sans">New Inquiries</td><td className="p-1 text-right">{report.executiveKpis.newInquiries}</td></tr>
                        <tr><td className="p-1 font-sans">Matched Inquiries</td><td className="p-1 text-right">{report.executiveKpis.matchedInquiries}</td></tr>
                        <tr><td className="p-1 font-sans">Unmatched Inquiries</td><td className="p-1 text-right">{report.executiveKpis.unmatchedInquiries}</td></tr>
                        <tr><td className="p-1 font-sans">Viewings Completed</td><td className="p-1 text-right">{report.executiveKpis.viewingsCompleted}</td></tr>
                        <tr><td className="p-1 font-sans">Active Negotiations</td><td className="p-1 text-right">{report.executiveKpis.activeNegotiations}</td></tr>
                        <tr><td className="p-1 font-sans font-bold">Completed Transactions</td><td className="p-1 text-right font-bold">{report.executiveKpis.completedTransactions}</td></tr>
                        <tr><td className="p-1 font-sans text-neutral-600">Failed / Lost Deals</td><td className="p-1 text-right">{report.executiveKpis.failedDeals}</td></tr>
                        <tr><td className="p-1 font-sans">Follow-ups Due</td><td className="p-1 text-right">{report.executiveKpis.followUpsDue}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Financial KPIs Table */}
                  <div>
                    <h3 className="font-bold text-[10px] uppercase text-neutral-700 mb-1">Financial & Commission Telemetry</h3>
                    <table className="w-full border-collapse border border-neutral-300 text-[10px] mb-3">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300">
                          <th className="p-1 text-left font-bold">Financial KPI</th>
                          <th className="p-1 text-right font-bold">Amount ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-mono">
                        <tr><td className="p-1 font-sans">Total Transaction Volume</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.totalTransactionValue, currency)}</td></tr>
                        <tr><td className="p-1 font-sans">Gross Company Commission</td><td className="p-1 text-right font-bold">{formatCurrency(report.financialKpis.companyCommission, currency)}</td></tr>
                        <tr><td className="p-1 font-sans">Closing Agent Splits</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.agentCommissions, currency)}</td></tr>
                        <tr className="bg-neutral-50 font-bold"><td className="p-1 font-sans text-black">Net Agency Retained</td><td className="p-1 text-right text-black">{formatCurrency(report.financialKpis.netCompanyCommission, currency)}</td></tr>
                        <tr><td className="p-1 font-sans text-red-700">Outstanding Rental Arrears</td><td className="p-1 text-right text-red-700 font-bold">{formatCurrency(report.financialKpis.outstandingRentalPayments, currency)}</td></tr>
                      </tbody>
                    </table>

                    {/* Section 2: Management Snapshot Alert */}
                    <div className="p-2.5 bg-neutral-50 border border-neutral-300 text-[10px]">
                      <div className="font-bold text-[10px] uppercase text-black mb-1">2. Management Attention Flags:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-neutral-800">
                        {report.managementAttentionRequired.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>CONTOUR REAL ESTATE MANAGEMENT PLATFORM • REF: BI-{report.period.from.replace(/-/g, "")}</span>
              <span>PAGE 1 OF 5</span>
            </div>
          </div>


          {/* ================================================================= */}
          {/* PAGE 2: PROPERTY PORTFOLIO, NEW LISTINGS & STALE INVENTORY       */}
          {/* ================================================================= */}
          <div className="pdf-page w-full max-w-[210mm] min-h-[297mm] bg-white text-[#111] p-10 sm:p-14 shadow-2xl print:shadow-none border border-neutral-300 print:border-none flex flex-col justify-between relative">
            <div>
              {/* Header */}
              <div className="border-b border-neutral-200 pb-2 mb-4 flex justify-between items-center text-[9px] font-mono text-neutral-500">
                <span>CONTOUR BUSINESS INTELLIGENCE • {report.meta.companyName}</span>
                <span>SECTION 3, 4 & 21: PORTFOLIO TELEMETRY</span>
              </div>

              {/* Section 3: Portfolio Summary */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  3. Property Portfolio Breakdown
                </h2>
                <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300">
                      <th className="p-1 text-left font-bold">Property Status</th>
                      <th className="p-1 text-right font-bold">Number</th>
                      <th className="p-1 text-right font-bold">Distribution %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono">
                    <tr><td className="p-1 font-sans">For Sale</td><td className="p-1 text-right">{report.portfolioSummary.forSale}</td><td className="p-1 text-right">{report.portfolioSummary.total > 0 ? Math.round((report.portfolioSummary.forSale / report.portfolioSummary.total) * 100) : 0}%</td></tr>
                    <tr><td className="p-1 font-sans">For Rent</td><td className="p-1 text-right">{report.portfolioSummary.forRent}</td><td className="p-1 text-right">{report.portfolioSummary.total > 0 ? Math.round((report.portfolioSummary.forRent / report.portfolioSummary.total) * 100) : 0}%</td></tr>
                    <tr><td className="p-1 font-sans">Under Offer / Negotiation</td><td className="p-1 text-right">{report.portfolioSummary.underNegotiation}</td><td className="p-1 text-right">{report.portfolioSummary.total > 0 ? Math.round((report.portfolioSummary.underNegotiation / report.portfolioSummary.total) * 100) : 0}%</td></tr>
                    <tr><td className="p-1 font-sans">Sold</td><td className="p-1 text-right">{report.portfolioSummary.sold}</td><td className="p-1 text-right">{report.portfolioSummary.total > 0 ? Math.round((report.portfolioSummary.sold / report.portfolioSummary.total) * 100) : 0}%</td></tr>
                    <tr><td className="p-1 font-sans">Rented</td><td className="p-1 text-right">{report.portfolioSummary.rented}</td><td className="p-1 text-right">{report.portfolioSummary.total > 0 ? Math.round((report.portfolioSummary.rented / report.portfolioSummary.total) * 100) : 0}%</td></tr>
                    <tr className="bg-neutral-50 font-bold"><td className="p-1 font-sans">Total Properties Registered</td><td className="p-1 text-right">{report.portfolioSummary.total}</td><td className="p-1 text-right">100%</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4: New Properties Added */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  4. New Properties Added During Period
                </h2>
                {report.newPropertiesAdded.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-2">No new properties added during this reporting period.</p>
                ) : (
                  <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300">
                        <th className="p-1 text-left font-bold">Property Title</th>
                        <th className="p-1 text-left font-bold">Location</th>
                        <th className="p-1 text-left font-bold">Type</th>
                        <th className="p-1 text-right font-bold">Price ({currency})</th>
                        <th className="p-1 text-center font-bold">Listing</th>
                        <th className="p-1 text-left font-bold">Assigned Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {report.newPropertiesAdded.slice(0, 7).map((p) => (
                        <tr key={p.id}>
                          <td className="p-1 font-semibold truncate max-w-[140px]">{p.title}</td>
                          <td className="p-1">{p.location}</td>
                          <td className="p-1">{p.type}</td>
                          <td className="p-1 text-right font-mono">{formatCurrency(p.price, currency)}</td>
                          <td className="p-1 text-center">{p.listingType}</td>
                          <td className="p-1 truncate max-w-[100px]">{p.agentAssigned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section 21: Old / Underperforming Properties (> 90 Days) */}
              <div>
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 text-red-800">
                  21. Stale Inventory Analysis (&gt; 90 Days on Market)
                </h2>
                {report.staleProperties.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-2">Zero listings older than 90 days. Portfolio velocity optimal.</p>
                ) : (
                  <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300">
                        <th className="p-1 text-left font-bold">Property</th>
                        <th className="p-1 text-left font-bold">Location</th>
                        <th className="p-1 text-center font-bold">Days</th>
                        <th className="p-1 text-center font-bold">Inq / View</th>
                        <th className="p-1 text-right font-bold">Price ({currency})</th>
                        <th className="p-1 text-left font-bold">Management Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {report.staleProperties.slice(0, 6).map((sp) => (
                        <tr key={sp.id}>
                          <td className="p-1 font-semibold truncate max-w-[130px]">{sp.title}</td>
                          <td className="p-1">{sp.suburb}</td>
                          <td className="p-1 text-center font-mono font-bold text-red-700">{sp.daysListed}d</td>
                          <td className="p-1 text-center font-mono">{sp.inquiries} / {sp.viewings}</td>
                          <td className="p-1 text-right font-mono">{formatCurrency(sp.price, currency)}</td>
                          <td className="p-1 text-neutral-700 italic">{sp.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>CONTOUR REAL ESTATE MANAGEMENT PLATFORM • REF: BI-{report.period.from.replace(/-/g, "")}</span>
              <span>PAGE 2 OF 5</span>
            </div>
          </div>


          {/* ================================================================= */}
          {/* PAGE 3: CLIENT DEMAND, MATCHING PERFORMANCE & UNMATCHED QUEUE     */}
          {/* ================================================================= */}
          <div className="pdf-page w-full max-w-[210mm] min-h-[297mm] bg-white text-[#111] p-10 sm:p-14 shadow-2xl print:shadow-none border border-neutral-300 print:border-none flex flex-col justify-between relative">
            <div>
              {/* Header */}
              <div className="border-b border-neutral-200 pb-2 mb-4 flex justify-between items-center text-[9px] font-mono text-neutral-500">
                <span>CONTOUR BUSINESS INTELLIGENCE • {report.meta.companyName}</span>
                <span>SECTION 7, 8 & 9: CLIENT DEMAND & MATCHING</span>
              </div>

              {/* Section 7: Demand Analysis */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  7. Client Demand Analysis (Suburbs & Property Types)
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-[10px] uppercase text-neutral-700 mb-1">Most Requested Suburbs</h3>
                    <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300">
                          <th className="p-1 text-left font-bold">Location</th>
                          <th className="p-1 text-right font-bold">Inquiries</th>
                          <th className="p-1 text-right font-bold">Demand %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-mono">
                        {report.demandByLocation.slice(0, 6).map((l) => (
                          <tr key={l.name}>
                            <td className="p-1 font-sans">{l.name}</td>
                            <td className="p-1 text-right">{l.inquiries}</td>
                            <td className="p-1 text-right">{l.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-bold text-[10px] uppercase text-neutral-700 mb-1">Most Requested Property Types</h3>
                    <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300">
                          <th className="p-1 text-left font-bold">Property Type</th>
                          <th className="p-1 text-right font-bold">Inquiries</th>
                          <th className="p-1 text-right font-bold">Demand %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-mono">
                        {report.demandByPropertyType.slice(0, 6).map((t) => (
                          <tr key={t.name}>
                            <td className="p-1 font-sans">{t.name}</td>
                            <td className="p-1 text-right">{t.inquiries}</td>
                            <td className="p-1 text-right">{t.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-2 bg-neutral-50 border-l-2 border-black text-[10px] text-neutral-700">
                  <strong>Strategic Insight: </strong> {report.demandInsight}
                </div>
              </div>

              {/* Section 8: Matching Performance */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  8. Property Matching Performance
                </h2>
                <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Total Inquiries</div>
                    <div className="text-sm font-bold font-mono text-black mt-0.5">{report.matching.totalInquiries}</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Fully Matched</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{report.matching.fullyMatched}</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Unmatched Clients</div>
                    <div className="text-sm font-bold font-mono text-red-700 mt-0.5">{report.matching.unmatched}</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Match Efficiency</div>
                    <div className="text-sm font-bold font-mono text-black mt-0.5">{report.matching.matchRatePct}%</div>
                  </div>
                </div>
              </div>

              {/* Section 9: Unmatched Inquiries Queue */}
              <div>
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 text-red-800">
                  9. Unmatched Demand Queue (Awaiting Inventory)
                </h2>
                {report.unmatchedQueue.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-2">Zero unmatched inquiries. All active clients paired to listings.</p>
                ) : (
                  <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300">
                        <th className="p-1 text-left font-bold">Client Name</th>
                        <th className="p-1 text-left font-bold">Requirement</th>
                        <th className="p-1 text-left font-bold">Desired Suburb</th>
                        <th className="p-1 text-right font-bold">Budget ({currency})</th>
                        <th className="p-1 text-center font-bold">Days Waiting</th>
                        <th className="p-1 text-left font-bold">Assigned Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {report.unmatchedQueue.slice(0, 8).map((u) => (
                        <tr key={u.id}>
                          <td className="p-1 font-semibold">{u.clientName}</td>
                          <td className="p-1 truncate max-w-[120px]">{u.requirement}</td>
                          <td className="p-1">{u.location}</td>
                          <td className="p-1 text-right font-mono">{formatCurrency(u.budget, currency)}</td>
                          <td className="p-1 text-center font-mono font-bold text-red-700">{u.daysWaiting}d</td>
                          <td className="p-1">{u.agent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>CONTOUR REAL ESTATE MANAGEMENT PLATFORM • REF: BI-{report.period.from.replace(/-/g, "")}</span>
              <span>PAGE 3 OF 5</span>
            </div>
          </div>


          {/* ================================================================= */}
          {/* PAGE 4: VIEWING VELOCITY, PIPELINE FUNNEL & TRANSACTIONS          */}
          {/* ================================================================= */}
          <div className="pdf-page w-full max-w-[210mm] min-h-[297mm] bg-white text-[#111] p-10 sm:p-14 shadow-2xl print:shadow-none border border-neutral-300 print:border-none flex flex-col justify-between relative">
            <div>
              {/* Header */}
              <div className="border-b border-neutral-200 pb-2 mb-4 flex justify-between items-center text-[9px] font-mono text-neutral-500">
                <span>CONTOUR BUSINESS INTELLIGENCE • {report.meta.companyName}</span>
                <span>SECTION 10, 11, 12 & 13: PIPELINE & TRANSACTIONS</span>
              </div>

              {/* Section 10: Viewing Performance */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  10. Viewing Performance & Conversion Rates
                </h2>
                <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Scheduled Viewings</div>
                    <div className="text-sm font-bold font-mono text-black mt-0.5">{report.viewings.scheduled}</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Completed Viewings</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{report.viewings.completed}</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Completion Rate</div>
                    <div className="text-sm font-bold font-mono text-black mt-0.5">{report.viewings.completionRatePct}%</div>
                  </div>
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] font-mono uppercase text-neutral-500">Viewing → Negotiation</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{report.viewings.viewingToNegotiationPct}%</div>
                  </div>
                </div>
              </div>

              {/* Section 11: Sales Pipeline Funnel */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  11. Sales & Deal Pipeline Funnel
                </h2>
                <table className="w-full border-collapse border border-neutral-300 text-[10px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300">
                      <th className="p-1 text-left font-bold">Pipeline Stage</th>
                      <th className="p-1 text-center font-bold">Active Opportunities</th>
                      <th className="p-1 text-right font-bold">Estimated Pipeline Value ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono">
                    {report.pipelineFunnel.stages.map((st) => (
                      <tr key={st.stage}>
                        <td className="p-1 font-sans">{st.label}</td>
                        <td className="p-1 text-center">{st.opportunities}</td>
                        <td className="p-1 text-right">{formatCurrency(st.potentialValue, currency)}</td>
                      </tr>
                    ))}
                    <tr className="bg-neutral-50 font-bold">
                      <td className="p-1 font-sans">Total Pipeline In-Flight</td>
                      <td className="p-1 text-center">{report.pipelineFunnel.stages.reduce((a, s) => a + s.opportunities, 0)}</td>
                      <td className="p-1 text-right">{formatCurrency(report.pipelineFunnel.totalActivePipelineValue, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 12: Completed Transactions */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 text-emerald-800">
                  12. Completed Transactions Detail
                </h2>
                {report.completedTransactions.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-2">No closed transactions recorded in this window.</p>
                ) : (
                  <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300">
                        <th className="p-1 text-left font-bold">Property / Suburb</th>
                        <th className="p-1 text-left font-bold">Agent</th>
                        <th className="p-1 text-center font-bold">Type</th>
                        <th className="p-1 text-right font-bold">Gross Value ({currency})</th>
                        <th className="p-1 text-right font-bold">Gross Comm</th>
                        <th className="p-1 text-right font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {report.completedTransactions.slice(0, 6).map((t) => (
                        <tr key={t.id}>
                          <td className="p-1 font-semibold">{t.property} ({t.suburb})</td>
                          <td className="p-1">{t.agent}</td>
                          <td className="p-1 text-center">{t.transactionType}</td>
                          <td className="p-1 text-right font-mono">{formatCurrency(t.value, currency)}</td>
                          <td className="p-1 text-right font-mono font-bold text-emerald-800">{formatCurrency(t.commission, currency)}</td>
                          <td className="p-1 text-right font-mono text-neutral-500">{t.closedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section 13: Failed / Lost Deals Breakdown */}
              <div>
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 text-red-800">
                  13. Lost Deals & Dropped Opportunity Analysis
                </h2>
                <div className="p-2 bg-neutral-50 border border-neutral-300 text-[10px] mb-2 flex justify-between">
                  <span>Total Deals Lost: <strong>{report.lostDealsSummary.totalDealsLost}</strong></span>
                  <span>Potential Volume Lost: <strong className="text-red-700">{currency} {formatCurrency(report.lostDealsSummary.totalPotentialValueLost, currency)}</strong></span>
                </div>
                {report.lostDealsSummary.deals.length > 0 && (
                  <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300">
                        <th className="p-1 text-left font-bold">Client / Opportunity</th>
                        <th className="p-1 text-center font-bold">Dropped At</th>
                        <th className="p-1 text-right font-bold">Lost Value ({currency})</th>
                        <th className="p-1 text-left font-bold">Primary Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {report.lostDealsSummary.deals.slice(0, 5).map((d) => (
                        <tr key={d.id}>
                          <td className="p-1 font-semibold">{d.client} ({d.property})</td>
                          <td className="p-1 text-center font-bold">{d.failedAt}</td>
                          <td className="p-1 text-right font-mono text-neutral-600">{formatCurrency(d.potentialValue, currency)}</td>
                          <td className="p-1 text-neutral-700 italic">{d.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>CONTOUR REAL ESTATE MANAGEMENT PLATFORM • REF: BI-{report.period.from.replace(/-/g, "")}</span>
              <span>PAGE 4 OF 5</span>
            </div>
          </div>


          {/* ================================================================= */}
          {/* PAGE 5: AGENT PERFORMANCE, ACTION PLAN & MANAGEMENT SIGN-OFF      */}
          {/* ================================================================= */}
          <div className="pdf-page w-full max-w-[210mm] min-h-[297mm] bg-white text-[#111] p-10 sm:p-14 shadow-2xl print:shadow-none border border-neutral-300 print:border-none flex flex-col justify-between relative">
            <div>
              {/* Header */}
              <div className="border-b border-neutral-200 pb-2 mb-4 flex justify-between items-center text-[9px] font-mono text-neutral-500">
                <span>CONTOUR BUSINESS INTELLIGENCE • {report.meta.companyName}</span>
                <span>SECTION 14, 23, 25 & 27: AGENTS & ACTION PLAN</span>
              </div>

              {/* Section 14: Agent Leaderboard */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  14. Agent Productivity & Revenue Generated
                </h2>
                <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300">
                      <th className="p-1 text-left font-bold">Agent Name</th>
                      <th className="p-1 text-center font-bold">Inquiries</th>
                      <th className="p-1 text-center font-bold">Viewings</th>
                      <th className="p-1 text-center font-bold">Deals Won</th>
                      <th className="p-1 text-center font-bold">Conv %</th>
                      <th className="p-1 text-center font-bold">Active Days</th>
                      <th className="p-1 text-right font-bold">Commission ({currency})</th>
                      <th className="p-1 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono">
                    {report.agentPerformance.map((ag) => (
                      <tr key={ag.agentId}>
                        <td className="p-1 font-sans font-semibold text-left">{ag.name}</td>
                        <td className="p-1 text-center">{ag.inquiries}</td>
                        <td className="p-1 text-center">{ag.viewings}</td>
                        <td className="p-1 text-center font-bold text-black">{ag.completed}</td>
                        <td className="p-1 text-center font-sans">{ag.conversionRatePct}%</td>
                        <td className="p-1 text-center">{ag.activeDays}d</td>
                        <td className="p-1 text-right font-bold text-black">{formatCurrency(ag.grossCommissionGenerated, currency)}</td>
                        <td className="p-1 text-center font-sans text-[8.5px] font-bold">
                          {ag.activityStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 23: Month-on-Month Trends */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  23. Month-on-Month Key Performance Trends
                </h2>
                <table className="w-full border-collapse border border-neutral-300 text-[9.5px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300">
                      <th className="p-1 text-left font-bold">Performance Indicator</th>
                      <th className="p-1 text-right font-bold">Prior Period</th>
                      <th className="p-1 text-right font-bold">Current Period</th>
                      <th className="p-1 text-right font-bold">Growth Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono">
                    {report.momComparison.slice(0, 6).map((m) => (
                      <tr key={m.label}>
                        <td className="p-1 font-sans font-semibold text-left">{m.label}</td>
                        <td className="p-1 text-right">{m.format === "CURRENCY" ? formatCurrency(m.previous, currency) : m.previous}</td>
                        <td className="p-1 text-right font-bold">{m.format === "CURRENCY" ? formatCurrency(m.current, currency) : m.current}</td>
                        <td className={`p-1 text-right font-bold ${m.trend === "UP" ? "text-emerald-800" : "text-neutral-600"}`}>
                          {m.changePct > 0 ? `+${m.changePct}%` : `${m.changePct}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 25: Management Action Plan */}
              <div className="mb-5">
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-2">
                  25. Operational Action Plan & Priorities
                </h2>
                <div className="space-y-2 text-[10px]">
                  <div className="p-2 bg-[#FFF8F7] border-l-2 border-red-600">
                    <strong className="text-red-700 uppercase">Priority 1 — Immediate (24–48h):</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {report.aiNarrative.actionPlan.immediatePriority1.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 bg-[#FFFDF5] border-l-2 border-amber-500">
                    <strong className="text-amber-800 uppercase">Priority 2 — This Week:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {report.aiNarrative.actionPlan.thisWeekPriority2.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 bg-[#F6F9F8] border-l-2 border-emerald-800">
                    <strong className="text-emerald-800 uppercase">Priority 3 — Next Month:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {report.aiNarrative.actionPlan.nextMonthPriority3.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 27: Conclusion & Sign-off */}
              <div>
                <h2 className="text-xs font-heading font-bold uppercase tracking-wider border-b border-black pb-1 mb-1">
                  27. Management Conclusion & Verification
                </h2>
                <p className="text-[10.5px] leading-relaxed text-neutral-800 mb-4">
                  {report.aiNarrative.conclusionText}
                </p>

                <div className="pt-3 border-t border-neutral-300 grid grid-cols-2 gap-4 text-[9px] font-mono text-neutral-600">
                  <div>
                    <p className="font-bold text-black mb-0.5">OPERATIONAL DATA INTEGRITY</p>
                    <p>Source: Contour Multi-Tenant Ledger</p>
                    <p>Verification: REF: BI-{report.period.from.replace(/-/g, "")}-VERIFIED</p>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    <div className="border-b border-black w-48 ml-auto mb-1" />
                    <p className="font-bold text-black">Managing Broker / Director Signature</p>
                  </div>
                </div>
              </div>

              {/* Official Brand Stamp: Contour Logo at the End */}
              <div className="mt-5 pt-3 border-t-2 border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ContourLogo size="sm" variant="light" />
                  <div className="text-[9px] font-mono text-neutral-600 leading-tight">
                    <p className="font-bold text-neutral-900 tracking-wide uppercase">Powered by Contour</p>
                    <p>Real Estate Operations & Field Agent Intelligence OS</p>
                  </div>
                </div>
                <div className="text-right text-[9px] font-mono text-neutral-500">
                  <p className="font-bold text-neutral-800 uppercase tracking-wider">Confidential & Proprietary</p>
                  <p>PAGE 5 OF 5 • END OF REPORT</p>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-neutral-300 pt-2 flex justify-between items-center text-[9px] font-mono text-neutral-500 mt-2">
              <span>CONTOUR REAL ESTATE MANAGEMENT PLATFORM • REF: BI-{report.period.from.replace(/-/g, "")}</span>
              <span>PAGE 5 OF 5</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function AnalyticsPrintPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#2B2D31] text-xs font-mono text-white">
          Preparing executive print document...
        </div>
      }
    >
      <AnalyticsPrintContent />
    </React.Suspense>
  );
}
