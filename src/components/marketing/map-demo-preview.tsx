"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Building,
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
} from "lucide-react";

interface SuburbData {
  id: string;
  name: string;
  category: string;
  mandatesCount: number;
  avgPrice: string;
  coordinates: string;
  elevation: string;
  sampleListing: {
    title: string;
    type: string;
    price: string;
    stand: string;
    landmark: string;
  };
}

const SUBURBS: SuburbData[] = [
  {
    id: "kabulonga",
    name: "Kabulonga",
    category: "Diplomatic & Prime Residential",
    mandatesCount: 4,
    avgPrice: "K 3,500,000",
    coordinates: "15°25'17.4\"S 28°20'04.2\"E",
    elevation: "1,280 m",
    sampleListing: {
      title: "Executive 4-Bed Standalone Residence",
      type: "FOR SALE",
      price: "K 14,500,000",
      stand: "Stand # 8942-A (2,400 m²)",
      landmark: "200m off Kabulonga Road, near Centro Mall",
    },
  },
  {
    id: "leopards-hill",
    name: "Leopards Hill",
    category: "Gated Estates & Diplomatic Leases",
    mandatesCount: 3,
    avgPrice: "$ 2,200 / mo",
    coordinates: "15°26'52.8\"S 28°22'51.6\"E",
    elevation: "1,295 m",
    sampleListing: {
      title: "Modern 3-Bed Townhouse in Gated Estate",
      type: "FOR RENT",
      price: "$ 2,200 / mo",
      stand: "Stand # 1102 (650 m²)",
      landmark: "Opposite American International School (AIS)",
    },
  },
  {
    id: "roma-park",
    name: "Roma Park",
    category: "Master-Planned Commercial Parcels",
    mandatesCount: 2,
    avgPrice: "$ 850,000",
    coordinates: "15°22'19.2\"S 28°18'18.0\"E",
    elevation: "1,285 m",
    sampleListing: {
      title: "5-Acre Commercial Development Plot",
      type: "FOR SALE",
      price: "$ 850,000",
      stand: "Stand # SD-LUS-8942 (20,234 m²)",
      landmark: "Inside Roma Park Mixed-Use Precinct",
    },
  },
  {
    id: "woodlands",
    name: "Woodlands & Sunningdale",
    category: "High-Yield Serviced Units & Villas",
    mandatesCount: 3,
    avgPrice: "K 18,000 / mo",
    coordinates: "15°26'06.0\"S 28°19'19.2\"E",
    elevation: "1,275 m",
    sampleListing: {
      title: "Luxury 2-Bedroom Serviced Apartment",
      type: "FOR RENT",
      price: "K 18,000 / mo",
      stand: "Stand # WDL-4412 (180 m²)",
      landmark: "Near Woodlands Stadium, off Independence Ave",
    },
  },
  {
    id: "mass-media",
    name: "Mass Media",
    category: "Commercial Office Corridors",
    mandatesCount: 2,
    avgPrice: "K 35,000 / mo",
    coordinates: "15°23'52.8\"S 28°18'43.2\"E",
    elevation: "1,288 m",
    sampleListing: {
      title: "Prime 450 m² Commercial Office Floor",
      type: "FOR RENT",
      price: "K 35,000 / mo",
      stand: "Stand # MM-209 (450 m²)",
      landmark: "Behind ZNBC Studios, off Alick Nkhata Rd",
    },
  },
];

export function MapDemoPreview() {
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbData>(SUBURBS[0]);

  return (
    <div className="w-full">
      {/* Map Preview Canvas */}
      <div className="bg-white rounded-3xl border border-[#E6E0D4] shadow-xl overflow-hidden">
        
        {/* Top Geodesic Coordinates Header */}
        <div className="bg-[#FAF8F5] px-6 py-3.5 border-b border-[#ECE7DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-stone-700">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span className="font-bold text-[#16382B]">LUSAKA GIS MAPPING CORRIDOR</span>
            <span className="text-stone-400">|</span>
            <span>UTM Zone 35S • {selectedSuburb.coordinates}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Leaflet Tiles Cached Offline
            </span>
            <span className="text-[#C89B3C] font-bold">▲ {selectedSuburb.elevation}</span>
          </div>
        </div>

        {/* Interactive Suburb Selector Ribbon */}
        <div className="p-4 bg-white border-b border-[#ECE7DE] flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-2 pr-1 shrink-0 font-mono">
            Lusaka Suburbs:
          </span>
          {SUBURBS.map((suburb) => {
            const isSelected = selectedSuburb.id === suburb.id;
            return (
              <button
                key={suburb.id}
                type="button"
                onClick={() => setSelectedSuburb(suburb)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#16382B] text-white shadow-xs font-bold"
                    : "bg-[#FAF8F5] border border-[#E6E0D4] text-stone-600 hover:bg-[#F3EFE6]"
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? "text-[#E8C265]" : "text-stone-400"}`} />
                <span>{suburb.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {suburb.mandatesCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Visual Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          
          {/* Left: Interactive Simulated Vector Map */}
          <div className="lg:col-span-7 bg-[#FAF8F5] p-6 relative overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ECE7DE]">
            
            {/* Topographic Background Simulation */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E6E0D4" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid)" />
                <path d="M 20 80 Q 200 40 400 120 T 800 160" fill="none" stroke="#16382B" strokeWidth="2" opacity="0.2" />
                <path d="M 50 200 Q 250 160 500 240 T 900 280" fill="none" stroke="#16382B" strokeWidth="1.5" opacity="0.15" />
              </svg>
            </div>

            {/* Suburb Header in Map */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E6E0D4] shadow-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C89B3C] font-bold">
                  Cadastral Survey Layer
                </span>
                <h3 className="font-serif text-lg font-bold text-[#16382B]">
                  {selectedSuburb.name} District
                </h3>
                <p className="text-xs text-stone-500">{selectedSuburb.category}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E6E0D4] text-right font-mono text-xs shadow-xs">
                <span className="text-stone-400 block text-[9px] uppercase">Benchmark Price</span>
                <span className="font-bold text-[#16382B]">{selectedSuburb.avgPrice}</span>
              </div>
            </div>

            {/* Simulated Geospatial Pins */}
            <div className="relative z-10 my-8 flex items-center justify-around">
              <div className="p-3 rounded-2xl bg-white border-2 border-[#16382B] shadow-lg flex items-center gap-2.5 animate-bounce">
                <div className="w-7 h-7 rounded-xl bg-[#16382B] text-[#E8C265] flex items-center justify-center font-bold text-xs">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#16382B]">{selectedSuburb.sampleListing.stand}</p>
                  <p className="text-[10px] text-emerald-700 font-bold font-mono">100% Title Verified</p>
                </div>
              </div>
            </div>

            {/* Bottom Coordinate Bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>Projection: WGS 84 / UTM 35S</span>
              <span className="text-emerald-700 font-semibold">✓ Stand Boundaries Verified</span>
            </div>
          </div>

          {/* Right: Selected Suburb Cadastral Spec */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16382B]/10 text-[#16382B] text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>ACTIVE SURVEY MANDATE</span>
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#C89B3C] uppercase">
                  {selectedSuburb.sampleListing.type}
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#16382B] leading-snug">
                  {selectedSuburb.sampleListing.title}
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DE] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Cadastral Stand:</span>
                  <span className="font-bold text-[#16382B] font-mono">{selectedSuburb.sampleListing.stand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Landmark Directions:</span>
                  <span className="font-medium text-stone-800 text-right max-w-[200px]">{selectedSuburb.sampleListing.landmark}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EAE5DB]">
                  <span className="text-stone-500">Asking Value:</span>
                  <span className="font-bold text-base text-emerald-700 font-mono">{selectedSuburb.sampleListing.price}</span>
                </div>
              </div>
            </div>

            {/* Open Full Live Map CTA */}
            <div className="space-y-2">
              <Link
                href="/dashboard/map"
                className="w-full py-3 rounded-xl bg-[#16382B] hover:bg-[#0F291E] text-[#E8C265] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Open Full Interactive Lusaka Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-center text-stone-400 font-mono">
                Includes Leaflet GPS routing & company-owned vs managed overlays
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
