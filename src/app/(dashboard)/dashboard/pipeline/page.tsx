"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Plus,
  X,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Lock,
  Building,
  User,
  Edit3,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { MotionCard } from "@/components/ui/animate/motion-card";
import { NumberTicker } from "@/components/ui/animate/number-ticker";
import { formatWhatsAppDigits } from "@/lib/phone-utils";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { isKeyPending, setKeyPending } from "@/lib/loading-feedback";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";

type Deal = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  propertyId?: string | null;
  propertyTitle: string;
  suburb: string;
  dealValue: number;
  currency: "ZMW" | "USD";
  agencyCommission: number;
  agencyCommissionPct: number;
  agentName: string;
  assignedAgentId?: string | null;
  daysInStage: number;
  stage: "NEW_INQUIRY" | "CONTACTED" | "VIEWING_SCHEDULED" | "NEGOTIATING" | "OFFER_MADE" | "MANAGEMENT_HANDOVER" | "CLOSED";
  outcome?: "WON" | "LOST" | null;
  lostReason?: string | null;
  closedAt?: string | null;
  leadSource?: string;
  notes?: string | null;
};

type AvailableProperty = {
  id: string;
  title: string;
  suburb?: string | null;
  city?: string | null;
  askingPrice?: number | null;
  agencyCommissionPct: number;
  rentalPrice?: number | null;
  currency?: string | null;
  status?: string;
};

type OrganizationAgent = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

type ExistingClient = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
};

const STAGES = [
  { id: "NEW_INQUIRY", label: "New Inquiry", tag: "RAW" },
  { id: "CONTACTED", label: "Contacted", tag: "TOUCH" },
  { id: "OFFER_MADE", label: "Written Offer", tag: "OFFER" },
  { id: "MANAGEMENT_HANDOVER", label: "Management Handover", tag: "REVIEW" },
];

function DealPipelineContent() {
  // Deals are intentionally empty until they are loaded from a tenant-scoped
  // deal source. Never seed the pipeline with development/demo records.
  const [deals, setDeals] = useState<Deal[]>([]);
  const [agents, setAgents] = useState<OrganizationAgent[]>([]);
  const [availableProperties, setAvailableProperties] = useState<AvailableProperty[]>([]);
  const [existingClients, setExistingClients] = useState<ExistingClient[]>([]);

  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // New Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSelectionMode, setClientSelectionMode] = useState<"existing" | "new">("new");
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    selectedExistingClientId: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    propertyId: "",
    assignedAgentId: "",
    dealValue: "",
    currency: "ZMW" as "ZMW" | "USD",
    leadSource: "WALK_IN",
    stage: "NEW_INQUIRY" as Deal["stage"],
    notes: "",
  });

  // Edit Deal (Reassign Property / Agent / Value / Stage) Modal State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editFormData, setEditFormData] = useState({
    propertyId: "",
    assignedAgentId: "",
    dealValue: "",
    currency: "ZMW" as "ZMW" | "USD",
    stage: "NEW_INQUIRY" as Deal["stage"],
    notes: "",
  });
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [isClosingDeal, setIsClosingDeal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pendingDealActions, setPendingDealActions] = useState<ReadonlySet<string>>(
    new Set(),
  );

  // Close Deal Modal State
  const [closeTarget, setCloseTarget] = useState<Deal | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<"WON" | "LOST">("WON");
  const [lostReason, setLostReason] = useState("");

  const [activeMobileStage, setActiveMobileStage] = useState<Deal["stage"]>("NEW_INQUIRY");

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadAllPipelineData = () => {
    void Promise.all([
      fetch("/api/clients"),
      fetch("/api/organization/agents"),
      fetch("/api/properties"),
    ])
      .then(async ([dealsResponse, agentsResponse, propsResponse]) => {
        const dealsData = await dealsResponse.json();
        const agentsData = await agentsResponse.json();
        const propsData = await propsResponse.json();

        if (dealsData.success) {
          const rawClients = dealsData.clients || [];
          const mappedDeals: Deal[] = rawClients.map((inquiry: any) => ({
            id: inquiry.id,
            clientName: inquiry.clientName,
            clientPhone: inquiry.clientPhone,
            clientEmail: inquiry.clientEmail,
            propertyId: inquiry.property?.id || inquiry.propertyId || null,
            propertyTitle: inquiry.property?.title || "Unassigned property",
            suburb: inquiry.property?.suburb || inquiry.preferredSuburbs?.[0] || "—",
            dealValue: Number(inquiry.dealValue || inquiry.property?.askingPrice || inquiry.property?.rentalPrice || 0),
            currency: inquiry.currency || "ZMW",
            agencyCommissionPct: Number(inquiry.property?.agencyCommissionPct ?? 5),
            agencyCommission: Number(inquiry.dealValue || inquiry.property?.askingPrice || inquiry.property?.rentalPrice || 0) * (Number(inquiry.property?.agencyCommissionPct ?? 5) / 100),
            agentName: inquiry.assignedAgent?.name || "Unassigned",
            assignedAgentId: inquiry.assignedAgent?.id || inquiry.assignedAgentId || null,
            daysInStage: Math.max(0, Math.floor((Date.now() - new Date(inquiry.updatedAt).getTime()) / 86400000)),
            // Retain visibility for legacy stages after the simplified workflow:
            // viewings remain Contacted, while negotiation records become Written Offer.
            stage: inquiry.status === "VIEWING_SCHEDULED"
              ? "CONTACTED"
              : inquiry.status === "NEGOTIATING"
                ? "OFFER_MADE"
                : inquiry.status,
            outcome: inquiry.outcome,
            lostReason: inquiry.lostReason,
            closedAt: inquiry.closedAt,
            leadSource: inquiry.leadSource,
            notes: inquiry.notes,
          }));
          setDeals(mappedDeals);

          // Extract distinct client contacts for quick client selection in new deals
          const clientsMap = new Map<string, ExistingClient>();
          rawClients.forEach((c: any) => {
            if (c.clientName && c.clientPhone) {
              const key = `${c.clientName.trim().toLowerCase()}_${c.clientPhone.trim()}`;
              if (!clientsMap.has(key)) {
                clientsMap.set(key, {
                  id: c.id,
                  clientName: c.clientName,
                  clientPhone: c.clientPhone,
                  clientEmail: c.clientEmail,
                });
              }
            }
          });
          setExistingClients(Array.from(clientsMap.values()));
        }

        if (agentsData.success) {
          setAgents(agentsData.agents || []);
        }

        if (propsData.success && Array.isArray(propsData.properties)) {
          setAvailableProperties(
            propsData.properties.map((p: any) => ({
              id: p.id,
              title: p.title,
              suburb: p.suburb,
              city: p.city,
              askingPrice: p.askingPrice ? Number(p.askingPrice) : null,
              agencyCommissionPct: Number(p.agencyCommissionPct ?? 5),
              rentalPrice: p.rentalPrice ? Number(p.rentalPrice) : null,
              currency: p.currency || "ZMW",
              status: p.status,
            }))
          );
        }
      })
      .catch(() => setFormError("Unable to load the pipeline. Please refresh and try again."));
  };

  useEffect(() => {
    loadAllPipelineData();
  }, []);

  const stats = useMemo(() => {
    const totalsByCurrency: Record<string, number> = {};
    const commByCurrency: Record<string, number> = {};
    let totalNegotiatingDays = 0;
    let negotiatingCount = 0;

    deals.filter((d) => d.stage !== "CLOSED").forEach((d) => {
      totalsByCurrency[d.currency] = (totalsByCurrency[d.currency] || 0) + d.dealValue;
      commByCurrency[d.currency] = (commByCurrency[d.currency] || 0) + d.agencyCommission;
      if (d.stage === "OFFER_MADE") {
        totalNegotiatingDays += d.daysInStage;
        negotiatingCount++;
      }
    });

    const totalValStr =
      Object.entries(totalsByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur as "ZMW" | "USD"))
        .join(" + ") || "K 0";

    const commValStr =
      Object.entries(commByCurrency)
        .map(([cur, val]) => formatCurrency(val, cur as "ZMW" | "USD"))
        .join(" + ") || "K 0";

    const avgVelocity =
      negotiatingCount > 0
        ? (totalNegotiatingDays / negotiatingCount).toFixed(1) + " Days"
        : "0.0 Days";

    return { totalValStr, commValStr, avgVelocity };
  }, [deals]);

  const openDeals = deals.filter((deal) => deal.stage !== "CLOSED");
  const closedDeals = deals.filter((deal) => deal.stage === "CLOSED");

  const openCloseModal = (deal: Deal) => {
    setCloseTarget(deal);
    setCloseOutcome(deal.outcome === "LOST" ? "LOST" : "WON");
    setLostReason(deal.lostReason || "");
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditError("");
    setEditFormData({
      propertyId: deal.propertyId || "",
      assignedAgentId: deal.assignedAgentId || "",
      dealValue: deal.dealValue ? deal.dealValue.toString() : "",
      currency: deal.currency,
      stage: deal.stage,
      notes: deal.notes || "",
    });
  };

  const handleMoveStage = async (dealId: string, nextStage: Deal["stage"]) => {
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) return;
    if (nextStage === "CLOSED") {
      openCloseModal(deal);
      return;
    }
    const actionKey = `${dealId}:move`;
    setPendingDealActions((state) => setKeyPending(state, actionKey, true));
    try {
      const response = await fetch(`/api/clients/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStage }),
      });
      if (!response.ok) {
        setFormError("Unable to update the pipeline stage.");
        return;
      }
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d)),
      );
    } finally {
      setPendingDealActions((state) => setKeyPending(state, actionKey, false));
    }
  };

  const handleCloseDeal = async () => {
    if (!closeTarget || (closeOutcome === "LOST" && lostReason.trim().length < 10)) return;
    setIsClosingDeal(true);
    try {
      const response = await fetch(`/api/clients/${closeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          outcome: closeOutcome,
          lostReason: closeOutcome === "LOST" ? lostReason.trim() : undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError("Unable to close this deal.");
        return;
      }
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === closeTarget.id
            ? {
                ...deal,
                stage: "CLOSED",
                outcome: closeOutcome,
                lostReason: closeOutcome === "LOST" ? lostReason.trim() : null,
              }
            : deal,
        ),
      );
      setCloseTarget(null);
      if (closeOutcome === "WON" && result?.leasePrefill) {
        const encoded = encodeURIComponent(JSON.stringify(result.leasePrefill));
        window.location.assign(`/dashboard/leases?new=1&prefill=${encoded}`);
      }
    } finally {
      setIsClosingDeal(false);
    }
  };

  const handleSaveEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    setEditError("");

    const valNum = parseFloat(editFormData.dealValue);
    if (!valNum || valNum <= 0) {
      setEditError("Deal value must be greater than 0.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/clients/${editingDeal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: editFormData.propertyId || null,
          assignedAgentId: editFormData.assignedAgentId || null,
          dealValue: valNum,
          currency: editFormData.currency,
          status: editFormData.stage,
          notes: editFormData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setEditError(errData.error || "Unable to update deal association.");
        setIsSavingEdit(false);
        return;
      }

      const resData = await response.json();
      const updatedInquiry = resData.inquiry;

      const matchedProp = availableProperties.find((p) => p.id === editFormData.propertyId);
      const matchedAgent = agents.find((a) => a.id === editFormData.assignedAgentId);

      setDeals((prev) =>
        prev.map((d) => {
          if (d.id !== editingDeal.id) return d;
          return {
            ...d,
            propertyId: editFormData.propertyId || null,
            propertyTitle: matchedProp ? matchedProp.title : (updatedInquiry?.property?.title || "Unassigned property"),
            suburb: matchedProp?.suburb || updatedInquiry?.property?.suburb || "—",
            assignedAgentId: editFormData.assignedAgentId || null,
            agentName: matchedAgent ? matchedAgent.name : (updatedInquiry?.assignedAgent?.name || "Unassigned"),
            dealValue: valNum,
            currency: editFormData.currency,
            agencyCommissionPct: Number(matchedProp?.agencyCommissionPct ?? 5),
            agencyCommission: valNum * (Number(matchedProp?.agencyCommissionPct ?? 5) / 100),
            stage: editFormData.stage,
            notes: editFormData.notes,
          };
        })
      );

      setEditingDeal(null);
    } catch {
      setEditError("Network error while updating this deal.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    let clientName = formData.clientName.trim();
    let clientPhone = formData.clientPhone.trim();
    let clientEmail = formData.clientEmail.trim();

    if (clientSelectionMode === "existing") {
      const chosen = existingClients.find((c) => c.id === formData.selectedExistingClientId);
      if (!chosen) {
        setFormError("Please select an existing client from the list.");
        return;
      }
      clientName = chosen.clientName;
      clientPhone = chosen.clientPhone;
      clientEmail = chosen.clientEmail || "";
    } else {
      if (!clientName || clientName.length < 3) {
        setFormError("Client name is required (minimum 3 characters).");
        return;
      }
      if (!clientPhone || clientPhone.length < 7) {
        setFormError("Valid client phone is required (minimum 7 digits).");
        return;
      }
    }

    const valNum = parseFloat(formData.dealValue);
    if (!valNum || valNum <= 0) {
      setFormError("Deal value must be greater than 0.");
      return;
    }

    const matchedProp = availableProperties.find((p) => p.id === formData.propertyId);
    const matchedAgent = agents.find((a) => a.id === formData.assignedAgentId);

    setIsCreatingDeal(true);
    try {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientPhone,
        clientEmail: clientEmail || undefined,
        existingInquiryId: clientSelectionMode === "existing" ? formData.selectedExistingClientId : undefined,
        lookingFor: "FOR_SALE",
        currency: formData.currency,
        assignedAgentId: formData.assignedAgentId || undefined,
        propertyId: formData.propertyId || undefined,
        dealValue: valNum,
        status: formData.stage,
        leadSource: formData.leadSource,
        notes: formData.notes || undefined,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      setFormError(errJson.error || "Unable to create this pipeline opportunity.");
      return;
    }

    const result = await response.json();
    const inquiry = result.client;

    const newDeal: Deal = {
      id: inquiry.id,
      clientName: inquiry.clientName,
      clientPhone: inquiry.clientPhone,
      clientEmail: inquiry.clientEmail,
      propertyId: formData.propertyId || null,
      propertyTitle: matchedProp ? matchedProp.title : "Unassigned property",
      suburb: matchedProp?.suburb || "—",
      dealValue: valNum,
      currency: formData.currency,
      agencyCommissionPct: Number(matchedProp?.agencyCommissionPct ?? 5),
      agencyCommission: valNum * (Number(matchedProp?.agencyCommissionPct ?? 5) / 100),
      agentName: matchedAgent ? matchedAgent.name : "Unassigned",
      assignedAgentId: formData.assignedAgentId || null,
      daysInStage: 0,
      stage: inquiry.status || formData.stage,
      leadSource: formData.leadSource,
      notes: formData.notes,
    };

    setDeals((current) => [newDeal, ...current.filter((deal) => deal.id !== newDeal.id)]);

    // Keep existing clients list refreshed
    setExistingClients((prev) => {
      const exists = prev.some((c) => c.clientPhone === clientPhone);
      if (!exists) {
        return [{ id: inquiry.id, clientName, clientPhone, clientEmail }, ...prev];
      }
      return prev;
    });

    setIsModalOpen(false);
    setFormData({
      selectedExistingClientId: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      propertyId: "",
      assignedAgentId: "",
      dealValue: "",
      currency: "ZMW",
      leadSource: "WALK_IN",
      stage: "NEW_INQUIRY",
      notes: "",
    });
    } catch {
      setFormError("Network error while creating this pipeline opportunity.");
    } finally {
      setIsCreatingDeal(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!deleteTarget) return;
    setIsDeletingDeal(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setDeleteError(result?.error || "Unable to delete this deal opportunity.");
        return;
      }
      setDeals((current) => current.filter((deal) => deal.id !== deleteTarget.id));
      setExistingClients((current) => current.filter((client) => client.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Network error while deleting this deal opportunity.");
    } finally {
      setIsDeletingDeal(false);
    }
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
    void handleMoveStage(draggedDealId, targetStageId as Deal["stage"]);
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
            Track active transactions across four operating stages: New Inquiry → Contacted → Written Offer → Management Handover. Completed outcomes are kept in the closed deal register below.
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
            {openDeals.length} active opportunities
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-contour-red uppercase tracking-wider">
            Expected Commission
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
            Written offer stage age
          </span>
        </MotionCard>

        <MotionCard withCorners className="p-3 sm:p-4">
          <span className="text-[9px] sm:text-[10px] font-heading font-bold text-editorial-black uppercase tracking-wider">
            Funnel Balance
          </span>
          <div className="font-geist text-xs sm:text-base font-bold text-editorial-black mt-1 tracking-tight">
            {openDeals.length} Open • {closedDeals.filter((d) => d.outcome === "WON").length} Won
          </div>
          <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted mt-0.5 block">
            {deals.length > 0
              ? ((closedDeals.filter((d) => d.outcome === "WON").length / deals.length) * 100).toFixed(0)
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
            <div key={deal.id} className="bg-white p-4 border border-editorial-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-geist font-semibold uppercase tracking-wider text-editorial-muted">
                  📍 {deal.suburb}
                </span>
                <span className="text-[10px] font-geist text-editorial-muted">
                  {deal.daysInStage}d in stage
                </span>
              </div>

              {/* Client & Associations Box - Client is Locked */}
              <div className="p-3 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-2">
                <div className="flex items-center justify-between border-b border-editorial-border/60 pb-1.5">
                  <span className="text-editorial-muted text-[10px] font-heading font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-editorial-muted" /> Client (Locked):
                  </span>
                  <strong className="text-editorial-black font-semibold text-right truncate max-w-[170px]" title={deal.clientName}>
                    {deal.clientName}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-editorial-muted flex items-center gap-1 text-[11px]">
                    <Building className="w-3 h-3 text-editorial-muted" /> Property:
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditModal(deal)}
                    className="text-editorial-black font-medium hover:text-contour-red hover:underline text-right truncate max-w-[170px] flex items-center gap-1"
                  >
                    <span className="truncate">{deal.propertyTitle || "Unassigned"}</span>
                    <Edit3 className="w-2.5 h-2.5 shrink-0 text-editorial-muted" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-editorial-muted flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-editorial-muted" /> Agent:
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditModal(deal)}
                    className="text-editorial-black font-medium hover:text-contour-red hover:underline text-right truncate max-w-[170px] flex items-center gap-1"
                  >
                    <span className="truncate">{deal.agentName || "Unassigned"}</span>
                    <Edit3 className="w-2.5 h-2.5 shrink-0 text-editorial-muted" />
                  </button>
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
                  <div className="text-[9px] font-geist text-contour-red uppercase">{deal.agencyCommissionPct}% Commission</div>
                  <div className="font-geist font-bold text-sm text-contour-red">
                    {formatCurrency(deal.agencyCommission, deal.currency)}
                  </div>
                </div>
              </div>

              {/* Touch Actions: Move Stage, Edit Deal, & WhatsApp */}
              <div className="space-y-2 pt-2 border-t border-editorial-border">
                <select
                  value={deal.stage}
                  onChange={(e) => handleMoveStage(deal.id, e.target.value as Deal["stage"])}
                  disabled={isKeyPending(pendingDealActions, `${deal.id}:move`)}
                  className="w-full bg-white px-2 py-2 border border-editorial-border text-[11px] font-heading font-semibold uppercase tracking-wider text-editorial-black focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      Move: {s.label}
                    </option>
                  ))}
                </select>
                {isKeyPending(pendingDealActions, `${deal.id}:move`) && (
                  <span role="status" className="flex items-center gap-2 text-[11px] text-contour-red">
                    <ContourSunLoader size="sm" label="Moving deal…" decorative />
                    Moving deal…
                  </span>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(deal)}
                    className="w-full py-2 px-2 border border-editorial-border bg-white hover:bg-neutral-50 text-editorial-black flex items-center justify-center gap-1 font-heading text-[11px] font-semibold uppercase tracking-wider"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Deal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteError(""); setDeleteTarget(deal); }}
                    className="w-full py-2 px-2 border border-red-200 bg-white hover:bg-red-50 text-red-700 flex items-center justify-center gap-1 font-heading text-[11px] font-semibold uppercase tracking-wider"
                    title="Delete deal opportunity"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                  <a
                    href={`https://wa.me/${formatWhatsAppDigits(deal.clientPhone)}?text=Hello%20${encodeURIComponent(deal.clientName)}%2C%20following%20up%20on%20${encodeURIComponent(deal.propertyTitle)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-fill-wipe bg-[#25D366] text-white py-2 px-2 flex items-center justify-center gap-1 font-heading text-[11px] font-semibold uppercase tracking-wider"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {deal.stage === "CLOSED" && (
                <div className="pt-2 border-t border-editorial-border">
                  {deal.outcome === "WON" ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 text-xs font-geist font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CLOSED WON
                      </span>
                      <button
                        type="button"
                        onClick={() => openCloseModal(deal)}
                        className="text-[10px] uppercase tracking-wider underline text-emerald-950 font-semibold"
                      >
                        Edit Outcome
                      </button>
                    </div>
                  ) : deal.outcome === "LOST" ? (
                    <div className="p-2 bg-red-50 border border-red-200 text-xs font-geist text-red-900 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-red-700">
                          <X className="w-3.5 h-3.5" /> CLOSED LOST
                        </span>
                        <button
                          type="button"
                          onClick={() => openCloseModal(deal)}
                          className="text-[10px] uppercase tracking-wider underline text-red-950 font-semibold"
                        >
                          Edit Outcome
                        </button>
                      </div>
                      {deal.lostReason && (
                        <p className="text-[11px] text-red-800 italic bg-white/70 p-1.5 border border-red-100">
                          "{deal.lostReason}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 text-xs font-geist text-amber-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Outcome Pending</span>
                      <button
                        type="button"
                        onClick={() => openCloseModal(deal)}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider"
                      >
                        Record Outcome
                      </button>
                    </div>
                  )}
                </div>
              )}
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
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="grid grid-cols-4 gap-3.5 items-start min-w-[860px]">
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
                      className={`bg-white p-3.5 border transition-all space-y-2.5 select-none ${
                        draggedDealId === deal.id
                          ? "opacity-30 border-dashed border-editorial-black cursor-grabbing"
                          : "border-editorial-border hover:border-editorial-black cursor-grab"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-geist font-semibold uppercase tracking-wider text-editorial-muted">
                          📍 {deal.suburb}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(deal);
                          }}
                          className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted hover:text-editorial-black flex items-center gap-1 transition-colors px-1.5 py-0.5 border border-transparent hover:border-editorial-border hover:bg-neutral-50"
                          title="Edit deal details & associations"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Client & Associations Box - Client is Locked */}
                      <div className="p-2.5 bg-neutral-50 border border-editorial-border text-xs font-geist space-y-1.5">
                        <div className="flex items-center justify-between border-b border-editorial-border/60 pb-1">
                          <span className="text-[10px] uppercase tracking-wider text-editorial-muted font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3 text-editorial-muted" /> Client:
                          </span>
                          <strong className="text-editorial-black truncate max-w-[110px]" title={deal.clientName}>
                            {deal.clientName}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-editorial-muted flex items-center gap-1">
                            <Building className="w-3 h-3 text-editorial-muted" /> Property:
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(deal);
                            }}
                            className="text-editorial-black font-medium hover:text-contour-red hover:underline truncate max-w-[120px] text-right"
                            title={deal.propertyTitle}
                          >
                            {deal.propertyTitle || "+ Assign"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-editorial-muted flex items-center gap-1">
                            <User className="w-3 h-3 text-editorial-muted" /> Agent:
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(deal);
                            }}
                            className="text-editorial-black font-medium hover:text-contour-red hover:underline truncate max-w-[120px] text-right"
                            title={deal.agentName}
                          >
                            {deal.agentName || "+ Assign"}
                          </button>
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
                          <div className="text-[9px] font-geist text-contour-red uppercase">{deal.agencyCommissionPct}% Commission</div>
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
                          href={`https://wa.me/${formatWhatsAppDigits(deal.clientPhone)}?text=Hello%20${encodeURIComponent(deal.clientName)}%2C%20following%20up%20on%20${encodeURIComponent(deal.propertyTitle)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-contour-red hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteError(""); setDeleteTarget(deal); }}
                          className="text-red-700 hover:underline flex items-center gap-0.5 font-medium"
                          title="Delete deal opportunity"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Delete
                        </button>
                      </div>

                      {stage.id === "CLOSED" && (
                        <div className="pt-2 border-t border-editorial-border">
                          {deal.outcome === "WON" ? (
                            <div className="flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-200 text-[10px] font-geist font-bold text-emerald-800">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CLOSED WON
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openCloseModal(deal); }}
                                className="text-[9px] uppercase tracking-wider underline text-emerald-950 hover:text-emerald-700 font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          ) : deal.outcome === "LOST" ? (
                            <div className="p-1.5 bg-red-50 border border-red-200 text-[10px] font-geist text-red-900 space-y-1">
                              <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1 text-red-700">
                                  <X className="w-3 h-3" /> CLOSED LOST
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openCloseModal(deal); }}
                                  className="text-[9px] uppercase tracking-wider underline text-red-950 hover:text-red-700 font-semibold"
                                >
                                  Edit
                                </button>
                              </div>
                              {deal.lostReason && (
                                <p className="text-[9px] text-red-800 italic bg-white/70 p-1 border border-red-100 line-clamp-2">
                                  "{deal.lostReason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-1.5 bg-amber-50 border border-amber-200 text-[10px] font-geist text-amber-900">
                              <span className="text-[9px] font-bold uppercase tracking-wider">Pending</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openCloseModal(deal); }}
                                className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold uppercase tracking-wider"
                              >
                                Set Outcome
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
      </div>

      {/* Closed deals are a register, not an active workflow stage. */}
      <section className="border border-editorial-border bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-editorial-border px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">Closed Deal Register</h2>
            </div>
            <p className="text-xs text-editorial-muted mt-1">Won and lost outcomes completed after management review.</p>
          </div>
          <span className="self-start text-[10px] font-geist font-bold uppercase tracking-wider px-2 py-1 border border-editorial-border bg-neutral-50 text-editorial-muted">
            {closedDeals.length} {closedDeals.length === 1 ? "record" : "records"}
          </span>
        </div>

        {closedDeals.length === 0 ? (
          <div className="p-6 text-center text-xs text-editorial-muted">No closed deals recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-neutral-50 border-b border-editorial-border">
                <tr className="text-[10px] font-heading uppercase tracking-wider text-editorial-muted">
                  <th className="px-4 py-3">Client / Property</th>
                  <th className="px-4 py-3">TO / Agent</th>
                  <th className="px-4 py-3 text-right">Deal Value</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Closed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-editorial-border">
                {closedDeals.map((deal) => (
                  <tr key={deal.id} className="align-top hover:bg-neutral-50/70">
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold text-xs text-editorial-black">{deal.clientName}</div>
                      <div className="text-[11px] text-editorial-muted mt-0.5">{deal.propertyTitle} · {deal.suburb}</div>
                      {deal.lostReason && <div className="text-[10px] text-red-700 mt-1 max-w-xs">Reason: {deal.lostReason}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-editorial-black">{deal.agentName || "Unassigned"}</td>
                    <td className="px-4 py-3 text-right font-geist font-bold text-xs text-editorial-black">{formatCurrency(deal.dealValue, deal.currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-geist font-bold text-xs text-contour-red">{formatCurrency(deal.agencyCommission, deal.currency)}</div>
                      <div className="text-[10px] text-editorial-muted">{deal.agencyCommissionPct}%</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider border ${deal.outcome === "WON" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                        {deal.outcome === "WON" ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {deal.outcome === "WON" ? "Won" : "Lost"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-editorial-muted whitespace-nowrap">
                      {deal.closedAt ? new Date(deal.closedAt).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button type="button" onClick={() => openCloseModal(deal)} className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted hover:text-editorial-black hover:underline">Edit outcome</button>
                        <button type="button" onClick={() => { setDeleteError(""); setDeleteTarget(deal); }} className="text-red-700 hover:underline" title="Delete closed deal"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-red-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-editorial-black">Delete deal opportunity?</h3>
                <p className="text-xs text-editorial-muted mt-1">This will remove the pipeline opportunity for {deleteTarget.clientName}. This action cannot be undone.</p>
              </div>
            </div>
            {deleteError && <p className="border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">{deleteError}</p>}
            <div className="flex justify-end gap-2 border-t border-editorial-border pt-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeletingDeal} className="px-3 py-2 border border-editorial-border text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black">Cancel</button>
              <button type="button" onClick={() => void handleDeleteDeal()} disabled={isDeletingDeal} className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50">
                {isDeletingDeal ? <ContourSunLoader size="sm" label="Deleting deal…" decorative /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeletingDeal ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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

            <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
              {/* Client Selection Section - Deal is locked to this client */}
              <div className="space-y-2 border border-editorial-border p-3 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-semibold uppercase tracking-wider text-editorial-black text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-contour-red" /> Client Association (Locked) *
                  </label>
                  <div className="flex border border-editorial-border bg-white text-[10px] font-heading font-semibold uppercase">
                    <button
                      type="button"
                      onClick={() => setClientSelectionMode("existing")}
                      className={`px-2 py-1 transition-colors ${clientSelectionMode === "existing" ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"}`}
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientSelectionMode("new")}
                      className={`px-2 py-1 transition-colors ${clientSelectionMode === "new" ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"}`}
                    >
                      + New Client
                    </button>
                  </div>
                </div>

                {clientSelectionMode === "existing" ? (
                  <div>
                    <select
                      value={formData.selectedExistingClientId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        const matched = existingClients.find((c) => c.id === cId);
                        setFormData({
                          ...formData,
                          selectedExistingClientId: cId,
                          clientName: matched?.clientName || "",
                          clientPhone: matched?.clientPhone || "",
                          clientEmail: matched?.clientEmail || "",
                        });
                      }}
                      className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                      required
                    >
                      <option value="">Select an existing client...</option>
                      {existingClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName} ({c.clientPhone})
                        </option>
                      ))}
                    </select>
                    {existingClients.length === 0 && (
                      <p className="text-[10px] text-editorial-muted mt-1">
                        No existing clients found yet. Switch to "+ New Client" to register.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-heading uppercase text-editorial-muted mb-0.5">
                          Client Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Banda"
                          value={formData.clientName}
                          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                          className="w-full bg-white px-3 py-1.5 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-heading uppercase text-editorial-muted mb-0.5">
                          Client Phone *
                        </label>
                        <PhoneNumberInput
                          value={formData.clientPhone}
                          onChange={(clientPhone) => setFormData({ ...formData, clientPhone })}
                          label=""
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading uppercase text-editorial-muted mb-0.5">
                        Client Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                        className="w-full bg-white px-3 py-1.5 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                      />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-editorial-muted italic">
                  Note: A deal is permanently locked to this client once created.
                </p>
              </div>

              {/* Property Target Selection */}
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1 flex items-center justify-between">
                  <span>Property Target</span>
                  <span className="text-[10px] text-editorial-muted font-normal font-geist lowercase">can link or change later</span>
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  <option value="">No Property Associated (Unassigned)</option>
                  {availableProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.suburb || "Lusaka"}) {p.askingPrice ? `- ${formatCurrency(p.askingPrice, "ZMW")}` : ""}
                    </option>
                  ))}
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
                    <option value="CONTACTED">Contacted</option>
                    <option value="OFFER_MADE">Written Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Lead Source
                  </label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="WALK_IN">Walk-in Client</option>
                    <option value="WHATSAPP">WhatsApp Direct</option>
                    <option value="WEBSITE">Website Ingest</option>
                    <option value="CLIENT_REFERRAL">Client Referral</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Closing Agent Selection */}
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1 flex items-center justify-between">
                  <span>Assigned Agent (Org Member)</span>
                  <span className="text-[10px] text-editorial-muted font-normal font-geist lowercase">can reassign later</span>
                </label>
                <select
                  value={formData.assignedAgentId}
                  onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.role ? `(${agent.role})` : ""}
                    </option>
                  ))}
                </select>
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
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as "ZMW" | "USD" })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-editorial-border flex items-center justify-between">
                <span className="text-editorial-muted font-heading text-xs uppercase tracking-wider">
                  Expected {availableProperties.find((p) => p.id === formData.propertyId)?.agencyCommissionPct ?? 5}% Agency Fee:
                </span>
                <span className="font-geist font-bold text-contour-red text-sm">
                  {formatCurrency(
                    (parseFloat(formData.dealValue) || 0) * ((availableProperties.find((p) => p.id === formData.propertyId)?.agencyCommissionPct ?? 5) / 100),
                    formData.currency,
                  )}
                </span>
              </div>

              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Notes / Requirements (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Specific requirements, preferred payment structure, etc."
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreatingDeal}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeal}
                  aria-busy={isCreatingDeal}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <PendingButtonContent
                    pending={isCreatingDeal}
                    pendingLabel="Creating deal…"
                    icon={<Sparkles className="h-3.5 w-3.5 text-contour-red" />}
                  >
                    Create Opportunity
                  </PendingButtonContent>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Modal: Edit Deal Associations (Client is Locked) */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-geist">
          <div className="bg-white max-w-lg w-full p-6 border border-editorial-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-editorial-black" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Edit Deal Associations & Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeal(null)}
                className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 text-xs font-geist">
                ⚠️ {editError}
              </div>
            )}

            {/* Locked Client Banner */}
            <div className="p-3 bg-neutral-50 border border-editorial-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold uppercase tracking-wider text-[11px] text-editorial-black flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-contour-red" />
                  <span>Client (Permanently Locked)</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-neutral-200 text-editorial-black font-semibold">
                  Locked
                </span>
              </div>
              <div className="text-xs font-geist text-editorial-black">
                <strong>{editingDeal.clientName}</strong> • {editingDeal.clientPhone}
                {editingDeal.clientEmail && (
                  <span className="text-editorial-muted"> ({editingDeal.clientEmail})</span>
                )}
              </div>
              <p className="text-[10px] font-geist text-editorial-muted italic">
                Deals remain strictly anchored to this client. You can reassign or associate the property, agent, value, and stage below.
              </p>
            </div>

            <form onSubmit={handleSaveEditDeal} className="space-y-3.5 text-xs">
              {/* Associated Property (Editable) */}
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-editorial-muted" /> Associated Property
                  </span>
                  <span className="text-[10px] text-editorial-muted font-normal font-geist lowercase">link or change</span>
                </label>
                <select
                  value={editFormData.propertyId}
                  onChange={(e) => setEditFormData({ ...editFormData, propertyId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  <option value="">No Property Associated (Unassigned)</option>
                  {availableProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.suburb || "Lusaka"}) {p.askingPrice ? `- ${formatCurrency(p.askingPrice, "ZMW")}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Associated Agent (Editable) */}
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-editorial-muted" /> Associated Agent (Org Member)
                  </span>
                  <span className="text-[10px] text-editorial-muted font-normal font-geist lowercase">assign or change</span>
                </label>
                <select
                  value={editFormData.assignedAgentId}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedAgentId: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.role ? `(${agent.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editFormData.stage}
                    onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value as Deal["stage"] })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Currency
                  </label>
                  <select
                    value={editFormData.currency}
                    onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value as "ZMW" | "USD" })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist"
                  >
                    <option value="ZMW">ZMW (K)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Deal Value */}
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Deal Value *
                </label>
                <input
                  type="number"
                  value={editFormData.dealValue}
                  onChange={(e) => setEditFormData({ ...editFormData, dealValue: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-geist"
                  required
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-editorial-border flex items-center justify-between">
                <span className="text-editorial-muted font-heading text-xs uppercase tracking-wider">
                  Expected {availableProperties.find((p) => p.id === editFormData.propertyId)?.agencyCommissionPct ?? editingDeal?.agencyCommissionPct ?? 5}% Agency Fee:
                </span>
                <span className="font-geist font-bold text-contour-red text-sm">
                  {formatCurrency(
                    (parseFloat(editFormData.dealValue) || 0) * ((availableProperties.find((p) => p.id === editFormData.propertyId)?.agencyCommissionPct ?? editingDeal?.agencyCommissionPct ?? 5) / 100),
                    editFormData.currency,
                  )}
                </span>
              </div>

              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Notes / Progress Updates
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  placeholder="Status notes, agreed terms, follow-up deadlines..."
                  className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none font-geist text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red disabled:opacity-50 text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <PendingButtonContent
                    pending={isSavingEdit}
                    pendingLabel="Saving deal…"
                    icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  >
                    Save Associations
                  </PendingButtonContent>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {closeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-geist">
          <div className="bg-white max-w-md w-full p-6 border border-editorial-border space-y-4">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider">Close deal</h3>
              <button
                type="button"
                onClick={() => setCloseTarget(null)}
                className="flex items-center justify-center w-8 h-8 rounded-none border border-editorial-border bg-white text-editorial-black hover:bg-editorial-black hover:text-white transition-all shadow-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-editorial-muted">Record the outcome for {closeTarget.clientName}. A lost outcome requires a reason for future follow-up and reporting.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCloseOutcome("WON")} className={`flex-1 px-3 py-2 border text-xs font-heading uppercase tracking-wider ${closeOutcome === "WON" ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-editorial-border"}`}>Won</button>
              <button type="button" onClick={() => setCloseOutcome("LOST")} className={`flex-1 px-3 py-2 border text-xs font-heading uppercase tracking-wider ${closeOutcome === "LOST" ? "border-red-700 bg-red-50 text-red-800" : "border-editorial-border"}`}>Lost</button>
            </div>
            {closeOutcome === "LOST" && (
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">Reason for lost deal *</label>
                <textarea value={lostReason} onChange={(event) => setLostReason(event.target.value)} minLength={10} maxLength={2000} rows={4} className="w-full bg-white px-3 py-2 border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-geist" placeholder="Explain what prevented the deal from closing..." />
                <p className="text-[10px] text-editorial-muted mt-1">Minimum 10 characters.</p>
              </div>
            )}
            <div className="pt-3 flex justify-end gap-2 border-t border-editorial-border">
              <button type="button" onClick={() => setCloseTarget(null)} className="px-4 py-2 border border-editorial-border text-xs font-heading uppercase tracking-wider">Cancel</button>
              <button type="button" disabled={isClosingDeal || (closeOutcome === "LOST" && lostReason.trim().length < 10)} aria-busy={isClosingDeal} onClick={() => void handleCloseDeal()} className="px-4 py-2 bg-editorial-black disabled:opacity-40 text-white text-xs font-heading uppercase tracking-wider">
                <PendingButtonContent pending={isClosingDeal} pendingLabel="Closing deal…">Save outcome</PendingButtonContent>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealPipelinePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading pipeline board...</div>}>
      <DealPipelineContent />
    </React.Suspense>
  );
}
