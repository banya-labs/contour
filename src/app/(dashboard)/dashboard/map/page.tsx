"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Search,
  X,
} from "lucide-react";
import { PropertyMapItem } from "@/components/map/interactive-property-map";

// Dynamically import InteractivePropertyMap with SSR disabled to prevent Leaflet window errors
const InteractivePropertyMap = dynamic(
  () => import("@/components/map/interactive-property-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] rounded-2xl bg-paper-200 border border-border flex items-center justify-center text-xs text-ink-600 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="w-6 h-6 text-contour-red animate-bounce" />
          <span>Loading Lusaka Full-Bleed Property Map...</span>
        </div>
      </div>
    ),
  }
);

export default function DashboardMapPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMapItem | null>(null);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified Search, Filter & View Mode state for Page Header & Map
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"STANDARD" | "CHOROPLETH">("STANDARD");
  const [suburbIntelOpen, setSuburbIntelOpen] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        if (data.success && data.properties) {
          // Map database Property schema to PropertyMapItem
          const mapped: PropertyMapItem[] = data.properties
            .filter((p: any) => p.latitude !== null && p.longitude !== null)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              listingType: p.listingType,
              status: p.status,
              ownershipType: p.ownershipType,
              askingPrice: p.askingPrice ? Number(p.askingPrice) : null,
              rentalPrice: p.rentalPrice ? Number(p.rentalPrice) : null,
              currency: p.currency,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
              plotSizeSqm: p.plotSizeSqm ? Number(p.plotSizeSqm) : null,
              suburb: p.suburb,
              city: p.city,
              latitude: p.latitude,
              longitude: p.longitude,
              standBoundary: p.standBoundary ? (p.standBoundary as [number, number][]) : null,
              landmarkDirections: p.landmarkDirections,
              photos: p.photos || [],
              featuredPhoto: p.featuredPhoto,
              assignedAgentName: p.assignedAgent?.name || null,
              assignedAgentPhone: p.assignedAgent?.phone || null,
              description: p.description,
              features: [], // Optional field in the component
            }));
          setProperties(mapped);
        }
      } catch (err) {
        console.error("Failed to load map properties:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  return (
    <div className="flex flex-col h-full max-h-full p-4 sm:p-6 gap-3 w-full overflow-hidden bg-paper-100">
      {/* Sleek Page Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-card shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-contour-red/10 border border-contour-red/20 flex items-center justify-center text-contour-red shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-contour-red uppercase tracking-wider bg-contour-red/10 px-2 py-0.5 rounded-full">
                Geospatial Dispatch
              </span>
              <span className="text-[11px] text-ink-600 font-mono">
                {loading ? "…" : properties.length} Mandates Live
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
              Interactive Property Map
            </h1>
          </div>
        </div>

        {/* Header Normal Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1 Main Normal Search Bar */}
          <div className="flex items-center gap-2 bg-paper-100 px-3 py-1.5 rounded-full border border-border focus-within:border-contour-red focus-within:ring-2 focus-within:ring-contour-red/10 transition-all w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-600 shrink-0" />
            <input
              type="text"
              placeholder="Search suburbs, landmarks, titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-ink-900 placeholder:text-ink-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-ink-600 hover:text-ink-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto bg-paper-100 p-1 rounded-full border border-border">
            {[
              { id: "ALL", label: `All` },
              { id: "FOR_SALE", label: "For Sale 🔴" },
              { id: "FOR_RENT", label: "For Rent 🟡" },
              { id: "SOLD", label: "Sold 🟢" },
              { id: "RENTED", label: "Rented 🔵" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors whitespace-nowrap ${
                  filterType === tab.id
                    ? "bg-ink-900 text-white shadow-sm"
                    : "text-ink-800 hover:bg-paper-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full-Bleed Interactive Map Component */}
      <div className="flex-1 min-h-0 w-full relative">
        {loading ? (
          <div className="w-full h-full min-h-[500px] rounded-2xl bg-paper-200 border border-border flex items-center justify-center text-xs text-ink-600">
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-6 h-6 text-contour-red animate-bounce" />
              <span>Loading live properties from database...</span>
            </div>
          </div>
        ) : (
          <InteractivePropertyMap
            properties={properties}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            filterType={filterType}
            onFilterChange={(f) => setFilterType(f)}
            viewMode={viewMode}
            onViewModeChange={(m) => setViewMode(m)}
            suburbIntelOpen={suburbIntelOpen}
            onToggleSuburbIntel={() => setSuburbIntelOpen((prev) => !prev)}
            onSelectProperty={(property) => setSelectedProperty(property)}
            onSaveStandBoundary={(vertices, areaSqm) => {
              console.log("[STAND BOUNDARY SAVED]", vertices, areaSqm);
            }}
          />
        )}
      </div>
    </div>
  );
}

