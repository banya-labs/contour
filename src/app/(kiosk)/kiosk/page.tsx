"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ContourGenUiModal from "@/components/ai/contour-genui-modal";
import { PowerSyncProvider, usePowerSync } from "@/lib/powersync";

export default function FieldAgentPwaPage() {
  return (
    <PowerSyncProvider>
      <KioskContent />
    </PowerSyncProvider>
  );
}

function KioskContent() {
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

  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mobile Drawer & Account Modal States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeAccountTab, setActiveAccountTab] = useState<"COMMISSIONS" | "DEALS" | "CLIENTS" | "HISTORY">("COMMISSIONS");

  // Client registration form states
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientBudget, setNewClientBudget] = useState("");
  const [newClientSuburb, setNewClientSuburb] = useState("Kabulonga");

  // Mock Agent Profile & Deals Data for Tembo Mwape
  const agentProfile = {
    name: "Tembo Mwape",
    role: "Senior Field Broker",
    zone: "Lusaka East Mandate (Kabulonga, Leopards Hill, Woodlands)",
    phone: "+260 97 123 4567",
    email: "tembo.mwape@contour.co.zm",
    earnedSplitUsd: 18500,
    earnedSplitZmw: 45000,
    pendingSplitZmw: 125000,
  };

  const agentDeals = [
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
    },
    {
      id: "deal_t02",
      propertyTitle: "5-Acre Commercial Development Plot",
      suburb: "Roma Park",
      clientName: "Mwamba & Sons Holdings",
      value: "$ 850,000",
      stage: "DEEDS_LODGED",
      stageLabel: "Deeds Lodged",
      agentSplitEst: "$ 21,250 (50%)",
      lockDaysRemaining: 18,
    },
  ];

  const agentClients = [
    {
      id: "cli_t01",
      name: "Nchimunya Mweene",
      phone: "+260 97 188 9900",
      budget: "K 4,000,000",
      preferredArea: "Kabulonga",
      lockExpiry: "24 Days (Anti-Poaching Active)",
    },
    {
      id: "cli_t02",
      name: "Dr. Thabo Zulu",
      phone: "+260 96 522 3344",
      budget: "$ 2,500 / mo",
      preferredArea: "Leopards Hill",
      lockExpiry: "18 Days (Anti-Poaching Active)",
    },
  ];

  const agentHistory = [
    {
      id: "hist_01",
      action: "WhatsApp Listing Flyer Sent",
      target: "Executive Kabulonga Residence to Nchimunya Mweene",
      time: "Today, 10:14 AM",
      icon: MessageSquare,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "hist_02",
      action: "Property Viewing Completed",
      target: "Diplomatic Villa, Kabulonga with Dr. Thabo Zulu",
      time: "Yesterday, 3:30 PM",
      icon: CheckCircle2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "hist_03",
      action: "Reverse-Match Alert Triggered",
      target: "Automated WhatsApp dispatch for Leopards Hill Rental",
      time: "15 Aug 2026",
      icon: Sparkles,
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: "hist_04",
      action: "Commission Payout Received",
      target: "Bank Remittance: K 45,000 ZMW credited",
      time: "01 Aug 2026",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  const filtered = properties.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb.toLowerCase().includes(search.toLowerCase());
    const matchesSub = selectedSub === "ALL" || p.suburb === selectedSub;
    return matchesSearch && matchesSub;
  });

  const handleTriggerGenUi = (queryText?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-contour-genui", {
          detail: { query: queryText || "Find available 3-bedroom houses in Lusaka" },
        })
      );
    }
  };

  const handleShareFlyer = (property: any) => {
    const priceText =
      property.listingType === "FOR_RENT"
        ? `${formatCurrency(Number(property.rentalPrice || 0), property.currency)} / mo`
        : formatCurrency(Number(property.askingPrice || 0), property.currency);

    const text = `🏡 *${property.title}*\n📍 *Location:* ${property.suburb}, Lusaka\n🧭 *Landmark:* ${property.landmarkDirections || "Available on request"}\n💰 *Price:* ${priceText}\n\n👉 *View photos & map:* https://contour.app/p/${property.slug}\n\n_Brokered exclusively by ${agentProfile.name} • Contour Real Estate_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(property.id);
      playNeutralTone();
      setTimeout(() => setCopiedId(null), 2000);
      alert("WhatsApp Listing Flyer copied to clipboard! Ready to paste into client chats.");
    }
  };

  const handleRegisterClientOffline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      alert("Name and phone number are required.");
      return;
    }

    const budgetNum = parseFloat(newClientBudget.replace(/[^0-9.]/g, "")) || 1000000;
    const clientPayload = {
      clientName: newClientName,
      clientPhone: newClientPhone,
      lookingFor: "FOR_SALE",
      propertyType: "STANDALONE_HOUSE",
      budgetMax: budgetNum,
      currency: "ZMW",
      preferredSuburbs: [newClientSuburb],
      notes: "Inquiry caught offline in field PWA.",
    };

    addToOutbox("INQUIRY", "/api/clients", clientPayload);

    setNewClientName("");
    setNewClientPhone("");
    setNewClientBudget("");
    setShowAddClient(false);
    alert(`[OFFLINE CACHE] Lead for ${newClientName} recorded! Will synchronize when online.`);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of the Field Companion Kiosk?")) {
      alert("Session logged out successfully. Returning to login.");
      window.location.href = "/login";
    }
  };

  const mergedClients = [...clients, ...agentClients];

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900 font-sans pb-32">
      {/* 1. Tablet & Mobile Responsive Navigation Header */}
      <header className="bg-paper-200/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-subtle">
        {/* Left: Hamburger Button & Title */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-xl text-ink-800 hover:bg-paper-300 hover:text-ink-900 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="font-serif font-bold text-sm sm:text-base text-ink-900 leading-tight">
              Field Companion
            </div>
            <div className="text-[10px] text-ink-600 font-medium">
              📱 {agentProfile.name} • {agentProfile.role}
            </div>
          </div>
        </div>

        {/* Right: Real-time Connection State Pill & Sync Trigger */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleNetwork}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                isOnline
                  ? "bg-contour-emerald/10 text-contour-emerald border-contour-emerald/30 hover:bg-contour-emerald/20"
                  : "bg-paper-300 text-ink-600 border-border hover:bg-paper-400"
              }`}
              title="Toggle Network State"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-contour-emerald animate-pulse" : "bg-ink-500"}`} />
              <span>{isOnline ? "Online" : "Offline Mode"}</span>
            </button>

            {isOnline && (
              <button
                onClick={() => {
                  playNeutralTone();
                  syncData().then(() => playSuccessTone());
                }}
                disabled={loading}
                className="p-1 rounded-full text-ink-600 hover:bg-paper-300 transition-colors"
                title="Force PowerSync Re-Sync"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 8H18.228" />
                </svg>
              </button>
            )}

            {outboxCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-contour-amber text-ink-900 text-[9px] font-bold animate-pulse">
                📤 {outboxCount} Pending
              </span>
            )}
          </div>

          {/* Account Profile Trigger Button */}
          <button
            onClick={() => setIsAccountOpen(true)}
            className="flex items-center gap-2 p-1 pl-2.5 pr-1 rounded-full bg-white border border-border shadow-xs hover:border-contour-red/40 transition-all"
            title="Open Agent Account"
          >
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-bold text-ink-900 leading-none">{agentProfile.name}</div>
              <div className="text-[9px] text-contour-emerald font-semibold">Active In Field</div>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-paper-300 bg-paper-200 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Agent Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </header>

      {/* 2. Main Content Container (Responsive for Mobile, Tablet, Desktop) */}
      <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-6xl mx-auto w-full">
        {/* Offline Banner Indicator */}
        {!isOnline && (
          <div className="p-3 bg-paper-200 border border-border rounded-2xl flex items-center gap-2 text-xs text-ink-700 animate-in slide-in-from-top">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ink-500"></span>
            </span>
            <span>Running in offline-first mode. All listing data is served zero-latency from the local SQLite cache.</span>
          </div>
        )}

        {/* Search & Suburb Filter Controls */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-border shadow-subtle">
            <Search className="w-4 h-4 text-ink-600 shrink-0" />
            <input
              type="text"
              placeholder="Search Lusaka properties, suburbs & landmark cues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            {["ALL", "Kabulonga", "Leopards Hill", "Roma Park", "Woodlands", "Sunningdale"].map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  playNeutralTone();
                  setSelectedSub(sub);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSub === sub
                    ? "bg-ink-900 text-white shadow-subtle"
                    : "bg-white text-ink-800 border border-border hover:bg-paper-200"
                }`}
              >
                {sub === "ALL" ? "All Suburbs" : sub}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Listings Feed (1 Col Mobile, 2 Cols Tablet, 3 Cols Desktop) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-600">
            <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
            <span className="text-xs font-semibold">Syncing SQLite WASM...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-border">
            <Compass className="w-12 h-12 text-ink-400 mb-2" />
            <h3 className="font-semibold text-ink-900">No properties matches</h3>
            <p className="text-xs text-ink-600 max-w-xs">No matching listings found in local offline storage cache.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((property) => {
              const priceText =
                property.listingType === "FOR_RENT"
                  ? `${formatCurrency(Number(property.rentalPrice || 0), property.currency)} / mo`
                  : formatCurrency(Number(property.askingPrice || 0), property.currency);

              const photoUrl = property.featuredPhoto || (property.photos && property.photos[0]) || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80";

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-3xl overflow-hidden border border-border shadow-card flex flex-col justify-between hover:border-contour-red/40 transition-all group"
                >
                  <div>
                    {/* Photo & Badge */}
                    <div className="relative w-full h-48 bg-paper-200 overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-ink-900/90 text-white text-[10px] font-bold px-3 py-0.5 rounded-full backdrop-blur-xs">
                        {property.suburb}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/95 text-contour-red font-mono font-bold text-xs px-3 py-1 rounded-full shadow-subtle">
                        {priceText}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2.5">
                      <h3 className="font-bold text-sm text-ink-900 leading-snug line-clamp-1">
                        {property.title}
                      </h3>

                      {property.landmarkDirections && (
                        <div className="flex items-center gap-1.5 text-xs text-ink-700 bg-paper-100 p-2.5 rounded-xl border border-paper-200">
                          <Compass className="w-3.5 h-3.5 text-contour-red shrink-0" />
                          <span className="truncate">{property.landmarkDirections}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-ink-600 pt-1 border-t border-paper-200">
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-ink-500" /> {property.bedrooms} Beds
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-ink-500" /> {property.bathrooms} Baths
                          </span>
                        )}
                        <span className="ml-auto text-[10px] font-semibold text-emerald-700">
                          Mandate Active 🟢
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="p-3 bg-paper-100 border-t border-border flex items-center gap-2">
                    <Link
                      href={`/p/${property.slug}`}
                      className="flex-1 py-2 rounded-xl bg-paper-200 hover:bg-paper-300 text-ink-900 text-xs font-bold text-center border border-border"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleShareFlyer(property)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 transition-colors ${
                        copiedId === property.id
                          ? "bg-contour-emerald"
                          : "bg-ink-900 hover:bg-ink-950 shadow-subtle active:scale-95"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedId === property.id ? "Copied!" : "Share Flyer"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Sliding Drawer Menu Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2100] bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-left duration-300">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-contour-red text-white flex items-center justify-center font-serif font-bold text-base shadow-subtle">
                    C
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-ink-900">CONTOUR</h3>
                    <p className="text-[10px] text-ink-600">Field Companion Navigation</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-xl text-ink-600 hover:bg-paper-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5 text-xs font-semibold">
                <Link
                  href="/dashboard/properties"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-paper-100 text-ink-900 hover:bg-paper-200 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-contour-red" />
                  <span>Property Inventory Catalog</span>
                </Link>

                <Link
                  href="/dashboard/map"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 text-ink-800 transition-colors"
                >
                  <Compass className="w-4 h-4 text-contour-amber" />
                  <span>Interactive Lusaka Map</span>
                </Link>

                <Link
                  href="/dashboard/pipeline"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 text-ink-800 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-contour-emerald" />
                  <span>Deal Pipeline Kanban</span>
                </Link>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAccountOpen(true);
                    setActiveAccountTab("COMMISSIONS");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 text-ink-800 transition-colors text-left"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>My Commissions Wallet</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAccountOpen(true);
                    setActiveAccountTab("CLIENTS");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-paper-100 text-ink-800 transition-colors text-left"
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Locked Clients CRM</span>
                </button>
              </div>
            </div>

            {/* Logout footer */}
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl border border-border hover:bg-red-50 hover:border-contour-red/30 text-contour-red text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Companion Kiosk</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Full Screen Agent Drawer Account & Commissions Panel */}
      {isAccountOpen && (
        <div className="fixed inset-0 z-[2200] bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-border bg-paper-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Agent"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-900">{agentProfile.name}</h3>
                  <p className="text-[10px] text-ink-600">{agentProfile.role}</p>
                </div>
              </div>

              <button
                onClick={() => setIsAccountOpen(false)}
                className="p-1.5 rounded-xl text-ink-600 hover:bg-paper-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex text-xs font-bold text-center">
              {(["COMMISSIONS", "DEALS", "CLIENTS", "HISTORY"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    playNeutralTone();
                    setActiveAccountTab(tab);
                  }}
                  className={`flex-1 py-3.5 border-b-2 transition-all ${
                    activeAccountTab === tab
                      ? "border-contour-red text-contour-red bg-red-50/5"
                      : "border-transparent text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: COMMISSIONS */}
              {activeAccountTab === "COMMISSIONS" && (
                <div className="space-y-4">
                  {/* Earnings summary */}
                  <div className="p-5 rounded-3xl bg-ink-900 text-white space-y-4 shadow-floating">
                    <div>
                      <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider block">
                        Principal Earned Commission (YTD)
                      </span>
                      <div className="font-mono text-3xl font-bold mt-1">
                        ${agentProfile.earnedSplitUsd.toLocaleString()}
                      </div>
                      <div className="font-mono text-lg font-bold text-ink-400">
                        + K{agentProfile.earnedSplitZmw.toLocaleString()} ZMW
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-ink-400 block">Pending Splits</span>
                        <span className="font-mono font-bold text-contour-amber">
                          K{agentProfile.pendingSplitZmw.toLocaleString()}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/15 text-white">
                        <Check className="w-3 h-3 text-contour-emerald" /> Auto Paystack Wired
                      </span>
                    </div>
                  </div>

                  {/* Anti Poaching locked wallet reminder */}
                  <div className="p-4 rounded-2xl border border-border bg-paper-100 flex items-start gap-2.5 text-xs text-ink-800">
                    <ShieldCheck className="w-5 h-5 text-contour-red shrink-0" />
                    <div className="space-y-1">
                      <strong className="text-ink-900 font-bold">Commission Split Safety</strong>
                      <p className="text-ink-600 leading-relaxed">
                        Splits are secured automatically via organization Membership claims. Transactions closed under locked clients route 50% split commissions to you.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MY DEALS */}
              {activeAccountTab === "DEALS" && (
                <div className="space-y-3">
                  {agentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 rounded-2xl bg-paper-100 border border-paper-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-contour-amber text-ink-900">
                          {deal.stageLabel}
                        </span>
                        <span className="text-[10px] font-bold text-contour-red">
                          🔒 {deal.lockDaysRemaining} Days Lock Remaining
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-ink-900">{deal.propertyTitle}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-paper-200">
                        <div>
                          <span className="text-ink-600">Client:</span>{" "}
                          <span className="font-semibold text-ink-900">{deal.clientName}</span>
                        </div>
                        <div>
                          <span className="text-ink-600">Deal Value:</span>{" "}
                          <span className="font-mono font-bold text-ink-900">{deal.value}</span>
                        </div>
                        <div>
                          <span className="text-ink-600">Est. 50% Split:</span>{" "}
                          <span className="font-mono font-bold text-emerald-700">{deal.agentSplitEst}</span>
                        </div>
                        <div>
                          <span className="text-ink-600">Suburb:</span>{" "}
                          <span className="font-semibold text-ink-900">{deal.suburb}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: LOCKED CLIENTS */}
              {activeAccountTab === "CLIENTS" && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-xs">
                    🛡️ <strong>30-Day Anti-Poaching Rule Active:</strong> These buyers are exclusively bound to your agent ID. Other brokerage agents cannot claim commission on these clients.
                  </div>

                  {/* Capture Inquiries Offline Banner */}
                  <button
                    onClick={() => {
                      playNeutralTone();
                      setShowAddClient(!showAddClient);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-ink-600/30 hover:border-ink-900 text-ink-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showAddClient ? "Cancel Registration" : "Register Buyer Inquiry (Offline Ready)"}</span>
                  </button>

                  {showAddClient && (
                    <form onSubmit={handleRegisterClientOffline} className="p-4 bg-paper-100 border border-border rounded-2xl space-y-3 text-xs animate-in slide-in-from-top">
                      <div className="font-bold text-ink-900 border-b pb-1.5">New Client CRM Lead Entry</div>
                      <div className="space-y-1">
                        <label className="block text-ink-700 font-semibold">Client Name *</label>
                        <input
                          type="text"
                          required
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="e.g. Kondwani Phiri"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-border text-ink-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-ink-700 font-semibold">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="e.g. +260 97 788 9900"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-ink-700 font-semibold">Max Budget *</label>
                        <input
                          type="text"
                          required
                          value={newClientBudget}
                          onChange={(e) => setNewClientBudget(e.target.value)}
                          placeholder="e.g. K 2,500,000"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-border text-ink-900 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-ink-700 font-semibold">Preferred Suburb</label>
                        <select
                          value={newClientSuburb}
                          onChange={(e) => setNewClientSuburb(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-border text-ink-900 focus:outline-none"
                        >
                          <option value="Kabulonga">Kabulonga</option>
                          <option value="Leopards Hill">Leopards Hill</option>
                          <option value="Roma Park">Roma Park</option>
                          <option value="Woodlands">Woodlands</option>
                          <option value="Sunningdale">Sunningdale</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-ink-900 hover:bg-ink-950 text-white font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register Lead</span>
                      </button>
                    </form>
                  )}

                  {mergedClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 rounded-2xl bg-white border border-border shadow-card space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-ink-900">{client.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-contour-emerald/10 text-contour-emerald">
                          {client.lockExpiry}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-ink-600">Phone:</span>{" "}
                          <span className="font-mono font-semibold text-ink-900">{client.phone}</span>
                        </div>
                        <div>
                          <span className="text-ink-600">Target Budget:</span>{" "}
                          <span className="font-mono font-bold text-contour-red">{client.budget}</span>
                        </div>
                        <div>
                          <span className="text-ink-600">Preferred Suburb:</span>{" "}
                          <span className="font-semibold text-ink-900">{client.preferredArea}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <a
                          href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Client</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: ACTIVITY HISTORY */}
              {activeAccountTab === "HISTORY" && (
                <div className="space-y-3">
                  {agentHistory.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-paper-100 border border-paper-200 flex items-start gap-3"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-ink-900">{item.action}</h4>
                            <span className="text-[10px] text-ink-500">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-ink-600 mt-0.5">{item.target}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Global Generative UI Copilot with Glowing Floating Capsule (Full Screen on Mobile) */}
      <ContourGenUiModal />
    </div>
  );
}
