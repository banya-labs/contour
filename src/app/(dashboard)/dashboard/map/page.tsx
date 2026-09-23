"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Search,
  X,
  Bed,
  Bath,
  Ruler,
  MessageSquare,
  ExternalLink,
  Navigation,
} from "lucide-react";
import type { PropertyMapItem } from "@/types/property-map";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatCurrency } from "@/lib/utils";
import { publicPropertyPath } from "@/lib/public-property";
import { formatWhatsAppDigits } from "@/lib/phone-utils";

// Dynamically import InteractivePropertyMap with SSR disabled to prevent Leaflet window errors
const InteractivePropertyMap = dynamic(
  () => import("@/components/map/interactive-property-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-white border border-editorial-border flex items-center justify-center text-xs text-editorial-muted">
        <div className="flex flex-col items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-contour-red animate-ping" />
          <span className="font-geist text-xs uppercase tracking-wider">Loading Lusaka Cadastral Map...</span>
        </div>
      </div>
    ),
  }
);

export default function DashboardMapPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMapItem | null>(null);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Unified Search, Filter & View Mode state for Page Header & Map
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        if (data.success && data.properties && data.properties.length > 0) {
          const mapped: PropertyMapItem[] = data.properties
            .filter((p: any) => p.latitude !== null && p.longitude !== null)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              organizationSlug: p.organization?.slug || data.organization?.slug || null,
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
              features: [],
            }));
          setProperties(mapped);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error("Failed to load map properties:", err);
        setProperties([]);
        setLoadError("We could not load this agency's property catalog.");
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const selectedPriceText = selectedProperty
    ? selectedProperty.listingType === "FOR_RENT"
      ? `${formatCurrency(selectedProperty.rentalPrice, selectedProperty.currency)} / mo`
      : formatCurrency(selectedProperty.askingPrice, selectedProperty.currency)
    : "";

  const selectedHeroImage = selectedProperty
    ? selectedProperty.featuredPhoto ||
      selectedProperty.photos[0] ||
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80"
    : "";

  return (
    <div className="flex flex-col h-full max-h-full p-2 sm:p-4 lg:p-6 gap-2 sm:gap-3 w-full overflow-hidden bg-white font-geist antialiased text-editorial-black">
      {/* Header Bar — Responsive on Mobile / Landscape */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-4 border border-editorial-border shrink-0">
        {/* Title & Coordinate Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-editorial-black text-white flex items-center justify-center font-heading font-bold text-xs shrink-0">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-contour-red" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-geist font-bold text-editorial-black uppercase tracking-wider bg-neutral-100 border border-editorial-border px-1.5 py-0.2">
                15°25&apos;S 28°20&apos;E
              </span>
              <span className="text-[10px] sm:text-[11px] text-editorial-muted font-geist">
                {loading ? "…" : properties.length} Mandates
              </span>
            </div>
            <h1 className="font-heading text-base sm:text-xl font-bold text-editorial-black uppercase tracking-tight leading-tight mt-0.5">
              Cadastral Map Hub
            </h1>
          </div>
        </div>

        {/* Search & Filter Controls (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {/* Search Bar */}
          <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 border border-editorial-border focus-within:border-editorial-black transition-colors w-44 sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-editorial-muted shrink-0" />
            <input
              type="text"
              placeholder="Search suburbs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-editorial-black placeholder:text-editorial-muted focus:outline-none font-geist"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-editorial-muted hover:text-editorial-black"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center border border-editorial-border shrink-0">
            {[
              { id: "ALL", label: "All" },
              { id: "FOR_SALE", label: "Sale" },
              { id: "FOR_RENT", label: "Rent" },
              { id: "SOLD", label: "Sold" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 sm:px-3 py-1 text-xs font-heading font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  filterType === tab.id
                    ? "bg-editorial-black text-white"
                    : "bg-white text-editorial-black hover:bg-neutral-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full-Bleed Interactive Map Component */}
      <div className="flex-1 min-h-0 w-full relative border border-editorial-border">
        {loading ? (
          <div className="w-full h-full min-h-[400px] bg-white flex items-center justify-center text-xs text-editorial-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-contour-red animate-ping" />
              <span className="font-geist text-xs uppercase tracking-wider">Loading live properties...</span>
            </div>
          </div>
        ) : (
          <InteractivePropertyMap
            properties={properties}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            filterType={filterType}
            onFilterChange={(f) => setFilterType(f)}
            selectedPropertyId={selectedProperty?.id || null}
            onSelectProperty={(property) => setSelectedProperty(property)}
            onSaveStandBoundary={(vertices, areaSqm) => {
              console.log("[STAND BOUNDARY SAVED]", vertices, areaSqm);
            }}
          />
        )}
        {!loading && loadError && (
          <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-white/90 p-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="font-heading text-sm font-bold uppercase tracking-tight text-editorial-black">Catalog unavailable</p>
              <p className="text-xs text-editorial-muted">{loadError} Refresh the page and try again.</p>
            </div>
          </div>
        )}
        {!loading && !loadError && properties.length === 0 && (
          <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-white/90 p-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="font-heading text-sm font-bold uppercase tracking-tight text-editorial-black">No properties in your catalog</p>
              <p className="text-xs text-editorial-muted">Add a property in the catalog and it will appear here automatically.</p>
              <Link href="/dashboard/properties" className="inline-flex bg-editorial-black px-3 py-2 text-[11px] font-heading font-semibold uppercase tracking-wider text-white">Open property catalog</Link>
            </div>
          </div>
        )}
        {!loading && !loadError && properties.length > 0 && properties.every((property) => property.latitude == null || property.longitude == null) && (
          <div className="absolute bottom-4 left-1/2 z-[1200] -translate-x-1/2 bg-white/95 px-3 py-2 text-center text-[11px] text-editorial-muted shadow-sm">
            Your catalog has {properties.length} propert{properties.length === 1 ? "y" : "ies"}, but none have map coordinates yet.
          </div>
        )}
      </div>

      {/* ── Google Maps-Style Property Detail Overlay Card ── */}
      {selectedProperty && (
        <BottomSheet
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          zIndex="z-[2500]"
          title={selectedProperty.title}
          subtitle={`📍 ${selectedProperty.suburb}, ${selectedProperty.city}`}
        >
          <div className="space-y-4 font-geist">
            {/* Image Preview */}
            <div className="relative w-full aspect-video sm:h-52 rounded-lg overflow-hidden border border-editorial-border">
              <img
                src={selectedHeroImage}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-wider bg-editorial-black text-white">
                {selectedProperty.listingType === "FOR_RENT" ? "FOR RENT" : "FOR SALE"}
              </span>
              <span className="absolute bottom-2 right-2 px-3 py-1 text-sm font-heading font-bold bg-white text-contour-red border border-editorial-border">
                {selectedPriceText}
              </span>
            </div>

            {/* Quick Specs Strip */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-neutral-50 border border-editorial-border text-xs text-center">
              <div>
                <span className="text-[10px] text-editorial-muted uppercase block">Bedrooms</span>
                <span className="font-bold flex items-center justify-center gap-1 mt-0.5">
                  <Bed className="w-3.5 h-3.5 text-editorial-muted" /> {selectedProperty.bedrooms || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-editorial-muted uppercase block">Bathrooms</span>
                <span className="font-bold flex items-center justify-center gap-1 mt-0.5">
                  <Bath className="w-3.5 h-3.5 text-editorial-muted" /> {selectedProperty.bathrooms || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-editorial-muted uppercase block">Plot Size</span>
                <span className="font-bold flex items-center justify-center gap-1 mt-0.5">
                  <Ruler className="w-3.5 h-3.5 text-editorial-muted" /> {selectedProperty.plotSizeSqm ? `${selectedProperty.plotSizeSqm} m²` : "—"}
                </span>
              </div>
            </div>

            {/* Landmark Directions */}
            {selectedProperty.landmarkDirections && (
              <div className="p-2.5 bg-[#fbf9f6] border border-editorial-border text-xs text-editorial-black flex items-start gap-2">
                <Navigation className="w-4 h-4 text-contour-red shrink-0 mt-0.5" />
                <p className="leading-relaxed">{selectedProperty.landmarkDirections}</p>
              </div>
            )}

            {/* Actions: 1-Tap WhatsApp & View Full Public Listing */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={`https://wa.me/${formatWhatsAppDigits(selectedProperty.assignedAgentPhone || "+260977000000")}?text=Hi%2C%20inquiring%20about%20${encodeURIComponent(selectedProperty.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fill-wipe bg-[#25D366] text-white py-3 px-3 flex items-center justify-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider rounded-none"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Agent</span>
              </a>

              <Link
                href={publicPropertyPath(selectedProperty.organizationSlug || "organization", selectedProperty.slug)}
                className="btn-fill-wipe bg-editorial-black text-white py-3 px-3 flex items-center justify-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider rounded-none"
              >
                <span>View Listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
