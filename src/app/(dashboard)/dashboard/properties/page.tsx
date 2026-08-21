"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Building2,
  Bed,
  Bath,
  Maximize,
  MapPin,
  ExternalLink,
  DollarSign,
  X,
  Sparkles,
  Bot,
  BellRing,
  Palette,
  Eye,
  Image as ImageIcon,
  Trash2,
  Layers,
  Share2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { evaluatePropertyAgainstAlerts, AlertMatchResult } from "@/lib/alerts/matchmaker";
import PropertyMatchSummaryModal from "@/components/alerts/property-match-summary-modal";
import Property360DetailModal from "@/components/properties/property-360-detail-modal";
import SocialMediaCardGeneratorModal from "@/components/marketing/social-media-card-generator-modal";
import PropertyStandEditor from "@/components/properties/property-stand-editor";

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
    latitude: -15.421100,
    longitude: 28.334100,
    standBoundary: [] as [number, number][],
    suburb: "Kabulonga",
    landmarkDirections: "",
    assignedAgentName: "Tembo Mwape",
    photos: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
    ],
  });
  const [newPhotoInput, setNewPhotoInput] = useState("");
  const [formError, setFormError] = useState("");

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb.toLowerCase().includes(search.toLowerCase()) ||
      (p.landmarkDirections && p.landmarkDirections.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      filterType === "ALL" || p.listingType === filterType;

    const matchesOwnership =
      filterOwnership === "ALL" || p.ownershipType === filterOwnership;

    return matchesSearch && matchesType && matchesOwnership;
  });

  const handleAddPhoto = () => {
    if (newPhotoInput.trim() && newPhotoInput.startsWith("http")) {
      setFormData({
        ...formData,
        photos: [...formData.photos, newPhotoInput.trim()],
      });
      setNewPhotoInput("");
    } else {
      alert("Please enter a valid image URL starting with http:// or https://");
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim() || formData.title.length < 5) {
      setFormError("Property title must be at least 5 characters.");
      return;
    }
    const priceNum = formData.listingType === "FOR_SALE"
      ? parseFloat(formData.askingPrice)
      : parseFloat(formData.rentalPrice);

    if (!priceNum || priceNum <= 0) {
      setFormError("Please enter a valid asking or rental price.");
      return;
    }

    const propertyPayload = {
      title: formData.title,
      listingType: formData.listingType,
      ownershipType: formData.ownershipType,
      askingPrice: formData.listingType === "FOR_SALE" ? priceNum : undefined,
      rentalPrice: formData.listingType === "FOR_RENT" ? priceNum : undefined,
      currency: formData.currency,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseFloat(formData.bathrooms) || 0,
      plotSizeSqm: parseFloat(formData.plotSizeSqm) || 0,
      suburb: formData.suburb,
      city: "Lusaka",
      latitude: formData.latitude,
      longitude: formData.longitude,
      landmarkDirections: formData.landmarkDirections || "Near Suburb Center",
      photos: formData.photos.length > 0
        ? formData.photos
        : ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80"],
      featuredPhoto: formData.photos[0] || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      description: "A gorgeous modern listing in " + formData.suburb + " with premium finishes.",
      ownerName: "Dev Landlord",
      ownerPhone: "+260971234567",
      ownerEmail: "landlord@gmail.com",
    };

    fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyPayload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.property) {
          setProperties([data.property, ...properties]);
          setIsModalOpen(false);

          const matches = evaluatePropertyAgainstAlerts(data.property);

          setFormData({
            title: "",
            listingType: "FOR_SALE",
            ownershipType: "MANAGED_ON_BEHALF",
            askingPrice: "",
            rentalPrice: "",
            currency: "ZMW",
            bedrooms: "3",
            bathrooms: "2",
            plotSizeSqm: "500",
            latitude: -15.421100,
            longitude: 28.334100,
            standBoundary: [],
            suburb: "Kabulonga",
            landmarkDirections: "",
            assignedAgentName: "Tembo Mwape",
            photos: [
              "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
            ],
          });

          if (matches.length > 0) {
            setMatchSummaryState({
              isOpen: true,
              property: data.property,
              matches,
            });
          } else {
            alert(`[SUCCESS] New property "${data.property.title}" created and saved to database!`);
          }
        } else {
          setFormError(data.error || "Failed to save property to database.");
        }
      })
      .catch((err) => {
        setFormError(`Failed to save property: ${err.message}`);
      });
  };

  return (
    <div className="p-6 sm:p-8 pb-32 sm:pb-40 space-y-6 max-w-7xl mx-auto w-full font-sans h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
            Portfolio Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
            Property Catalog & Mandate Vault
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Browse verified listings, inspect attached title deeds, generate social media marketing cards, and evaluate reverse-matched buyers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="px-4 py-2.5 rounded-full border border-border bg-white hover:bg-paper-200 text-ink-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-contour-red" />
            <span>Agency Settings</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold shadow-subtle flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property Listing</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-border shadow-card">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            type="text"
            placeholder="Search by title, suburb (e.g. Kabulonga, Roma Park), or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-paper-100 rounded-xl text-xs text-ink-900 placeholder:text-ink-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-paper-100 text-xs font-medium text-ink-800 px-3 py-2 rounded-xl border border-border focus:outline-none"
          >
            <option value="ALL">All Types (Sale & Rent)</option>
            <option value="FOR_SALE">For Sale</option>
            <option value="FOR_RENT">For Rent</option>
          </select>

          <select
            value={filterOwnership}
            onChange={(e) => setFilterOwnership(e.target.value)}
            className="bg-paper-100 text-xs font-medium text-ink-800 px-3 py-2 rounded-xl border border-border focus:outline-none"
          >
            <option value="ALL">All Ownership</option>
            <option value="COMPANY_OWNED">Company-Owned</option>
            <option value="MANAGED_ON_BEHALF">Managed On Behalf</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-ink-600 font-medium">
          <Bot className="animate-spin w-8 h-8 mb-2 text-contour-red" />
          <span>Loading properties from database...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-3xl bg-white space-y-3">
          <Building2 className="w-12 h-12 text-ink-400" />
          <h3 className="font-semibold text-ink-900">No properties found</h3>
          <p className="text-sm text-ink-600 max-w-sm">No listings found matching your search. Create your first property listing to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => {
            const isSale = p.listingType === "FOR_SALE";
            const price = isSale ? p.askingPrice : p.rentalPrice;
            const cardMatches = evaluatePropertyAgainstAlerts(p);
            const photoCount = p.photos ? p.photos.length : 1;

            return (
              <div
                key={p.id}
                onClick={() => setDetailModalState({ isOpen: true, property: p })}
                className="bg-white rounded-3xl border border-border overflow-hidden shadow-card hover:shadow-floating transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Image Banner with 360 Trigger */}
                  <div
                    className="relative h-48 bg-paper-300 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={p.featuredPhoto || p.photos?.[0] || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80"}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                        isSale ? "bg-contour-amber text-white" : "bg-contour-red text-white"
                      }`}>
                        {isSale ? "For Sale" : "For Rent"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white border border-border text-ink-800`}>
                        {p.propertyType?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 z-10">
                      <ImageIcon className="w-3 h-3 text-contour-red" />
                      <span>{photoCount} Photo{photoCount > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Property Info Content */}
                  <div className="p-5 space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-contour-red uppercase tracking-wider">
                        <MapPin className="w-3 h-3" />
                        <span>{p.suburb}, {p.city}</span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-ink-900 leading-tight group-hover:text-contour-red transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-ink-600 line-clamp-2 h-8 pt-0.5">
                        {p.description}
                      </p>
                    </div>

                    {/* Pricing Display */}
                    <div className="flex items-baseline gap-1 text-ink-900 border-t border-border pt-3">
                      <span className="text-[10px] font-semibold text-ink-600">{p.currency}</span>
                      <span className="text-lg font-bold tracking-tight">
                        {formatCurrency(Number(price || 0))}
                      </span>
                      {!isSale && <span className="text-[10px] font-medium text-ink-600">/ month</span>}
                    </div>

                    {/* Bedroom / Bathroom Specs */}
                    <div className="grid grid-cols-3 gap-2 bg-paper-100 p-2 rounded-2xl text-[10px] font-semibold text-ink-700 text-center">
                      <div className="flex items-center justify-center gap-1 border-r border-border">
                        <Bed className="w-3.5 h-3.5 text-ink-600" />
                        <span>{p.bedrooms || 0} Bed{p.bedrooms !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 border-r border-border">
                        <Bath className="w-3.5 h-3.5 text-ink-600" />
                        <span>{p.bathrooms || 0} Bath{p.bathrooms !== 1 ? "s" : ""}</span>
                      </div>
                      {p.plotSizeSqm && (
                        <div className="flex items-center justify-center gap-1">
                          <Maximize className="w-3.5 h-3.5 text-ink-600" />
                          <span>{p.plotSizeSqm} m²</span>
                        </div>
                      )}
                    </div>

                    {/* Action Triggers Bar */}
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalState({ isOpen: true, property: p });
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-paper-100 hover:bg-paper-200 border border-border text-ink-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-ink-600" />
                        <span>Full View</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSocialModalState({ isOpen: true, property: p });
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-ink-900 hover:bg-ink-950 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-subtle"
                      >
                        <Palette className="w-3 h-3 text-contour-red" />
                        <span>Social Card</span>
                      </button>
                    </div>

                    {/* Matching Buyers Trigger */}
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
                        className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center justify-between transition-colors shadow-xs"
                      >
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-contour-red" />
                          <span>{cardMatches.length} Matching Buyer{cardMatches.length > 1 ? "s" : ""}</span>
                        </span>
                        <span className="text-[10px] font-bold underline">Outreach & Reminders →</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-paper-100 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-ink-600 truncate max-w-[150px]">
                    Agent: <strong>{p.assignedAgent?.name || p.assignedAgentName || "Grace Banda"}</strong>
                  </span>
                  <Link
                    href={`/p/${p.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-contour-red hover:underline flex items-center gap-1"
                  >
                    <span>Public Card</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modal: Add Property Listing with Multi-Photo Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-border shadow-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-contour-red" />
                <h3 className="font-bold text-base text-ink-900">Add New Property Listing</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-600 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-contour-red text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateProperty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink-800 mb-1">Property Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Luxury 4-Bedroom Standalone Residence"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Listing Type</label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  >
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Ownership Model</label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  >
                    <option value="MANAGED_ON_BEHALF">Managed on Behalf</option>
                    <option value="COMPANY_OWNED">Company-Owned Asset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">
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
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  >
                    <option value="ZMW">ZMW (Zambian Kwacha)</option>
                    <option value="USD">USD (United States Dollar)</option>
                  </select>
                </div>
              </div>

              {/* Multi-Photo Upload & Preview Section */}
              <div className="p-3.5 rounded-2xl bg-paper-100 border border-paper-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-ink-900 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-contour-red" />
                    <span>Property Photos ({formData.photos.length} Added)</span>
                  </label>
                  <span className="text-[10px] text-ink-500">First photo is featured hero</span>
                </div>

                {/* Photo Previews Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {formData.photos.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-paper-300 group">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-contour-red text-white text-[8px] font-bold px-1 rounded">
                          HERO
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Photo Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                    value={newPhotoInput}
                    onChange={(e) => setNewPhotoInput(e.target.value)}
                    className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-border text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 rounded-xl bg-ink-900 hover:bg-ink-950 text-white font-semibold text-xs shrink-0"
                  >
                    + Add Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Plot Size (m²)</label>
                  <input
                    type="number"
                    value={formData.plotSizeSqm}
                    onChange={(e) => setFormData({ ...formData, plotSizeSqm: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-800 mb-1">Suburb (Lusaka)</label>
                  <select
                    value={formData.suburb}
                    onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900 font-semibold"
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
                  <label className="block font-semibold text-ink-800 mb-1">Assigned Closing Agent</label>
                  <select
                    value={formData.assignedAgentName}
                    onChange={(e) => setFormData({ ...formData, assignedAgentName: e.target.value })}
                    className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                  >
                    <option value="Tembo Mwape">Tembo Mwape</option>
                    <option value="Grace Banda">Grace Banda</option>
                    <option value="Chipo Banda">Chipo Banda</option>
                  </select>
                </div>
              </div>

              {/* Geospatial Coordinates & Interactive Stand Boundary Editor */}
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
                <label className="block font-semibold text-ink-800 mb-1">Landmark Directions</label>
                <input
                  type="text"
                  placeholder="e.g. 200m off Kabulonga Road, near Centro Mall"
                  value={formData.landmarkDirections}
                  onChange={(e) => setFormData({ ...formData, landmarkDirections: e.target.value })}
                  className="w-full bg-paper-100 px-3 py-2 rounded-xl border border-border focus:outline-none text-ink-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-ink-800 hover:bg-paper-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink-900 hover:bg-ink-950 text-white font-semibold shadow-subtle flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                  <span>Save & Publish ({formData.photos.length} Photos)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Property Full View & Legal Vault Modal */}
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

      {/* 2. Social Media Marketing Card Generator Modal */}
      <SocialMediaCardGeneratorModal
        isOpen={socialModalState.isOpen}
        onClose={() => setSocialModalState({ isOpen: false, property: null })}
        property={socialModalState.property}
      />

      {/* 3. Interactive Reverse-Match Summary & Outreach Modal */}
      <PropertyMatchSummaryModal
        isOpen={matchSummaryState.isOpen}
        onClose={() => setMatchSummaryState({ ...matchSummaryState, isOpen: false })}
        property={matchSummaryState.property}
        matches={matchSummaryState.matches}
      />
    </div>
  );
}
