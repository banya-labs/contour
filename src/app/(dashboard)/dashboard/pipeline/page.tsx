"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  DollarSign,
  User,
  Building2,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  Plus,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Deal = {
  id: string;
  clientName: string;
  clientPhone: string;
  propertyTitle: string;
  suburb: string;
  dealValue: number;
  currency: "ZMW" | "USD";
  agencyCommission: number;
  agentName: string;
  daysInStage: number;
  stage: "NEW_INQUIRY" | "VIEWING_SCHEDULED" | "NEGOTIATION" | "OFFER_MADE" | "CLOSED_WON";
};

const INITIAL_DEALS: Deal[] = [
  {
    id: "deal_01",
    clientName: "John Banda",
    clientPhone: "+260 97 788 9900",
    propertyTitle: "Executive 4-Bedroom Residence",
    suburb: "Kabulonga",
    dealValue: 3500000,
    currency: "ZMW",
    agencyCommission: 175000,
    agentName: "Tembo Mwape",
    daysInStage: 3,
    stage: "NEGOTIATION",
  },
  {
    id: "deal_02",
    clientName: "EU Diplomatic Mission Housing",
    clientPhone: "+260 96 112 2334",
    propertyTitle: "Modern 3-Bedroom Townhouse",
    suburb: "Leopards Hill",
    dealValue: 2200,
    currency: "USD",
    agencyCommission: 220,
    agentName: "Chipo Banda",
    daysInStage: 2,
    stage: "VIEWING_SCHEDULED",
  },
  {
    id: "deal_03",
    clientName: "AfriCorp Logistics Zambia",
    clientPhone: "+260 97 889 0011",
    propertyTitle: "5-Acre Commercial Development Plot",
    suburb: "Roma Park",
    dealValue: 850000,
    currency: "USD",
    agencyCommission: 42500,
    agentName: "Grace Banda",
    daysInStage: 1,
    stage: "CLOSED_WON",
  },
  {
    id: "deal_04",
    clientName: "Dr. Mutale Kapwepwe",
    clientPhone: "+260 96 223 4455",
    propertyTitle: "Luxury 3-Bedroom Villa",
    suburb: "Sunningdale",
    dealValue: 4200000,
    currency: "ZMW",
    agencyCommission: 210000,
    agentName: "Tembo Mwape",
    daysInStage: 14,
    stage: "CLOSED_WON",
  },
  {
    id: "deal_05",
    clientName: "Chileshe Mwansa",
    clientPhone: "+260 97 445 6677",
    propertyTitle: "Prime Commercial Office Space",
    suburb: "Mass Media",
    dealValue: 35000,
    currency: "ZMW",
    agencyCommission: 3500,
    agentName: "Tembo Mwape",
    daysInStage: 1,
    stage: "NEW_INQUIRY",
  },
  {
    id: "deal_06",
    clientName: "Zambezi Freight & Haulage",
    clientPhone: "+260 97 554 3322",
    propertyTitle: "Commercial Warehouse & Yard",
    suburb: "Industrial Area",
    dealValue: 1200000,
    currency: "USD",
    agencyCommission: 60000,
    agentName: "Tembo Mwape",
    daysInStage: 4,
    stage: "OFFER_MADE",
  },
];

const STAGES = [
  { id: "NEW_INQUIRY", label: "New Inquiry", badgeColor: "bg-paper-300 text-ink-900" },
  { id: "VIEWING_SCHEDULED", label: "Viewing Booked", badgeColor: "bg-amber-100 text-amber-800" },
  { id: "NEGOTIATION", label: "In Negotiation", badgeColor: "bg-blue-100 text-blue-800" },
  { id: "OFFER_MADE", label: "Written Offer", badgeColor: "bg-purple-100 text-purple-800" },
  { id: "CLOSED_WON", label: "Closed / Won", badgeColor: "bg-emerald-100 text-emerald-800" },
] as const;

export default function DealPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    propertyTitle: "Executive 4-Bedroom Residence",
    suburb: "Kabulonga",
    dealValue: "3500000",
    currency: "ZMW",
    agentName: "Tembo Mwape",
    stage: "NEW_INQUIRY" as Deal["stage"],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadPipelineData() {
      try {
        const [clientsRes, salesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/sales")
        ]);
        const clientsData = await clientsRes.json();
        const salesData = await salesRes.json();

        const combinedDeals: Deal[] = [];

        if (clientsData.success && clientsData.clients) {
          clientsData.clients.forEach((c: any) => {
            let stage: Deal["stage"] = "NEW_INQUIRY";
            if (c.status === "VIEWING_SCHEDULED") stage = "VIEWING_SCHEDULED";
            else if (c.status === "CONTACTED") stage = "VIEWING_SCHEDULED";
            else if (c.status === "NEGOTIATING") stage = "NEGOTIATION";
            else if (c.status === "CLOSED_WON") stage = "CLOSED_WON";
            else if (c.status === "CLOSED_LOST") return;

            const val = Number(c.budgetMax || 0);

            combinedDeals.push({
              id: c.id,
              clientName: c.clientName,
              clientPhone: c.clientPhone,
              propertyTitle: c.notes?.replace(/^\[Source:\s*[^\]]+\]\s*/, "") || "Requirements not specified",
              suburb: c.preferredSuburbs?.[0] || "Lusaka",
              dealValue: val || 0,
              currency: c.currency === "USD" ? "USD" : "ZMW",
              agencyCommission: val * 0.05,
              agentName: c.assignedAgent?.name || "Unassigned",
              daysInStage: Math.max(0, Math.ceil((Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24))),
              stage,
            });
          });
        }

        if (salesData.success && salesData.transactions) {
          salesData.transactions.forEach((t: any) => {
            if (combinedDeals.some((d) => d.id === t.propertyId || d.clientPhone === t.buyerContact)) {
              return;
            }

            const val = Number(t.grossValue || 0);

            combinedDeals.push({
              id: t.id,
              clientName: "Client",
              clientPhone: "",
              propertyTitle: t.property?.title || "Untitled Property",
              suburb: t.property?.suburb || "Lusaka",
              dealValue: val,
              currency: t.currency === "USD" ? "USD" : "ZMW",
              agencyCommission: Number(t.agencyCommissionAmount || 0),
              agentName: t.closingAgent?.name || "Unassigned",
              daysInStage: Math.max(0, Math.ceil((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
              stage: "CLOSED_WON",
            });
          });
        }

        setDeals(combinedDeals);
      } catch (err) {
        console.error("Failed to load pipeline data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPipelineData();
  }, []);

  // Compute stats dynamically
  const stats = React.useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const commissionsByCurrency: Record<string, number> = {};
    let totalNegotiatingDays = 0;
    let negotiatingCount = 0;

    deals.forEach((d) => {
      const cur = d.currency || "ZMW";
      totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + (d.dealValue || 0);
      commissionsByCurrency[cur] = (commissionsByCurrency[cur] || 0) + (d.agencyCommission || 0);

      if (d.stage === "NEGOTIATION") {
        totalNegotiatingDays += d.daysInStage || 0;
        negotiatingCount++;
      }
    });

    const totalValStr = Object.entries(totalsByCurrency)
      .map(([cur, val]) => formatCurrency(val, cur))
      .join(" + ") || "K 0";

    const commValStr = Object.entries(commissionsByCurrency)
      .map(([cur, val]) => formatCurrency(val, cur))
      .join(" + ") || "K 0";

    const avgVelocity = negotiatingCount > 0
      ? (totalNegotiatingDays / negotiatingCount).toFixed(1) + " Days"
      : "0.0 Days";

    return {
      totalValStr,
      commValStr,
      avgVelocity,
    };
  }, [deals]);

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.clientName.trim() || formData.clientName.length < 3) {
      setFormError("Client name is required.");
      return;
    }
    if (!formData.clientPhone.trim() || formData.clientPhone.length < 7) {
      setFormError("Valid client phone is required.");
      return;
    }
    const valNum = parseFloat(formData.dealValue);
    if (!valNum || valNum <= 0) {
      setFormError("Deal value must be greater than 0.");
      return;
    }

    const comm = valNum * 0.05;

    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      propertyTitle: formData.propertyTitle,
      suburb: formData.suburb,
      dealValue: valNum,
      currency: formData.currency as "ZMW" | "USD",
      agencyCommission: comm,
      agentName: formData.agentName,
      daysInStage: 0,
      stage: formData.stage,
    };

    setDeals([newDeal, ...deals]);
    setIsModalOpen(false);
    setFormData({
      clientName: "",
      clientPhone: "",
      propertyTitle: "Executive 4-Bedroom Residence",
      suburb: "Kabulonga",
      dealValue: "3500000",
      currency: "ZMW",
      agentName: "Tembo Mwape",
      stage: "NEW_INQUIRY",
    });
    alert(`[SUCCESS] New deal for ${newDeal.clientName} added to pipeline in stage "${newDeal.stage}"!`);
  };

  // ── Drag-and-Drop handlers ────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
    // Small timeout so the ghost image renders before we dim the card
    setTimeout(() => {}, 0);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear highlight when the pointer truly leaves the column (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedDealId) return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === draggedDealId
          ? { ...d, stage: targetStageId as Deal["stage"] }
          : d
      )
    );
    setDraggedDealId(null);
    setDragOverStage(null);
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-[1400px] mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Sales Velocity & Pipeline
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Deal Pipeline & Velocity Board
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Track deals across each stage: Client → Property → Agent → Value → Expected 5% Commission.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold transition-transform active:scale-95 shadow-subtle flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Deal Opportunity</span>
        </button>
      </div>

      {/* Pipeline Velocity Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Total Pipeline Value
          </span>
          <div className="font-mono text-xl font-bold text-ink-900 mt-1">
            {loading ? "…" : stats.totalValStr}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">{deals.length} active & closed deals</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Expected 5% Agency Revenue
          </span>
          <div className="font-mono text-xl font-bold text-contour-red mt-1">
            {loading ? "…" : stats.commValStr}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">True earned brokerage revenue</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Avg Negotiation Velocity
          </span>
          <div className="font-mono text-xl font-bold text-contour-emerald mt-1">
            {loading ? "…" : stats.avgVelocity}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">From first viewing to accepted offer</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
          <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">
            Active Funnel Balance
          </span>
          <div className="font-mono text-base font-bold text-ink-900 mt-1">
            {loading ? "…" : `${deals.filter(d => d.stage !== "CLOSED_WON").length} Open Opportunities`}
          </div>
          <span className="text-[11px] text-ink-600 mt-0.5 block">
            {loading ? "…" : `${deals.filter(d => d.stage === "CLOSED_WON").length} Deals Closed Won`}
          </span>
        </div>
      </div>

      {/* Visual Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`rounded-2xl p-3 border flex flex-col space-y-3 min-h-[500px] transition-all duration-150 ${
                dragOverStage === stage.id
                  ? "bg-red-50/60 border-contour-red ring-2 ring-contour-red/25 shadow-[inset_0_0_0_2px_rgba(220,38,38,0.15)]"
                  : "bg-paper-100 border-border"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.badgeColor}`}>
                    {stageDeals.length}
                  </span>
                  <h3 className="font-bold text-xs text-ink-900">{stage.label}</h3>
                </div>
                {dragOverStage === stage.id && (
                  <span className="text-[9px] font-bold text-contour-red animate-pulse">Drop here</span>
                )}
              </div>

              {/* Deals in this Stage */}
              <div className="space-y-3 flex-1">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-xl p-3.5 border border-border shadow-card hover:shadow-floating transition-all space-y-2 group select-none ${
                      draggedDealId === deal.id
                        ? "opacity-40 scale-95 cursor-grabbing shadow-none"
                        : "cursor-grab hover:border-contour-red/30"
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-bold text-ink-600 uppercase tracking-wider">
                        📍 {deal.suburb}
                      </span>
                      <h4 className="font-bold text-xs text-ink-900 leading-snug mt-0.5">
                        {deal.propertyTitle}
                      </h4>
                    </div>

                    <div className="p-2 rounded-lg bg-paper-100 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-600">Client:</span>
                        <strong className="text-ink-900 truncate max-w-[120px]">{deal.clientName}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-600">Agent:</span>
                        <span className="text-ink-800">{deal.agentName}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-paper-200 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-ink-600 font-semibold">Deal Value</div>
                        <div className="font-mono font-bold text-xs text-ink-900">
                          {formatCurrency(deal.dealValue, deal.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-contour-red font-semibold">5% Agency Fee</div>
                        <div className="font-mono font-bold text-xs text-contour-red">
                          {formatCurrency(deal.agencyCommission, deal.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-ink-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-400" />
                        {deal.daysInStage}d in stage
                      </span>
                      <a
                        href={`https://wa.me/${deal.clientPhone.replace(/\+/g, "").replace(/\s/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-contour-red hover:underline flex items-center gap-0.5"
                      >
                        <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xs text-ink-400 text-center p-4">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal: New Deal Opportunity */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-border shadow-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-contour-red" />
                <h3 className="font-bold text-base text-ink-900">Create New Deal Opportunity</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-600 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-contour-red text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. John Banda"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Client Phone *</label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 788 9900"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink-800 mb-1">Property Target</label>
                <select
                  value={formData.propertyTitle}
                  onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                >
                  <option value="Executive 4-Bedroom Residence">Executive 4-Bedroom Residence (Kabulonga)</option>
                  <option value="Modern 3-Bedroom Townhouse">Modern 3-Bedroom Townhouse (Leopards Hill)</option>
                  <option value="5-Acre Commercial Development Plot">5-Acre Plot (Roma Park)</option>
                  <option value="Luxury 3-Bedroom Villa">Luxury 3-Bedroom Villa (Sunningdale)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Pipeline Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal["stage"] })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  >
                    <option value="NEW_INQUIRY">New Inquiry</option>
                    <option value="VIEWING_SCHEDULED">Viewing Booked</option>
                    <option value="NEGOTIATION">In Negotiation</option>
                    <option value="OFFER_MADE">Written Offer</option>
                    <option value="CLOSED_WON">Closed Won</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Closing Agent</label>
                  <select
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none"
                  >
                    <option value="Tembo Mwape">Tembo Mwape</option>
                    <option value="Chipo Banda">Chipo Banda</option>
                    <option value="Grace Banda">Grace Banda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Deal Value *</label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-100 border border-paper-200 flex items-center justify-between">
                <span className="text-ink-600 font-semibold">Expected 5% Agency Revenue:</span>
                <span className="font-mono font-bold text-contour-red">
                  {formatCurrency((parseFloat(formData.dealValue) || 0) * 0.05, formData.currency as any)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-ink-800 hover:bg-paper-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink-900 hover:bg-ink-950 text-white font-semibold shadow-subtle flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>Create Opportunity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
