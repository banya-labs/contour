"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Building2,
  Bed,
  Bath,
  Maximize,
  MapPin,
  ExternalLink,
  DollarSign,
  X,
  Sparkles,
  Palette,
  Eye,
  Image as ImageIcon,
  Trash2,
  Share2,
  ShieldCheck,
  Scale,
  Check,
  Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { evaluatePropertyAgainstAlerts, AlertMatchResult } from "@/lib/alerts/matchmaker";
import PropertyMatchSummaryModal from "@/components/alerts/property-match-summary-modal";
import Property360DetailModal from "@/components/properties/property-360-detail-modal";
import SocialMediaCardGeneratorModal from "@/components/marketing/social-media-card-generator-modal";
import TitleDeedOcrUploader from "@/components/properties/title-deed-ocr-uploader";
import PropertyImageUploader from "@/components/properties/property-image-uploader";
import LocationCoordinatePicker from "@/components/properties/location-coordinate-picker";
import { AnimatedTabs } from "@/components/ui/animate/animated-tabs";
import { CornerMark } from "@/components/ui/corner-mark";
import { useSession } from "@/lib/auth-client";
import { useDebounce } from "@/hooks/use-debounce";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";
import { PendingButtonContent } from "@/components/ui/pending-button-content";

const SUBURB_GPS_COORDINATES: Record<string, [number, number]> = {
  "Kabulonga": [-15.4215, 28.3345],
  "Leopards Hill": [-15.4520, 28.3850],
  "Roma Park": [-15.3780, 28.3120],
  "Woodlands": [-15.4350, 28.3250],
  "Rhodes Park": [-15.4102, 28.2985],
  "Mass Media": [-15.3980, 28.3150],
  "Ibex Hill": [-15.4150, 28.3750],
  "Chudleigh": [-15.3650, 28.3380],
  "Longacres": [-15.4190, 28.3090],
  "New Kasama": [-15.4650, 28.3650],
  "Silverest": [-15.3850, 28.4450],
  "Makeni": [-15.4550, 28.2450],
};

function PropertiesCatalogContent() {
  const { data: session } = useSession();
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [filterType, setFilterType] = useState("ALL");
  const [filterOwnership, setFilterOwnership] = useState("ALL");
  const [filterAssigned, setFilterAssigned] = useState<"ALL" | "ASSIGNED">("ALL");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1" || searchParams?.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadProperties() {
      try {
        const [res, agentsRes] = await Promise.all([
          fetch("/api/properties?status=ALL", { cache: "no-store" }),
          fetch("/api/organization/agents", { cache: "no-store" }),
        ]);
        const data = await res.json();
        const agentsData = await agentsRes.json();
        if (agentsData.success && agentsData.agents) {
          setAgents(agentsData.agents);
        }
        if (data.success && data.properties) {
          setProperties(data.properties);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  // Reverse-Match Summary Modal State
  const [matchSummaryState, setMatchSummaryState] = useState<{
    isOpen: boolean;
    property: any;
    matches: AlertMatchResult[];
  }>({
    isOpen: false,
    property: null,
    matches: [],
  });

  // 360 Detail Modal State
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    property: any;
  }>({
    isOpen: false,
    property: null,
  });

  // Social Media Generator Modal State
  const [socialModalState, setSocialModalState] = useState<{
    isOpen: boolean;
    property: any;
  }>({
    isOpen: false,
    property: null,
  });

  // Form State with Multi-Photo & Geospatial Stand Support
  const [formData, setFormData] = useState({
    title: "",
    listingType: "FOR_SALE",
    ownershipType: "MANAGED_ON_BEHALF",
    askingPrice: "",
    rentalPrice: "",
    currency: "ZMW",
    bedrooms: "3",
    bathrooms: "2",
    plotSizeSqm: "500",
    latitude: -15.4215,
    longitude: 28.3345,
    suburb: "Kabulonga",
    assignedAgentId: "",
    assignedAgentName: "",
    landmarkDirections: "",
    description: "",
    photos: [] as string[],
    featuredPhoto: undefined as string | undefined,
    standBoundary: undefined as any,
    titleDeedNumber: "",
    titleDeedDocumentId: undefined as string | undefined,
    mandateType: "SOLE_MANDATE",
    mandateReference: "",
    mandateDeclarationAgreed: false,
  });

  const [copiedPropertyId, setCopiedPropertyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCustomSuburb, setIsCustomSuburb] = useState(false);

  const handleSharePropertyLink = (p: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const publicUrl = `${origin}/p/${p.slug || p.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(publicUrl).catch(() => {});
    }
    setCopiedPropertyId(p.id);
    setTimeout(() => setCopiedPropertyId(null), 2500);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const titleTrimmed = formData.title.trim();
    if (!titleTrimmed) {
      setFormError("Property Title is required.");
      return;
    }

    const isDuplicate = properties.some(
      (p) => p.title?.trim().toLowerCase() === titleTrimmed.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`A property named "${titleTrimmed}" already exists in your agency workspace. Property titles must be unique.`);
      return;
    }

    if (!formData.suburb || !formData.suburb.trim()) {
      setFormError("Please specify or select a suburb / area for this listing.");
      return;
    }

    if (!formData.mandateDeclarationAgreed) {
      setFormError("Statutory Mandate & Title Warranty required: You must confirm that your agency holds an active mandate from the lawful owner before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const askingPriceNum =
        formData.listingType === "FOR_SALE" && formData.askingPrice && !isNaN(parseFloat(formData.askingPrice))
          ? parseFloat(formData.askingPrice)
          : undefined;
      const rentalPriceNum =
        formData.listingType === "FOR_RENT" && formData.rentalPrice && !isNaN(parseFloat(formData.rentalPrice))
          ? parseFloat(formData.rentalPrice)
          : undefined;
      const plotSizeNum =
        formData.plotSizeSqm && !isNaN(parseFloat(formData.plotSizeSqm)) && parseFloat(formData.plotSizeSqm) >= 0
          ? parseFloat(formData.plotSizeSqm)
          : undefined;
      const bedroomsNum =
        formData.bedrooms && !isNaN(parseInt(formData.bedrooms, 10))
          ? parseInt(formData.bedrooms, 10)
          : undefined;
      const bathroomsNum =
        formData.bathrooms && !isNaN(parseFloat(formData.bathrooms))
          ? parseFloat(formData.bathrooms)
          : undefined;

      const payload = {
        title: formData.title.trim(),
        listingType: formData.listingType,
        ownershipType: formData.ownershipType,
        askingPrice: askingPriceNum,
        rentalPrice: rentalPriceNum,
        currency: formData.currency,
        bedrooms: bedroomsNum,
        bathrooms: bathroomsNum,
        plotSizeSqm: plotSizeNum,
        latitude: typeof formData.latitude === "number" && !isNaN(formData.latitude) ? formData.latitude : undefined,
        longitude: typeof formData.longitude === "number" && !isNaN(formData.longitude) ? formData.longitude : undefined,
        suburb: formData.suburb,
        assignedAgentId: formData.assignedAgentId || undefined,
        assignedAgentName: formData.assignedAgentName || undefined,
        landmarkDirections: formData.landmarkDirections?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        photos: formData.photos,
        featuredPhoto: formData.featuredPhoto || (formData.photos && formData.photos[0]) || undefined,
        standBoundary: formData.standBoundary,
        titleDeedNumber: formData.titleDeedNumber || undefined,
        titleDeedDocumentId: formData.titleDeedDocumentId || undefined,
        mandateType: formData.mandateType,
        mandateReference: formData.mandateReference || undefined,
        mandateDeclarationAgreed: formData.mandateDeclarationAgreed,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.property) {
        setProperties((prev) => [data.property, ...prev]);
        setIsModalOpen(false);
      } else {
        let errorMsg = data.error || "Failed to create property listing";
        if (data.details && typeof data.details === "object") {
          const fieldErrors: string[] = [];
          for (const [key, val] of Object.entries(data.details)) {
            if (val && typeof val === "object" && "_errors" in val && Array.isArray((val as any)._errors)) {
              const errs = (val as any)._errors;
              if (errs.length > 0) fieldErrors.push(`${key}: ${errs.join(", ")}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMsg = `${data.error || "Validation error"}: ${fieldErrors.join("; ")}`;
          }
        }
        setFormError(errorMsg);
      }
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Network error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const query = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      p.title?.toLowerCase().includes(query) ||
      p.suburb?.toLowerCase().includes(query) ||
      p.landmarkDirections?.toLowerCase().includes(query);

    const matchesType =
      filterType === "ALL" || p.listingType === filterType;

    const matchesOwnership =
      filterOwnership === "ALL" || p.ownershipType === filterOwnership;

    const matchesAssigned =
      filterAssigned === "ALL" ||
      (session?.user?.id && (p.assignedAgentId === session.user.id || p.assignedAgent?.id === session.user.id));

    return matchesSearch && matchesType && matchesOwnership && matchesAssigned;
  });

  const typeTabs = [
    { id: "ALL", label: "All Listings", count: properties.length },
    {
      id: "FOR_SALE",
      label: "For Sale",
      count: properties.filter((p) => p.listingType === "FOR_SALE").length,
    },
    {
      id: "FOR_RENT",
      label: "For Rent",
      count: properties.filter((p) => p.listingType === "FOR_RENT").length,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-32 space-y-4 sm:space-y-6 w-full h-full overflow-y-auto font-geist antialiased text-editorial-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-editorial-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-geist font-bold px-1.5 sm:px-2 py-0.5 border border-editorial-border bg-neutral-100 text-editorial-black uppercase tracking-wider">
              Cadastral Registry
            </span>
            <span className="text-[10px] sm:text-[11px] font-geist text-editorial-muted">
              Lusaka Plateau • S3 Custody
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-editorial-black mt-1 uppercase tracking-tight">
            Property Catalog & Mandates
          </h1>
          <p className="text-xs text-editorial-muted mt-1 max-w-3xl">
            Browse verified listings, inspect attached title deeds, generate social marketing cards, and evaluate reverse-matched buyer leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="px-3 sm:px-4 py-2 border border-editorial-border hover:border-editorial-black bg-white text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
          >
            <Palette className="w-3.5 h-3.5 text-contour-red" />
            <span className="hidden sm:inline">Brand Settings</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 sm:px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Type Filter Sliding Tabs */}
      <AnimatedTabs
        tabs={typeTabs}
        activeTab={filterType}
        onChange={(tabId) => setFilterType(tabId)}
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 border border-editorial-border">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-editorial-muted" />
          <input
            type="text"
            placeholder="Search by title, suburb (e.g. Kabulonga, Roma Park), or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-editorial-border text-xs text-editorial-black placeholder:text-editorial-muted focus:outline-none focus:border-editorial-black font-geist"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value as "ALL" | "ASSIGNED")}
            className="bg-white text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black px-3 py-1.5 border border-editorial-border focus:outline-none"
          >
            <option value="ALL">All Agents</option>
            <option value="ASSIGNED">Assigned to Me</option>
          </select>

          <select
            value={filterOwnership}
            onChange={(e) => setFilterOwnership(e.target.value)}
            className="bg-white text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black px-3 py-1.5 border border-editorial-border focus:outline-none"
          >
            <option value="ALL">All Ownership</option>
            <option value="COMPANY_OWNED">Company-Owned</option>
            <option value="MANAGED_ON_BEHALF">Managed on Behalf</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-editorial-border bg-white space-y-2">
          <Building2 className="w-10 h-10 text-editorial-muted mx-auto" />
          <h3 className="font-heading font-bold text-sm text-editorial-black uppercase">
            No properties found
          </h3>
          <p className="text-xs text-editorial-muted max-w-sm mx-auto">
            No listings matched your criteria. Add a property listing to populate the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProperties.map((p) => {
            const isSale = p.listingType === "FOR_SALE";
            const price = isSale ? p.askingPrice : p.rentalPrice;
            const cardMatches = evaluatePropertyAgainstAlerts(p);
            const photoCount = p.photos ? p.photos.length : 1;

            return (
              <div
                key={p.id}
                onClick={() => setDetailModalState({ isOpen: true, property: p })}
                className="group relative bg-white border border-editorial-border hover:border-editorial-black transition-colors flex flex-col justify-between cursor-pointer"
              >
                <CornerMark position="top-left" />
                <CornerMark position="top-right" />
                <CornerMark position="bottom-left" />
                <CornerMark position="bottom-right" />

                <div>
                  {/* Photo Frame */}
                  <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden border-b border-editorial-border">
                    <img
                      src={
                        p.featuredPhoto ||
                        p.photos?.[0] ||
                        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80"
                      }
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";
                      }}
                    />
                    <div className="absolute top-2 left-2 flex gap-1 z-10">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-heading font-bold uppercase tracking-wider ${
                          isSale
                            ? "bg-editorial-black text-white"
                            : "bg-contour-red text-white"
                        }`}
                      >
                        {isSale ? "For Sale" : "For Rent"}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-heading font-bold uppercase tracking-wider bg-white text-editorial-black border border-editorial-border">
                        {p.ownershipType === "COMPANY_OWNED" ? "Asset" : "Managed"}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-geist px-1.5 py-0.5 flex items-center gap-1 z-10">
                      <ImageIcon className="w-3 h-3 text-contour-red" />
                      <span>{photoCount} Photo{photoCount > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-geist uppercase tracking-wider text-contour-red">
                        <MapPin className="w-3 h-3" />
                        <span>{p.suburb}, Lusaka</span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-editorial-black leading-tight group-hover:text-contour-red transition-colors line-clamp-1 uppercase">
                        {p.title}
                      </h3>
                      <p className="text-xs text-editorial-muted line-clamp-2 leading-relaxed">
                        {p.description || "Verified Lusaka property mandate with clean Certificate of Title."}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="font-geist font-bold text-lg text-editorial-black tracking-tight pt-1">
                      {formatCurrency(Number(price || 0), p.currency || "ZMW")}
                      {!isSale && <span className="text-xs font-normal text-editorial-muted"> / mo</span>}
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-editorial-border text-center text-xs font-geist text-editorial-muted">
                      <div className="flex items-center justify-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{p.bedrooms || 0} Beds</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 border-x border-editorial-border">
                        <Bath className="w-3.5 h-3.5" />
                        <span>{p.bathrooms || 0} Baths</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Maximize className="w-3.5 h-3.5" />
                        <span>{p.plotSizeSqm || 0} m²</span>
                      </div>
                    </div>

                    {/* Action Triggers Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalState({ isOpen: true, property: p });
                        }}
                        className="py-1.5 px-2 bg-white hover:bg-neutral-50 border border-editorial-border text-editorial-black text-[11px] font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-editorial-muted" />
                        <span>360 Dossier</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSocialModalState({ isOpen: true, property: p });
                        }}
                        className="py-1.5 px-2 bg-editorial-black hover:bg-contour-red text-white text-[11px] font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Flyer</span>
                      </button>
                    </div>

                    {/* Reverse-Matched Buyers */}
                    {cardMatches.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMatchSummaryState({
                            isOpen: true,
                            property: p,
                            matches: cardMatches,
                          });
                        }}
                        className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-heading font-semibold flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-contour-red" />
                          <span>{cardMatches.length} Matching Buyer{cardMatches.length > 1 ? "s" : ""}</span>
                        </span>
                        <span className="text-[10px] font-geist uppercase underline">Engage →</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-neutral-50 border-t border-editorial-border flex items-center justify-between text-xs">
                  <span className="text-[10px] font-geist text-editorial-muted truncate">
                    Agent: <strong className="text-editorial-black">{p.assignedAgent?.name || p.assignedAgentName || "Grace Banda"}</strong>
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => handleSharePropertyLink(p, e)}
                      title="Copy Public Link for Client"
                      className="text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-black hover:text-contour-red flex items-center gap-1 transition-colors"
                    >
                      {copiedPropertyId === p.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-editorial-muted" />
                          <span>Share Link</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/p/${p.slug || p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-heading font-semibold uppercase tracking-wider text-contour-red hover:underline flex items-center gap-1"
                    >
                      <span>Public Card</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modal: Add Property Listing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-geist">
          <div className="bg-white max-w-xl w-full p-4 sm:p-6 border border-editorial-border space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-contour-red" />
                <h3 className="font-heading font-bold text-sm text-editorial-black uppercase tracking-wider">
                  Add New Property Mandate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPublishing}
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

            <form onSubmit={handleCreateProperty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury 4-Bedroom Standalone Residence"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none focus:border-editorial-black text-editorial-black font-geist"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Listing Type
                  </label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  >
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Ownership Model
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  >
                    <option value="MANAGED_ON_BEHALF">Managed on Behalf</option>
                    <option value="COMPANY_OWNED">Company-Owned Asset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    {formData.listingType === "FOR_SALE" ? "Asking Price *" : "Monthly Rent *"}
                  </label>
                  <input
                    type="number"
                    placeholder={formData.listingType === "FOR_SALE" ? "e.g. 3500000" : "e.g. 2500"}
                    value={formData.listingType === "FOR_SALE" ? formData.askingPrice : formData.rentalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [formData.listingType === "FOR_SALE" ? "askingPrice" : "rentalPrice"]: e.target.value,
                      })
                    }
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none focus:border-editorial-black text-editorial-black font-geist"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  >
                    <option value="ZMW">ZMW (Zambian Kwacha)</option>
                    <option value="USD">USD (United States Dollar)</option>
                  </select>
                </div>
              </div>

              {/* Photos Section */}
              <div className="p-3 bg-neutral-50 border border-editorial-border space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-contour-red" />
                    <span>Property Photos (Optional)</span>
                  </label>
                  <span className="text-[10px] font-geist text-editorial-muted">Single or multiple photos (optional)</span>
                </div>

                <PropertyImageUploader
                  photos={formData.photos}
                  featuredPhoto={formData.featuredPhoto}
                  onChange={(updatedPhotos, updatedCover) =>
                    setFormData((prev) => ({
                      ...prev,
                      photos: updatedPhotos,
                      featuredPhoto: updatedCover,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Plot Size (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.plotSizeSqm}
                    onChange={(e) => setFormData({ ...formData, plotSizeSqm: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black">
                      Suburb / Area (Lusaka) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const willBeCustom = !isCustomSuburb;
                        setIsCustomSuburb(willBeCustom);
                        if (willBeCustom && (!formData.suburb || formData.suburb === "Kabulonga")) {
                          setFormData({ ...formData, suburb: "" });
                        }
                      }}
                      className="text-[10px] font-geist font-semibold text-contour-red hover:underline"
                    >
                      {isCustomSuburb ? "← Choose from list" : "✍️ Type area manually"}
                    </button>
                  </div>
                  {isCustomSuburb ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Avondale, Prospect, Silverest Extension..."
                      value={formData.suburb}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchedKey = Object.keys(SUBURB_GPS_COORDINATES).find(
                          (k) => k.toLowerCase() === val.trim().toLowerCase()
                        );
                        const coords = matchedKey ? SUBURB_GPS_COORDINATES[matchedKey] : [-15.4211, 28.3341];
                        setFormData({
                          ...formData,
                          suburb: val,
                          latitude: coords[0],
                          longitude: coords[1],
                        });
                      }}
                      className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none focus:border-editorial-black text-editorial-black font-geist font-semibold placeholder:font-normal"
                    />
                  ) : (
                    <select
                      value={formData.suburb}
                      onChange={(e) => {
                        const nextSuburb = e.target.value;
                        if (nextSuburb === "__CUSTOM__") {
                          setIsCustomSuburb(true);
                          setFormData({ ...formData, suburb: "" });
                          return;
                        }
                        const coords = SUBURB_GPS_COORDINATES[nextSuburb] || [-15.4211, 28.3341];
                        setFormData({
                          ...formData,
                          suburb: nextSuburb,
                          latitude: coords[0],
                          longitude: coords[1],
                        });
                      }}
                      className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist font-semibold"
                    >
                      <option value="Kabulonga">Kabulonga</option>
                      <option value="Leopards Hill">Leopards Hill</option>
                      <option value="Roma Park">Roma Park</option>
                      <option value="Woodlands">Woodlands</option>
                      <option value="Rhodes Park">Rhodes Park</option>
                      <option value="Mass Media">Mass Media</option>
                      <option value="Ibex Hill">Ibex Hill</option>
                      <option value="Chudleigh">Chudleigh</option>
                      <option value="Longacres">Longacres</option>
                      <option value="New Kasama">New Kasama</option>
                      <option value="Silverest">Silverest</option>
                      <option value="Makeni">Makeni</option>
                      <option value="__CUSTOM__">✍️ Type Custom Area Manually...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Assigned Agent
                  </label>
                  <select
                    value={formData.assignedAgentId}
                    onChange={(e) => {
                      const selected = agents.find((a) => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        assignedAgentId: e.target.value,
                        assignedAgentName: selected?.name || "",
                      });
                    }}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Location & Coordinate Picker (Map Click, Drag, Address Search, Direct GPS) */}
              <LocationCoordinatePicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                suburb={formData.suburb}
                onChange={(lat, lng) =>
                  setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }))
                }
              />

              {/* Title Deed & Cadastral Survey (OCR Boundary Extraction) */}
              <TitleDeedOcrUploader
                onBoundaryExtracted={({ standBoundary, plotSizeSqm, titleDeedNumber, document }) => {
                  setFormData((prev) => ({
                    ...prev,
                    standBoundary,
                    plotSizeSqm: plotSizeSqm ? String(plotSizeSqm) : prev.plotSizeSqm,
                    titleDeedNumber: titleDeedNumber || prev.titleDeedNumber,
                    titleDeedDocumentId: document?.id || prev.titleDeedDocumentId,
                  }));
                }}
                onReset={() => {
                  setFormData((prev) => ({
                    ...prev,
                    standBoundary: undefined,
                    titleDeedDocumentId: undefined,
                  }));
                }}
                initialBoundary={formData.standBoundary}
                currentPlotSize={formData.plotSizeSqm}
              />

              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Landmark Directions
                </label>
                <input
                  type="text"
                  placeholder="e.g. 200m off Kabulonga Road, near Centro Mall"
                  value={formData.landmarkDirections}
                  onChange={(e) => setFormData({ ...formData, landmarkDirections: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                  Property Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Executive standalone residence with verified boundaries, borehole, high perimeter wall, and manicured grounds..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none focus:border-editorial-black text-editorial-black font-geist text-xs"
                />
              </div>

              {/* Statutory Mandate & Title Warranty Declaration (Estate Agents Act Cap 187 & Penal Code Cap 87) */}
              <div className="p-4 bg-[#fffaf8] border-l-2 border-contour-red border-y border-r border-editorial-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-contour-red" />
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-editorial-black">
                      Mandate & Title Warranty
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono bg-white border border-editorial-border px-1.5 py-0.5 text-editorial-muted">
                    Cap 187 § 14
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted mb-1">
                      Mandate Category
                    </label>
                    <select
                      value={formData.mandateType}
                      onChange={(e) => setFormData({ ...formData, mandateType: e.target.value })}
                      className="w-full bg-white px-2 py-1.5 border border-editorial-border text-xs text-editorial-black font-geist"
                    >
                      <option value="SOLE_MANDATE">Sole Mandate</option>
                      <option value="OPEN_MANDATE">Open Mandate</option>
                      <option value="COMPANY_OWNED">Company Owned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted mb-1">
                      Mandate Reference / Deed No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MAN-2026-088 or Folio 44/2"
                      value={formData.mandateReference}
                      onChange={(e) => setFormData({ ...formData, mandateReference: e.target.value })}
                      className="w-full bg-white px-2 py-1.5 border border-editorial-border text-xs text-editorial-black font-geist"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="mandate-declaration"
                    required
                    checked={formData.mandateDeclarationAgreed}
                    onChange={(e) => setFormData({ ...formData, mandateDeclarationAgreed: e.target.checked })}
                    className="mt-0.5 rounded-none text-contour-red focus:ring-contour-red border-editorial-border"
                  />
                  <label htmlFor="mandate-declaration" className="text-[11px] text-editorial-black leading-relaxed cursor-pointer font-geist">
                    <strong className="font-heading font-bold uppercase tracking-wider text-editorial-black">Statutory Declaration: </strong>
                    I confirm that our agency holds an active written Mandate Agreement from the lawful registered owner. I warrant that stand boundaries, pricing, and title specifications are authentic under the <em>Estate Agents Act (Cap 187)</em> and <em>Penal Code (Cap 87)</em>.
                  </label>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border-l-2 border-red-600 border-y border-r border-red-200 text-xs text-red-700 font-geist">
                  {formError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPublishing}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || !formData.mandateDeclarationAgreed}
                  aria-busy={isPublishing}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PendingButtonContent
                    pending={isPublishing}
                    pendingLabel="Publishing property…"
                    icon={<Sparkles className="h-3.5 w-3.5 text-contour-red" />}
                  >
                    Publish Listing
                  </PendingButtonContent>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Detail Modal */}
      <Property360DetailModal
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState({ isOpen: false, property: null })}
        property={detailModalState.property}
        onUpdateProperty={(updatedProp) => {
          setProperties((prev) =>
            prev.map((p) => (p.id === updatedProp.id ? updatedProp : p))
          );
          setDetailModalState({ isOpen: true, property: updatedProp });
        }}
        onOpenSocialGenerator={(p) => setSocialModalState({ isOpen: true, property: p })}
        onOpenMatchingBuyers={(p) =>
          setMatchSummaryState({
            isOpen: true,
            property: p,
            matches: evaluatePropertyAgainstAlerts(p),
          })
        }
      />

      {/* Social Media Generator Modal */}
      <SocialMediaCardGeneratorModal
        isOpen={socialModalState.isOpen}
        onClose={() => setSocialModalState({ isOpen: false, property: null })}
        property={socialModalState.property}
      />

      {/* Reverse-Match Summary Modal */}
      <PropertyMatchSummaryModal
        isOpen={matchSummaryState.isOpen}
        onClose={() => setMatchSummaryState({ ...matchSummaryState, isOpen: false })}
        property={matchSummaryState.property}
        matches={matchSummaryState.matches}
      />
    </div>
  );
}

export default function PropertiesCatalogPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-editorial-muted">Loading properties catalog...</div>}>
      <PropertiesCatalogContent />
    </React.Suspense>
  );
}
