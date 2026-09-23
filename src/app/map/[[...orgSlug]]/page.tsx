"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
  Building2,
  ArrowUpRight,
} from "lucide-react";
import type { PropertyMapItem } from "@/types/property-map";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatCurrency } from "@/lib/utils";
import { formatWhatsAppDigits } from "@/lib/phone-utils";
import { ContourLogo } from "@/components/brand/contour-logo";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { publicPropertyPath } from "@/lib/public-property";

// Dynamically import InteractivePropertyMap with SSR disabled to prevent Leaflet window errors
const InteractivePropertyMap = dynamic(
  () => import("@/components/map/interactive-property-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-white border border-editorial-border flex items-center justify-center text-xs text-editorial-muted">
        <div className="flex flex-col items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-contour-red animate-ping" />
          <span className="font-mono text-xs uppercase tracking-wider text-editorial-black">
            Loading Public Lusaka Cadastral Map...
          </span>
        </div>
      </div>
    ),
  }
);

function PublicMapInner() {
  const params = useParams();
  const searchParams = useSearchParams();

  // Resolve target organization from route parameter `/map/[orgSlug]` or query string `/map?org=...`
  const orgParam = Array.isArray(params?.orgSlug)
    ? params.orgSlug[0]
    : typeof params?.orgSlug === "string"
    ? params.orgSlug
    : null;
  const orgQuery = searchParams.get("org");
  const resolvedOrg = orgParam || orgQuery || "";

  const [selectedProperty, setSelectedProperty] = useState<PropertyMapItem | null>(null);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    let isCancelled = false;

    async function loadPublicProperties() {
      setLoading(true);
      setLoadError(null);
      try {
        const queryUrl = resolvedOrg
          ? `/api/properties?org=${encodeURIComponent(resolvedOrg)}&status=ALL&limit=250`
          : `/api/properties?status=ALL&limit=250`;

        const res = await fetch(queryUrl);
        const data = await res.json();

        if (isCancelled) return;

        if (data.success) {
          if (data.organization) {
            setOrganization(data.organization);
          }

          if (Array.isArray(data.properties)) {
            const mapped: PropertyMapItem[] = data.properties
              .filter((p: any) => p.latitude !== null && p.longitude !== null)
              .map((p: any) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                organizationSlug: p.organization?.slug || resolvedOrg || data.organization?.slug || null,
                listingType: p.listingType,
                status: p.status,
                ownershipType: p.ownershipType,
                askingPrice: p.askingPrice ? Number(p.askingPrice) : null,
                rentalPrice: p.rentalPrice ? Number(p.rentalPrice) : null,
                currency: p.currency || "ZMW",
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
                plotSizeSqm: p.plotSizeSqm ? Number(p.plotSizeSqm) : null,
                suburb: p.suburb,
                city: p.city || "Lusaka",
                latitude: p.latitude,
                longitude: p.longitude,
                standBoundary: p.standBoundary ? (p.standBoundary as [number, number][]) : null,
                landmarkDirections: p.landmarkDirections,
                photos: Array.isArray(p.photos) ? p.photos : [],
                featuredPhoto: p.featuredPhoto || (p.photos && p.photos[0]) || null,
                assignedAgentName: p.assignedAgent?.name || null,
                assignedAgentPhone: p.assignedAgent?.phone || null,
                description: p.description,
                features: [],
              }));
            setProperties(mapped);
          } else {
            setProperties([]);
          }
        } else {
          setLoadError(data.error || "Could not load public property catalog.");
          setProperties([]);
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error("Failed to load public map properties:", err);
        setLoadError("Unable to connect to the property registry.");
        setProperties([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPublicProperties();

    return () => {
      isCancelled = true;
    };
  }, [resolvedOrg]);

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

  const whatsappInquiryUrl = selectedProperty
    ? `https://wa.me/${formatWhatsAppDigits(
        selectedProperty.assignedAgentPhone || "260971234567"
      )}?text=${encodeURIComponent(
        `Hello, I am inquiring about the property "${selectedProperty.title}" (${selectedProperty.suburb}) on your public spatial map. Link: ${typeof window !== "undefined" ? window.location.origin : ""}${publicPropertyPath(selectedProperty.organizationSlug || resolvedOrg || "organization", selectedProperty.slug)}`
      )}`
    : "#";

  return (
    <div className="flex flex-col h-screen max-h-screen w-full overflow-hidden bg-white font-geist text-editorial-black">
      {/* ── Public Top Bar ── */}
      <header className="bg-white border-b border-editorial-border shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand + Organization Spatial Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="shrink-0" title="Contour Real Estate Platform">
              <ContourLogo size="sm" />
            </Link>

            <div className="h-4 w-px bg-editorial-border hidden sm:block" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 border border-editorial-border text-editorial-black px-2 py-0.5 truncate shrink-0">
                {organization?.name ? `${organization.name}` : "Public Cadastre"}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Spatial Map</span>
              </span>
            </div>
          </div>

          {/* Center: Search & Filter Controls */}
          <div className="flex items-center gap-2 max-w-md w-full justify-end sm:justify-center">
            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 border border-editorial-border focus-within:border-editorial-black transition-colors w-32 sm:w-56 shrink-0">
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
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-editorial-muted hover:text-editorial-black"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="hidden sm:flex items-center border border-editorial-border shrink-0">
              {[
                { id: "ALL", label: "All" },
                { id: "FOR_SALE", label: "Sale" },
                { id: "FOR_RENT", label: "Rent" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 text-xs font-heading font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
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

          {/* Right: Visit Contour & Status */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline text-xs font-mono text-editorial-muted">
              {loading ? "Loading…" : `${properties.length} Active Public Mandates`}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-2xs"
            >
              <span>Contour</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Map Canvas ── */}
      <main className="flex-1 w-full relative overflow-hidden" aria-busy={loading}>
        {loading ? (
          <div className="w-full h-full min-h-[400px] bg-neutral-50 flex items-center justify-center text-xs text-editorial-muted">
            <SectionPendingState label="Loading public property map…" description="Resolving available mandates and map coordinates." />
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
          />
        )}

        {/* Empty State Banner when 0 properties are mapped */}
        {!loading && !loadError && properties.length === 0 && (
          <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-white/95 p-6 text-center">
            <div className="max-w-md space-y-3 bg-white border border-editorial-border p-6 sm:p-8 shadow-xl">
              <div className="w-10 h-10 border border-editorial-border bg-neutral-50 flex items-center justify-center text-contour-red mx-auto">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-sm sm:text-base font-bold uppercase tracking-tight text-editorial-black">
                No Public Properties Currently Mapped
              </h2>
              <p className="text-xs text-editorial-muted leading-relaxed">
                {organization?.name
                  ? `${organization.name} does not have any publicly active property mandates with spatial coordinates at this time.`
                  : "There are currently no public property mandates mapped for this organization."}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                {resolvedOrg && (
                  <Link
                    href="/map"
                    className="w-full sm:w-auto px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
                  >
                    Explore All Lusaka Mandates
                  </Link>
                )}
                <Link
                  href="/"
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-neutral-50 border border-editorial-border text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Load Error Notice */}
        {!loading && loadError && (
          <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-white/95 p-6 text-center">
            <div className="max-w-md space-y-3 bg-white border border-editorial-border p-6 shadow-xl">
              <h2 className="font-heading text-sm font-bold uppercase tracking-tight text-editorial-black">
                Map Catalog Unavailable
              </h2>
              <p className="text-xs text-editorial-muted">{loadError}</p>
              <div className="pt-1">
                <Link
                  href="/"
                  className="inline-flex bg-editorial-black text-white px-3 py-1.5 text-xs font-heading uppercase tracking-wider"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Property Detail Bottom Sheet Overlay on Marker Click ── */}
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
            <div className="relative w-full aspect-video sm:h-52 rounded-none overflow-hidden border border-editorial-border bg-neutral-100">
              <img
                src={selectedHeroImage}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-wider bg-editorial-black text-white">
                {selectedProperty.listingType === "FOR_RENT" ? "FOR RENT" : "FOR SALE"}
              </span>
              <span className="absolute bottom-2 right-2 px-3 py-1 text-sm font-mono font-bold bg-white text-contour-red border border-editorial-border shadow-2xs">
                {selectedPriceText}
              </span>
            </div>

            {/* Property Key Specifications */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-editorial-border text-center">
              {selectedProperty.bedrooms !== null && selectedProperty.bedrooms !== undefined && (
                <div className="flex flex-col items-center gap-1 p-2 bg-neutral-50 border border-editorial-border">
                  <Bed className="w-4 h-4 text-editorial-muted" />
                  <span className="text-[10px] font-mono uppercase text-editorial-muted">Beds</span>
                  <span className="text-xs font-bold text-editorial-black">{selectedProperty.bedrooms}</span>
                </div>
              )}
              {selectedProperty.bathrooms !== null && selectedProperty.bathrooms !== undefined && (
                <div className="flex flex-col items-center gap-1 p-2 bg-neutral-50 border border-editorial-border">
                  <Bath className="w-4 h-4 text-editorial-muted" />
                  <span className="text-[10px] font-mono uppercase text-editorial-muted">Baths</span>
                  <span className="text-xs font-bold text-editorial-black">{selectedProperty.bathrooms}</span>
                </div>
              )}
              {selectedProperty.plotSizeSqm !== null && selectedProperty.plotSizeSqm !== undefined && (
                <div className="flex flex-col items-center gap-1 p-2 bg-neutral-50 border border-editorial-border">
                  <Ruler className="w-4 h-4 text-editorial-muted" />
                  <span className="text-[10px] font-mono uppercase text-editorial-muted">Plot Area</span>
                  <span className="text-xs font-bold text-editorial-black">{selectedProperty.plotSizeSqm.toLocaleString()} m²</span>
                </div>
              )}
            </div>

            {/* Description Excerpt */}
            {selectedProperty.description && (
              <p className="text-xs text-editorial-muted leading-relaxed line-clamp-2">
                {selectedProperty.description}
              </p>
            )}

            {/* Action Buttons: Direct Public Listing Dossier + WhatsApp Inquiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <Link
                href={publicPropertyPath(selectedProperty.organizationSlug || resolvedOrg || "organization", selectedProperty.slug)}
                className="w-full py-2.5 px-4 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <span>View Full Listing Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default function PublicMapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-white flex items-center justify-center text-xs text-editorial-muted">
          <div className="flex flex-col items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-contour-red animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-editorial-black font-semibold">
              Initializing Spatial Cadastre...
            </span>
          </div>
        </div>
      }
    >
      <PublicMapInner />
    </Suspense>
  );
}
