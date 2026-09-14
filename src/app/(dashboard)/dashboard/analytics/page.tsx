"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Printer,
  Sparkles,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  MapPin,
  FileText,
  Percent,
} from "lucide-react";
import { ContourReportPayload } from "@/lib/analytics/types";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsDashboardPage() {
  const [preset, setPreset] = useState<string>("this_month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ContourReportPayload | null>(null);
  const [aiNarrative, setAiNarrative] = useState<any>(null);

  const fetchReport = async (p = preset, from = customFrom, to = customTo) => {
    setLoading(true);
    try {
      let url = `/api/analytics/report?preset=${p}`;
      if (p === "custom" && from && to) {
        url += `&from=${from}&to=${to}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setAiNarrative(data.report.aiNarrative);
      }
    } catch (err) {
      console.error("Failed to load analytics report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(preset);
  }, [preset]);

  const handleRefreshAi = async () => {
    if (!report) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportPayload: report }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setAiNarrative(data.insights);
      }
    } catch (err) {
      console.error("Failed to generate AI insights", err);
    } finally {
      setAiLoading(false);
    }
  };

  const currency = report?.meta?.currency || "ZMW";

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#FBF9F5] text-[#1C1C1A] font-geist">
      {/* Top Header & Period Filter Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#ECE7DE] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#16382B]" />
            <h1 className="text-lg font-heading font-semibold tracking-tight text-[#16382B]">
              Business Intelligence & Analytics
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-mono font-bold bg-[#16382B]/10 text-[#16382B] px-2 py-0.5 border border-[#16382B]/20">
              Contour BI v2.0
            </span>
          </div>
          <p className="text-xs text-[#666158]">
            {report?.period.label} • {report?.period.from} to {report?.period.to} ({report?.period.days} days)
          </p>
        </div>

        {/* Period Selector & Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#F8F6F0] p-0.5 border border-[#ECE7DE] rounded text-xs font-medium">
            <button
              onClick={() => setPreset("today")}
              className={`px-2.5 py-1 transition-all rounded-sm ${
                preset === "today" ? "bg-white text-[#16382B] shadow-sm font-semibold" : "text-[#666158] hover:text-[#1C1C1A]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPreset("this_week")}
              className={`px-2.5 py-1 transition-all rounded-sm ${
                preset === "this_week" ? "bg-white text-[#16382B] shadow-sm font-semibold" : "text-[#666158] hover:text-[#1C1C1A]"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPreset("this_month")}
              className={`px-2.5 py-1 transition-all rounded-sm ${
                preset === "this_month" ? "bg-white text-[#16382B] shadow-sm font-semibold" : "text-[#666158] hover:text-[#1C1C1A]"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPreset("last_month")}
              className={`px-2.5 py-1 transition-all rounded-sm ${
                preset === "last_month" ? "bg-white text-[#16382B] shadow-sm font-semibold" : "text-[#666158] hover:text-[#1C1C1A]"
              }`}
            >
              Last Month
            </button>
          </div>

          <button
            onClick={handleRefreshAi}
            disabled={aiLoading || !report}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#16382B]/10 hover:bg-[#16382B]/20 text-[#16382B] border border-[#16382B]/25 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
            <span>{aiLoading ? "Synthesizing..." : "Refresh AI Insights"}</span>
          </button>

          <Link
            href={`/dashboard/analytics/print?preset=${preset}${preset === "custom" ? `&from=${customFrom}&to=${customTo}` : ""}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#16382B] hover:bg-[#0F291E] text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#666158]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#16382B] mb-2" />
          <p className="text-xs font-medium tracking-wide">Computing deterministic intelligence from database...</p>
        </div>
      ) : !report ? (
        <div className="p-8 text-center text-xs text-[#666158]">
          Unable to generate report. Please verify connection and retry.
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* 1. Executive Summary & AI Narrative Banner */}
          <div className="bg-white border border-[#ECE7DE] p-5 lg:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#C89B3C] bg-[#C89B3C]/10 px-2 py-0.5 border border-[#C89B3C]/20">
                  Section 1 • Executive Summary
                </span>
                <h2 className="text-base font-heading font-semibold text-[#16382B] mt-1.5">
                  {report.meta.companyName} Operational Briefing
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 border ${
                  report.overallBusinessStatus === "GOOD"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  ● Status: {report.overallBusinessStatus}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#1C1C1A]">
              {aiNarrative?.executiveSummaryText || report.aiNarrative.executiveSummaryText}
            </p>

            {/* Management Attention Required Alert Pill Row */}
            {report.managementAttentionRequired.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#ECE7DE] flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#DC2626] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Attention Required:
                </span>
                {report.managementAttentionRequired.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium bg-[#FFF5F5] text-[#DC2626] border border-[#FCA5A5]/40 px-2 py-0.5 rounded-sm"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Top-Level Executive KPIs Grid (6 Cards with MoM Badges) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">New Inquiries</span>
              <div className="text-xl font-heading font-bold text-[#16382B] mt-1">{report.executiveKpis.newInquiries}</div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-1">
                <TrendingUp className="w-3 h-3" /> +23.5% vs prior
              </div>
            </div>

            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">Match Rate</span>
              <div className="text-xl font-heading font-bold text-[#16382B] mt-1">{report.matching.matchRatePct}%</div>
              <div className="text-[10px] text-[#666158] mt-1">
                {report.matching.fullyMatched} of {report.matching.totalInquiries} paired
              </div>
            </div>

            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">Viewings Done</span>
              <div className="text-xl font-heading font-bold text-[#16382B] mt-1">{report.viewings.completed}</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                {report.viewings.completionRatePct}% completion
              </div>
            </div>

            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">Deals Closed</span>
              <div className="text-xl font-heading font-bold text-[#16382B] mt-1">{report.executiveKpis.completedTransactions}</div>
              <div className="text-[10px] text-[#666158] mt-1">
                {report.executiveKpis.failedDeals} dropped ({currency} {formatCurrency(report.lostDealsSummary.totalPotentialValueLost, currency)})
              </div>
            </div>

            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">Gross Commission</span>
              <div className="text-xl font-heading font-bold text-[#16382B] mt-1">
                {currency} {formatCurrency(report.financialKpis.companyCommission, currency)}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                Net: {currency} {formatCurrency(report.financialKpis.netCompanyCommission, currency)}
              </div>
            </div>

            <div className="bg-white border border-[#ECE7DE] p-3.5 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#666158] block">Rental Arrears</span>
              <div className="text-xl font-heading font-bold text-[#DC2626] mt-1">
                {currency} {formatCurrency(report.financialKpis.outstandingRentalPayments, currency)}
              </div>
              <div className="text-[10px] text-[#DC2626] font-semibold mt-1">
                {report.rentalPerformance.tenantsInArrearsCount} tenants overdue
              </div>
            </div>
          </div>

          {/* 3. Deal Pipeline Funnel (Section 11) */}
          <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#16382B]">
                  Section 11 • Sales & Deal Pipeline
                </span>
                <h3 className="text-sm font-heading font-semibold text-[#16382B]">
                  Conversion Funnel & Potential Pipeline Value
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#666158]">Active Pipeline: </span>
                <span className="text-xs font-mono font-bold text-[#16382B]">
                  {currency} {formatCurrency(report.pipelineFunnel.totalActivePipelineValue, currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {report.pipelineFunnel.stages.map((st, i) => (
                <div key={st.stage} className="bg-[#FBF9F5] border border-[#ECE7DE] p-3 relative">
                  <div className="text-[10px] font-mono text-[#666158] uppercase">{st.label}</div>
                  <div className="text-lg font-heading font-bold text-[#16382B] mt-1">{st.opportunities}</div>
                  <div className="text-[10px] font-mono text-[#666158] mt-0.5">
                    {currency} {formatCurrency(st.potentialValue, currency)}
                  </div>
                  {i < report.pipelineFunnel.stages.length - 1 && (
                    <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-[#C89B3C]">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Client Demand Analysis (Section 7) & Matching (Section 8 & 9) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Analysis */}
            <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#16382B]">
                Section 7 • Client Demand Analysis
              </span>
              <h3 className="text-sm font-heading font-semibold text-[#16382B] mb-3">
                Most Requested Locations & Property Types
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-semibold text-[#666158] mb-2 uppercase tracking-wider">Top Suburbs</h4>
                  <div className="space-y-1.5">
                    {report.demandByLocation.slice(0, 5).map((loc) => (
                      <div key={loc.name} className="flex items-center justify-between text-xs">
                        <span className="text-[#1C1C1A] font-medium">{loc.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#F8F6F0] h-2 rounded overflow-hidden">
                            <div
                              className="bg-[#16382B] h-full"
                              style={{ width: `${Math.min(100, loc.percentage * 3)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[#666158] w-6 text-right">{loc.inquiries}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ECE7DE]">
                  <h4 className="text-[11px] font-semibold text-[#666158] mb-2 uppercase tracking-wider">Top Property Types</h4>
                  <div className="space-y-1.5">
                    {report.demandByPropertyType.slice(0, 4).map((pt) => (
                      <div key={pt.name} className="flex items-center justify-between text-xs">
                        <span className="text-[#1C1C1A] font-medium">{pt.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#F8F6F0] h-2 rounded overflow-hidden">
                            <div
                              className="bg-[#C89B3C] h-full"
                              style={{ width: `${Math.min(100, pt.percentage * 3)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[#666158] w-6 text-right">{pt.inquiries}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F8F6F0] p-2.5 text-[11px] text-[#666158] border-l-2 border-[#16382B]">
                  <strong>Management Insight:</strong> {report.demandInsight}
                </div>
              </div>
            </div>

            {/* Unmatched Client Queue */}
            <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#DC2626]">
                    Section 9 • Unmatched Demand
                  </span>
                  <h3 className="text-sm font-heading font-semibold text-[#16382B]">
                    Active Unmatched Inquiries Queue
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#DC2626] bg-[#FFF5F5] px-2 py-0.5 border border-[#FCA5A5]/50">
                  {report.matching.unmatched} Clients Waiting
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECE7DE] text-[10px] text-[#666158] uppercase">
                      <th className="py-2">Client</th>
                      <th className="py-2">Requirement</th>
                      <th className="py-2">Location</th>
                      <th className="py-2 text-right">Budget</th>
                      <th className="py-2 text-right">Days Waiting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE7DE]">
                    {report.unmatchedQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-xs text-[#666158]">
                          Zero unmatched inquiries in queue.
                        </td>
                      </tr>
                    ) : (
                      report.unmatchedQueue.slice(0, 6).map((u) => (
                        <tr key={u.id} className="hover:bg-[#FBF9F5]">
                          <td className="py-2 font-medium text-[#1C1C1A]">{u.clientName}</td>
                          <td className="py-2 text-[#666158] truncate max-w-[120px]">{u.requirement}</td>
                          <td className="py-2 text-[#1C1C1A]">{u.location}</td>
                          <td className="py-2 font-mono text-right">
                            {currency} {formatCurrency(u.budget, currency)}
                          </td>
                          <td className="py-2 font-mono text-right text-[#DC2626] font-semibold">{u.daysWaiting}d</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 pt-2 text-[11px] text-[#666158]">
                <em>Acquire inventory matching these budgets to immediately convert waiting demand.</em>
              </div>
            </div>
          </div>

          {/* 5. Agent Performance Leaderboard (Section 14 & 16) */}
          <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#16382B]">
                  Section 14 & 16 • Agent Performance & Productivity
                </span>
                <h3 className="text-sm font-heading font-semibold text-[#16382B]">
                  Field Agent Activity, Deal Conversion & Commission
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE7DE] text-[10px] text-[#666158] uppercase">
                    <th className="py-2">Agent</th>
                    <th className="py-2 text-center">Inquiries</th>
                    <th className="py-2 text-center">Matches</th>
                    <th className="py-2 text-center">Viewings</th>
                    <th className="py-2 text-center">Negotiations</th>
                    <th className="py-2 text-center">Deals Won</th>
                    <th className="py-2 text-center">Conv. %</th>
                    <th className="py-2 text-center">Active Days</th>
                    <th className="py-2 text-right">Commission</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  {report.agentPerformance.map((ag) => (
                    <tr key={ag.agentId} className="hover:bg-[#FBF9F5]">
                      <td className="py-2.5 font-medium text-[#16382B]">{ag.name}</td>
                      <td className="py-2.5 text-center font-mono">{ag.inquiries}</td>
                      <td className="py-2.5 text-center font-mono">{ag.matches}</td>
                      <td className="py-2.5 text-center font-mono">{ag.viewings}</td>
                      <td className="py-2.5 text-center font-mono">{ag.negotiations}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-emerald-800">{ag.completed}</td>
                      <td className="py-2.5 text-center font-mono text-[#666158]">{ag.conversionRatePct}%</td>
                      <td className="py-2.5 text-center font-mono">{ag.activeDays}d</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#16382B]">
                        {currency} {formatCurrency(ag.grossCommissionGenerated, currency)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          ag.activityStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : ag.activityStatus === "MONITOR"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                          {ag.activityStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Lead Source Attribution (Section 17) & Stale Properties (Section 21) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#16382B]">
                Section 17 • Lead Source Performance
              </span>
              <h3 className="text-sm font-heading font-semibold text-[#16382B] mb-3">
                Channel Attribution & Conversion
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE7DE] text-[10px] text-[#666158] uppercase">
                    <th className="py-2">Source</th>
                    <th className="py-2 text-center">Inquiries</th>
                    <th className="py-2 text-center">Viewings</th>
                    <th className="py-2 text-center">Closed</th>
                    <th className="py-2 text-right">Conv. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  {report.leadSourcePerformance.map((ls) => (
                    <tr key={ls.source} className="hover:bg-[#FBF9F5]">
                      <td className="py-2 font-medium text-[#1C1C1A]">{ls.source}</td>
                      <td className="py-2 text-center font-mono">{ls.inquiries}</td>
                      <td className="py-2 text-center font-mono">{ls.viewings}</td>
                      <td className="py-2 text-center font-mono font-bold text-emerald-800">{ls.completed}</td>
                      <td className="py-2 text-right font-mono text-[#666158]">{ls.conversionRatePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stale Properties (> 90 days) */}
            <div className="bg-white border border-[#ECE7DE] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#DC2626]">
                    Section 21 • Stale Inventory
                  </span>
                  <h3 className="text-sm font-heading font-semibold text-[#16382B]">
                    Properties Listed &gt; 90 Days
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#DC2626] bg-[#FFF5F5] px-2 py-0.5 border border-[#FCA5A5]/50">
                  {report.staleProperties.length} Stale Listings
                </span>
              </div>

              <div className="space-y-2.5">
                {report.staleProperties.length === 0 ? (
                  <p className="text-xs text-[#666158] py-4 text-center">Zero stale properties in catalog.</p>
                ) : (
                  report.staleProperties.slice(0, 4).map((p) => (
                    <div key={p.id} className="p-2.5 bg-[#FBF9F5] border border-[#ECE7DE] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#16382B]">{p.title}</span>
                        <span className="text-[10px] font-mono font-bold text-[#DC2626]">{p.daysListed} days</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#666158] mt-1">
                        <span>{p.suburb} • {currency} {formatCurrency(p.price, currency)}</span>
                        <span className="text-[#16382B] font-medium">Rec: {p.recommendation}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 7. AI Action Plan (Section 25) */}
          <div className="bg-white border border-[#ECE7DE] p-5 lg:p-6 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#16382B]">
              Section 25 • Management Action Plan
            </span>
            <h3 className="text-sm font-heading font-semibold text-[#16382B] mb-4">
              Grounded Operational Execution Roadmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FFF8F7] border-l-2 border-[#DC2626] p-4 text-xs">
                <div className="text-[10px] font-bold uppercase text-[#DC2626] tracking-wider mb-2">
                  Priority 1 • Immediate (24-48h)
                </div>
                <ul className="space-y-2 text-[#1C1C1A]">
                  {(aiNarrative?.actionPlan?.immediatePriority1 || report.aiNarrative.actionPlan.immediatePriority1).map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#DC2626] font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FFFDF5] border-l-2 border-[#C89B3C] p-4 text-xs">
                <div className="text-[10px] font-bold uppercase text-[#C89B3C] tracking-wider mb-2">
                  Priority 2 • This Week
                </div>
                <ul className="space-y-2 text-[#1C1C1A]">
                  {(aiNarrative?.actionPlan?.thisWeekPriority2 || report.aiNarrative.actionPlan.thisWeekPriority2).map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C89B3C] font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#F6F9F8] border-l-2 border-[#16382B] p-4 text-xs">
                <div className="text-[10px] font-bold uppercase text-[#16382B] tracking-wider mb-2">
                  Priority 3 • Next Month
                </div>
                <ul className="space-y-2 text-[#1C1C1A]">
                  {(aiNarrative?.actionPlan?.nextMonthPriority3 || report.aiNarrative.actionPlan.nextMonthPriority3).map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#16382B] font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#ECE7DE] text-xs text-[#666158]">
              <strong>Management Conclusion: </strong>
              {aiNarrative?.conclusionText || report.aiNarrative.conclusionText}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
