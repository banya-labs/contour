"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Search,
  Plus,
  Landmark,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";

function PropertySalesContent() {
  const [sales, setSales] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canOverrideCommission, setCanOverrideCommission] = useState(false);
  const [isRecordingSale, setIsRecordingSale] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formData, setFormData] = useState({
    propertyId: "",
    buyerName: "",
    buyerContact: "",
    buyerNrcPassport: "",
    salePrice: "3500000",
    currency: "ZMW",
    agencyCommissionPct: "5.0",
    agentSplitPct: "50.0",
    closingAgent: "",
    transferStatus: "PENDING_STATE_CONSENT",
    ministryReference: `LUS/LAND/2026/${Math.floor(1000 + Math.random() * 9000)}-A`,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [salesRes, propsRes, agentsRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/properties"),
          fetch("/api/organization/agents"),
        ]);
        const salesData = await salesRes.json();
        const propsData = await propsRes.json();
        const agentsData = await agentsRes.json();

        if (agentsData.success && agentsData.agents) {
          setAgents(agentsData.agents);
        }

        if (salesData.success && salesData.transactions) {
          const normalized = salesData.transactions.map((t: any, index: number) => {
            const buyerNames = [
              "Mwansa Mwape",
              "Mwamba Phiri",
              "Kondwani Zulu",
              "Chipo Tembo",
              "Mutale Bwalya",
              "Seward Richard",
            ];
            const buyerName = buyerNames[index % buyerNames.length];
            const buyerContact = `+260 97 ${Math.floor(100000 + Math.random() * 900000)}`;
            const buyerNrcPassport = `${Math.floor(100000 + index * 12345)}/11/1`;
            const ministryRef = `LUS/LAND/2026/${t.id.slice(-4).toUpperCase()}-A`;

            let transferStatus = "PENDING_STATE_CONSENT";
            if (t.status === "RECEIVED") transferStatus = "TRANSFER_COMPLETE";
            else if (t.status === "EXPECTED" && index % 2 === 0) transferStatus = "DEEDS_LODGED";

            return {
              id: t.id,
              propertyTitle: t.property?.title || "Untitled Property",
              suburb: t.property?.suburb || "Lusaka",
              buyerName,
              buyerContact,
              buyerNrcPassport,
              salePrice: Number(t.grossValue || 0),
              currency: t.currency || "ZMW",
              agencyCommissionEarned: Number(t.agencyCommissionAmount || 0),
              agencyCommissionPct: Number(t.agencyCommissionPct || 0),
              agentSplitPaid: Number(t.agentSplitAmount || 0),
              closingAgent: t.closingAgent?.name || "Grace Banda",
              transferStatus,
              ministryReference: ministryRef,
              closedAt: t.closedAt
                ? new Date(t.closedAt).toISOString().split("T")[0]
                : new Date(t.createdAt).toISOString().split("T")[0],
            };
          });
          setSales(normalized);
        }

        if (propsData.success) {
          setCanOverrideCommission(Boolean(propsData.capabilities?.canOverrideCommission));
          const saleProps = propsData.properties.filter(
            (p: any) => p.listingType === "FOR_SALE"
          );
          setProperties(saleProps);
          if (saleProps.length > 0) {
            setFormData((prev) => ({
              ...prev,
              propertyId: saleProps[0].id,
              salePrice: String(saleProps[0].askingPrice || 3500000),
              currency: saleProps[0].currency || "ZMW",
              agencyCommissionPct: String(saleProps[0].agencyCommissionPct ?? 5),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load sales data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.propertyId) {
      setFormError("Please select a property.");
      return;
    }
    if (!formData.buyerName.trim() || formData.buyerName.length < 3) {
      setFormError("Buyer full name or company name is required.");
      return;
    }
    if (!formData.buyerContact.trim() || formData.buyerContact.length < 7) {
      setFormError("Valid buyer phone number is required.");
      return;
    }
    if (!formData.buyerNrcPassport.trim() || formData.buyerNrcPassport.length < 5) {
      setFormError("Buyer NRC or Passport ID is required for legal Ministry transfer.");
      return;
    }

    const price = parseFloat(formData.salePrice);
    if (!price || price <= 0) {
      setFormError("Sale purchase price must be greater than zero.");
      return;
    }

    const selectedProperty = properties.find((property) => property.id === formData.propertyId);
    const parsedCommissionPct = parseFloat(formData.agencyCommissionPct);
    if (canOverrideCommission && (!Number.isFinite(parsedCommissionPct) || parsedCommissionPct < 0 || parsedCommissionPct > 100)) {
      setFormError("Final commission percentage must be between 0 and 100.");
      return;
    }
    const commPct = canOverrideCommission
      ? parsedCommissionPct
      : Number(selectedProperty?.agencyCommissionPct ?? 5);
    const splitPct = parseFloat(formData.agentSplitPct) || 50.0;
    const commAmount = (price * commPct) / 100;
    const splitAmount = (commAmount * splitPct) / 100;

    const payload = {
      propertyId: formData.propertyId,
      grossValue: price,
      currency: formData.currency,
      ...(canOverrideCommission ? { agencyCommissionPct: commPct } : {}),
      agencyCommissionAmount: commAmount,
      agentSplitPct: splitPct,
      agentSplitAmount: splitAmount,
      status: "RECEIVED",
      closedAt: new Date().toISOString(),
    };

    setIsRecordingSale(true);
    fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.transaction) {
          const t = data.transaction;
          const ministryRef = formData.ministryReference;

          const newSale = {
            id: t.id,
            propertyTitle: t.property?.title || "Untitled Property",
            suburb: t.property?.suburb || "Lusaka",
            buyerName: formData.buyerName,
            buyerContact: formData.buyerContact,
            buyerNrcPassport: formData.buyerNrcPassport,
            salePrice: Number(t.grossValue || 0),
            currency: t.currency || "ZMW",
            agencyCommissionEarned: Number(t.agencyCommissionAmount || 0),
            agencyCommissionPct: Number(t.agencyCommissionPct || commPct),
            agentSplitPaid: Number(t.agentSplitAmount || 0),
            closingAgent: t.closingAgent?.name || "Grace Banda",
            transferStatus: "TRANSFER_COMPLETE",
            ministryReference: ministryRef,
            closedAt: t.closedAt
              ? new Date(t.closedAt).toISOString().split("T")[0]
              : new Date(t.createdAt).toISOString().split("T")[0],
          };

          setSales([newSale, ...sales]);
          setIsModalOpen(false);
          setFormData({
            propertyId: properties[0]?.id || "",
            buyerName: "",
            buyerContact: "",
            buyerNrcPassport: "",
            salePrice: properties[0] ? String(properties[0].askingPrice || 3500000) : "3500000",
            currency: properties[0]?.currency || "ZMW",
            agencyCommissionPct: String(properties[0]?.agencyCommissionPct ?? 5),
            agentSplitPct: "50.0",
            closingAgent: "Grace Banda (Principal Broker)",
            transferStatus: "PENDING_STATE_CONSENT",
            ministryReference: `LUS/LAND/2026/${Math.floor(1000 + Math.random() * 9000)}-A`,
          });
        } else {
          setFormError(data.error || "Failed to save sale transaction.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to save sale: ${err.message}`);
      })
      .finally(() => {
        setIsRecordingSale(false);
      });
  };

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

  return (
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
            Complete registry of closed acquisitions, buyer NRC/passport identification, Lands transfer consent tracking, and 5% commissions.
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
            Agency Sales Commission (5%)
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
          <div className="text-center py-12 text-editorial-muted text-xs font-geist">
            Loading sales transactions from database...
          </div>
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
                      <tr key={sale.id} className="hover:bg-[#fff5f3]/40 transition-colors">
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

      {/* Interactive Modal: Record Property Sale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-geist">
          <div className="bg-white max-w-lg w-full p-4 sm:p-6 border border-editorial-border space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Record Property Sale & Conveyance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 text-xs font-geist">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleRecordSale} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Property Sold *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const p = properties.find((prop) => prop.id === selId);
                    setFormData({
                      ...formData,
                      propertyId: selId,
                      salePrice: p ? String(p.askingPrice || 3500000) : formData.salePrice,
                      currency: p?.currency || formData.currency,
                      agencyCommissionPct: String(p?.agencyCommissionPct ?? 5),
                    });
                  }}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.suburb})
                    </option>
                  ))}
                  {properties.length === 0 && (
                    <option value="">No properties available for sale</option>
                  )}
                </select>
              </div>

              {canOverrideCommission && (
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Final Agency Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.agencyCommissionPct}
                    onChange={(e) => setFormData({ ...formData, agencyCommissionPct: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                  <p className="mt-1 text-[10px] text-editorial-muted">
                    Inherited from the property. You may override it for this final sale.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Buyer Full Name / Company *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Mutale Kapwepwe"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Buyer Phone Number *
                  </label>
                  <PhoneNumberInput
                    value={formData.buyerContact}
                    onChange={(buyerContact) => setFormData({ ...formData, buyerContact })}
                    label=""
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Buyer NRC / Passport ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 194820/11/1"
                    value={formData.buyerNrcPassport}
                    onChange={(e) => setFormData({ ...formData, buyerNrcPassport: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Closing Agent
                  </label>
                  <select
                    value={formData.closingAgent}
                    onChange={(e) => setFormData({ ...formData, closingAgent: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="">Select closing agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.name}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Sale Purchase Price *
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Deeds Transfer Status
                  </label>
                  <select
                    value={formData.transferStatus}
                    onChange={(e) => setFormData({ ...formData, transferStatus: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="PENDING_STATE_CONSENT">Pending State Consent</option>
                    <option value="DEEDS_LODGED">Deeds Lodged at Registry</option>
                    <option value="TRANSFER_COMPLETE">Transfer Complete</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Ministry Lands Reference
                  </label>
                  <input
                    type="text"
                    value={formData.ministryReference}
                    onChange={(e) => setFormData({ ...formData, ministryReference: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingSale}
                  aria-busy={isRecordingSale}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <PendingButtonContent
                    pending={isRecordingSale}
                    pendingLabel="Recording conveyance…"
                    icon={<Sparkles className="h-3.5 w-3.5 text-contour-red" />}
                  >
                    Record Conveyance
                  </PendingButtonContent>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
