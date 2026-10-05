"use client";

import { usePageUrlState } from "@/hooks/use-page-url-state";
import { consumeCreationLink } from "@/lib/page-url-state";
import { StartSaleDialog } from "@/components/closing/start-sale-dialog";
import { ClosingWorkflowPanel } from "@/components/closing/closing-workflow-panel";
import { StatementGenerateButton } from "@/components/statements/statement-generate-button";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Search,
  Plus,
  Landmark,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";


import { SelectedRowDetailsDialog } from "@/components/ui/selected-row-details-dialog";
import CommissionsPage from "@/app/(dashboard)/dashboard/commissions/page";
import { emitWorkspaceMutation, mutationTouchesScope, WORKSPACE_MUTATION_EVENT, type WorkspaceMutationEventDetail } from "@/lib/workspace-events";
import { PageTabs } from "@/components/ui/page-tabs";
import { SectionPendingState } from "@/components/ui/section-pending-state";

function PropertySalesContent() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = usePageUrlState<string>("search", "");
  const [filterStatus, setFilterStatus] = usePageUrlState<string>("status", "ALL", ["ALL", "PENDING_STATE_CONSENT", "DEEDS_LODGED", "TRANSFER_COMPLETE"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = usePageUrlState<string>("saleId", "");
  const selectedSale = sales.find((sale) => sale.id === selectedSaleId) || null;
  const setSelectedSale = (sale: { id: string } | null) => setSelectedSaleId(sale?.id || "");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [closingInquiryId, setClosingInquiryId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get("tab") === "commissions" ? "commissions" : "sales";
  useEffect(() => {
    if (activeTab === "sales" && consumeCreationLink()) {
      setIsModalOpen(true);
    }
  }, [searchParams, activeTab]);

  const [formError, setFormError] = useState("");
  const [transferPending, setTransferPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setFormError("");
      try {
        const salesRes = await fetch("/api/sales", { signal: controller.signal });
        const salesData = await salesRes.json();
        if (!salesRes.ok || !salesData.success) throw new Error(salesData.error || "Unable to load sales.");

        if (salesData.success && salesData.transactions) {
          const normalized = salesData.transactions.filter((t: { transactionType: string }) => t.transactionType === "PROPERTY_SALE").map((t: any) => {
            const buyerName = t.inquiry?.clientName || "Buyer details pending";
            const buyerContact = t.inquiry?.clientPhone || "-";
            const buyerNrcPassport = "Not captured";
            const ministryRef = t.transferReference || "Not recorded";

            const transferStatus = t.transferStatus || "SALE_AGREED";

            return {
              id: t.id,
              transactionType: t.transactionType,
              propertyTitle: t.property?.title || "Untitled Property",
              suburb: t.property?.suburb || t.property?.city || "Location not recorded",
              buyerName,
              buyerContact,
              buyerNrcPassport,
              salePrice: Number(t.grossValue || 0),
              currency: t.currency || "ZMW",
              agencyCommissionEarned: Number(t.agencyCommissionAmount || 0),
              agencyCommissionPct: Number(t.agencyCommissionPct || 0),
              agentSplitPaid: Number(t.agentSplitAmount || 0),
              closingAgent: t.closingAgent?.name || "Not recorded",
              transferStatus,
              ministryReference: ministryRef,
              closedAt: t.closedAt
                ? new Date(t.closedAt).toISOString().split("T")[0]
                : new Date(t.createdAt).toISOString().split("T")[0],
            };
          });
          setSales(normalized);
        }

      } catch (err) {
        if (!controller.signal.aborted) setFormError(err instanceof Error ? err.message : "Unable to load sales.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [refreshNonce]);
  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceMutationEventDetail>).detail;
      if (detail && mutationTouchesScope(detail, "sales")) setRefreshNonce((value) => value + 1);
    };
    window.addEventListener(WORKSPACE_MUTATION_EVENT, handle);
    return () => window.removeEventListener(WORKSPACE_MUTATION_EVENT, handle);
  }, []);

  const stats = React.useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const commissionsByCurrency: Record<string, number> = {};
    let completeTransfers = 0;
    let pendingTransfers = 0;

    sales.forEach((s) => {
      const cur = s.currency || "ZMW";
      totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + (s.salePrice || 0);
      commissionsByCurrency[cur] = (commissionsByCurrency[cur] || 0) + (s.agencyCommissionEarned || 0);

      if (s.transferStatus === "TRANSFER_COMPLETE") {
        completeTransfers++;
      } else {
        pendingTransfers++;
      }
    });

    const totalValStr =
      Object.entries(totalsByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    const commValStr =
      Object.entries(commissionsByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    return {
      totalValStr,
      commValStr,
      completeTransfers,
      pendingTransfers,
    };
  }, [sales]);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      search.trim() === "" ||
      s.propertyTitle?.toLowerCase().includes(search.toLowerCase()) ||
      s.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.suburb?.toLowerCase().includes(search.toLowerCase()) ||
      s.ministryReference?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || s.transferStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return activeTab === "commissions" ? <CommissionsPage /> : (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Conveyance Registry
            </span>
            <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
              Ministry of Lands Folio Sync
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Property Sales & Deeds Registry
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Complete registry of closed acquisitions, buyer NRC/passport identification, Lands transfer consent tracking, and recorded commissions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 sm:px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Sale</span>
        </button>
      </div>

      {formError && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}<button type="button" className="ml-3 underline" onClick={() => setRefreshNonce(v => v + 1)}>Reload sales</button></p>}
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Total Closed Sales Value
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-editorial-black mt-1 tracking-tight truncate">
            {loading ? "…" : stats.totalValStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Across {sales.length} closed transactions
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3.5 sm:p-5">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-contour-red uppercase tracking-wider">
            Agency Sales Commission
          </span>
          <div className="font-geist text-xl sm:text-2xl font-bold text-contour-red mt-1 tracking-tight truncate">
            {loading ? "…" : stats.commValStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Retained brokerage fee revenue
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-5">
          <span className="text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Ministry Title Transfers
          </span>
          <div className="font-geist text-2xl font-bold text-emerald-800 mt-1 tracking-tight">
            {loading ? "…" : `${stats.completeTransfers} Complete • ${stats.pendingTransfers} In Progress`}
          </div>
          <span className="text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Verified Lands Registry folio entries
          </span>
        </MotionCard>
      </div>

      <PageTabs
        tabs={[
          { id: "sales", label: "Sales Register", count: sales.length },
          { id: "commissions", label: "Commissions" },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => router.push(tabId === "commissions" ? "/dashboard/sales?tab=commissions" : "/dashboard/sales")}
        className="mt-1"
      />

      {/* Search & Status Filter */}
      <div className="bg-white p-3 border border-editorial-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 border border-editorial-border flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-editorial-muted shrink-0" />
          <input
            type="text"
            placeholder="Search by property, buyer name, or suburb..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-editorial-black placeholder:text-editorial-muted focus:outline-none font-geist"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Transfer Statuses</option>
          <option value="PENDING_STATE_CONSENT">Pending State Consent</option>
          <option value="DEEDS_LODGED">Deeds Lodged at Registry</option>
          <option value="TRANSFER_COMPLETE">Transfer Complete</option>
        </select>
      </div>

      {/* Sales Table Card */}
      <div className="bg-white border border-editorial-border">
        <div className="p-4 border-b border-editorial-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
            Property Sales Registry ({filteredSales.length})
          </h3>
          <span className="text-xs text-editorial-muted font-geist flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-contour-red" />
            <span>Ministry Lands Folio Tracking</span>
          </span>
        </div>

        {loading ? (
          <SectionPendingState label="Loading sales transactions…" />
        ) : filteredSales.length === 0 ? (
          <div className="py-16 text-center text-xs text-editorial-muted font-geist">
            No property acquisitions match your current filter.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-editorial-border">
              {filteredSales.map((sale) => {
                const isComplete = sale.transferStatus === "TRANSFER_COMPLETE";

                return (
                  <div key={sale.id} className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted">
                          📍 {sale.suburb}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-editorial-black truncate">
                          {sale.propertyTitle}
                        </h4>
                      </div>
                      <span
                        className={`inline-block text-[9px] font-geist uppercase tracking-wider px-2 py-0.5 border shrink-0 ${
                          isComplete
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                            : "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                        }`}
                      >
                        {sale.transferStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Buyer:</span>
                        <strong className="text-editorial-black">{sale.buyerName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Ref:</span>
                        <span className="font-mono text-[10px] text-editorial-black">{sale.ministryReference}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Price:</span>
                        <strong className="text-editorial-black">
                          {formatCurrency(sale.salePrice, sale.currency)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Agent:</span>
                        <span className="text-editorial-black">{sale.closingAgent}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-editorial-border text-xs font-geist">
                      <div>
                        <span className="text-[9px] text-editorial-muted uppercase block">Sale Date</span>
                        <span className="text-editorial-muted text-[11px]">{sale.closedAt}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-contour-red uppercase block">{sale.agencyCommissionPct}% Commission</span>
                        <strong className="text-contour-red font-bold">
                          {formatCurrency(sale.agencyCommissionEarned, sale.currency)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-geist">
                <thead className="bg-neutral-50 text-editorial-muted uppercase tracking-wider text-[10px] font-heading font-semibold border-b border-editorial-border">
                  <tr>
                    <th className="py-3 px-4">Sold Property</th>
                    <th className="py-3 px-4">Buyer Information</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">Agency Fee</th>
                    <th className="py-3 px-4">Closing Agent</th>
                    <th className="py-3 px-4">Deeds Transfer Status</th>
                    <th className="py-3 px-4 text-right">Sale Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border">
                  {filteredSales.map((sale) => {
                    const isComplete = sale.transferStatus === "TRANSFER_COMPLETE";
                    const isLodged = sale.transferStatus === "DEEDS_LODGED";

                    return (
                      <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="cursor-pointer hover:bg-[#fff5f3]/40 transition-colors" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedSale(sale); }}>
                        <td className="py-3.5 px-4">
                          <div className="font-heading font-bold text-editorial-black uppercase max-w-xs">
                            {sale.propertyTitle}
                          </div>
                          <div className="text-[11px] font-geist text-editorial-muted mt-0.5">
                            📍 {sale.suburb} • Ref: {sale.ministryReference}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-editorial-black">{sale.buyerName}</div>
                          <div className="text-[11px] text-editorial-muted">{sale.buyerContact}</div>
                          <div className="text-[10px] font-mono text-editorial-muted">NRC: {sale.buyerNrcPassport}</div>
                        </td>
                        <td className="py-3.5 px-4 font-geist font-bold text-editorial-black text-sm">
                          {formatCurrency(sale.salePrice, sale.currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-geist font-bold text-contour-red">
                            {formatCurrency(sale.agencyCommissionEarned, sale.currency)}
                          </div>
                          <div className="text-[10px] font-geist text-editorial-muted">
                            Agent Split: {formatCurrency(sale.agentSplitPaid, sale.currency)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-editorial-black">
                          {sale.closingAgent}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[9px] font-geist uppercase tracking-wider px-2 py-0.2 border ${
                              isComplete
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                : isLodged
                                ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                                : "border-editorial-border bg-neutral-100 text-editorial-black"
                            }`}
                          >
                            {sale.transferStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[11px] text-editorial-muted">
                          {sale.closedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <SelectedRowDetailsDialog
        open={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        eyebrow="Closed property sale"
        title={selectedSale?.propertyTitle || "Property sale"}
        subtitle={selectedSale ? `${selectedSale.suburb || "-"} · ${selectedSale.closedAt || "No closing date"}` : undefined}
        details={selectedSale ? [
          { label: "Buyer", value: selectedSale.buyerName },
          { label: "Buyer contact", value: selectedSale.buyerContact },
          { label: "NRC / Passport", value: selectedSale.buyerNrcPassport },
          { label: "Purchase price", value: formatCurrency(selectedSale.salePrice, selectedSale.currency) },
          { label: "Agency commission", value: formatCurrency(selectedSale.agencyCommissionEarned, selectedSale.currency) },
          { label: "Agent split", value: formatCurrency(selectedSale.agentSplitPaid, selectedSale.currency) },
          { label: "Closing agent", value: selectedSale.closingAgent },
          { label: "Transfer status", value: selectedSale.transferStatus?.replace(/_/g, " ") },
          { label: "Ministry reference", value: selectedSale.ministryReference },
          { label: "Title deed reference", value: selectedSale.titleDeedReference },
        ] : []}
      >
        {selectedSale && <div className="grid gap-3 border-t border-editorial-border pt-4 sm:grid-cols-2"><StatementGenerateButton input={{ kind: "SALE", transactionId: selectedSale.id }} label="Generate sale statement" /><StatementGenerateButton input={{ kind: "SALE_COMMISSION", transactionId: selectedSale.id }} label="Generate internal commission statement" /></div>}
        {selectedSale && selectedSale.transactionType === "PROPERTY_SALE" && (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-contour-red">Transfer handover</p>
              <p className="mt-1 text-xs text-editorial-muted">A Won sale is commercially agreed. Track conveyancing separately until transfer is complete.</p>
            </div>
            {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
            {transferPending && <SectionPendingState compact label="Updating transfer status…" />}
            <select aria-label="Transfer status" disabled={transferPending} value={selectedSale.transferStatus || "SALE_AGREED"} onChange={async (event) => {
              if (transferPending) return;
              const transferStatus = event.target.value, saleId = selectedSale.id;
              setTransferPending(true); setFormError("");
              try {
                const response = await fetch(`/api/sales/${saleId}/transfer`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: transferStatus }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Unable to update transfer status.");
                setSales(current => current.map(sale => sale.id === saleId ? { ...sale, transferStatus } : sale));
                emitWorkspaceMutation(["sales"]);
              } catch (error) { setFormError(error instanceof Error ? error.message : "Unable to update transfer status."); }
              finally { setTransferPending(false); }
            }} className="w-full border border-editorial-border p-2 text-xs disabled:opacity-50">
              <option value="SALE_AGREED">Sale agreed</option>
              <option value="TRANSFER_IN_PROGRESS">Transfer in progress</option>
              <option value="TRANSFER_COMPLETE">Transfer complete</option>
              <option value="CANCELLED">Transfer cancelled</option>
            </select>
            <p className="text-[11px] text-editorial-muted">Only management can change this status. Completed transfers cannot be moved backwards.</p>
          </div>
        )}
      </SelectedRowDetailsDialog>

      {isModalOpen && <StartSaleDialog onClose={() => setIsModalOpen(false)} onStarted={id => { setIsModalOpen(false); setClosingInquiryId(id); emitWorkspaceMutation(["pipeline", "clients", "dashboard"]); }} /> }
      {closingInquiryId && <ClosingWorkflowPanel inquiryId={closingInquiryId} onClose={() => setClosingInquiryId(null)} onCompleted={() => { setClosingInquiryId(null); setRefreshNonce(v => v + 1); emitWorkspaceMutation(["sales", "properties", "commissions", "pipeline", "dashboard"]); }} /> }
    </div>
  );
}

export default function PropertySalesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading property sales...</div>}>
      <PropertySalesContent />
    </React.Suspense>
  );
}
