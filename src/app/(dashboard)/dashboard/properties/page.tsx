"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { evaluatePropertyAgainstAlerts, AlertMatchResult } from "@/lib/alerts/matchmaker";
import PropertyMatchSummaryModal from "@/components/alerts/property-match-summary-modal";
import Property360DetailModal from "@/components/properties/property-360-detail-modal";
import SocialMediaCardGeneratorModal from "@/components/marketing/social-media-card-generator-modal";
import PropertyStandEditor from "@/components/properties/property-stand-editor";
import { AnimatedTabs } from "@/components/ui/animate/animated-tabs";
import { CornerMark } from "@/components/ui/corner-mark";

export default function PropertiesCatalogPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterOwnership, setFilterOwnership] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
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
    latitude: -15.4211,
    longitude: 28.3341,
    suburb: "Kabulonga",
    assignedAgentName: "Grace Banda",
    landmarkDirections: "",
    photos: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
    ],
    standBoundary: undefined as any,
  });

  const [newPhotoInput, setNewPhotoInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddPhoto = () => {
    if (newPhotoInput.trim() && newPhotoInput.startsWith("http")) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, newPhotoInput.trim()],
      }));
      setNewPhotoInput("");
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          listingType: formData.listingType,
          ownershipType: formData.ownershipType,
          askingPrice:
            formData.listingType === "FOR_SALE"
              ? parseFloat(formData.askingPrice)
              : undefined,
          rentalPrice:
            formData.listingType === "FOR_RENT"
              ? parseFloat(formData.rentalPrice)
              : undefined,
          currency: formData.currency,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          plotSizeSqm: parseFloat(formData.plotSizeSqm) || 0,
          latitude: formData.latitude,
          longitude: formData.longitude,
          suburb: formData.suburb,
          assignedAgentName: formData.assignedAgentName,
          landmarkDirections: formData.landmarkDirections,
          photos: formData.photos,
          standBoundary: formData.standBoundary,
        }),
      });

      const data = await res.json();
      if (data.success && data.property) {
        setProperties((prev) => [data.property, ...prev]);
        setIsModalOpen(false);
      } else {
        setFormError(data.error || "Failed to create property listing");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error occurred");
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb?.toLowerCase().includes(search.toLowerCase()) ||
      p.landmarkDirections?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === "ALL" || p.listingType === filterType;

    const matchesOwnership =
      filterOwnership === "ALL" || p.ownershipType === filterOwnership;

    return matchesSearch && matchesType && matchesOwnership;
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
        <div className="text-center py-16 text-editorial-muted text-xs font-geist">
          Loading property catalog from database...
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
                  <Link
                    href={`/p/${p.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-heading font-semibold uppercase tracking-wider text-contour-red hover:underline flex items-center gap-1"
                  >
                    <span>Public Card</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
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
                onClick={() => setIsModalOpen(false)}
                className="text-editorial-muted hover:text-contour-red"
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
                <div className="flex items-center justify-between">
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-contour-red" />
                    <span>Photos ({formData.photos.length})</span>
                  </label>
                  <span className="text-[10px] font-geist text-editorial-muted">First photo is hero</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {formData.photos.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-14 border border-editorial-border shrink-0">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-0.5 left-0.5 bg-contour-red text-white text-[7px] font-bold px-1">
                          HERO
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/80 text-white p-0.5 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste image URL (https://...)"
                    value={newPhotoInput}
                    onChange={(e) => setNewPhotoInput(e.target.value)}
                    className="flex-1 bg-white px-2.5 py-1 border border-editorial-border text-xs focus:outline-none font-geist"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-xs uppercase tracking-wider shrink-0 transition-colors"
                  >
                    + Add
                  </button>
                </div>
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
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Suburb (Lusaka)
                  </label>
                  <select
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
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
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold uppercase tracking-wider text-editorial-black mb-1">
                    Assigned Agent
                  </label>
                  <select
                    value={formData.assignedAgentName}
                    onChange={(e) => setFormData({ ...formData, assignedAgentName: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-editorial-border focus:outline-none text-editorial-black font-geist"
                  >
                    <option value="Tembo Mwape">Tembo Mwape</option>
                    <option value="Grace Banda">Grace Banda</option>
                    <option value="Chipo Banda">Chipo Banda</option>
                  </select>
                </div>
              </div>

              {/* Stand Boundary Editor */}
              <PropertyStandEditor
                latitude={formData.latitude}
                longitude={formData.longitude}
                standBoundary={formData.standBoundary}
                plotSizeSqm={formData.plotSizeSqm}
                onChange={({ latitude, longitude, standBoundary, plotSizeSqm }) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    standBoundary,
                    plotSizeSqm: String(plotSizeSqm),
                  }));
                }}
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

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-editorial-border text-editorial-black hover:bg-neutral-50 text-xs font-heading font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>Publish Listing</span>
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
