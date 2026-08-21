"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  MapPin,
  KeyRound,
  CheckCircle2,
  Bell,
  Clock,
  FileCheck,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<any>({
    totalProperties: 0,
    forSaleCount: 0,
    forRentCount: 0,
    activeLeasesCount: 0,
    arrearsCount: 0,
    arrearsAmount: 0,
    earnedCommission: 0,
    expectedCommission: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentLeases, setRecentLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  // Real action queue data from DB
  const [arrearsLeases, setArrearsLeases] = useState<any[]>([]);
  const [draftStatements, setDraftStatements] = useState<any[]>([]);
  const [newInquiries, setNewInquiries] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [expiringSoonLeases, setExpiringSoonLeases] = useState<any[]>([]);
  const [inquiryStatusBreakdown, setInquiryStatusBreakdown] = useState<any[]>([]);
  const [totalInquiries, setTotalInquiries] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, salesRes, leasesRes, actionQueueRes] = await Promise.all([
          fetch("/api/dashboard/metrics"),
          fetch("/api/sales"),
          fetch("/api/leases"),
          fetch("/api/dashboard/action-queue"),
        ]);
        const metricsData = await metricsRes.json();
        const salesData = await salesRes.json();
        const leasesData = await leasesRes.json();
        const aqData = await actionQueueRes.json();

        if (metricsData.success && metricsData.metrics) {
          setMetrics(metricsData.metrics);
        }
        if (salesData.success && salesData.transactions) {
          setRecentSales(salesData.transactions.slice(0, 3));
        }
        if (leasesData.success && leasesData.leases) {
          setRecentLeases(leasesData.leases.slice(0, 3));
        }
        if (aqData.success) {
          setArrearsLeases(aqData.arrearsLeases || []);
          setDraftStatements(aqData.draftStatements || []);
          setNewInquiries(aqData.newInquiries || []);
          setPendingTransactions(aqData.pendingTransactions || []);
          setExpiringSoonLeases(aqData.expiringSoonLeases || []);
          setInquiryStatusBreakdown(aqData.inquiryStatusBreakdown || []);
          setTotalInquiries(aqData.totalInquiries || 0);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCompleteAction = (id: string, actionMsg: string) => {
    setCompletedActions((prev) => [...prev, id]);
    alert(`[ACTION EXECUTED] ${actionMsg}`);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Build real Daily Action Queue from DB results
  // ────────────────────────────────────────────────────────────────────────────
  const dailyActionQueue: Array<{
    id: string;
    icon: any;
    color: string;
    title: string;
    detail: string;
    actionLabel: string;
    actionMsg: string;
  }> = [];

  // Arrears leases
  arrearsLeases.forEach((lease) => {
    const propertyTitle = lease.property?.title || "Property";
    const suburb = lease.property?.suburb || "";
    dailyActionQueue.push({
      id: `arrears_${lease.id}`,
      icon: AlertTriangle,
      color: "text-contour-red bg-red-50",
      title: `Rent Overdue — ${lease.tenantName}`,
      detail: `${propertyTitle}${suburb ? ` (${suburb})` : ""} • ${formatCurrency(Number(lease.monthlyRent), lease.currency)} pending`,
      actionLabel: "Send WhatsApp Nudge",
      actionMsg: `Tier-1 WhatsApp rent arrears reminder dispatched to ${lease.tenantName} (${lease.tenantPhone}) with 4-day cooldown key.`,
    });
  });

  // New inquiries needing follow-up
  newInquiries.forEach((inq) => {
    const budgetRange = inq.budgetMax
      ? `Budget: ${formatCurrency(Number(inq.budgetMax), inq.currency)}`
      : "Budget not specified";
    dailyActionQueue.push({
      id: `inq_${inq.id}`,
      icon: Clock,
      color: "text-contour-amber bg-amber-50",
      title: `Follow-up Required — ${inq.clientName}`,
      detail: `${inq.lookingFor === "FOR_SALE" ? "Looking to buy" : "Looking to rent"} • ${budgetRange} • Submitted ${new Date(inq.createdAt).toLocaleDateString("en-ZM")}`,
      actionLabel: "Call Client",
      actionMsg: `Opening phone dialer for ${inq.clientName} (${inq.clientPhone}).`,
    });
  });

  // Draft landlord statements awaiting authorization
  draftStatements.forEach((stmt) => {
    dailyActionQueue.push({
      id: `stmt_${stmt.id}`,
      icon: ShieldCheck,
      color: "text-contour-emerald bg-emerald-50",
      title: `DocuSign Seam Authorization Needed`,
      detail: `${stmt.statementMonth}/${stmt.statementYear} Landlord Remittance — ${stmt.landlordName} • ${formatCurrency(Number(stmt.netLandlordPayout), stmt.currency)} net`,
      actionLabel: "Authorize Payout",
      actionMsg: `DocuSign Seam signed! Landlord payout authorized for ${stmt.landlordName} — bank wire initiated.`,
    });
  });

  // Pending (EXPECTED) transactions awaiting deed/title
  pendingTransactions.forEach((tx) => {
    const propertyTitle = tx.property?.title || "Property";
    dailyActionQueue.push({
      id: `tx_${tx.id}`,
      icon: FileCheck,
      color: "text-blue-600 bg-blue-50",
      title: `Ministry of Lands Title Pending`,
      detail: `${propertyTitle} • Agent: ${tx.closingAgent?.name || "N/A"} • Commission: ${formatCurrency(Number(tx.agencyCommissionAmount), tx.currency)}`,
      actionLabel: "View Registry",
      actionMsg: `Opening Ministry of Lands folio tracking record for ${propertyTitle}.`,
    });
  });

  // Leases expiring within 60 days
  expiringSoonLeases.forEach((lease) => {
    const propertyTitle = lease.property?.title || "Property";
    const daysLeft = Math.ceil(
      (new Date(lease.leaseEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    dailyActionQueue.push({
      id: `expiring_${lease.id}`,
      icon: Bell,
      color: "text-purple-600 bg-purple-50",
      title: `Lease Expiring in ${daysLeft} Days — ${lease.tenantName}`,
      detail: `${propertyTitle} • ${formatCurrency(Number(lease.monthlyRent), lease.currency)}/mo • Ends ${new Date(lease.leaseEndDate).toLocaleDateString("en-ZM")}`,
      actionLabel: "Initiate Renewal",
      actionMsg: `Renewal conversation initiated for ${lease.tenantName} at ${propertyTitle}.`,
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Build Lead Attribution from real inquiry status breakdown
  // ────────────────────────────────────────────────────────────────────────────
  const STATUS_LABELS: Record<string, { label: string; highlight: string; color: string }> = {
    NEW_INQUIRY:        { label: "New Inquiries",        highlight: "Awaiting Contact",  color: "text-contour-amber" },
    CONTACTED:          { label: "Contacted",            highlight: "In Progress",        color: "text-blue-600" },
    VIEWING_SCHEDULED:  { label: "Viewing Scheduled",    highlight: "Hot Leads",          color: "text-purple-600" },
    NEGOTIATING:        { label: "Negotiating",          highlight: "Near Close",         color: "text-contour-red" },
    CLOSED_WON:         { label: "Closed Won",           highlight: "Commission Earned",  color: "text-contour-emerald" },
    CLOSED_LOST:        { label: "Closed Lost",          highlight: "Churned",            color: "text-ink-600" },
  };

  const pipelineBreakdown = inquiryStatusBreakdown.map((g) => {
    const meta = STATUS_LABELS[g.status] || { label: g.status, highlight: "Other", color: "text-ink-600" };
    const pct = totalInquiries > 0 ? ((g._count.status / totalInquiries) * 100).toFixed(0) + "%" : "0%";
    return {
      status: g.status,
      label: meta.label,
      highlight: meta.highlight,
      color: meta.color,
      count: g._count.status,
      conversionRate: pct,
    };
  }).sort((a, b) => {
    const order = ["NEW_INQUIRY", "CONTACTED", "VIEWING_SCHEDULED", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  const closedWon = inquiryStatusBreakdown.find((g) => g.status === "CLOSED_WON")?._count?.status || 0;
  const overallConversionRate = totalInquiries > 0
    ? ((closedWon / totalInquiries) * 100).toFixed(1) + "%"
    : "0%";

  return (
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Executive Command Plane
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Agency Operations & Intelligence
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Real-time cashflow, daily work queue, deal velocity, and Lusaka market attribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/pipeline"
            className="px-4 py-2.5 rounded-full bg-paper-200 hover:bg-paper-300 text-ink-900 border border-border text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <TrendingUp className="w-3.5 h-3.5 text-contour-red" />
            <span>Deal Pipeline</span>
          </Link>
          <Link
            href="/dashboard/map"
            className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Property Map</span>
          </Link>
        </div>
      </div>

      {/* 1. The Daily Work Queue Widget */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-contour-red/10 text-contour-red flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900">
                Daily Action Queue ({loading ? "…" : Math.max(0, dailyActionQueue.length - completedActions.length)} Actions Requiring Attention)
              </h3>
              <p className="text-[11px] text-ink-600">
                Prioritized operational tasks compiled automatically from leases, client inquiries, and legal transfers.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-paper-200 text-ink-800 uppercase tracking-wider">
            Today's Dispatch
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-ink-600 text-xs font-medium animate-pulse">
            Loading action queue from database…
          </div>
        ) : dailyActionQueue.length === 0 ? (
          <div className="text-center py-8 text-contour-emerald text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            All clear — no pending actions today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dailyActionQueue.map((item) => {
              const isDone = completedActions.includes(item.id);
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isDone
                      ? "bg-paper-100/40 border-border opacity-50"
                      : "bg-paper-100 border-border hover:border-ink-600/40 shadow-subtle"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-ink-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-ink-600 mt-0.5 leading-snug">{item.detail}</p>
                    </div>
                  </div>

                  {!isDone ? (
                    <button
                      onClick={() => handleCompleteAction(item.id, item.actionMsg)}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-paper-200 border border-border text-ink-900 font-semibold text-[11px] shrink-0 transition-colors shadow-subtle"
                    >
                      {item.actionLabel}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-contour-emerald flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Core Financial & Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between text-xs text-ink-600 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Actual Agency Commission</span>
            <DollarSign className="w-4 h-4 text-contour-red" />
          </div>
          <div className="font-mono text-xl font-bold text-contour-red">
            {formatCurrency(metrics.earnedCommission || 0, "ZMW")}
          </div>
          <div className="text-[11px] text-ink-600 mt-1">
            <span>+{formatCurrency(metrics.expectedCommission || 0, "ZMW")} expected pipeline</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between text-xs text-ink-600 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Properties Catalog</span>
            <Building2 className="w-4 h-4 text-ink-900" />
          </div>
          <div className="font-mono text-xl font-bold text-ink-900">
            {metrics.totalProperties || 0} Listings
          </div>
          <div className="text-[11px] text-ink-600 mt-1">
            <span>{metrics.forSaleCount || 0} For Sale • {metrics.forRentCount || 0} For Rent</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between text-xs text-ink-600 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Rental Occupancy</span>
            <KeyRound className="w-4 h-4 text-contour-emerald" />
          </div>
          <div className="font-mono text-xl font-bold text-contour-emerald">
            {metrics.forRentCount > 0 ? ((metrics.activeLeasesCount / metrics.forRentCount) * 100).toFixed(1) + "%" : "0.0%"}
          </div>
          <div className="text-[11px] text-ink-600 mt-1">
            <span>{metrics.activeLeasesCount || 0} Occupied • {Math.max(0, (metrics.forRentCount || 0) - (metrics.activeLeasesCount || 0))} Vacant</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-contour-red/30 shadow-card bg-red-50/20">
          <div className="flex items-center justify-between text-xs text-ink-600 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-contour-red">Active Arrears</span>
            <AlertTriangle className="w-4 h-4 text-contour-red" />
          </div>
          <div className="font-mono text-xl font-bold text-contour-red">
            {formatCurrency(metrics.arrearsAmount || 0, "ZMW")}
          </div>
          <div className="text-[11px] text-contour-red mt-1">
            <span>{metrics.arrearsCount || 0} Tenant{metrics.arrearsCount === 1 ? "" : "s"} Overdue</span>
          </div>
        </div>
      </div>

      {/* 3. CRM Pipeline & Inquiry Status Attribution */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-contour-red" />
              <h3 className="font-bold text-sm text-ink-900">CRM Pipeline & Lead Conversion Funnel</h3>
            </div>
            <p className="text-xs text-ink-600 mt-0.5">
              Where are your leads in the pipeline? Real-time breakdown from your CRM database.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs font-semibold text-contour-emerald bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto">
              {loading ? "…" : `${totalInquiries} Total Inquiries`}
            </div>
            <div className="text-xs font-semibold text-contour-amber bg-amber-50 px-3 py-1 rounded-full self-start sm:self-auto">
              {loading ? "…" : `${overallConversionRate} Close Rate`}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-ink-600 text-xs font-medium animate-pulse">
            Loading pipeline data…
          </div>
        ) : pipelineBreakdown.length === 0 ? (
          <div className="text-center py-8 text-ink-600 text-xs font-medium">
            No CRM inquiries recorded yet. Add clients via the{" "}
            <Link href="/dashboard/clients" className="text-contour-red underline">
              Clients module
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineBreakdown.map((item) => (
              <div key={item.status} className="p-4 rounded-xl bg-paper-100 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-paper-200 text-ink-800 truncate max-w-[80px]">
                    {item.highlight}
                  </span>
                  <span className={`font-mono font-bold text-xs ${item.color}`}>{item.conversionRate}</span>
                </div>
                <div className="font-bold text-xs text-ink-900 leading-tight">{item.label}</div>
                <div className={`font-mono text-lg font-bold ${item.color}`}>
                  {item.count} <span className="text-[10px] text-ink-600 font-sans font-normal">leads</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalInquiries > 0 && (
          <div className="p-4 rounded-xl bg-paper-200 border border-paper-300 text-xs text-ink-800 space-y-1">
            <strong className="text-ink-900 font-bold">💡 Pipeline Intelligence:</strong>
            <p className="text-ink-600 leading-relaxed">
              You have <strong>{totalInquiries} total leads</strong> in the pipeline with a <strong>{overallConversionRate} close rate</strong>.
              {(() => {
                const newCount = inquiryStatusBreakdown.find(g => g.status === "NEW_INQUIRY")?._count?.status || 0;
                return newCount > 0
                  ? ` ${newCount} new inquir${newCount === 1 ? "y" : "ies"} require${newCount === 1 ? "s" : ""} immediate follow-up to prevent lead decay.`
                  : " Great — all leads have been contacted.";
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Two Column Grid: Recent Sales & Active Leases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Sales */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink-900">Recent Property Sales</h3>
            <Link href="/dashboard/sales" className="text-xs font-semibold text-contour-red hover:underline">
              View All Sales
            </Link>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-ink-600 text-xs font-medium">
                No recent closed sales transactions found.
              </div>
            ) : (
              recentSales.map((tx) => {
                const title = tx.property?.title || "Untitled Property";
                const agentName = tx.closingAgent?.name || "N/A";
                const displayDate = tx.closedAt 
                  ? new Date(tx.closedAt).toISOString().split("T")[0] 
                  : new Date(tx.createdAt).toISOString().split("T")[0];

                return (
                  <div key={tx.id} className="p-3.5 rounded-xl bg-paper-100 border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-ink-900">{title}</div>
                      <div className="text-[11px] text-ink-600 mt-0.5">
                        Closed by {agentName} • {displayDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-contour-red">
                        {formatCurrency(Number(tx.agencyCommissionAmount || 0), tx.currency)}
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rental Arrears & Watcher */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink-900">Rental Yield & Arrears Tracker</h3>
            <Link href="/dashboard/leases" className="text-xs font-semibold text-contour-red hover:underline">
              Manage Leases
            </Link>
          </div>

          <div className="space-y-3">
            {recentLeases.length === 0 ? (
              <div className="text-center py-8 text-ink-600 text-xs font-medium">
                No active leases logged.
              </div>
            ) : (
              recentLeases.map((lease) => {
                const title = lease.property?.title || lease.propertyTitle || "Untitled Property";
                const isArrears = lease.status === "IN_ARREARS";

                return (
                  <div
                    key={lease.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      isArrears
                        ? "bg-red-50/40 border-red-200"
                        : "bg-paper-100 border-border"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-ink-900">{title}</div>
                      <div className="text-[11px] text-ink-600 mt-0.5">
                        Tenant: {lease.tenantName} ({lease.tenantPhone})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-ink-900">
                        {formatCurrency(Number(lease.monthlyRent || 0), lease.currency)} / mo
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isArrears
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isArrears ? "In Arrears" : "Paid on Time"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
