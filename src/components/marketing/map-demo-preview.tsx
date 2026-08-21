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
} from "lucide-react";

interface SuburbData {
  id: string;
  name: string;
  category: string;
  mandatesCount: number;
  avgPrice: string;
  coordinates: string;
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
    sampleListing: {
      title: "Executive 4-Bed Standalone Residence",
      type: "FOR SALE",
      price: "K 3,500,000",
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
    <section className="py-20 bg-paper-100 border-b border-border" id="map-preview">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-border text-ink-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Compass className="w-3.5 h-3.5 text-contour-red" />
            Geospatial Cadastral Intelligence
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">
            Interactive Property Map & Cadastral Stand Boundaries
          </h2>
          <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
            Move beyond static photo lists. Locate properties by cadastral stands, landmark cues, and suburb price dynamics across Greater Lusaka.
          </p>
        </div>

        {/* Map Preview Canvas */}
        <div className="bg-white rounded-2xl border border-border shadow-floating overflow-hidden">
          {/* Top Geodesic Coordinates Header */}
          <div className="bg-paper-200 px-6 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-ink-700">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-contour-red" />
              <span className="font-bold">LUSAKA GIS MAPPING CORRIDOR</span>
              <span className="text-ink-400">|</span>
              <span>UTM Zone 35S • {selectedSuburb.coordinates}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-contour-emerald font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-contour-emerald animate-pulse" />
                14 Live GPS Stand Pins
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Suburb Selector List */}
            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold text-ink-600 uppercase tracking-wider block mb-2">
                Prime Lusaka Suburb Hubs
              </span>
              <div className="space-y-2">
                {SUBURBS.map((suburb) => {
                  const isSelected = selectedSuburb.id === suburb.id;
                  return (
                    <button
                      key={suburb.id}
                      type="button"
                      onClick={() => setSelectedSuburb(suburb)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-paper-200 border-contour-red/60 shadow-subtle text-ink-950"
                          : "bg-white border-border hover:bg-paper-100 text-ink-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-contour-red text-white"
                              : "bg-paper-200 text-ink-700"
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink-900">{suburb.name}</div>
                          <div className="text-[11px] text-ink-500">{suburb.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-ink-900">
                          {suburb.mandatesCount} Mandates
                        </div>
                        <div className="text-[10px] text-ink-400 font-mono">
                          Avg {suburb.avgPrice}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spotlight Listing Card for Selected Suburb */}
            <div className="lg:col-span-7 bg-paper-100 rounded-2xl p-6 sm:p-7 border border-border shadow-card space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-contour-dark text-white text-[10px] font-bold font-mono">
                    {selectedSuburb.sampleListing.type}
                  </span>
                  <span className="text-xs font-bold text-ink-900">{selectedSuburb.name} Spotlight</span>
                </div>
                <span className="text-xs font-mono text-ink-500">
                  {selectedSuburb.sampleListing.stand}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 leading-snug">
                  {selectedSuburb.sampleListing.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-ink-700 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-contour-red shrink-0" />
                  <span>{selectedSuburb.sampleListing.landmark}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-400 block">Asking / Guide Price</span>
                  <span className="font-mono text-2xl font-bold text-contour-red">
                    {selectedSuburb.sampleListing.price}
                  </span>
                </div>

                <Link
                  href="/dashboard/map"
                  className="px-5 py-2.5 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-xs font-semibold transition-all shadow-subtle flex items-center justify-center gap-2"
                >
                  <span>Explore on Full Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Callout & Direct Map Link */}
          <div className="bg-paper-200/80 px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-ink-700 text-center sm:text-left">
              <strong>Need full cadastral GIS search?</strong> View stand polygons, borehole depths, and title folios on our Leaflet GIS interface.
            </div>
            <Link
              href="/dashboard/map"
              className="inline-flex items-center gap-2 text-xs font-bold text-contour-red hover:text-ink-950 transition-colors"
            >
              <span>Launch Full Interactive Lusaka Map (/dashboard/map)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
