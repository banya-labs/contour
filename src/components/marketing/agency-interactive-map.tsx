"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Sparkles,
  Building,
  ArrowRight,
  Bed,
  Bath,
  Maximize,
  ShieldCheck,
  Share2,
  Lock,
  Compass,
  CheckCircle2,
  FileText,
  Calendar,
  Phone,
  MessageCircle,
  X,
  ExternalLink,
  Layers,
  Zap,
} from "lucide-react";
import { AgencyMapItem } from "./agency-leaflet-canvas";

// Dynamically import the real Leaflet Canvas to prevent SSR window errors
const AgencyLeafletCanvas = dynamic(
  () => import("./agency-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[440px] bg-[#FAF8F5] flex flex-col items-center justify-center text-stone-500 gap-3 animate-pulse border border-[#E6E0D4] rounded-none">
        <Navigation className="w-8 h-8 text-[#C89B3C]" />
        <span className="text-xs font-mono font-bold tracking-wider text-[#16382B]">
          INITIALIZING LUSAKA CADASTRAL LEAFLET ENGINE (WGS 84)...
        </span>
      </div>
    ),
  }
);

// High-fidelity Lusaka Agency Inventory (MAL's Property Consultancy Pilot Showcase)
const AGENCY_PROPERTIES: AgencyMapItem[] = [
  {
    id: "prop-rhodes-park-hq",
    title: "Joseph Mwilwa Executive Commercial Suites",
    suburb: "Rhodes Park",
    category: "Prime Corporate & Embassy Hub",
    type: "FOR RENT",
    priceUSD: "$ 4,800 / mo",
    priceZMW: "K 110,400 / mo",
    rawPrice: 4800,
    badgePrice: "$4.8k/mo",
    commission: "1 Month Rent ($4,800 Brokerage Fee)",
    standNumber: "Stand # 44 Joseph Mwilwa Rd",
    plotSize: "1,450 m² Building (4,200 m² Stand)",
    bedrooms: 12,
    bathrooms: 6,
    coordinates: [-15.4102, 28.2985],
    elevation: "1,274 m",
    landmark: "Directly on Joseph Mwilwa Road, adjacent to Rhodes Park Medical Centre",
    status: "MAL'S SHOWCASE PILOT",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/COMM/2026/4410-RP",
    standBoundary: [
      [-15.4095, 28.2978],
      [-15.4095, 28.2992],
      [-15.4108, 28.2992],
      [-15.4108, 28.2978],
    ],
  },
  {
    id: "prop-kabulonga-villa",
    title: "The Palm Pavilion — 5-Bed Diplomatic Villa",
    suburb: "Kabulonga",
    category: "Diplomatic Residence & Embassy Strip",
    type: "FOR SALE",
    priceUSD: "$ 750,000",
    priceZMW: "K 17,250,000",
    rawPrice: 750000,
    badgePrice: "$750k",
    commission: "5% Agency Split ($37,500 Net)",
    standNumber: "Stand # 8942-A (Whitewood Lane)",
    plotSize: "5,070 m² (1.25 Acres)",
    bedrooms: 5,
    bathrooms: 4.5,
    coordinates: [-15.4211, 28.3341],
    elevation: "1,280 m",
    landmark: "Corner of Twin Palm Road and Whitewood Lane, 250m from Centro Mall",
    status: "EXCLUSIVE SOLE MANDATE",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/LAND/2026/8942-A",
    standBoundary: [
      [-15.4202, 28.3332],
      [-15.4202, 28.3350],
      [-15.4220, 28.3350],
      [-15.4220, 28.3332],
    ],
  },
  {
    id: "prop-leopards-hill",
    title: "The Ridge Contemporary Townhouse in Gated Estate",
    suburb: "Leopards Hill",
    category: "Gated Community & Expat Enclave",
    type: "FOR RENT",
    priceUSD: "$ 2,400 / mo",
    priceZMW: "K 55,200 / mo",
    rawPrice: 2400,
    badgePrice: "$2.4k/mo",
    commission: "1 Month Rent ($2,400 Brokerage Fee)",
    standNumber: "Stand # 1102 (Leopards Hill Rd)",
    plotSize: "650 m² Stand",
    bedrooms: 4,
    bathrooms: 3.5,
    coordinates: [-15.4475, 28.3810],
    elevation: "1,295 m",
    landmark: "Opposite American International School (AIS), 500m to The Village",
    status: "ACTIVE MANDATE",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/RES/2025/1102-LH",
    standBoundary: [
      [-15.4468, 28.3802],
      [-15.4468, 28.3818],
      [-15.4482, 28.3818],
      [-15.4482, 28.3802],
    ],
  },
  {
    id: "prop-roma-park",
    title: "Master-Planned Mixed-Use Commercial Parcel",
    suburb: "Roma Park",
    category: "Special Economic Zone & Retail",
    type: "FOR SALE",
    priceUSD: "$ 850,000",
    priceZMW: "K 19,550,000",
    rawPrice: 850000,
    badgePrice: "$850k",
    commission: "5% Agency Split ($42,500 Net)",
    standNumber: "Stand # RP-480-C (Commercial Sector)",
    plotSize: "20,234 m² (5 Acres)",
    coordinates: [-15.3720, 28.3050],
    elevation: "1,285 m",
    landmark: "Inside Roma Park Mixed-Use Precinct, off Zambezi Road",
    status: "TITLE DEED IN S3 VAULT",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/COMM/2026/894-RP",
    standBoundary: [
      [-15.3705, 28.3035],
      [-15.3705, 28.3065],
      [-15.3735, 28.3065],
      [-15.3735, 28.3035],
    ],
  },
  {
    id: "prop-woodlands-chindo",
    title: "Chindo Road Executive Residence & Grounds",
    suburb: "Woodlands",
    category: "Prime Urban Residential",
    type: "FOR SALE",
    priceUSD: "$ 650,000",
    priceZMW: "K 14,950,000",
    rawPrice: 650000,
    badgePrice: "$650k",
    commission: "5% Agency Split ($32,500 Net)",
    standNumber: "Stand # WDL-4412",
    plotSize: "3,205 m² Stand",
    bedrooms: 4,
    bathrooms: 3,
    coordinates: [-15.4321, 28.3289],
    elevation: "1,275 m",
    landmark: "Along Chindo Road, directly opposite Novare Pinnacle Mall",
    status: "UNDER OFFER",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/LAND/2024/2918-W",
  },
  {
    id: "prop-mass-media",
    title: "ZNBC Corridor Corporate Headquarters Floor",
    suburb: "Mass Media",
    category: "Commercial Office Park",
    type: "FOR RENT",
    priceUSD: "$ 1,600 / mo",
    priceZMW: "K 36,800 / mo",
    rawPrice: 1600,
    badgePrice: "$1.6k/mo",
    commission: "1 Month Rent Brokerage",
    standNumber: "Stand # MM-209 (Level 2)",
    plotSize: "450 m² Corporate Floor",
    bathrooms: 4,
    coordinates: [-15.3980, 28.3120],
    elevation: "1,288 m",
    landmark: "Behind ZNBC Studios, 100m off Alick Nkhata Road",
    status: "ACTIVE MANDATE",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/OFF/2025/209-MM",
  },
  {
    id: "prop-ibex-embassy",
    title: "Embassy Walk 6-Villa Commercial Compound",
    suburb: "Ibex Hill",
    category: "Diplomatic Compound & Office",
    type: "FOR SALE",
    priceUSD: "$ 1,500,000",
    priceZMW: "K 34,500,000",
    rawPrice: 1500000,
    badgePrice: "$1.5M",
    commission: "5% Agency Split ($75,000 Net)",
    standNumber: "Stand # IBX-4046",
    plotSize: "4,046 m² (1 Acre)",
    bedrooms: 18,
    bathrooms: 12,
    coordinates: [-15.4215, 28.3685],
    elevation: "1,290 m",
    landmark: "300 meters off Twin Palm Road, near new US Embassy housing",
    status: "EXCLUSIVE SOLE MANDATE",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/CORP/2026/894-IBX",
  },
  {
    id: "prop-independence-mansion",
    title: "Independence Avenue Ambassadorial Mansion",
    suburb: "Woodlands",
    category: "Ambassadorial & Diplomatic Strip",
    type: "FOR SALE",
    priceUSD: "$ 1,700,000",
    priceZMW: "K 39,100,000",
    rawPrice: 1700000,
    badgePrice: "$1.7M",
    commission: "5% Agency Split ($85,000 Net)",
    standNumber: "Stand # IND-8802",
    plotSize: "4,046 m² (1 Acre)",
    bedrooms: 6,
    bathrooms: 5,
    coordinates: [-15.4190, 28.3180],
    elevation: "1,278 m",
    landmark: "Along Independence Avenue, 150m from Chinese Embassy",
    status: "ACTIVE MANDATE",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
    titleDeedNumber: "Folio: LUS/LAND/2026/902-S",
  },
];

const SUBURBS_LIST = [
  "All Lusaka",
  "Rhodes Park",
  "Kabulonga",
  "Leopards Hill",
  "Roma Park",
  "Woodlands",
  "Mass Media",
  "Ibex Hill",
];

export function AgencyInteractiveMap() {
  const [selectedSuburb, setSelectedSuburb] = useState("All Lusaka");
  const [selectedType, setSelectedType] = useState<"ALL" | "FOR SALE" | "FOR RENT">("ALL");
  const [selectedProperty, setSelectedProperty] = useState<AgencyMapItem>(AGENCY_PROPERTIES[0]);
  
  // CTA Modal State
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const [ctaActionTitle, setCtaActionTitle] = useState("");
  const [ctaActionDescription, setCtaActionDescription] = useState("");
  const [ctaBadge, setCtaBadge] = useState("");

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return AGENCY_PROPERTIES.filter((p) => {
      const matchSuburb = selectedSuburb === "All Lusaka" || p.suburb === selectedSuburb;
      const matchType = selectedType === "ALL" || p.type === selectedType;
      return matchSuburb && matchType;
    });
  }, [selectedSuburb, selectedType]);

  const handleActionClick = (actionType: string, property: AgencyMapItem) => {
    if (actionType === "whatsapp-flyer") {
      setCtaBadge("1-TAP WHATSAPP FLYER SYNDICATION");
      setCtaActionTitle("Generate Branded WhatsApp Flyers with Masked Landlord PII");
      setCtaActionDescription(
        `Equip your field agents in ${property.suburb} to generate instant WhatsApp PDF flyers for "${property.title}" without revealing landlord phone numbers or title numbers to rival brokers.`
      );
    } else if (actionType === "claim-mandate") {
      setCtaBadge("30-DAY ANTI-POACHING COMMISSION LOCK");
      setCtaActionTitle("Register & Lock Procuring Commission Rights");
      setCtaActionDescription(
        `Lock your 5% agency commission (${property.commission}) under Contour's 30-Day Anti-Poaching Rule. Prevents intra-agency sniping and protects your deal from initial viewing to conveyance sign-off.`
      );
    } else if (actionType === "viewing") {
      setCtaBadge("OFFLINE LEAFLET VIEWING DISPATCH");
      setCtaActionTitle("Dispatch Offline GPS Viewing Coordinates to Client");
      setCtaActionDescription(
        `Send landmark navigation instructions ("${property.landmark}") directly to prospective buyers. Powered by PowerSync local SQLite WASM for 0ms navigation during 8-hour ZESCO load-shedding.`
      );
    } else if (actionType === "title-vault") {
      setCtaBadge("ENCRYPTED MINIO S3 LEGAL VAULT");
      setCtaActionTitle("Access Encrypted Certificate of Title & Cadastral Diagrams");
      setCtaActionDescription(
        `Certificate of Title #${property.titleDeedNumber} is protected under POPIA compliance with 15-minute presigned download tokens. Onboard your agency to manage encrypted title deeds.`
      );
    } else {
      setCtaBadge("CONTOUR REAL ESTATE OPERATING SYSTEM");
      setCtaActionTitle("Onboard Your Agency to Contour OS");
      setCtaActionDescription(
        "Manage your agency's property portfolio, 5% commission ledgers, field agent WhatsApp workflows, and landlord statements in one unified platform."
      );
    }
    setCtaModalOpen(true);
  };

  return (
    <section className="py-12 sm:py-16 bg-[#FAF8F5] border-t border-stone-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Compass className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>SPATIAL AGENCY INTELLIGENCE • LUSAKA GIS GRID</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
              Interactive Lusaka Agency Map
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl font-sans">
              Explore how Lusaka real estate firms like <strong className="text-[#16382B]">MAL&apos;s Property Consultancy</strong> manage active mandates, landmark directions, and 5% commission splits on a live, interactive Leaflet geospatial grid.
            </p>
          </div>

          {/* Quick CTA to live app */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-5 py-2.5 rounded-xl bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265] text-xs font-bold font-mono tracking-wide transition-all shadow-sm flex items-center gap-2"
            >
              <span>START 14-DAY AGENCY PILOT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Map Container Card */}
        <div className="bg-white rounded-3xl border border-[#E6E0D4] shadow-2xl overflow-hidden">
          
          {/* Top Geodesic HUD Bar */}
          <div className="bg-[#FAF8F5] px-6 py-3.5 border-b border-[#ECE7DE] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-stone-700">
            <div className="flex items-center gap-2 flex-wrap">
              <Navigation className="w-4 h-4 text-[#C89B3C]" />
              <span className="font-bold text-[#16382B]">MAL&apos;S PROPERTY CONSULTANCY</span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-500">44 Joseph Mwilwa Rd, Rhodes Park HQ</span>
              <span className="text-stone-300">|</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Leaflet Interactive Mode
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-stone-500">
                Selected: <strong className="text-[#16382B]">{selectedProperty.suburb}</strong> ({selectedProperty.elevation})
              </span>
              <span className="text-[#C89B3C] font-bold">
                {selectedProperty.coordinates[0].toFixed(4)}°S, {selectedProperty.coordinates[1].toFixed(4)}°E
              </span>
            </div>
          </div>

          {/* Suburb & Type Filter Controls */}
          <div className="p-4 bg-white border-b border-[#ECE7DE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            {/* Suburb Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1 pr-1 shrink-0 font-mono">
                Suburbs:
              </span>
              {SUBURBS_LIST.map((suburb) => {
                const isSelected = selectedSuburb === suburb;
                return (
                  <button
                    key={suburb}
                    type="button"
                    onClick={() => {
                      setSelectedSuburb(suburb);
                      const match = AGENCY_PROPERTIES.find((p) => suburb === "All Lusaka" || p.suburb === suburb);
                      if (match) setSelectedProperty(match);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#16382B] text-white shadow-xs font-bold"
                        : "bg-[#FAF8F5] border border-[#E6E0D4] text-stone-600 hover:bg-[#F3EFE6]"
                    }`}
                  >
                    <MapPin className={`w-3 h-3 ${isSelected ? "text-[#E8C265]" : "text-stone-400"}`} />
                    <span>{suburb}</span>
                  </button>
                );
              })}
            </div>

            {/* Type Switcher */}
            <div className="flex items-center gap-1 shrink-0 bg-[#FAF8F5] p-1 rounded-xl border border-[#ECE7DE]">
              {(["ALL", "FOR SALE", "FOR RENT"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedType === t
                      ? "bg-[#16382B] text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

          </div>

          {/* Main Map & Dossier Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            
            {/* Left: Real Leaflet Map Canvas (7 cols) */}
            <div className="lg:col-span-7 relative h-[640px] border-b lg:border-b-0 lg:border-r border-[#ECE7DE]">
              <AgencyLeafletCanvas
                properties={filteredProperties}
                selectedProperty={selectedProperty}
                onSelectProperty={(prop) => setSelectedProperty(prop)}
                onActionClick={handleActionClick}
              />

              {/* Map Floating Legend */}
              <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-stone-200 shadow-lg text-[11px] font-mono text-stone-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Green Pins: For Sale (5% Commission)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Gold Pins: Diplomatic Rentals (Leasing)</span>
                </div>
                <div className="text-[10px] text-stone-400 pt-0.5 border-t border-stone-100">
                  Click any marker to inspect agency dossier
                </div>
              </div>
            </div>

            {/* Right: Selected Property Agency Dossier (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
              
              <div className="space-y-4">
                
                {/* Status & Category Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-xs font-bold font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>{selectedProperty.status}</span>
                  </span>

                  <span className="text-xs font-mono font-bold text-[#8B1E1E] uppercase px-2 py-0.5 rounded-md bg-[#8B1E1E]/10">
                    {selectedProperty.type}
                  </span>
                </div>

                {/* Property Title & Image Preview */}
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-[#16382B] leading-tight">
                    {selectedProperty.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>{selectedProperty.suburb}, Lusaka</span>
                    <span>•</span>
                    <span>{selectedProperty.standNumber}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DE] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Asking Price</span>
                    <span className="font-serif text-2xl font-bold text-[#16382B]">
                      {selectedProperty.priceUSD}
                    </span>
                    <span className="text-xs font-mono text-stone-500 block">
                      ≈ {selectedProperty.priceZMW}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Agency Commission</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 block">
                      {selectedProperty.commission}
                    </span>
                  </div>
                </div>

                {/* Landmark & Viewing Instructions */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-mono font-bold text-stone-500 uppercase flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 text-[#C89B3C]" />
                    <span>Verified Lusaka Landmark Directions:</span>
                  </span>
                  <p className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-700 italic">
                    &ldquo;{selectedProperty.landmark}&rdquo;
                  </p>
                </div>

                {/* Property Specs Pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  {selectedProperty.bedrooms !== undefined && (
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE]">
                      <span className="text-stone-400 block text-[10px]">BEDROOMS</span>
                      <span className="font-bold text-[#16382B] text-sm">{selectedProperty.bedrooms}</span>
                    </div>
                  )}
                  {selectedProperty.bathrooms !== undefined && (
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE]">
                      <span className="text-stone-400 block text-[10px]">BATHROOMS</span>
                      <span className="font-bold text-[#16382B] text-sm">{selectedProperty.bathrooms}</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE]">
                    <span className="text-stone-400 block text-[10px]">STAND SIZE</span>
                    <span className="font-bold text-[#16382B] text-sm">{selectedProperty.plotSize}</span>
                  </div>
                </div>

              </div>

              {/* Agency Action Buttons (Act as CTAs to Signup) */}
              <div className="space-y-2.5 pt-4 border-t border-[#ECE7DE]">
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider text-center">
                  Live Agency Operational Actions:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleActionClick("whatsapp-flyer", selectedProperty)}
                    className="px-3 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#E6E0D4] text-[#16382B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Flyer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActionClick("claim-mandate", selectedProperty)}
                    className="px-3 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#E6E0D4] text-[#16382B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>Lock Mandate</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleActionClick("viewing", selectedProperty)}
                  className="w-full py-3 rounded-xl bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265] text-xs font-bold font-mono tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>SCHEDULE PRIVATE VIEWING WITH AGENT</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-mono">
                  <button
                    type="button"
                    onClick={() => handleActionClick("title-vault", selectedProperty)}
                    className="hover:text-stone-700 underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Inspect Title Deed #{selectedProperty.titleDeedNumber}</span>
                  </button>
                  <span>100% Verified</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Agency Onboarding / Signup CTA Modal */}
      {ctaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E6E0D4] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setCtaModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-[10px] font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-[#C89B3C]" />
                <span>{ctaBadge}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#16382B] leading-snug">
                {ctaActionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                {ctaActionDescription}
              </p>
            </div>

            {/* Core Value Props */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DE] space-y-2.5 text-xs text-stone-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>30-Day Anti-Poaching Lock</strong> protects procuring agent commissions.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero-Leakage WhatsApp Flyers</strong> with masked landlord contacts.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>0ms Offline PowerSync Map</strong> runs smoothly during ZESCO power cuts.</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link
                href="/sign-in"
                className="w-full py-3.5 rounded-xl bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265] text-xs font-bold font-mono tracking-wider transition-all shadow-md flex items-center justify-center gap-2 text-center"
              >
                <span>START 14-DAY FREE PILOT (INSTANT ACCESS)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard/map"
                  className="py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#E6E0D4] text-[#16382B] text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                >
                  <span>Explore Live Map Demo</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </Link>

                <a
                  href="https://wa.me/260971234567?text=Hi%20Contour%20Team%2C%20we%20want%20to%20pilot%20Contour%20for%20our%20Lusaka%20real%20estate%20agency."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            <p className="text-[10px] text-center text-stone-400 font-mono">
              Fast Dev Login available in development mode • No credit card required to pilot
            </p>

          </div>
        </div>
      )}

    </section>
  );
}
