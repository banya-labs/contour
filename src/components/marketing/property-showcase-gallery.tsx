"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Share2,
  Phone,
  MessageSquare,
  ArrowRight,
  Maximize2,
  Bed,
  Bath,
  Layers,
  FileCheck,
  Compass,
} from "lucide-react";
import SocialMediaCardGeneratorModal from "@/components/marketing/social-media-card-generator-modal";

interface PropertyShowcaseItem {
  id: string;
  title: string;
  suburb: string;
  category: "RESIDENTIAL" | "COMMERCIAL" | "DIPLOMATIC" | "AGRO";
  price: string;
  usdEquivalent: string;
  standSize: string;
  standNumber: string;
  titleDeedStatus: "VERIFIED" | "IN_ESCROW" | "MANDATE_LOCKED";
  commission5Pct: string;
  beds?: number;
  baths?: number;
  image: string;
  description: string;
  elevation: string;
  agent: {
    name: string;
    role: string;
    avatar: string;
  };
}

const FEATURED_PROPERTIES: PropertyShowcaseItem[] = [
  {
    id: "prop-1",
    title: "The Kabulonga Grand Executive Villa",
    suburb: "Kabulonga, Lusaka East",
    category: "DIPLOMATIC",
    price: "K 14,500,000",
    usdEquivalent: "$ 580,000",
    standSize: "2,400 m² (0.6 Acres)",
    standNumber: "Stand # 8942-A",
    titleDeedStatus: "VERIFIED",
    commission5Pct: "K 725,000",
    beds: 5,
    baths: 6,
    image: "/images/contour/rolling-hills.webp",
    elevation: "1,280 m",
    description: "Architectural masterpiece on prime Kabulonga soil. 5 en-suite bedrooms, private guardhouse, borehole solar backup, and 100% verified 99-year Ministry of Lands title deed.",
    agent: {
      name: "Chileshe Mwamba",
      role: "Managing Principal",
      avatar: "/images/contour/agent-1.png",
    },
  },
  {
    id: "prop-2",
    title: "Leopards Hill Contemporary Gated Estate",
    suburb: "Leopards Hill, Lusaka",
    category: "RESIDENTIAL",
    price: "K 8,900,000",
    usdEquivalent: "$ 356,000",
    standSize: "1,850 m²",
    standNumber: "Stand # 1102-LH",
    titleDeedStatus: "VERIFIED",
    commission5Pct: "K 445,000",
    beds: 4,
    baths: 4,
    image: "/images/contour/mountain-hero.png",
    elevation: "1,295 m",
    description: "Modern open-plan luxury living with infinity lap pool, double volume glass facade, and 30-day anti-poaching broker mandate lock.",
    agent: {
      name: "Grace Banda",
      role: "Senior Broker",
      avatar: "/images/contour/agent-2.png",
    },
  },
  {
    id: "prop-3",
    title: "Roma Park Commercial Office Suites",
    suburb: "Roma Park, Lusaka",
    category: "COMMERCIAL",
    price: "K 22,000,000",
    usdEquivalent: "$ 880,000",
    standSize: "3,500 m² Plot",
    standNumber: "Stand # 440-C",
    titleDeedStatus: "MANDATE_LOCKED",
    commission5Pct: "K 1,100,000",
    image: "/images/contour/rolling-hills.webp",
    elevation: "1,285 m",
    description: "Institutional-grade commercial office campus in Lusaka's premier mixed-use business park. Full tenant occupancy with 14.2% gross rental yield.",
    agent: {
      name: "Mulenga Zulu",
      role: "Commercial Director",
      avatar: "/images/contour/agent-3.png",
    },
  },
  {
    id: "prop-4",
    title: "Woodlands Diplomatic Residence",
    suburb: "Woodlands, Lusaka",
    category: "DIPLOMATIC",
    price: "K 11,200,000",
    usdEquivalent: "$ 448,000",
    standSize: "2,100 m²",
    standNumber: "Stand # 2049-W",
    titleDeedStatus: "VERIFIED",
    commission5Pct: "K 560,000",
    beds: 4,
    baths: 5,
    image: "/images/contour/mountain-bottom.png",
    elevation: "1,275 m",
    description: "High-security diplomatic compound with ambassadorial residence, secondary guest cottage, bulletproof perimeter, and automated PowerSync field compliance.",
    agent: {
      name: "Mutale Phiri",
      role: "Diplomatic Leasing Lead",
      avatar: "/images/contour/agent-4.png",
    },
  },
  {
    id: "prop-5",
    title: "Silverest Prime Agro-Residential Estate",
    suburb: "Silverest / Chongwe Corridor",
    category: "AGRO",
    price: "K 4,500,000",
    usdEquivalent: "$ 180,000",
    standSize: "5.0 Hectares (12.3 Acres)",
    standNumber: "Subdivision # 88/Agro",
    titleDeedStatus: "VERIFIED",
    commission5Pct: "K 225,000",
    image: "/images/contour/rolling-hills.webp",
    elevation: "1,240 m",
    description: "Sprawling virgin agro-residential land along great east road corridor. Perennial stream boundary, three-phase power line, and clean sub-division title.",
    agent: {
      name: "Mwape Tembo",
      role: "Land & Survey Broker",
      avatar: "/images/contour/agent-5.png",
    },
  },
  {
    id: "prop-6",
    title: "Mass Media Executive Penthouse",
    suburb: "Mass Media, Lusaka",
    category: "RESIDENTIAL",
    price: "K 6,800,000",
    usdEquivalent: "$ 272,000",
    standSize: "420 m² Penthouse",
    standNumber: "Unit # PH-4",
    titleDeedStatus: "VERIFIED",
    commission5Pct: "K 340,000",
    beds: 3,
    baths: 3,
    image: "/images/contour/mountain-hero.png",
    elevation: "1,288 m",
    description: "Panoramic Lusaka city skyline view, private elevator foyer, Italian marble kitchen, and instant 1-click WhatsApp flyer syndication.",
    agent: {
      name: "Grace Banda",
      role: "Senior Broker",
      avatar: "/images/contour/agent-2.png",
    },
  },
];

export function PropertyShowcaseGallery() {
  const [filter, setFilter] = useState<"ALL" | "DIPLOMATIC" | "RESIDENTIAL" | "COMMERCIAL" | "AGRO">("ALL");
  const [selectedPropertyForFlyer, setSelectedPropertyForFlyer] = useState<PropertyShowcaseItem | null>(null);

  const filteredProperties = filter === "ALL" 
    ? FEATURED_PROPERTIES 
    : FEATURED_PROPERTIES.filter(p => p.category === filter);

  return (
    <section id="properties" className="py-20 bg-[#FBF9F5] border-t border-[#ECE7DE] relative overflow-hidden">
      
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16382B]/10 border border-[#16382B]/15 text-[#16382B] text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>THE LIVING LUSAKA PROPERTY CATALOGUE</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16382B] tracking-tight">
              Institutional Properties, <br className="hidden sm:block" />
              100% Title Verified.
            </h2>
            
            <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Every property managed on Contour carries full cadastral coordinates, verified Ministry of Lands survey refs, and a locked 5% commission ledger for your brokerage.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {[
              { id: "ALL", label: "All Prime Portfolios" },
              { id: "DIPLOMATIC", label: "Diplomatic Residences" },
              { id: "RESIDENTIAL", label: "Gated Estates" },
              { id: "COMMERCIAL", label: "Commercial Hubs" },
              { id: "AGRO", label: "Agro Plots" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  filter === tab.id
                    ? "bg-[#16382B] text-white shadow-md font-bold"
                    : "bg-white border border-[#E6E0D4] text-stone-600 hover:bg-[#F3EFE6]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredProperties.map((prop) => (
          <div
            key={prop.id}
            className="group rounded-2xl bg-white border border-[#E6E0D4] hover:border-[#C89B3C]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Property Image Cover with Badges */}
            <div className="relative h-60 w-full overflow-hidden bg-stone-100">
              <Image
                src={prop.image}
                alt={prop.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-semibold">
                  {prop.standNumber}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Title Verified</span>
                </span>
              </div>

              {/* Bottom Image Overlay Specs */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-center gap-2 text-[11px] text-[#E8C265] font-mono mb-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{prop.suburb}</span>
                  <span>•</span>
                  <span>▲ {prop.elevation}</span>
                </div>
                <h3 className="font-serif text-lg font-bold leading-snug drop-shadow line-clamp-1">
                  {prop.title}
                </h3>
              </div>
            </div>

            {/* Property Body Specs */}
            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Plot Specs Row */}
              <div className="grid grid-cols-2 gap-2 py-2 border-b border-[#ECE7DE] text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-mono">Stand Area</span>
                  <span className="font-bold text-[#16382B]">{prop.standSize}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px] uppercase font-mono">5% Commission Locked</span>
                  <span className="font-bold text-emerald-700 font-mono">{prop.commission5Pct}</span>
                </div>
              </div>

              {/* Room counts if available */}
              {prop.beds && prop.baths && (
                <div className="flex items-center gap-4 text-xs text-stone-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-stone-400" />
                    <span>{prop.beds} Bedrooms</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4 text-stone-400" />
                    <span>{prop.baths} Bathrooms</span>
                  </span>
                </div>
              )}

              {/* Short Description */}
              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {prop.description}
              </p>

              {/* Asking Price Box */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#ECE7DE] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block font-mono">Asking Price</span>
                  <p className="text-base sm:text-lg font-bold text-[#16382B] font-mono leading-tight">
                    {prop.price}
                  </p>
                </div>
                <span className="text-xs font-mono text-stone-500 font-medium">
                  {prop.usdEquivalent}
                </span>
              </div>

              {/* Agent Attribution & WhatsApp Flyer Trigger */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#ECE7DE]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#16382B] text-[#E8C265] flex items-center justify-center font-bold text-xs">
                    {prop.agent.name.charAt(0)}
                  </div>
                  <div className="text-[11px] leading-tight">
                    <p className="font-bold text-stone-800">{prop.agent.name}</p>
                    <p className="text-stone-400 text-[10px]">30-Day Anti-Poach Lock</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPropertyForFlyer(prop)}
                  className="px-3 py-1.5 rounded-lg bg-[#16382B]/5 hover:bg-[#16382B] text-[#16382B] hover:text-white border border-[#16382B]/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Flyer</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Social Media & WhatsApp Flyer Modal */}
      {selectedPropertyForFlyer && (
        <SocialMediaCardGeneratorModal
          isOpen={!!selectedPropertyForFlyer}
          onClose={() => setSelectedPropertyForFlyer(null)}
          property={{
            id: selectedPropertyForFlyer.id,
            title: selectedPropertyForFlyer.title,
            location: selectedPropertyForFlyer.suburb,
            price: parseInt(selectedPropertyForFlyer.price.replace(/[^0-9]/g, "")),
            currency: "ZMW",
            bedrooms: selectedPropertyForFlyer.beds || 4,
            bathrooms: selectedPropertyForFlyer.baths || 4,
            areaSqFt: parseInt(selectedPropertyForFlyer.standSize.replace(/[^0-9]/g, "")),
            description: selectedPropertyForFlyer.description,
            imageUrl: selectedPropertyForFlyer.image,
            images: [selectedPropertyForFlyer.image],
            agentName: selectedPropertyForFlyer.agent.name,
            agentPhone: "+260 97 123 4567",
            agencyName: "Kabulonga Premier Agency",
          }}
        />
      )}

    </section>
  );
}
