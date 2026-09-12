"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Clock,
  Plus,
  X,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";
import { NumberTicker } from "@/components/ui/animate/number-ticker";

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

const STAGES = [
  { id: "NEW_INQUIRY", label: "New Inquiry", tag: "RAW" },
  { id: "VIEWING_SCHEDULED", label: "Viewing Booked", tag: "VIEW" },
  { id: "NEGOTIATION", label: "In Negotiation", tag: "TERMS" },
  { id: "OFFER_MADE", label: "Written Offer", tag: "OFFER" },
  { id: "CLOSED_WON", label: "Closed Won", tag: "ESCROW" },
];

export default function DealPipelinePage() {
  // Deals are intentionally empty until they are loaded from a tenant-scoped
  // deal source. Never seed the pipeline with development/demo records.
  const [deals, setDeals] = useState<Deal[]>([]);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeMobileStage, setActiveMobileStage] = useState<Deal["stage"]>("NEW_INQUIRY");

  const handleMoveStage = (dealId: string, nextStage: Deal["stage"]) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d))
    );
  };

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    propertyTitle: "",
    suburb: "",
    dealValue: "",
    currency: "ZMW",
    agentName: "",
    stage: "NEW_INQUIRY" as Deal["stage"],
  });

  const stats = useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const commByCurrency: Record<string, number> = {};
    let totalNegotiatingDays = 0;
    let negotiatingCount = 0;

    deals.forEach((d) => {
      totalsByCurrency[d.currency] = (totalsByCurrency[d.currency] || 0) + d.dealValue;
      commByCurrency[d.currency] = (commByCurrency[d.currency] || 0) + d.agencyCommission;
      if (d.stage === "NEGOTIATION") {
        totalNegotiatingDays += d.daysInStage;
        negotiatingCount++;
      }
    });

    const totalValStr =
      Object.entries(totalsByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    const commValStr =
      Object.entries(commByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur))
        .join(" + ") || "K 0";

    const avgVelocity =
      negotiatingCount > 0
        ? (totalNegotiatingDays / negotiatingCount).toFixed(1) + " Days"
        : "0.0 Days";

    return { totalValStr, commValStr, avgVelocity };
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
      propertyTitle: "",
      suburb: "",
      dealValue: "",
      currency: "ZMW",
      agentName: "",
      stage: "NEW_INQUIRY",
    });
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
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

  return (
    <div className="p-4 sm:p-8 pb-32 space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-geist font-bold px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Deal Pipeline
            </span>
            <span className="text-[11px] font-geist text-editorial-muted">
              Lusaka Real Estate Velocity
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Pipeline & Velocity Board
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Track transactions across 5 verified stages: Inquiries → Site Viewings → Term Negotiation → Signed Offer → Closed Escrow.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Deal Opportunity</span>
        </button>
      </div>

      {/* Velocity Intelligence Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Total Pipeline Value
          </span>
          <div className="font-geist text-base sm:text-xl font-bold text-editorial-black mt-1 tracking-tight truncate">
            {stats.totalValStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            {deals.length} active opportunities
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-contour-red uppercase tracking-wider">
            Expected 5% Fee
          </span>
          <div className="font-geist text-base sm:text-xl font-bold text-contour-red mt-1 tracking-tight truncate">
            {stats.commValStr}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Contracted commission
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Velocity
          </span>
          <div className="font-geist text-base sm:text-xl font-bold text-emerald-800 mt-1 tracking-tight">
            {stats.avgVelocity}
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            Viewing to offer
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Funnel Balance
          </span>
          <div className="font-geist text-xs sm:text-base font-bold text-editorial-black mt-1 tracking-tight">
            {deals.filter((d) => d.stage !== "CLOSED_WON").length} Open • {deals.filter((d) => d.stage === "CLOSED_WON").length} Won
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            {deals.length > 0
              ? ((deals.filter((d) => d.stage === "CLOSED_WON").length / deals.length) * 100).toFixed(0)
              : "0"}% Win rate
          </span>
        </MotionCard>
      </div>

      {deals.length === 0 && (
        <div className="border border-dashed border-editorial-border bg-white p-8 text-center">
          <h2 className="font-heading text-sm font-bold uppercase tracking-tight text-editorial-black">
            No deals in your pipeline
          </h2>
          <p className="mt-2 text-xs text-editorial-muted">
            Deals created for this workspace will appear here. Development data is not shown.
          </p>
        </div>
      )}

      {/* ── Mobile Touch Stage Switcher & Cards View (< md) ── */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-editorial-border pb-2">
          {STAGES.map((stage) => {
            const count = deals.filter((d) => d.stage === stage.id).length;
            const isSelected = activeMobileStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveMobileStage(stage.id as Deal["stage"])}
                className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-editorial-black text-white border-editorial-black"
                    : "bg-white text-editorial-black border-editorial-border hover:bg-neutral-50"
                }`}
              >
                <span>{stage.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? "bg-contour-red text-white" : "bg-neutral-100 text-editorial-muted"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Stage Cards List */}
        <div className="space-y-3">
          {deals.filter((d) => d.stage === activeMobileStage).map((deal) => (
            <div key={deal.id} className="bg-white p-4 border border-editorial-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-geist font-semibold uppercase tracking-wider text-editorial-muted">
                  📍 {deal.suburb}
                </span>
                <span className="text-[10px] font-geist text-editorial-muted">
                  {deal.daysInStage}d in stage
                </span>
              </div>
              <h4 className="font-heading font-bold text-sm text-editorial-black uppercase leading-snug">
                {deal.propertyTitle}
              </h4>
              <div className="p-2.5 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-editorial-muted">Client:</span>
                  <strong className="text-editorial-black">{deal.clientName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-editorial-muted">Agent:</span>
                  <span className="text-editorial-black">{deal.agentName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-editorial-border">
                <div>
                  <div className="text-[9px] font-geist text-editorial-muted uppercase">Deal Value</div>
                  <div className="font-geist font-bold text-sm text-editorial-black">
                    {formatCurrency(deal.dealValue, deal.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-geist text-contour-red uppercase">5% Commission</div>
                  <div className="font-geist font-bold text-sm text-contour-red">
                    {formatCurrency(deal.agencyCommission, deal.currency)}
                  </div>
                </div>
              </div>

              {/* Touch Actions: Move Stage & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-editorial-border">
                <select
                  value={deal.stage}
                  onChange={(e) => handleMoveStage(deal.id, e.target.value as Deal["stage"])}
                  className="w-full bg-white px-2 py-2 border border-editorial-border text-[11px] font-heading font-semibold uppercase tracking-wider text-editorial-black focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      Move: {s.label}
                    </option>
                  ))}
                </select>

                <a
                  href={`https://wa.me/${deal.clientPhone.replace(/\+/g, "").replace(/\s/g, "")}?text=Hello%20${encodeURIComponent(deal.clientName)}%2C%20following%20up%20on%20${encodeURIComponent(deal.propertyTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-fill-wipe bg-[#25D366] text-white py-2 px-2 flex items-center justify-center gap-1 font-heading text-[11px] font-semibold uppercase tracking-wider"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}

          {deals.filter((d) => d.stage === activeMobileStage).length === 0 && (
            <div className="p-8 border border-dashed border-editorial-border text-center text-xs text-editorial-muted">
              No deals in this stage.
            </div>
          )}
        </div>
      </div>

      {/* Visual Kanban Columns Grid (Desktop & Tablet) */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`p-3 border flex flex-col space-y-3 min-h-[520px] transition-colors ${
                dragOverStage === stage.id
                  ? "bg-[#fff5f3]/40 border-contour-red"
                  : "bg-neutral-50/50 border-editorial-border"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-editorial-border">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-geist font-bold px-1.5 py-0.2 bg-white border border-editorial-border text-editorial-black">
                    {stageDeals.length}
                  </span>
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
                    {stage.label}
                  </h3>
                </div>
                {dragOverStage === stage.id && (
                  <span className="text-[9px] font-geist text-contour-red">Drop here</span>
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
                    className={`bg-white p-3.5 border transition-all space-y-2 select-none ${
                      draggedDealId === deal.id
                        ? "opacity-30 border-dashed border-editorial-black cursor-grabbing"
                        : "border-editorial-border hover:border-editorial-black cursor-grab"
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-geist font-semibold uppercase tracking-wider text-editorial-muted">
                        📍 {deal.suburb}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-editorial-black uppercase leading-snug mt-0.5">
                        {deal.propertyTitle}
                      </h4>
                    </div>

                    <div className="p-2 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Client:</span>
                        <strong className="text-editorial-black truncate max-w-[120px]">
                          {deal.clientName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-editorial-muted">Agent:</span>
                        <span className="text-editorial-black">{deal.agentName}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-editorial-border flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-geist text-editorial-muted uppercase">Value</div>
                        <div className="font-geist font-bold text-xs text-editorial-black">
                          {formatCurrency(deal.dealValue, deal.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-geist text-contour-red uppercase">5% Commission</div>
                        <div className="font-geist font-bold text-xs text-contour-red">
                          {formatCurrency(deal.agencyCommission, deal.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-geist text-editorial-muted pt-1 border-t border-editorial-border">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deal.daysInStage}d in stage
                      </span>
                      <a
                        href={`https://wa.me/${deal.clientPhone.replace(/\+/g, "").replace(/\s/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-contour-red hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="h-28 border border-dashed border-editorial-border flex items-center justify-center text-xs text-editorial-muted text-center p-3 font-geist">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal: New Deal Opportunity */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-geist">
          <div className="bg-white max-w-lg w-full p-6 border border-editorial-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Create Deal Opportunity
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-editorial-muted hover:text-contour-red"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 text-xs font-geist">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Banda"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-geist"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Client Phone *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 788 9900"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-geist"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Property Target
                </label>
                <select
                  value={formData.propertyTitle}
                  onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  <option value="Executive 4-Bedroom Residence">Executive 4-Bedroom Residence (Kabulonga)</option>
                  <option value="Modern 3-Bedroom Townhouse">Modern 3-Bedroom Townhouse (Leopards Hill)</option>
                  <option value="5-Acre Commercial Development Plot">5-Acre Plot (Roma Park)</option>
                  <option value="Luxury 3-Bedroom Villa">Luxury 3-Bedroom Villa (Sunningdale)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal["stage"] })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="NEW_INQUIRY">New Inquiry</option>
                    <option value="VIEWING_SCHEDULED">Viewing Booked</option>
                    <option value="NEGOTIATION">In Negotiation</option>
                    <option value="OFFER_MADE">Written Offer</option>
                    <option value="CLOSED_WON">Closed Won</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Closing Agent
                  </label>
                  <select
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="Tembo Mwape">Tembo Mwape</option>
                    <option value="Chipo Banda">Chipo Banda</option>
                    <option value="Grace Banda">Grace Banda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Deal Value *
                  </label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-geist"
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
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-editorial-border flex items-center justify-between">
                <span className="text-editorial-muted font-heading text-xs uppercase tracking-wider">
                  Expected 5% Agency Fee:
                </span>
                <span className="font-geist font-bold text-contour-red text-sm">
                  {formatCurrency((parseFloat(formData.dealValue) || 0) * 0.05, formData.currency as any)}
                </span>
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
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
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
