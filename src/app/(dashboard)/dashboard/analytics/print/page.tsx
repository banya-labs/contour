"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContourReportPayload } from "@/lib/analytics/types";
import { formatCurrency } from "@/lib/utils";

function AnalyticsPrintContent() {
  const searchParams = useSearchParams();
  const preset = searchParams?.get("preset") || "this_month";
  const fromParam = searchParams?.get("from");
  const toParam = searchParams?.get("to");

  const [report, setReport] = useState<ContourReportPayload | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-xs font-mono text-neutral-500">
        Preparing executive print document...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-xs font-mono text-red-600">
        Unable to load report for print generation.
      </div>
    );
  }

  const currency = report.meta.currency || "ZMW";

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white py-6 print:py-0 font-geist text-[#111]">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analytics Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#16382B] text-white text-xs font-semibold hover:bg-black transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
        </button>
      </div>

      {/* Main Print Container (A4 Printable Canvas) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 print:p-0 shadow-sm print:shadow-none border border-neutral-200 print:border-none text-xs leading-relaxed">
        
        {/* Document Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-heading font-black tracking-wider uppercase">CONTOUR</div>
              <div className="text-sm font-heading font-bold text-neutral-800 uppercase tracking-wide">
                BUSINESS INTELLIGENCE & PERFORMANCE REPORT
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-neutral-600">
              <div>Ref: BI-{report.period.from.replace(/-/g, "")}</div>
              <div>{report.meta.reportType}</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="font-semibold text-neutral-700">Company: </span>
              <span className="font-bold">{report.meta.companyName}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-neutral-700">Reporting Period: </span>
              <span className="font-bold">{report.period.from} – {report.period.to}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Prepared By: </span>
              <span>{report.meta.preparedBy}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-neutral-700">Generated: </span>
              <span>{new Date(report.meta.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">
            ***CONFIDENTIAL FOR MANAGEMENT USE ONLY***
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="mb-8">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            1. Executive Summary
          </h2>
          <p className="mb-4 leading-normal">
            {report.aiNarrative.executiveSummaryText}
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Operational KPIs Table */}
            <div>
              <h3 className="font-bold text-[11px] mb-1.5">Business Performance — {report.period.label}</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[11px]">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">KPI</th>
                    <th className="p-1 text-right font-bold">{report.period.label}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr><td className="p-1">Total Properties</td><td className="p-1 text-right font-mono">{report.executiveKpis.totalProperties}</td></tr>
                  <tr><td className="p-1">Active Properties</td><td className="p-1 text-right font-mono">{report.executiveKpis.activeProperties}</td></tr>
                  <tr><td className="p-1">New Properties Added</td><td className="p-1 text-right font-mono">{report.executiveKpis.newPropertiesAdded}</td></tr>
                  <tr><td className="p-1">Properties Sold</td><td className="p-1 text-right font-mono">{report.executiveKpis.propertiesSold}</td></tr>
                  <tr><td className="p-1">Properties Rented</td><td className="p-1 text-right font-mono">{report.executiveKpis.propertiesRented}</td></tr>
                  <tr><td className="p-1">New Inquiries</td><td className="p-1 text-right font-mono">{report.executiveKpis.newInquiries}</td></tr>
                  <tr><td className="p-1">Matched Inquiries</td><td className="p-1 text-right font-mono">{report.executiveKpis.matchedInquiries}</td></tr>
                  <tr><td className="p-1">Unmatched Inquiries</td><td className="p-1 text-right font-mono">{report.executiveKpis.unmatchedInquiries}</td></tr>
                  <tr><td className="p-1">Viewings Completed</td><td className="p-1 text-right font-mono">{report.executiveKpis.viewingsCompleted}</td></tr>
                  <tr><td className="p-1">Active Negotiations</td><td className="p-1 text-right font-mono">{report.executiveKpis.activeNegotiations}</td></tr>
                  <tr><td className="p-1">Completed Transactions</td><td className="p-1 text-right font-mono">{report.executiveKpis.completedTransactions}</td></tr>
                  <tr><td className="p-1">Failed/Lost Deals</td><td className="p-1 text-right font-mono">{report.executiveKpis.failedDeals}</td></tr>
                  <tr><td className="p-1">Follow-ups Due</td><td className="p-1 text-right font-mono">{report.executiveKpis.followUpsDue}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Financial Performance Table */}
            <div>
              <h3 className="font-bold text-[11px] mb-1.5">Financial Performance</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[11px]">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">Financial KPI</th>
                    <th className="p-1 text-right font-bold">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono">
                  <tr><td className="p-1 font-sans">Total Transaction Value</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.totalTransactionValue, currency)}</td></tr>
                  <tr><td className="p-1 font-sans">Company Commission</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.companyCommission, currency)}</td></tr>
                  <tr><td className="p-1 font-sans">Agent Commissions</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.agentCommissions, currency)}</td></tr>
                  <tr className="bg-neutral-50 font-bold"><td className="p-1 font-sans">Net Company Commission</td><td className="p-1 text-right">{formatCurrency(report.financialKpis.netCompanyCommission, currency)}</td></tr>
                  <tr><td className="p-1 font-sans text-red-700">Outstanding Rental Payments</td><td className="p-1 text-right text-red-700">{formatCurrency(report.financialKpis.outstandingRentalPayments, currency)}</td></tr>
                </tbody>
              </table>

              <div className="mt-4 p-2.5 bg-neutral-50 border border-neutral-200">
                <div className="font-bold text-[10px] uppercase text-neutral-600 mb-1">Management Attention Required:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {report.managementAttentionRequired.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Property Portfolio & Performance */}
        <div className="mb-8 print:break-before-page">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            3. Property Portfolio & Performance
          </h2>
          
          <table className="w-full border-collapse border border-neutral-300 text-[11px] mb-4">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300">
                <th className="p-1 text-left font-bold">Property Status</th>
                <th className="p-1 text-right font-bold">Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr><td className="p-1">For Sale</td><td className="p-1 text-right font-mono">{report.portfolioSummary.forSale}</td></tr>
              <tr><td className="p-1">For Rent</td><td className="p-1 text-right font-mono">{report.portfolioSummary.forRent}</td></tr>
              <tr><td className="p-1">Under Negotiation</td><td className="p-1 text-right font-mono">{report.portfolioSummary.underNegotiation}</td></tr>
              <tr><td className="p-1">Sold</td><td className="p-1 text-right font-mono">{report.portfolioSummary.sold}</td></tr>
              <tr><td className="p-1">Rented</td><td className="p-1 text-right font-mono">{report.portfolioSummary.rented}</td></tr>
              <tr className="font-bold bg-neutral-50"><td className="p-1">Total Properties</td><td className="p-1 text-right font-mono">{report.portfolioSummary.total}</td></tr>
            </tbody>
          </table>

          {report.newPropertiesAdded.length > 0 && (
            <>
              <h3 className="font-bold text-[11px] mb-1.5">New Properties Added During Period</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[10px] mb-4">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">Property</th>
                    <th className="p-1 text-left font-bold">Location</th>
                    <th className="p-1 text-left font-bold">Type</th>
                    <th className="p-1 text-right font-bold">Price ({currency})</th>
                    <th className="p-1 text-center font-bold">Type</th>
                    <th className="p-1 text-left font-bold">Agent Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.newPropertiesAdded.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td className="p-1 font-semibold">{p.title}</td>
                      <td className="p-1">{p.location}</td>
                      <td className="p-1">{p.type}</td>
                      <td className="p-1 text-right font-mono">{formatCurrency(p.price, currency)}</td>
                      <td className="p-1 text-center">{p.listingType}</td>
                      <td className="p-1">{p.agentAssigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Section 7 & 8: Demand Analysis & Matching */}
        <div className="mb-8">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            7. Client Demand Analysis & Matching Performance
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-bold text-[11px] mb-1">Most Requested Property Types</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[11px]">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">Type</th>
                    <th className="p-1 text-right font-bold">Inquiries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.demandByPropertyType.slice(0, 5).map((d) => (
                    <tr key={d.name}><td className="p-1">{d.name}</td><td className="p-1 text-right font-mono">{d.inquiries}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-[11px] mb-1">Most Requested Locations</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[11px]">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">Location</th>
                    <th className="p-1 text-right font-bold">Inquiries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.demandByLocation.slice(0, 5).map((l) => (
                    <tr key={l.name}><td className="p-1">{l.name}</td><td className="p-1 text-right font-mono">{l.inquiries}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-2 bg-neutral-50 border border-neutral-200 text-[11px] mb-4">
            <strong>Matching Efficiency: </strong>
            Total Inquiries: {report.matching.totalInquiries} | Fully Matched: {report.matching.fullyMatched} | Partially Matched: {report.matching.partiallyMatched} | Unmatched: {report.matching.unmatched} | <strong>Match Rate: {report.matching.matchRatePct}%</strong>
          </div>
        </div>

        {/* Section 11 & 12: Sales Pipeline & Completed Transactions */}
        <div className="mb-8 print:break-before-page">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            11. Sales Pipeline & Completed Deals
          </h2>

          <h3 className="font-bold text-[11px] mb-1.5">Deal Funnel Snapshot</h3>
          <table className="w-full border-collapse border border-neutral-300 text-[11px] mb-4">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300">
                <th className="p-1 text-left font-bold">Stage</th>
                <th className="p-1 text-center font-bold">Opportunities</th>
                <th className="p-1 text-right font-bold">Potential Value ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {report.pipelineFunnel.stages.map((s) => (
                <tr key={s.stage}>
                  <td className="p-1 font-sans">{s.label}</td>
                  <td className="p-1 text-center">{s.opportunities}</td>
                  <td className="p-1 text-right">{formatCurrency(s.potentialValue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.completedTransactions.length > 0 && (
            <>
              <h3 className="font-bold text-[11px] mb-1.5">Completed Transactions Detail</h3>
              <table className="w-full border-collapse border border-neutral-300 text-[10px] mb-4">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="p-1 text-left font-bold">Client / Suburb</th>
                    <th className="p-1 text-left font-bold">Property</th>
                    <th className="p-1 text-left font-bold">Agent</th>
                    <th className="p-1 text-center font-bold">Type</th>
                    <th className="p-1 text-right font-bold">Value ({currency})</th>
                    <th className="p-1 text-right font-bold">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.completedTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="p-1 font-semibold">{t.client}</td>
                      <td className="p-1">{t.property}</td>
                      <td className="p-1">{t.agent}</td>
                      <td className="p-1 text-center">{t.transactionType}</td>
                      <td className="p-1 text-right font-mono">{formatCurrency(t.value, currency)}</td>
                      <td className="p-1 text-right font-mono font-bold">{formatCurrency(t.commission, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Section 14: Agent Performance Leaderboard */}
        <div className="mb-8">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            14. Agent Performance & Activity
          </h2>

          <table className="w-full border-collapse border border-neutral-300 text-[10px] mb-4">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300">
                <th className="p-1 text-left font-bold">Agent</th>
                <th className="p-1 text-center font-bold">Inquiries</th>
                <th className="p-1 text-center font-bold">Matches</th>
                <th className="p-1 text-center font-bold">Viewings</th>
                <th className="p-1 text-center font-bold">Negotiations</th>
                <th className="p-1 text-center font-bold">Closed</th>
                <th className="p-1 text-center font-bold">Lost</th>
                <th className="p-1 text-center font-bold">Conv. %</th>
                <th className="p-1 text-right font-bold">Commission ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {report.agentPerformance.map((ag) => (
                <tr key={ag.agentId}>
                  <td className="p-1 font-sans font-semibold text-left">{ag.name}</td>
                  <td className="p-1 text-center">{ag.inquiries}</td>
                  <td className="p-1 text-center">{ag.matches}</td>
                  <td className="p-1 text-center">{ag.viewings}</td>
                  <td className="p-1 text-center">{ag.negotiations}</td>
                  <td className="p-1 text-center font-bold text-black">{ag.completed}</td>
                  <td className="p-1 text-center text-neutral-500">{ag.lost}</td>
                  <td className="p-1 text-center font-sans">{ag.conversionRatePct}%</td>
                  <td className="p-1 text-right font-bold">{formatCurrency(ag.grossCommissionGenerated, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 23: Month-on-Month Trends */}
        <div className="mb-8">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            23. Month-on-Month Trend Analysis
          </h2>

          <table className="w-full border-collapse border border-neutral-300 text-[11px] mb-4">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300">
                <th className="p-1 text-left font-bold">KPI</th>
                <th className="p-1 text-right font-bold">Prior Period</th>
                <th className="p-1 text-right font-bold">Current Period</th>
                <th className="p-1 text-right font-bold">Change %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {report.momComparison.map((m) => (
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

        {/* Section 25 & 27: Management Action Plan & Conclusion */}
        <div className="print:break-before-page">
          <h2 className="text-sm font-heading font-bold uppercase border-b border-neutral-300 pb-1 mb-2">
            25. Management Action Plan & Recommendations
          </h2>

          <div className="space-y-3 mb-6">
            <div>
              <div className="font-bold text-[11px] uppercase text-neutral-800 mb-1">Priority 1 — Immediate (24–48h)</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {report.aiNarrative.actionPlan.immediatePriority1.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-bold text-[11px] uppercase text-neutral-800 mb-1">Priority 2 — This Week</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {report.aiNarrative.actionPlan.thisWeekPriority2.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-bold text-[11px] uppercase text-neutral-800 mb-1">Priority 3 — Next Month</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {report.aiNarrative.actionPlan.nextMonthPriority3.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-300">
            <h3 className="font-bold text-[11px] uppercase mb-1">27. Management Conclusion</h3>
            <p className="leading-relaxed">
              {report.aiNarrative.conclusionText}
            </p>
          </div>

          {/* Sign-off footer */}
          <div className="mt-12 pt-6 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-500 font-mono">
            <div>Verified by Contour Real Estate Operations OS</div>
            <div>Authorized Signature: _______________________</div>
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
        <div className="min-h-screen flex items-center justify-center bg-white text-xs font-mono text-neutral-500">
          Preparing executive print document...
        </div>
      }
    >
      <AnalyticsPrintContent />
    </React.Suspense>
  );
}
