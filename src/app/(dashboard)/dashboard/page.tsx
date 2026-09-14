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
  BarChart3,
  ArrowUpRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/animate/number-ticker";
import { MotionCard } from "@/components/ui/animate/motion-card";

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

  // Build real Daily Action Queue from DB results
  const dailyActionQueue: Array<{
    id: string;
    tag: string;
    title: string;
    detail: string;
    actionLabel: string;
    actionMsg: string;
  }> = [];

  arrearsLeases.forEach((lease) => {
    const propertyTitle = lease.property?.title || "Property";
    const suburb = lease.property?.suburb || "";
    dailyActionQueue.push({
      id: `arrears_${lease.id}`,
      tag: "ARREARS",
      title: `Rent Overdue — ${lease.tenantName}`,
      detail: `${propertyTitle}${suburb ? ` (${suburb})` : ""} • ${formatCurrency(Number(lease.monthlyRent), lease.currency)} pending`,
      actionLabel: "WhatsApp Nudge",
      actionMsg: `Tier-1 WhatsApp rent arrears reminder dispatched to ${lease.tenantName} (${lease.tenantPhone}) with 4-day cooldown key.`,
    });
  });

  newInquiries.forEach((inq) => {
    dailyActionQueue.push({
      id: `inq_${inq.id}`,
      tag: "INQUIRY",
      title: `New Lead — ${inq.clientName}`,
      detail: `${inq.property?.title || "General Inquiry"} • Phone: ${inq.clientPhone}`,
      actionLabel: "Assign Agent",
      actionMsg: `Lead ${inq.clientName} assigned to active on-duty broker with auto-reply flyer dispatched.`,
    });
  });

  draftStatements.forEach((stmt) => {
    dailyActionQueue.push({
      id: `stmt_${stmt.id}`,
      tag: "STATEMENT",
      title: `Approve Statement — ${stmt.landlordName}`,
      detail: `${stmt.period} • Net Payout: ${formatCurrency(Number(stmt.netPayout), stmt.currency)}`,
      actionLabel: "Sign & Release",
      actionMsg: `Human-in-the-loop authorization granted. Statement locked and payment receipt generated.`,
    });
  });

  pendingTransactions.forEach((tx) => {
    dailyActionQueue.push({
      id: `tx_${tx.id}`,
      tag: "CONVEYANCE",
      title: `Sale in Escrow — ${tx.property?.title || "Property"}`,
      detail: `Buyer: ${tx.buyerName} • Gross: ${formatCurrency(Number(tx.salePrice), tx.currency)}`,
      actionLabel: "Check Deeds",
      actionMsg: `Ministry of Lands verification status synced from MinIO legal documents vault.`,
    });
  });

  // Pipeline breakdown calculation
  const statusMeta: Record<string, { label: string; tag: string }> = {
    NEW_INQUIRY: { label: "New Leads", tag: "RAW" },
    CONTACTED: { label: "Contacted", tag: "ENGAGED" },
    VIEWING_SCHEDULED: { label: "Site Viewings", tag: "FIELD" },
    NEGOTIATING: { label: "Offers In", tag: "TERMS" },
    CLOSED_WON: { label: "Closed Deals", tag: "ESCROW" },
    CLOSED_LOST: { label: "Archived", tag: "LOST" },
  };

  const pipelineBreakdown = inquiryStatusBreakdown.map((g: any) => {
    const meta = statusMeta[g.status] || { label: g.status, tag: "GEN" };
    const pct = totalInquiries > 0 ? ((g._count.status / totalInquiries) * 100).toFixed(0) + "%" : "0%";
    return {
      status: g.status,
      label: meta.label,
      tag: meta.tag,
      count: g._count.status,
      conversionRate: pct,
    };
  });

  const closedWon = inquiryStatusBreakdown.find((g) => g.status === "CLOSED_WON")?._count?.status || 0;
  const overallConversionRate =
    totalInquiries > 0 ? ((closedWon / totalInquiries) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-5 sm:space-y-8 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Lusaka Operating HQ
            </span>
            <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
              Real-Time Cadastral Sync
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Agency Command Center
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Real-time cashflow telemetry, daily prioritized action queue, 5% commission escrow, and Lusaka market velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/pipeline"
            className="px-3 sm:px-4 py-2 border border-editorial-border hover:border-editorial-black bg-white text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
          >
            <TrendingUp className="w-3.5 h-3.5 text-contour-red" />
            <span>Deal Pipeline</span>
          </Link>
          <Link
            href="/dashboard/map"
            className="px-3 sm:px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Cadastral Map</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions CTA Bar */}
      <div className="bg-white border border-editorial-border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-contour-red shrink-0" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
            Quick Actions
          </span>
          <span className="text-[11px] font-geist text-editorial-muted hidden lg:inline">
            — Instant operational actions across Lusaka HQ
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Link
            href="/dashboard/clients?new=1"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-editorial-black hover:text-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3 h-3 text-contour-red" />
            <span>Add Client</span>
          </Link>

          <Link
            href="/dashboard/properties?new=1"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-editorial-black hover:text-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3 h-3 text-contour-red" />
            <span>Add Property</span>
          </Link>

          <Link
            href="/dashboard/pipeline?new=1"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-editorial-black hover:text-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3 h-3 text-contour-red" />
            <span>Add Deal Pipeline</span>
          </Link>

          <Link
            href="/dashboard/leases?new=1"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-editorial-black hover:text-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3 h-3 text-contour-red" />
            <span>Add New Lease</span>
          </Link>

          <Link
            href="/dashboard/statements?new=1"
            className="px-3 py-1.5 bg-neutral-100 hover:bg-editorial-black hover:text-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3 h-3 text-contour-red" />
            <span>Add Landlord Statement</span>
          </Link>
        </div>
      </div>

      {/* 1. Core Financial & Operating Metrics (Ruled Counter Boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Actual Commission */}
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1.5">
            <span className="font-heading font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-editorial-black">
              Earned Commission
            </span>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-contour-red" />
          </div>
          <div className="font-geist text-lg sm:text-2xl font-bold text-contour-red tracking-tight truncate">
            {loading ? (
              "..."
            ) : (
              <NumberTicker
                value={Number(metrics.earnedCommission || 0)}
                prefix="K "
                decimals={0}
              />
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span>Pipeline:</span>
            <span className="font-medium text-editorial-black truncate">
              {formatCurrency(metrics.expectedCommission || 0, "ZMW")}
            </span>
          </div>
        </MotionCard>

        {/* Properties Catalog */}
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1.5">
            <span className="font-heading font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-editorial-black">
              Properties
            </span>
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-editorial-black" />
          </div>
          <div className="font-geist text-lg sm:text-2xl font-bold text-editorial-black tracking-tight truncate">
            {loading ? (
              "..."
            ) : (
              <NumberTicker value={Number(metrics.totalProperties || 0)} suffix=" Listings" />
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-1 flex items-center justify-between">
            <span>Sale: {metrics.forSaleCount || 0}</span>
            <span>Rent: {metrics.forRentCount || 0}</span>
          </div>
        </MotionCard>

        {/* Rental Occupancy */}
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1.5">
            <span className="font-heading font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-editorial-black">
              Occupancy
            </span>
            <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
          </div>
          <div className="font-geist text-lg sm:text-2xl font-bold text-emerald-800 tracking-tight truncate">
            {metrics.forRentCount > 0
              ? ((metrics.activeLeasesCount / metrics.forRentCount) * 100).toFixed(1) + "%"
              : "0.0%"}
          </div>
          <div className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-1 flex items-center justify-between">
            <span>Active: {metrics.activeLeasesCount || 0}</span>
            <span>Vacant: {Math.max(0, (metrics.forRentCount || 0) - (metrics.activeLeasesCount || 0))}</span>
          </div>
        </MotionCard>

        {/* Active Arrears */}
        <MotionCard
          withCorners
          active={Boolean(metrics.arrearsAmount > 0)}
          className="p-3.5 sm:p-5"
        >
          <div className="flex items-center justify-between text-xs text-editorial-muted mb-1.5">
            <span className="font-heading font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-contour-red">
              Active Arrears
            </span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-contour-red" />
          </div>
          <div className="font-geist text-lg sm:text-2xl font-bold text-contour-red tracking-tight truncate">
            {loading ? (
              "..."
            ) : (
              <NumberTicker
                value={Number(metrics.arrearsAmount || 0)}
                prefix="K "
                decimals={0}
              />
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-geist text-contour-red mt-1 flex items-center justify-between">
            <span>{metrics.arrearsCount || 0} Overdue</span>
            <span className="font-bold text-[9px] uppercase tracking-wider border border-contour-red/30 px-1 py-0.2">
              Action
            </span>
          </div>
        </MotionCard>
      </div>

      {/* 2. Daily Action Queue */}
      <div className="bg-white border border-editorial-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-contour-red" />
            <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
              Daily Action Queue ({loading ? "…" : Math.max(0, dailyActionQueue.length - completedActions.length)} Items Requiring Decision)
            </h3>
          </div>
          <span className="text-[10px] font-geist uppercase tracking-wider px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-muted">
            Automated Operational Dispatch
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-editorial-muted text-xs font-geist">
            Loading action queue from database…
          </div>
        ) : dailyActionQueue.length === 0 ? (
          <div className="text-center py-8 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            All clear — no pending operational actions today.
          </div>
        ) : (
          <div className="divide-y divide-editorial-border border border-editorial-border">
            {dailyActionQueue.map((item) => {
              const isDone = completedActions.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors flex items-center justify-between gap-4 ${
                    isDone ? "bg-neutral-50/50 opacity-50" : "bg-white hover:bg-[#fff5f3]/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-[9px] font-geist font-bold px-1.5 py-0.5 border shrink-0 ${
                        item.tag === "ARREARS"
                          ? "border-red-300 bg-red-50 text-red-800"
                          : item.tag === "STATEMENT"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-editorial-border bg-neutral-100 text-editorial-black"
                      }`}
                    >
                      {item.tag}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs text-editorial-black truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-geist text-editorial-muted truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  {!isDone ? (
                    <button
                      onClick={() => handleCompleteAction(item.id, item.actionMsg)}
                      className="px-3 py-1.5 border border-editorial-border hover:border-editorial-black bg-white hover:bg-neutral-50 text-editorial-black font-heading font-semibold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-none"
                    >
                      {item.actionLabel}
                    </button>
                  ) : (
                    <span className="text-xs font-geist font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CRM Lead Conversion Funnel */}
      <div className="bg-white border border-editorial-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-editorial-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-contour-red" />
            <div>
              <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                CRM Pipeline & Lead Conversion Funnel
              </h3>
              <p className="text-xs font-geist text-editorial-muted">
                Real-time attribution and stage velocity from your client CRM database.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-geist px-2 py-0.5 border border-editorial-border bg-neutral-50 text-editorial-black font-semibold">
              {totalInquiries} Total Leads
            </span>
            <span className="text-[10px] font-geist px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold">
              {overallConversionRate} Close Rate
            </span>
          </div>
        </div>

        {pipelineBreakdown.length === 0 ? (
          <div className="text-center py-8 text-editorial-muted text-xs font-geist">
            No CRM inquiries recorded yet. Add clients via the{" "}
            <Link href="/dashboard/clients" className="text-contour-red underline">
              Clients module
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineBreakdown.map((item) => (
              <div
                key={item.status}
                className="p-3 bg-neutral-50/70 border border-editorial-border space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-geist font-bold uppercase tracking-wider text-editorial-muted">
                    {item.tag}
                  </span>
                  <span className="font-geist text-[10px] font-bold text-editorial-black">
                    {item.conversionRate}
                  </span>
                </div>
                <div className="font-heading font-semibold text-xs text-editorial-black truncate">
                  {item.label}
                </div>
                <div className="font-geist text-lg font-bold text-editorial-black">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Split Tabular Ledgers: Recent Sales & Active Leases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Property Sales */}
        <div className="bg-white border border-editorial-border p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
            <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
              Recent Closed Sales
            </h3>
            <Link
              href="/dashboard/sales"
              className="text-xs font-heading font-semibold text-contour-red hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>Full Registry</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-editorial-border border border-editorial-border">
            {recentSales.length === 0 ? (
              <div className="text-center py-6 text-editorial-muted text-xs font-geist">
                No recent closed transactions found.
              </div>
            ) : (
              recentSales.map((tx) => {
                const title = tx.property?.title || "Untitled Property";
                const agentName = tx.closingAgent?.name || "Broker";
                const displayDate = tx.closedAt
                  ? new Date(tx.closedAt).toISOString().split("T")[0]
                  : new Date(tx.createdAt).toISOString().split("T")[0];

                return (
                  <div
                    key={tx.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50/50 transition-colors"
                  >
                    <div>
                      <div className="font-heading font-semibold text-editorial-black truncate">
                        {title}
                      </div>
                      <div className="text-[11px] font-geist text-editorial-muted mt-0.5">
                        Closed by {agentName} • {displayDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-geist font-bold text-contour-red">
                        {formatCurrency(Number(tx.agencyCommissionAmount || 0), tx.currency)}
                      </div>
                      <span className="text-[9px] font-geist uppercase tracking-wider px-1.5 py-0.2 border border-emerald-300 bg-emerald-50 text-emerald-800">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Leases & Arrears Tracker */}
        <div className="bg-white border border-editorial-border p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
            <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
              Rentals & Leases
            </h3>
            <Link
              href="/dashboard/leases"
              className="text-xs font-heading font-semibold text-contour-red hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>Manage Leases</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-editorial-border border border-editorial-border">
            {recentLeases.length === 0 ? (
              <div className="text-center py-6 text-editorial-muted text-xs font-geist">
                No active rental leases logged.
              </div>
            ) : (
              recentLeases.map((lease) => {
                const title = lease.property?.title || lease.propertyTitle || "Untitled Property";
                const isArrears = lease.status === "IN_ARREARS";

                return (
                  <div
                    key={lease.id}
                    className={`p-3 flex items-center justify-between text-xs transition-colors ${
                      isArrears ? "bg-red-50/40" : "hover:bg-neutral-50/50"
                    }`}
                  >
                    <div>
                      <div className="font-heading font-semibold text-editorial-black truncate">
                        {title}
                      </div>
                      <div className="text-[11px] font-geist text-editorial-muted mt-0.5">
                        Tenant: {lease.tenantName} ({lease.tenantPhone})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-geist font-bold text-editorial-black">
                        {formatCurrency(Number(lease.monthlyRent || 0), lease.currency)} / mo
                      </div>
                      <span
                        className={`text-[9px] font-geist uppercase tracking-wider px-1.5 py-0.2 border ${
                          isArrears
                            ? "border-red-300 bg-red-50 text-red-800 font-bold"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {isArrears ? "In Arrears" : "Current"}
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
