"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  MessageSquare,
  Share2,
  Lock,
  Compass,
  Bed,
  Bath,
  PhoneCall,
  Search,
  Sparkles,
  ChevronLeft,
  Bot,
  UserCheck,
  Menu,
  X,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  LogOut,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Calendar,
  Check,
  ExternalLink,
  Plus,
  Building2,
  Home,
  Users,
  Briefcase,
  Wallet,
  Mic,
  Camera,
  Send,
  SlidersHorizontal,
  ArrowUpRight,
  Filter,
  CheckCheck,
  Phone,
  Layers,
  Sparkle,
  Map as MapIcon,
  Navigation,
  Crosshair
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ContourGenUiModal from "@/components/ai/contour-genui-modal";
import { PowerSyncProvider, usePowerSync } from "@/lib/powersync";
import { PropertyMapItem } from "@/components/map/interactive-property-map";

// Dynamically import InteractivePropertyMap with SSR disabled to prevent Leaflet window errors
const InteractivePropertyMap = dynamic(
  () => import("@/components/map/interactive-property-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[60vh] rounded-2xl bg-[#0F1B14] border border-emerald-900/50 flex flex-col items-center justify-center text-xs text-emerald-400 gap-2 animate-pulse">
        <MapPin className="w-6 h-6 text-[#E57A1A] animate-bounce" />
        <span>Loading Lusaka Spatial Map...</span>
      </div>
    ),
  }
);

export default function FieldAgentPwaPage() {
  return (
    <PowerSyncProvider>
      <AgentKioskContent />
    </PowerSyncProvider>
  );
}

type TabType = "PROPERTIES" | "MAP" | "CLIENTS" | "DEALS" | "EARNINGS";
type IntakeType = "NONE" | "PROPERTY" | "CLIENT" | "OFFER";

function AgentKioskContent() {
  const {
    isOnline,
    loading,
    properties,
    clients,
    outboxCount,
    toggleNetwork,
    syncData,
    addToOutbox,
    playNeutralTone,
    playSuccessTone,
  } = usePowerSync();

  // Active Bottom Navigation Tab & Sub-View
  const [activeTab, setActiveTab] = useState<TabType>("PROPERTIES");
  const [propertyViewMode, setPropertyViewMode] = useState<"LIST" | "MAP">("LIST");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState("ALL");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"ALL" | "SALE" | "RENT">("ALL");

  // Selection & Modal States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [matchedProperty, setMatchedProperty] = useState<any | null>(null);
  const [selectedMapProperty, setSelectedMapProperty] = useState<any | null>(null);
  const [intakeDrawer, setIntakeDrawer] = useState<IntakeType>("NONE");
  const [selectedCommissionSlip, setSelectedCommissionSlip] = useState<any | null>(null);

  // AI Voice/Text Copilot State
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessage, setCopilotMessage] = useState<string | null>(null);
  const [isParsingCopilot, setIsParsingCopilot] = useState(false);

  // Agent Persona State (Default: Tembo Mwape)
  const [currentAgent, setCurrentAgent] = useState({
    id: "agt_tembo",
    name: "Tembo Mwape",
    role: "Senior Field Broker",
    zone: "Lusaka East (Kabulonga, Leopards Hill, Woodlands)",
    phone: "+260 97 123 4567",
    email: "tembo.mwape@contour.co.zm",
    earnedSplitUsd: 18500,
    earnedSplitZmw: 45000,
    pendingSplitZmw: 125000,
    pendingSplitUsd: 21250,
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  // Deals State with optimistic transitions
  const [agentDeals, setAgentDeals] = useState([
    {
      id: "deal_t01",
      propertyTitle: "Executive 4-Bedroom Standalone Residence",
      suburb: "Kabulonga",
      clientName: "Nchimunya Mweene",
      value: "K 3,500,000",
      stage: "OFFER_ACCEPTED",
      stageLabel: "Offer Accepted",
      agentSplitEst: "K 87,500 (50%)",
      lockDaysRemaining: 24,
      updatedAt: "Today, 10:15 AM",
    },
    {
      id: "deal_t02",
      propertyTitle: "5-Acre Commercial Development Plot",
      suburb: "Roma Park",
      clientName: "Mwamba & Sons Holdings",
      value: "$ 850,000",
      stage: "DEEDS_LODGED",
      stageLabel: "Deeds Lodged at Lands",
      agentSplitEst: "$ 21,250 (50%)",
      lockDaysRemaining: 18,
      updatedAt: "Yesterday, 3:30 PM",
    },
    {
      id: "deal_t03",
      propertyTitle: "Modern 3-Bed Semi-Detached Townhouse",
      suburb: "Leopards Hill",
      clientName: "Dr. Thabo Zulu",
      value: "$ 2,500 / mo",
      stage: "VIEWING_SCHEDULED",
      stageLabel: "Viewing Scheduled (Tomorrow 14:00)",
      agentSplitEst: "$ 1,250 (50% 1st Mo)",
      lockDaysRemaining: 29,
      updatedAt: "Today, 08:45 AM",
    },
  ]);

  // Form States for Intake
  const [newPropTitle, setNewPropTitle] = useState("");
  const [newPropSuburb, setNewPropSuburb] = useState("Kabulonga");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropType, setNewPropType] = useState<"SALE" | "RENT">("SALE");
  const [newPropCurrency, setNewPropCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [newPropBeds, setNewPropBeds] = useState("4");
  const [newPropMandate, setNewPropMandate] = useState("EXCLUSIVE");

  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientBudget, setNewClientBudget] = useState("");
  const [newClientCurrency, setNewClientCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [newClientSuburb, setNewClientSuburb] = useState("Kabulonga");

  const [offerPropertyId, setOfferPropertyId] = useState("");
  const [offerClientName, setOfferClientName] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerTerms, setOfferTerms] = useState("CASH_30_DAYS");

  // Suburbs List
  const suburbs = ["ALL", "Kabulonga", "Leopards Hill", "Roma Park", "Ibex Hill", "Mass Media", "Woodlands"];

  const DEFAULT_PROPERTIES = [
    {
      id: "prop_01",
      title: "Executive 4-Bedroom Standalone Residence",
      slug: "executive-4-bedroom-standalone-residence",
      suburb: "Kabulonga",
      city: "Lusaka",
      price: 3500000,
      askingPrice: 3500000,
      currency: "ZMW",
      propertyType: "RESIDENTIAL_SALE",
      listingType: "FOR_SALE",
      status: "AVAILABLE",
      ownershipType: "MANAGED_ON_BEHALF",
      bedrooms: 4,
      bathrooms: 3,
      plotSizeSqm: 2400,
      latitude: -15.4215,
      longitude: 28.3345,
      photos: ["/images/villa-hero.webp"],
      mandateType: "EXCLUSIVE",
    },
    {
      id: "prop_02",
      title: "Luxury 5-Bed Diplomatic Villa with Pool",
      slug: "luxury-5-bed-diplomatic-villa",
      suburb: "Leopards Hill",
      city: "Lusaka",
      price: 3500,
      rentalPrice: 3500,
      currency: "USD",
      propertyType: "RESIDENTIAL_RENTAL",
      listingType: "FOR_RENT",
      status: "AVAILABLE",
      ownershipType: "MANAGED_ON_BEHALF",
      bedrooms: 5,
      bathrooms: 4,
      plotSizeSqm: 4000,
      latitude: -15.4480,
      longitude: 28.3810,
      photos: ["/images/villa-hero.webp"],
      mandateType: "EXCLUSIVE",
    },
    {
      id: "prop_03",
      title: "5-Acre Commercial Mixed-Use Development Land",
      slug: "5-acre-commercial-mixed-use-development-land",
      suburb: "Roma Park",
      city: "Lusaka",
      price: 850000,
      askingPrice: 850000,
      currency: "USD",
      propertyType: "COMMERCIAL_LAND",
      listingType: "FOR_SALE",
      status: "AVAILABLE",
      ownershipType: "COMPANY_OWNED",
      bedrooms: 0,
      bathrooms: 0,
      plotSizeSqm: 20234,
      latitude: -15.3850,
      longitude: 28.3120,
      photos: ["/images/villa-hero.webp"],
      mandateType: "EXCLUSIVE",
    },
    {
      id: "prop_04",
      title: "Modern 3-Bedroom Semi-Detached Townhouse",
      slug: "modern-3-bed-townhouse-ibex",
      suburb: "Ibex Hill",
      city: "Lusaka",
      price: 1800,
      rentalPrice: 1800,
      currency: "USD",
      propertyType: "RESIDENTIAL_RENTAL",
      listingType: "FOR_RENT",
      status: "AVAILABLE",
      ownershipType: "MANAGED_ON_BEHALF",
      bedrooms: 3,
      bathrooms: 2,
      plotSizeSqm: 800,
      latitude: -15.4380,
      longitude: 28.3650,
      photos: ["/images/villa-hero.webp"],
      mandateType: "EXCLUSIVE",
    },
  ];

  const displayProperties = properties && properties.length > 0 ? properties : DEFAULT_PROPERTIES;

  // Filtered Properties
  const filteredProperties = displayProperties.filter((p: any) => {
    const matchesSub = selectedSub === "ALL" || p.suburb?.toLowerCase() === selectedSub.toLowerCase();
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb?.toLowerCase().includes(search.toLowerCase()) ||
      p.propertyType?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      propertyTypeFilter === "ALL" ||
      (propertyTypeFilter === "SALE" && (p.listingType === "FOR_SALE" || !p.listingType)) ||
      (propertyTypeFilter === "RENT" && p.listingType === "FOR_RENT");
    return matchesSub && matchesSearch && matchesType;
  });

  // Map Format for InteractivePropertyMap
  const mapItems: PropertyMapItem[] = filteredProperties.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug || p.id,
    listingType: p.listingType || "FOR_SALE",
    status: p.status || "AVAILABLE",
    ownershipType: p.ownershipType || "MANAGED_ON_BEHALF",
    askingPrice: p.price || p.askingPrice || null,
    rentalPrice: p.rentalPrice || (p.listingType === "FOR_RENT" ? p.price : null),
    currency: p.currency || "ZMW",
    bedrooms: p.bedrooms || 4,
    bathrooms: p.bathrooms || 3,
    plotSizeSqm: p.plotSizeSqm || 2000,
    suburb: p.suburb || "Kabulonga",
    city: p.city || "Lusaka",
    latitude: p.latitude || -15.4215,
    longitude: p.longitude || 28.3345,
    photos: p.photos && p.photos.length > 0 ? p.photos : ["/images/villa-hero.webp"],
    description: p.description,
  }));

  // 1-Click WhatsApp Pitch Generator
  const generateWhatsAppFlyer = (p: any) => {
    const rawPrice = p.price || p.askingPrice || p.rentalPrice || 0;
    const priceStr = formatCurrency(Number(rawPrice), p.currency || "ZMW");
    const text = `*🏡 CONTOUR EXCLUSIVE MANDATE — ${p.title.toUpperCase()}*\n\n` +
      `📍 *Location:* ${p.suburb}, Lusaka\n` +
      `💰 *Price:* ${priceStr}${p.listingType === "FOR_RENT" ? " / month" : ""}\n` +
      `🛏 *Specs:* ${p.bedrooms || 4} Beds | ${p.bathrooms || 3} Baths\n` +
      `📐 *Zoning/Land:* Verified Ministry Clean Title\n\n` +
      `⚡ *Viewing Coordinates & Key Custody:* Available via Contour Broker Portal.\n\n` +
      `_Contact ${currentAgent.name} (${currentAgent.role}) on ${currentAgent.phone} to arrange private access._`;

    return text;
  };

  const copyWhatsAppFlyer = (p: any) => {
    const flyer = generateWhatsAppFlyer(p);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(flyer).catch(() => {});
    }
    setCopiedId(p.id);
    playSuccessTone();
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Submit Intake: New Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle || !newPropPrice) return;

    const payload = {
      title: newPropTitle,
      suburb: newPropSuburb,
      price: Number(newPropPrice),
      currency: newPropCurrency,
      propertyType: newPropType === "SALE" ? "RESIDENTIAL_SALE" : "RESIDENTIAL_RENTAL",
      listingType: newPropType === "SALE" ? "FOR_SALE" : "FOR_RENT",
      bedrooms: Number(newPropBeds),
      bathrooms: Math.max(1, Number(newPropBeds) - 1),
      mandateType: newPropMandate,
      agentId: currentAgent.id,
      agentName: currentAgent.name,
      latitude: newPropSuburb === "Kabulonga" ? -15.4215 : newPropSuburb === "Leopards Hill" ? -15.4480 : -15.3850,
      longitude: newPropSuburb === "Kabulonga" ? 28.3345 : newPropSuburb === "Leopards Hill" ? 28.3810 : 28.3120,
      createdAt: new Date().toISOString(),
    };

    await addToOutbox("PROPERTY", "/api/properties", payload);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setNewPropTitle("");
    setNewPropPrice("");
  };

  // Submit Intake: New Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    const payload = {
      clientName: newClientName,
      clientPhone: newClientPhone,
      budgetMax: Number(newClientBudget) || 0,
      currency: newClientCurrency,
      preferredSuburbs: [newClientSuburb],
      assignedAgentId: currentAgent.id,
      exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await addToOutbox("INQUIRY", "/api/clients", payload);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setNewClientName("");
    setNewClientPhone("");
    setNewClientBudget("");
  };

  // Submit Intake: Formal Offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerClientName || !offerAmount) return;

    const newDeal = {
      id: `deal_${Date.now()}`,
      propertyTitle: offerPropertyId ? displayProperties.find((p: any) => p.id === offerPropertyId)?.title || "Executive Mandate" : "Lusaka Mandate",
      suburb: newPropSuburb,
      clientName: offerClientName,
      value: `${newClientCurrency === "USD" ? "$" : "K"} ${Number(offerAmount).toLocaleString()}`,
      stage: "OFFER_MADE",
      stageLabel: "Formal Offer Submitted",
      agentSplitEst: `${newClientCurrency === "USD" ? "$" : "K"} ${(Number(offerAmount) * 0.025).toLocaleString()} (50% Split)`,
      lockDaysRemaining: 30,
      updatedAt: "Just now",
    };

    setAgentDeals([newDeal, ...agentDeals]);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setOfferClientName("");
    setOfferAmount("");
  };

  // Deal Stage Advancement
  const advanceDealStage = (dealId: string) => {
    setAgentDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        if (deal.stage === "VIEWING_SCHEDULED") {
          return { ...deal, stage: "OFFER_MADE", stageLabel: "Offer Made", updatedAt: "Just now" };
        }
        if (deal.stage === "OFFER_MADE") {
          return { ...deal, stage: "OFFER_ACCEPTED", stageLabel: "Offer Accepted", updatedAt: "Just now" };
        }
        if (deal.stage === "OFFER_ACCEPTED") {
          return { ...deal, stage: "DEEDS_LODGED", stageLabel: "Deeds Lodged at Lands", updatedAt: "Just now" };
        }
        if (deal.stage === "DEEDS_LODGED") {
          return { ...deal, stage: "COMMISSION_PAID", stageLabel: "Commission Settled & Paid", updatedAt: "Just now" };
        }
        return deal;
      })
    );
    playSuccessTone();
  };

  // AI Field Copilot Parser
  const handleExecuteCopilot = () => {
    if (!copilotInput.trim()) return;
    setIsParsingCopilot(true);

    setTimeout(() => {
      const lower = copilotInput.toLowerCase();
      if (lower.includes("offer") || lower.includes("k") || lower.includes("$")) {
        const amountMatch = copilotInput.match(/(?:k|\$)\s*(\d+(?:,\d+)*(?:\.\d+)?|\d+k|\d+m)/i);
        const nameMatch = copilotInput.match(/(?:mr|mrs|ms|dr)?\.?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);

        const newDeal = {
          id: `deal_ai_${Date.now()}`,
          propertyTitle: "Kabulonga Executive Villa Mandate",
          suburb: "Kabulonga",
          clientName: nameMatch ? nameMatch[0] : "Verified Client",
          value: amountMatch ? amountMatch[0].toUpperCase() : "K 3,200,000",
          stage: "OFFER_MADE",
          stageLabel: "Formal Offer Submitted via Copilot",
          agentSplitEst: "K 80,000 (50% Split)",
          lockDaysRemaining: 30,
          updatedAt: "Just now (AI Parsed)",
        };

        setAgentDeals((prev) => [newDeal, ...prev]);
        setCopilotMessage(`✅ Successfully logged offer for ${newDeal.clientName} (${newDeal.value}) and attached to Kabulonga Mandate.`);
      } else if (lower.includes("client") || lower.includes("buyer") || lower.includes("register")) {
        setCopilotMessage("✅ Client registered with 30-Day Anti-Poaching Lock in Lusaka East zone.");
      } else {
        setCopilotMessage("✅ Note recorded and synced to Field Outbox.");
      }

      setIsParsingCopilot(false);
      playSuccessTone();
      setCopilotInput("");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#070D0A] text-slate-100 font-sans flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-emerald-950/40">
      
      {/* 1. Top Fixed Field Bar */}
      <header className="sticky top-0 z-40 bg-[#0B1711]/95 backdrop-blur-md border-b border-emerald-900/40 px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Agent Identity & Persona Switcher */}
          <button
            onClick={() => setIsPersonaModalOpen(true)}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E57A1A] to-[#B3580B] text-white flex items-center justify-center font-serif font-bold text-sm shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              {currentAgent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-white leading-tight group-hover:text-[#E57A1A] transition-colors">
                <span>{currentAgent.name}</span>
                <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50">
                  Agent
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">
                {currentAgent.zone.split("(")[0]}
              </p>
            </div>
          </button>

          {/* Right Network & AI Triggers */}
          <div className="flex items-center gap-2">
            
            {/* AI Field Copilot Trigger */}
            <button
              onClick={() => setIsAiCopilotOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open AI Field Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E57A1A]" />
              <span>Copilot</span>
            </button>

            {/* Offline/Online PowerSync Badge */}
            <button
              onClick={toggleNetwork}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                isOnline
                  ? "bg-emerald-950/70 text-emerald-400 border-emerald-700/60"
                  : "bg-amber-950/70 text-amber-300 border-amber-700/60 animate-pulse"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>{isOnline ? "Live" : "Offline"}</span>
              {outboxCount > 0 && (
                <span className="ml-0.5 px-1 py-0.2 bg-amber-500 text-black text-[9px] rounded-full font-bold">
                  {outboxCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollable Canvas */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-28 overflow-y-auto">
        
        {/* ================= TAB 1: PROPERTIES (CATALOG & SPATIAL MAP) ================= */}
        {(activeTab === "PROPERTIES" || activeTab === "MAP") && (
          <div className="space-y-4">
            
            {/* Search, Suburb Chips & Layout Switcher */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Lusaka properties, suburbs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E57A1A] transition-colors"
                  />
                </div>

                {/* View Mode Toggle: [ 📋 List | 🗺️ Map ] */}
                <div className="flex bg-[#101D16] p-1 rounded-xl border border-emerald-900/50 text-xs shrink-0">
                  <button
                    onClick={() => {
                      setPropertyViewMode("LIST");
                      setActiveTab("PROPERTIES");
                      playNeutralTone();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      propertyViewMode === "LIST" && activeTab === "PROPERTIES"
                        ? "bg-[#E57A1A] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => {
                      setPropertyViewMode("MAP");
                      setActiveTab("PROPERTIES");
                      playNeutralTone();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      propertyViewMode === "MAP" || activeTab === "MAP"
                        ? "bg-[#E57A1A] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Map</span>
                  </button>
                </div>
              </div>

              {/* Suburb Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-semibold">
                {suburbs.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSub(sub);
                      playNeutralTone();
                    }}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                      selectedSub === sub
                        ? "bg-[#E57A1A] text-white shadow-sm font-bold"
                        : "bg-[#101D16] text-slate-400 border border-emerald-900/40 hover:text-white"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Type Filter Pill Switcher */}
              <div className="flex items-center gap-2 pt-0.5 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Type:</span>
                <div className="flex bg-[#101D16] p-0.5 rounded-lg border border-emerald-900/40 text-[11px]">
                  {(["ALL", "SALE", "RENT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPropertyTypeFilter(t)}
                      className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
                        propertyTypeFilter === t
                          ? "bg-emerald-900/80 text-emerald-200"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t === "ALL" ? "All" : t === "SALE" ? "For Sale" : "For Rent"}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-[10px] text-emerald-400 font-mono font-bold">
                  {filteredProperties.length} Mandates
                </span>
              </div>
            </div>

            {/* A. MAP VIEW MODE */}
            {(propertyViewMode === "MAP" || activeTab === "MAP") && (
              <div className="space-y-3">
                {/* Embedded Mobile Map Container */}
                <div className="h-[52vh] rounded-2xl overflow-hidden border border-emerald-900/60 relative shadow-lg bg-[#0F1B14]">
                  <InteractivePropertyMap
                    properties={mapItems}
                    onSelectProperty={(prop) => {
                      setSelectedMapProperty(prop);
                      playSuccessTone();
                    }}
                    searchQuery={search}
                    filterType={propertyTypeFilter}
                    className="w-full h-full"
                  />

                  {/* Floating Map Helper Badge */}
                  <div className="absolute top-2.5 left-2.5 z-[1000] bg-[#0B1711]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-800/60 text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 shadow">
                    <Compass className="w-3 h-3 text-[#E57A1A] animate-spin" />
                    <span>Tap any pin to view Mandate</span>
                  </div>
                </div>

                {/* Selected Property Floating Detail Card on Map */}
                {selectedMapProperty ? (
                  <div className="bg-[#0F1B14] border border-emerald-700/80 rounded-2xl p-4 space-y-3 shadow-xl animate-in slide-in-from-bottom-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#E57A1A] bg-[#E57A1A]/10 px-2 py-0.5 rounded border border-[#E57A1A]/20">
                          {selectedMapProperty.suburb}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                          {selectedMapProperty.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-emerald-400 font-mono">
                          {formatCurrency(Number(selectedMapProperty.askingPrice || selectedMapProperty.rentalPrice || 0), selectedMapProperty.currency || "ZMW")}
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase font-mono">
                          {selectedMapProperty.listingType === "FOR_RENT" ? "Per Month" : "Price"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300 py-1 border-y border-emerald-900/40">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedMapProperty.bedrooms || 4} Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedMapProperty.bathrooms || 3} Baths</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 ml-auto font-mono">
                        <Navigation className="w-3 h-3 text-[#E57A1A]" />
                        <span>{selectedMapProperty.latitude.toFixed(4)}, {selectedMapProperty.longitude.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Action Bar on Map Card */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        onClick={() => copyWhatsAppFlyer(selectedMapProperty)}
                        className="py-2 px-3 rounded-xl bg-[#14261C] hover:bg-[#1A3326] text-emerald-300 text-xs font-bold border border-emerald-700/50 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{copiedId === selectedMapProperty.id ? "Copied!" : "WhatsApp Pitch"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setMatchedProperty(selectedMapProperty);
                          playNeutralTone();
                        }}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-900 to-[#10241A] text-white text-xs font-bold border border-emerald-600/40 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Users className="w-3.5 h-3.5 text-[#E57A1A]" />
                        <span>Match Buyers</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B150F] p-3 rounded-xl border border-emerald-950 text-center text-xs text-slate-400">
                    <span>💡 Tap any property pin on the Lusaka map above to preview mandating specs, generate WhatsApp copy, or match registered buyers.</span>
                  </div>
                )}
              </div>
            )}

            {/* B. LIST VIEW MODE */}
            {propertyViewMode === "LIST" && activeTab === "PROPERTIES" && (
              <div className="space-y-3.5">
                {filteredProperties.map((p: any) => {
                  const isCopied = copiedId === p.id;
                  const priceStr = formatCurrency(Number(p.price || p.askingPrice || p.rentalPrice || 0), p.currency || "ZMW");

                  return (
                    <div
                      key={p.id}
                      className="bg-[#0F1B14] border border-emerald-900/50 rounded-2xl p-4 space-y-3 shadow-md hover:border-emerald-700/60 transition-all"
                    >
                      {/* Header: Title & Suburb */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E57A1A] bg-[#E57A1A]/10 px-2 py-0.5 rounded border border-[#E57A1A]/20">
                            {p.suburb || "Lusaka"}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                            {p.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-emerald-400 font-mono">
                            {priceStr}
                          </div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">
                            {p.listingType === "FOR_RENT" ? "Per Month" : "Sale Price"}
                          </span>
                        </div>
                      </div>

                      {/* Property Specs Pill Grid */}
                      <div className="flex items-center gap-3 text-xs text-slate-300 py-1 border-y border-emerald-900/40">
                        <div className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.bedrooms || 4} Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.bathrooms || 3} Baths</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Verified Title</span>
                        </div>
                      </div>

                      {/* Masked PII Notice */}
                      <div className="bg-[#0B150F] px-2.5 py-1.5 rounded-lg border border-emerald-950 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                          <Lock className="w-3 h-3 text-[#E57A1A]" />
                          <span>Landlord PII Masked (Mandate Protected)</span>
                        </span>
                        <span className="font-mono text-slate-500">ID: {p.id.slice(0, 8)}</span>
                      </div>

                      {/* Action Bar */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* WhatsApp Flyer Generator */}
                        <button
                          onClick={() => copyWhatsAppFlyer(p)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            isCopied
                              ? "bg-emerald-600 text-white"
                              : "bg-[#14261C] hover:bg-[#1A3326] text-emerald-300 border border-emerald-700/50"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Pitch Copied!</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                              <span>WhatsApp Pitch</span>
                            </>
                          )}
                        </button>

                        {/* Match Buyers Button */}
                        <button
                          onClick={() => {
                            setMatchedProperty(p);
                            playNeutralTone();
                          }}
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-900 to-[#10241A] hover:from-emerald-800 hover:to-[#173426] text-white text-xs font-bold border border-emerald-600/40 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Users className="w-3.5 h-3.5 text-[#E57A1A]" />
                          <span>Match Buyers</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CLIENTS ================= */}
        {activeTab === "CLIENTS" && (
          <div className="space-y-4">
            
            {/* Header & Intake Trigger */}
            <div className="flex items-center justify-between bg-[#0F1B14] p-3.5 rounded-2xl border border-emerald-900/50">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  30-Day Anti-Poaching Registry
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clients locked exclusively to your agent profile.
                </p>
              </div>
              <button
                onClick={() => setIntakeDrawer("CLIENT")}
                className="px-3 py-1.5 bg-[#E57A1A] hover:bg-[#B3580B] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Client</span>
              </button>
            </div>

            {/* Clients List */}
            <div className="space-y-3">
              {clients.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-[#0F1B14] border border-emerald-900/50 rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{c.name}</h3>
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/60 font-mono font-bold">
                          {c.preferredArea}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-400 font-mono">
                        {c.budget}
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono">
                        Budget Max
                      </span>
                    </div>
                  </div>

                  {/* Anti-Poaching Countdown Badge */}
                  <div className="bg-[#09130D] p-2.5 rounded-xl border border-emerald-950 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{c.lockExpiry}</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-mono font-bold">
                      Protected
                    </span>
                  </div>

                  {/* Direct Communication Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <a
                      href={`tel:${c.phone}`}
                      className="py-2 px-3 rounded-xl bg-[#14261C] hover:bg-[#1A3326] text-white text-xs font-bold border border-emerald-700/40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DEALS ================= */}
        {activeTab === "DEALS" && (
          <div className="space-y-4">
            
            {/* Header & Quick Offer */}
            <div className="flex items-center justify-between bg-[#0F1B14] p-3.5 rounded-2xl border border-emerald-900/50">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Deal Velocity Pipeline
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Track viewings, offers, and title deed completions.
                </p>
              </div>
              <button
                onClick={() => setIntakeDrawer("OFFER")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lodge Offer</span>
              </button>
            </div>

            {/* Deals Stream */}
            <div className="space-y-3.5">
              {agentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-[#0F1B14] border border-emerald-900/50 rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50 font-bold">
                        {deal.suburb}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1 leading-tight">
                        {deal.propertyTitle}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Client: <span className="text-slate-200 font-semibold">{deal.clientName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white font-mono">
                        {deal.value}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                        Split: {deal.agentSplitEst}
                      </div>
                    </div>
                  </div>

                  {/* Stage Badge & Status */}
                  <div className="bg-[#09130D] p-2.5 rounded-xl border border-emerald-950 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                        Current Status
                      </div>
                      <div className="text-xs font-bold text-emerald-300 mt-0.5">
                        {deal.stageLabel}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {deal.updatedAt}
                    </span>
                  </div>

                  {/* Stage Advancement Action */}
                  <button
                    onClick={() => advanceDealStage(deal.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-900 to-[#10241A] hover:from-emerald-800 hover:to-[#163325] text-white text-xs font-bold border border-emerald-700/50 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#E57A1A]" />
                    <span>
                      {deal.stage === "VIEWING_SCHEDULED" && "Advance: Lodge Buyer Offer"}
                      {deal.stage === "OFFER_MADE" && "Advance: Mark Offer Accepted"}
                      {deal.stage === "OFFER_ACCEPTED" && "Advance: Lodge Deeds at Ministry"}
                      {deal.stage === "DEEDS_LODGED" && "Advance: Confirm Payout Settled"}
                      {deal.stage === "COMMISSION_PAID" && "Deal Completed & Settled ✅"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: EARNINGS ================= */}
        {activeTab === "EARNINGS" && (
          <div className="space-y-4">
            
            {/* Commissions Overview Card */}
            <div className="bg-gradient-to-br from-[#0F1E16] to-[#09130E] border border-emerald-800/60 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                    My Commission Splits
                  </span>
                  <h2 className="text-xl font-extrabold text-white font-serif mt-0.5">
                    {currentAgent.name}
                  </h2>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/50 text-[#E57A1A]">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Earnings Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#070E0A] p-3 rounded-xl border border-emerald-950">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Paid (USD)</span>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    ${currentAgent.earnedSplitUsd.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-500">50% Broker Split</span>
                </div>
                <div className="bg-[#070E0A] p-3 rounded-xl border border-emerald-950">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Paid (ZMW)</span>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    K{currentAgent.earnedSplitZmw.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-500">Cleared to Bank</span>
                </div>
              </div>

              {/* Pending In Pipeline */}
              <div className="bg-[#070E0A] p-3.5 rounded-xl border border-emerald-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">
                    Pending In Pipeline
                  </span>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    K {currentAgent.pendingSplitZmw.toLocaleString()} + ${currentAgent.pendingSplitUsd.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 font-mono">
                  3 Deals
                </span>
              </div>
            </div>

            {/* Recent Closed Transactions & Receipts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Closed Transaction Slips
              </h3>

              {[
                {
                  id: "slip_01",
                  property: "Leopards Hill Villa Mandate",
                  grossCommission: "K 90,000",
                  agentSplit: "K 45,000",
                  date: "14 Aug 2026",
                  splitPct: "50%",
                  buyer: "Chanda Chisamba",
                },
                {
                  id: "slip_02",
                  property: "Roma Park Commercial Unit",
                  grossCommission: "$ 37,000",
                  agentSplit: "$ 18,500",
                  date: "28 Jul 2026",
                  splitPct: "50%",
                  buyer: "Bwalya Properties Ltd",
                },
              ].map((slip) => (
                <div
                  key={slip.id}
                  className="bg-[#0F1B14] border border-emerald-900/50 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{slip.property}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Buyer: {slip.buyer}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-400 font-mono">
                        {slip.agentSplit}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">{slip.date}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCommissionSlip(slip)}
                    className="w-full py-2 px-3 rounded-xl bg-[#14261C] hover:bg-[#1A3326] text-emerald-300 text-xs font-bold border border-emerald-700/40 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Digital Commission Slip</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. Dedicated Bottom Dock Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A140F]/95 backdrop-blur-md border-t border-emerald-900/40 max-w-md mx-auto">
        <div className="grid grid-cols-5 items-center px-2 py-2">
          
          {/* Properties (Catalog & Map) Tab */}
          <button
            onClick={() => {
              setActiveTab("PROPERTIES");
              playNeutralTone();
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "PROPERTIES" ? "text-[#E57A1A]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Properties</span>
          </button>

          {/* Clients Tab */}
          <button
            onClick={() => {
              setActiveTab("CLIENTS");
              playNeutralTone();
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "CLIENTS" ? "text-[#E57A1A]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Clients</span>
          </button>

          {/* Center Intake Action FAB */}
          <div className="flex justify-center -mt-5">
            <button
              onClick={() => {
                setIntakeDrawer("PROPERTY");
                playSuccessTone();
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E57A1A] to-[#F59E0B] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-[#070D0A]"
              title="Add Listing / Client / Offer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Deals Tab */}
          <button
            onClick={() => {
              setActiveTab("DEALS");
              playNeutralTone();
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "DEALS" ? "text-[#E57A1A]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Deals</span>
          </button>

          {/* Earnings Tab */}
          <button
            onClick={() => {
              setActiveTab("EARNINGS");
              playNeutralTone();
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "EARNINGS" ? "text-[#E57A1A]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Earnings</span>
          </button>
        </div>
      </footer>

      {/* ================= MODAL: INTAKE DRAWER (FAB) ================= */}
      {intakeDrawer !== "NONE" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0B1711] border border-emerald-900/60 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 text-white max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E57A1A]/20 text-[#E57A1A] flex items-center justify-center font-bold text-xs">
                  +
                </div>
                <div>
                  <h3 className="text-sm font-bold">Field Intake & Mandate Capture</h3>
                  <p className="text-[10px] text-slate-400">Offline-first local SQLite sync</p>
                </div>
              </div>
              <button
                onClick={() => setIntakeDrawer("NONE")}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Intake Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[#060C08] p-1 rounded-xl border border-emerald-950 text-xs">
              <button
                onClick={() => setIntakeDrawer("PROPERTY")}
                className={`py-1.5 rounded-lg font-semibold transition-colors ${
                  intakeDrawer === "PROPERTY" ? "bg-emerald-900 text-white" : "text-slate-400"
                }`}
              >
                🏡 Listing
              </button>
              <button
                onClick={() => setIntakeDrawer("CLIENT")}
                className={`py-1.5 rounded-lg font-semibold transition-colors ${
                  intakeDrawer === "CLIENT" ? "bg-emerald-900 text-white" : "text-slate-400"
                }`}
              >
                👤 Client
              </button>
              <button
                onClick={() => setIntakeDrawer("OFFER")}
                className={`py-1.5 rounded-lg font-semibold transition-colors ${
                  intakeDrawer === "OFFER" ? "bg-emerald-900 text-white" : "text-slate-400"
                }`}
              >
                📝 Offer
              </button>
            </div>

            {/* 1. Property Intake Form */}
            {intakeDrawer === "PROPERTY" && (
              <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Property Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern 4-Bed Standalone Villa"
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E57A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Suburb</label>
                    <select
                      value={newPropSuburb}
                      onChange={(e) => setNewPropSuburb(e.target.value)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      {suburbs.filter((s) => s !== "ALL").map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={newPropBeds}
                      onChange={(e) => setNewPropBeds(e.target.value)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Price</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3500000"
                      value={newPropPrice}
                      onChange={(e) => setNewPropPrice(e.target.value)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                    <select
                      value={newPropCurrency}
                      onChange={(e) => setNewPropCurrency(e.target.value as any)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="ZMW">ZMW (K)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#070E0A] p-2.5 rounded-xl border border-emerald-950 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Camera className="w-3.5 h-3.5" /> Photos Attached (3)
                  </span>
                  <span className="font-mono text-slate-500">GPS: Lusaka East</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E57A1A] hover:bg-[#B3580B] text-white font-bold text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Mandate to Field Outbox</span>
                </button>
              </form>
            )}

            {/* 2. Client Intake Form */}
            {intakeDrawer === "CLIENT" && (
              <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mwamba & Sons Holdings"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#E57A1A]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +260 97 999 8888"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Budget Max</label>
                    <input
                      type="number"
                      placeholder="e.g. 4000000"
                      value={newClientBudget}
                      onChange={(e) => setNewClientBudget(e.target.value)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Zone</label>
                    <select
                      value={newClientSuburb}
                      onChange={(e) => setNewClientSuburb(e.target.value)}
                      className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      {suburbs.filter((s) => s !== "ALL").map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 text-[11px] text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>30-Day Anti-Poaching Lock automatically activated upon save.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lock & Register Client</span>
                </button>
              </form>
            )}

            {/* 3. Offer Intake Form */}
            {intakeDrawer === "OFFER" && (
              <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Property</label>
                  <select
                    value={offerPropertyId}
                    onChange={(e) => setOfferPropertyId(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Choose Mandate...</option>
                    {displayProperties.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.suburb})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Buyer / Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nchimunya Mweene"
                    value={offerClientName}
                    onChange={(e) => setOfferClientName(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Offer Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3200000"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={offerTerms}
                    onChange={(e) => setOfferTerms(e.target.value)}
                    className="w-full bg-[#101D16] border border-emerald-900/50 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="CASH_30_DAYS">Cash Settlement (30 Days)</option>
                    <option value="MORTGAGE_FINANCE">Bank Mortgage / Financing</option>
                    <option value="INSTALLMENTS">Developer Installments (6 Months)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Offer to Principal Broker</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: MATCH REGISTERED BUYERS ================= */}
      {matchedProperty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1711] border border-emerald-900/60 rounded-3xl w-full max-w-md p-5 space-y-4 text-white max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#E57A1A] uppercase font-bold">Reverse Matchmaker</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{matchedProperty.title}</h3>
              </div>
              <button
                onClick={() => setMatchedProperty(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Matched <span className="text-emerald-400 font-bold">{clients.length} registered clients</span> with active budgets in {matchedProperty.suburb || "Lusaka"}:
            </p>

            <div className="space-y-2.5">
              {clients.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-[#0F1B14] p-3 rounded-xl border border-emerald-900/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.budget} • {c.preferredArea}</div>
                  </div>
                  <a
                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(generateWhatsAppFlyer(matchedProperty))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Pitch</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIGITAL COMMISSION SLIP ================= */}
      {selectedCommissionSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1711] border border-emerald-900/60 rounded-3xl w-full max-w-md p-6 space-y-4 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/80 text-emerald-300 flex items-center justify-center font-bold font-serif text-sm">
                  C
                </div>
                <div>
                  <h3 className="text-sm font-bold">Commission Payout Slip</h3>
                  <p className="text-[10px] text-slate-400 font-mono">CONTOUR VOUCHER #{selectedCommissionSlip.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommissionSlip(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#060D09] p-4 rounded-2xl border border-emerald-950 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mandate:</span>
                <span className="font-bold text-white">{selectedCommissionSlip.property}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement Date:</span>
                <span className="font-mono text-slate-200">{selectedCommissionSlip.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Agency Commission (5%):</span>
                <span className="font-mono text-slate-200">{selectedCommissionSlip.grossCommission}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-900/40 pt-2 text-sm font-bold">
                <span className="text-emerald-400">Agent Split (50%):</span>
                <span className="font-mono text-emerald-400">{selectedCommissionSlip.agentSplit}</span>
              </div>
            </div>

            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40 flex items-center gap-2 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Settlement verified and cleared to agent bank account.</span>
            </div>

            <button
              onClick={() => {
                setSelectedCommissionSlip(null);
                playSuccessTone();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: AI FIELD COPILOT ================= */}
      {isAiCopilotOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0B1711] border border-emerald-800/60 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 text-white animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E57A1A] to-[#B3580B] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Contour AI Field Copilot</h3>
                  <p className="text-[10px] text-slate-400">Voice Note & Quick Text Intake</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiCopilotOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Speak or type a field update. The Copilot will extract clients, log offers, or advance deals automatically:
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="e.g. Met Mr. Phiri at Kabulonga plot, offered K3.2M cash, needs title deed scan tomorrow."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                className="w-full bg-[#101D16] border border-emerald-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E57A1A]"
              />

              {/* Sample Prompts */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCopilotInput("Met Mr. Bwalya at Leopards Hill villa, offered K2.8M cash, schedule viewing tomorrow.")}
                  className="bg-[#14261C] text-emerald-300 px-2 py-1 rounded-lg border border-emerald-800/40 hover:bg-emerald-900"
                >
                  ⚡ Offer: K2.8M Leopards Hill
                </button>
                <button
                  type="button"
                  onClick={() => setCopilotInput("Register new buyer Dr. Miti, budget $500k for Roma Park commercial.")}
                  className="bg-[#14261C] text-emerald-300 px-2 py-1 rounded-lg border border-emerald-800/40 hover:bg-emerald-900"
                >
                  ⚡ Register: $500k Buyer
                </button>
              </div>
            </div>

            {copilotMessage && (
              <div className="bg-emerald-950 p-3 rounded-xl border border-emerald-700/60 text-xs text-emerald-200 animate-in fade-in">
                {copilotMessage}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleExecuteCopilot}
                disabled={isParsingCopilot || !copilotInput.trim()}
                className="flex-1 py-3 rounded-xl bg-[#E57A1A] hover:bg-[#B3580B] text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-md"
              >
                {isParsingCopilot ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Parsing Field Note...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Process Field Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PERSONA SWITCHER ================= */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1711] border border-emerald-900/60 rounded-3xl w-full max-w-md p-5 space-y-4 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#E57A1A]" />
                <h3 className="text-sm font-bold">Field Agent Persona Switch</h3>
              </div>
              <button
                onClick={() => setIsPersonaModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  id: "agt_tembo",
                  name: "Tembo Mwape",
                  role: "Senior Field Broker",
                  zone: "Lusaka East (Kabulonga, Leopards Hill, Woodlands)",
                  phone: "+260 97 123 4567",
                  email: "tembo.mwape@contour.co.zm",
                  earnedSplitUsd: 18500,
                  earnedSplitZmw: 45000,
                  pendingSplitZmw: 125000,
                  pendingSplitUsd: 21250,
                },
                {
                  id: "agt_grace",
                  name: "Grace Banda",
                  role: "Commercial Lands Specialist",
                  zone: "Lusaka North (Roma Park, Foxdale, Mass Media)",
                  phone: "+260 96 987 6543",
                  email: "grace.banda@contour.co.zm",
                  earnedSplitUsd: 32000,
                  earnedSplitZmw: 95000,
                  pendingSplitZmw: 240000,
                  pendingSplitUsd: 45000,
                },
              ].map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setCurrentAgent(agent);
                    setIsPersonaModalOpen(false);
                    playSuccessTone();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    currentAgent.id === agent.id
                      ? "bg-emerald-900/60 border-emerald-600 text-white font-bold"
                      : "bg-[#0F1B14] border-emerald-900/40 text-slate-300 hover:border-emerald-700"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">{agent.name}</div>
                    <div className="text-[11px] text-emerald-400">{agent.role}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{agent.zone}</div>
                  </div>
                  {currentAgent.id === agent.id && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-emerald-900/40 flex justify-between items-center text-xs">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-200 text-[11px] underline"
              >
                Switch to Desktop Operations Dashboard
              </Link>
              <button
                onClick={() => setIsPersonaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
