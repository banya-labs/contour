"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  MessageSquare,
  Share2,
  FileCheck,
  ShieldCheck,
  Download,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Compass,
  Palette,
  Layers,
  Edit3,
  Save,
  Plus,
  Trash2,
  UserPlus,
  Briefcase,
  AlertCircle,
  Image as ImageIcon,
  Lock,
  Crosshair,
  FileText,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PropertyStandEditor from "@/components/properties/property-stand-editor";

export type DealParty = {
  id: string;
  name: string;
  title: string;
  dealAssociation: string;
  phone: string;
  email: string;
  roleType: "SELLER" | "BROKER" | "BUYER" | "LAWYER" | "ESCROW" | "TENANT";
};

type PropertyFullDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onUpdateProperty?: (updatedProperty: any) => void;
  onOpenSocialGenerator: (property: any) => void;
  onOpenMatchingBuyers: (property: any) => void;
};

type TabId = "OVERVIEW" | "GEOSPATIAL" | "PARTIES" | "DOCUMENTS" | "TIMELINE";

export default function PropertyFullDetailModal({
  isOpen,
  onClose,
  property,
  onUpdateProperty,
  onOpenSocialGenerator,
  onOpenMatchingBuyers,
}: PropertyFullDetailModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("OVERVIEW");
  const [completedActions, setCompletedActions] = useState<{ [key: string]: boolean }>({});

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Deal Parties State
  const [partiesList, setPartiesList] = useState<DealParty[]>([
    {
      id: "party_01",
      name: "Mr. Hastings Banda",
      title: "Registered Title Deed Holder (Seller)",
      dealAssociation: "Sole Mandate Signatory & Beneficial Property Owner",
      phone: "+260 97 445 5667",
      email: "hastings.banda@zambia.mail",
      roleType: "SELLER",
    },
    {
      id: "party_02",
      name: "Tembo Mwape",
      title: "Lead Listing Broker (Field Agent)",
      dealAssociation: "Exclusive 50% Commission Deal Owner & Field Representative",
      phone: "+260 97 123 4567",
      email: "tembo.mwape@contour.co.zm",
      roleType: "BROKER",
    },
    {
      id: "party_03",
      name: "Nchimunya Mweene",
      title: "Prospective Buyer (Client Lead)",
      dealAssociation: "Pre-Qualified Buyer • Completed Physical Viewing on Aug 15 • Purchase Offer under Legal Review",
      phone: "+260 97 188 9900",
      email: "nchimunya.mweene@corp.zm",
      roleType: "BUYER",
    },
    {
      id: "party_04",
      name: "Grace Banda",
      title: "Principal Broker & Conveyancer",
      dealAssociation: "Ministry of Lands Consent Lodgement & Trust Account Escrow Officer",
      phone: "+260 97 999 1122",
      email: "grace.banda@contour.co.zm",
      roleType: "ESCROW",
    },
  ]);

  // Add Contact State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Omit<DealParty, "id">>({
    name: "",
    title: "",
    dealAssociation: "",
    phone: "",
    email: "",
    roleType: "BUYER",
  });

  // Initialize edit form data when property changes
  useEffect(() => {
    if (property) {
      const initPhotos =
        property.photos && property.photos.length > 0
          ? property.photos
          : [property.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"];
      setEditFormData({
        title: property.title || "",
        suburb: property.suburb || "Kabulonga",
        listingType: property.listingType || "FOR_SALE",
        ownershipType: property.ownershipType || "MANAGED_ON_BEHALF",
        askingPrice: property.askingPrice || "",
        rentalPrice: property.rentalPrice || "",
        currency: property.currency || "ZMW",
        bedrooms: property.bedrooms !== undefined ? property.bedrooms : 3,
        bathrooms: property.bathrooms !== undefined ? property.bathrooms : 2,
        plotSizeSqm: property.plotSizeSqm || 500,
        latitude: property.latitude || -15.421100,
        longitude: property.longitude || 28.334100,
        standBoundary: property.standBoundary || [],
        landmarkDirections: property.landmarkDirections || "",
        description: property.description || "",
        assignedAgentName: property.assignedAgentName || "Tembo Mwape",
        assignedAgentPhone: property.assignedAgentPhone || "+260971234567",
        status: property.status || "AVAILABLE",
        photos: initPhotos,
        featuredPhoto: property.featuredPhoto || initPhotos[0],
      });
    }
  }, [property]);

  // When switching to edit mode, force tab to OVERVIEW if on read-only tabs
  useEffect(() => {
    if (isEditing && (activeTab === "PARTIES" || activeTab === "DOCUMENTS" || activeTab === "TIMELINE")) {
      setActiveTab("OVERVIEW");
    }
  }, [isEditing]);

  const handleAddEditPhoto = () => {
    if (newPhotoUrl.trim() && newPhotoUrl.startsWith("http")) {
      const currentPhotos = editFormData?.photos || [];
      const updatedPhotos = [...currentPhotos, newPhotoUrl.trim()];
      setEditFormData({
        ...editFormData,
        photos: updatedPhotos,
        featuredPhoto: editFormData?.featuredPhoto || updatedPhotos[0],
      });
      setNewPhotoUrl("");
    } else {
      alert("Please enter a valid image URL starting with http:// or https://");
    }
  };

  const handleRemoveEditPhoto = (indexToRemove: number) => {
    const currentPhotos = editFormData?.photos || [];
    if (currentPhotos.length <= 1) {
      alert("A property listing must contain at least one photo.");
      return;
    }
    const photoToRemove = currentPhotos[indexToRemove];
    const updatedPhotos = currentPhotos.filter((_: any, idx: number) => idx !== indexToRemove);
    let newCover = editFormData?.featuredPhoto;
    if (editFormData?.featuredPhoto === photoToRemove || !updatedPhotos.includes(editFormData?.featuredPhoto)) {
      newCover = updatedPhotos[0];
    }
    setEditFormData({
      ...editFormData,
      photos: updatedPhotos,
      featuredPhoto: newCover,
    });
  };

  const handleSetCoverPhoto = (photoUrl: string) => {
    setEditFormData({
      ...editFormData,
      featuredPhoto: photoUrl,
    });
  };

  if (!isOpen || !property) return null;

  const isSale = property.listingType === "FOR_SALE";
  const price = isSale ? property.askingPrice : property.rentalPrice;
  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : [property.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"];

  // Mock Attached Vault Documents
  const attachedDocuments = [
    {
      id: "doc_01",
      name: "Certificate of Title Deed Folio",
      refNumber: "LUS/LAND/2026/8942-A",
      type: "TITLE_DEED",
      fileSize: "2.4 MB",
      dateUploaded: "2026-08-01",
      verified: true,
    },
    {
      id: "doc_02",
      name: "Exclusive Sole Agency Mandate Contract",
      refNumber: "CTR-MND-2026-044",
      type: "MANDATE",
      fileSize: "1.1 MB",
      dateUploaded: "2026-08-02",
      verified: true,
    },
    {
      id: "doc_03",
      name: "Ministry of Lands Cadastral Survey Diagram",
      refNumber: "SD-LUS-8942",
      type: "SURVEY",
      fileSize: "4.8 MB",
      dateUploaded: "2026-08-05",
      verified: true,
    },
    {
      id: "doc_04",
      name: "PACRA Company Search & Title Verification",
      refNumber: "PACRA-LUS-9910",
      type: "PACRA",
      fileSize: "850 KB",
      dateUploaded: "2026-08-06",
      verified: true,
    },
  ];

  // Mock Chronological Deal Timeline
  const timelineEvents = [
    {
      title: "In-Person Client Viewing Completed",
      date: "Aug 15, 2026 • 11:00 AM",
      actor: "Tembo Mwape (Lead Broker)",
      detail: "Conducted 45-minute on-site inspection with buyer Nchimunya Mweene.",
      status: "COMPLETED",
    },
    {
      title: "Automated Reverse-Match WhatsApp Alerts Dispatched",
      date: "Aug 14, 2026 • 09:15 AM",
      actor: "Contour AI Matchmaking Engine",
      detail: "2 matching buyers notified with pre-formatted WhatsApp flyer.",
      status: "COMPLETED",
    },
    {
      title: "Sole Agency Mandate Executed & Verified",
      date: "Aug 10, 2026 • 04:00 PM",
      actor: "Legal Compliance Officer",
      detail: "Signed sole mandate active for 6 months (Expires Dec 2026).",
      status: "COMPLETED",
    },
  ];

  const nextActions = [
    { id: "act_1", label: "Follow up with Nchimunya Mweene on formal purchase offer contract" },
    { id: "act_2", label: "Generate and post social media flyer card for Lusaka marketing" },
    { id: "act_3", label: "Obtain certified copy of Ministry of Lands survey diagram" },
  ];

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveListingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title.trim()) {
      alert("Property title cannot be empty.");
      return;
    }

    const priceNum = editFormData.listingType === "FOR_SALE"
      ? parseFloat(editFormData.askingPrice)
      : parseFloat(editFormData.rentalPrice);

    const updatedProp = {
      ...property,
      title: editFormData.title,
      suburb: editFormData.suburb,
      listingType: editFormData.listingType,
      ownershipType: editFormData.ownershipType,
      askingPrice: editFormData.listingType === "FOR_SALE" ? priceNum : undefined,
      rentalPrice: editFormData.listingType === "FOR_RENT" ? priceNum : undefined,
      currency: editFormData.currency,
      bedrooms: parseInt(editFormData.bedrooms) || 0,
      bathrooms: parseFloat(editFormData.bathrooms) || 0,
      plotSizeSqm: parseFloat(editFormData.plotSizeSqm) || 0,
      latitude: editFormData.latitude,
      longitude: editFormData.longitude,
      standBoundary: editFormData.standBoundary,
      landmarkDirections: editFormData.landmarkDirections,
      description: editFormData.description,
      assignedAgentName: editFormData.assignedAgentName,
      assignedAgentPhone: editFormData.assignedAgentPhone,
      status: editFormData.status,
      photos: editFormData.photos && editFormData.photos.length > 0 ? editFormData.photos : property.photos,
      featuredPhoto: editFormData.featuredPhoto || (editFormData.photos && editFormData.photos[0]) || property.featuredPhoto,
    };

    try {
      await fetch("/api/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: property.id, ...updatedProp }),
      });
    } catch (_err) {
      console.warn("API offline, updated local state");
    }

    if (onUpdateProperty) {
      onUpdateProperty(updatedProp);
    }
    setIsEditing(false);
    alert("[LISTING UPDATED] Property details, coordinates, stand boundary, pricing, and photos updated successfully!");
  };

  const handleAddDealParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.title.trim()) {
      alert("Please provide the contact's name and their official title.");
      return;
    }
    const created: DealParty = {
      id: `party_${Date.now()}`,
      ...newContact,
    };
    setPartiesList((prev) => [...prev, created]);
    setNewContact({
      name: "",
      title: "",
      dealAssociation: "",
      phone: "",
      email: "",
      roleType: "BUYER",
    });
    setIsAddingContact(false);
  };

  const handleRemoveDealParty = (partyId: string) => {
    setPartiesList(partiesList.filter((p) => p.id !== partyId));
  };

  return (
    <div className="fixed inset-0 z-[2200] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden w-full max-w-6xl h-[92vh] max-h-[92vh]">
        
        {/* 1. TOP ELEGANT HEADER BAR */}
        <div className="px-6 py-3.5 bg-paper-100 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-contour-red text-white flex items-center justify-center font-bold shadow-subtle shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-ink-900 line-clamp-1">
                  {property.title}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-ink-900 text-white shrink-0">
                  {isSale ? "FOR SALE 🔴" : "FOR RENT 🟡"}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  {property.status || "AVAILABLE"}
                </span>
                {isEditing && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-contour-amber text-ink-950 animate-pulse shrink-0">
                    📝 EDIT MODE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-600">
                Property Vault 360 • 📍 {property.suburb}, {property.city || "Lusaka"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons Capsule */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveListingDetails}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-xs font-bold shadow-subtle transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full bg-white border border-border text-ink-800 hover:bg-paper-200 text-xs font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold shadow-subtle transition-transform active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-contour-amber" />
                  <span>Edit Property</span>
                </button>

                <button
                  onClick={() => onOpenSocialGenerator(property)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border text-ink-800 hover:bg-paper-200 text-xs font-semibold transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-contour-red" />
                  <span>Social Flyer</span>
                </button>

                <button
                  onClick={() => onOpenMatchingBuyers(property)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-subtle transition-transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Matching Buyers</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-ink-600 hover:bg-paper-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. MAIN 2-COLUMN MASTER-DETAIL BODY */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* LEFT SIDEBAR NAVIGATION MENU */}
          <div className="w-60 sm:w-64 bg-paper-100 border-r border-border shrink-0 p-3 space-y-1.5 overflow-y-auto font-sans">
            <div className="px-2 py-1 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
              Navigation Sections
            </div>

            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                activeTab === "OVERVIEW"
                  ? "bg-contour-red text-white shadow-subtle"
                  : "text-ink-800 hover:bg-paper-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Full Specs & Gallery</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("GEOSPATIAL")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors ${
                activeTab === "GEOSPATIAL"
                  ? "bg-contour-red text-white shadow-subtle"
                  : "text-ink-800 hover:bg-paper-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                <span>Geospatial & Stand</span>
              </div>
              <span className="text-[9px] bg-paper-300/60 text-ink-900 px-1.5 py-0.5 rounded font-mono">
                A, B, C...
              </span>
            </button>

            <div className="pt-2 border-t border-paper-200 px-2 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
              Mandate Operations
            </div>

            {/* Deal Parties Tab */}
            <button
              disabled={isEditing}
              onClick={() => setActiveTab("PARTIES")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors ${
                isEditing
                  ? "opacity-40 cursor-not-allowed text-ink-600 bg-paper-200/50"
                  : activeTab === "PARTIES"
                  ? "bg-contour-red text-white shadow-subtle"
                  : "text-ink-800 hover:bg-paper-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Deal Parties ({partiesList.length})</span>
              </div>
              {isEditing && <Lock className="w-3 h-3 text-ink-500" />}
            </button>

            {/* Legal Vault Tab */}
            <button
              disabled={isEditing}
              onClick={() => setActiveTab("DOCUMENTS")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors ${
                isEditing
                  ? "opacity-40 cursor-not-allowed text-ink-600 bg-paper-200/50"
                  : activeTab === "DOCUMENTS"
                  ? "bg-contour-red text-white shadow-subtle"
                  : "text-ink-800 hover:bg-paper-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Legal Vault ({attachedDocuments.length})</span>
              </div>
              {isEditing && <Lock className="w-3 h-3 text-ink-500" />}
            </button>

            {/* Deal Timeline Tab */}
            <button
              disabled={isEditing}
              onClick={() => setActiveTab("TIMELINE")}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors ${
                isEditing
                  ? "opacity-40 cursor-not-allowed text-ink-600 bg-paper-200/50"
                  : activeTab === "TIMELINE"
                  ? "bg-contour-red text-white shadow-subtle"
                  : "text-ink-800 hover:bg-paper-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Deal Timeline</span>
              </div>
              {isEditing && <Lock className="w-3 h-3 text-ink-500" />}
            </button>

            {isEditing && (
              <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-tight">
                🔒 <strong>Edit Mode Active</strong>: Deal Parties, Vault Documents, and Timeline are read-only during listing editing.
              </div>
            )}
          </div>

          {/* RIGHT MAIN CONTENT CANVAS */}
          <div className="flex-1 bg-white p-6 overflow-y-auto min-w-0">
            
            {/* TAB 1: OVERVIEW & SPECS */}
            {activeTab === "OVERVIEW" && (
              <div className="space-y-6">
                
                {/* EDIT MODE OVERVIEW FORM */}
                {isEditing ? (
                  <form onSubmit={handleSaveListingDetails} className="space-y-4 max-w-3xl">
                    
                    {/* Multi-Photo Upload & Cover Selector */}
                    <div className="p-4 rounded-2xl bg-paper-100 border border-paper-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-ink-900 text-xs flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-contour-red" />
                          <span>Photo Gallery ({editFormData.photos.length} Photos)</span>
                        </label>
                        <span className="text-[10px] text-ink-500">Select photo to set as Cover / Hero picture</span>
                      </div>

                      {/* Photo Previews Strip */}
                      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                        {editFormData.photos.map((url: string, idx: number) => {
                          const isCover = editFormData.featuredPhoto === url;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleSetCoverPhoto(url)}
                              className={`relative w-24 h-18 rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                                isCover ? "border-contour-red ring-2 ring-contour-red/20 shadow-md" : "border-paper-300 opacity-80 hover:opacity-100"
                              }`}
                            >
                              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              {isCover && (
                                <div className="absolute top-1 left-1 bg-contour-red text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                                  HERO COVER
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveEditPhoto(idx);
                                }}
                                className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Photo Input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="flex-1 bg-white px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-1 focus:ring-contour-red"
                        />
                        <button
                          type="button"
                          onClick={handleAddEditPhoto}
                          className="px-4 py-2 rounded-xl bg-ink-900 hover:bg-ink-950 text-white font-semibold text-xs shrink-0 flex items-center gap-1 shadow-subtle"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Photo</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 text-xs mb-1">Property Title *</label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-border text-ink-900 font-semibold focus:outline-none focus:ring-2 focus:ring-contour-red/20 focus:border-contour-red text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Listing Type</label>
                        <select
                          value={editFormData.listingType}
                          onChange={(e) => setEditFormData({ ...editFormData, listingType: e.target.value })}
                          className="w-full bg-white px-3 py-2.5 rounded-xl border border-border text-ink-900 text-xs font-semibold focus:outline-none"
                        >
                          <option value="FOR_SALE">For Sale</option>
                          <option value="FOR_RENT">For Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">
                          {editFormData.listingType === "FOR_SALE" ? "Asking Price *" : "Monthly Rent *"}
                        </label>
                        <input
                          type="number"
                          value={editFormData.listingType === "FOR_SALE" ? editFormData.askingPrice : editFormData.rentalPrice}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              [editFormData.listingType === "FOR_SALE" ? "askingPrice" : "rentalPrice"]: e.target.value,
                            })
                          }
                          className="w-full bg-white px-3 py-2.5 rounded-xl border border-border text-ink-900 font-mono font-bold text-xs focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Currency</label>
                        <select
                          value={editFormData.currency}
                          onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                          className="w-full bg-white px-3 py-2.5 rounded-xl border border-border text-ink-900 text-xs font-semibold focus:outline-none"
                        >
                          <option value="ZMW">ZMW (Zambian Kwacha)</option>
                          <option value="USD">USD (United States Dollar)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Suburb (Lusaka)</label>
                        <select
                          value={editFormData.suburb}
                          onChange={(e) => setEditFormData({ ...editFormData, suburb: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs font-semibold focus:outline-none"
                        >
                          <option value="Kabulonga">Kabulonga</option>
                          <option value="Leopards Hill">Leopards Hill</option>
                          <option value="Roma Park">Roma Park</option>
                          <option value="Woodlands">Woodlands</option>
                          <option value="Rhodes Park">Rhodes Park</option>
                          <option value="Mass Media">Mass Media</option>
                          <option value="Ibex Hill">Ibex Hill</option>
                          <option value="Chudleigh">Chudleigh</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Bedrooms</label>
                        <input
                          type="number"
                          value={editFormData.bedrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bedrooms: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Bathrooms</label>
                        <input
                          type="number"
                          step="0.5"
                          value={editFormData.bathrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bathrooms: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Plot Size (m²)</label>
                        <input
                          type="number"
                          value={editFormData.plotSizeSqm}
                          onChange={(e) => setEditFormData({ ...editFormData, plotSizeSqm: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Assigned Closing Agent</label>
                        <select
                          value={editFormData.assignedAgentName}
                          onChange={(e) => setEditFormData({ ...editFormData, assignedAgentName: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                        >
                          <option value="Tembo Mwape">Tembo Mwape</option>
                          <option value="Grace Banda">Grace Banda</option>
                          <option value="Chipo Banda">Chipo Banda</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Agent Phone Number</label>
                        <input
                          type="text"
                          value={editFormData.assignedAgentPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, assignedAgentPhone: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-ink-900 text-xs mb-1">Listing Status</label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-border text-ink-900 text-xs font-semibold focus:outline-none"
                        >
                          <option value="AVAILABLE">AVAILABLE (Active Mandate)</option>
                          <option value="UNDER_OFFER">UNDER_OFFER (Offer in Review)</option>
                          <option value="SOLD">SOLD (Title Transferred)</option>
                          <option value="RENTED">RENTED (Lease Executed)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 text-xs mb-1">Landmark Driving Directions</label>
                      <input
                        type="text"
                        value={editFormData.landmarkDirections}
                        onChange={(e) => setEditFormData({ ...editFormData, landmarkDirections: e.target.value })}
                        placeholder="e.g. 200m off Kabulonga Road, near Centro Mall"
                        className="w-full bg-white px-3.5 py-2 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink-900 text-xs mb-1">Marketing Narrative & Description</label>
                      <textarea
                        rows={4}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full bg-white p-3 rounded-xl border border-border text-ink-900 text-xs focus:outline-none"
                      />
                    </div>
                  </form>
                ) : (
                  /* READING MODE OVERVIEW */
                  <>
                    {/* Hero Photo Carousel */}
                    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden shadow-card border border-border group">
                      <img
                        src={photos[activePhotoIdx]}
                        alt={property.title}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-black/60 px-2 py-0.5 rounded-full border border-white/20">
                            {activePhotoIdx + 1} / {photos.length} Photos
                          </span>
                          <span className="font-semibold">{property.suburb}, Lusaka</span>
                        </div>
                        <span className="font-serif font-extrabold text-xl text-contour-amber">
                          {formatCurrency(price, property.currency)}
                          {!isSale && <span className="text-xs text-white/80 font-mono font-normal"> / mo</span>}
                        </span>
                      </div>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-2.5">
                        <Bed className="w-4 h-4 text-contour-red shrink-0" />
                        <div>
                          <div className="text-[10px] text-ink-500 font-semibold">Bedrooms</div>
                          <div className="font-bold text-sm text-ink-900">{property.bedrooms || 3} Beds</div>
                        </div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-2.5">
                        <Bath className="w-4 h-4 text-contour-red shrink-0" />
                        <div>
                          <div className="text-[10px] text-ink-500 font-semibold">Bathrooms</div>
                          <div className="font-bold text-sm text-ink-900">{property.bathrooms || 2} Baths</div>
                        </div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-2.5">
                        <Maximize className="w-4 h-4 text-contour-red shrink-0" />
                        <div>
                          <div className="text-[10px] text-ink-500 font-semibold">Plot Size</div>
                          <div className="font-bold text-sm text-ink-900">{property.plotSizeSqm || 500} m²</div>
                        </div>
                      </div>
                      <div className="p-3 bg-paper-100 rounded-xl border border-paper-200 flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-contour-red shrink-0" />
                        <div>
                          <div className="text-[10px] text-ink-500 font-semibold">Assigned Agent</div>
                          <div className="font-bold text-xs text-ink-900 line-clamp-1">{property.assignedAgentName || "Tembo Mwape"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Marketing Narrative Description */}
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-sm text-ink-900">Marketing Narrative & Description</h4>
                      <p className="text-xs text-ink-700 leading-relaxed bg-paper-100/60 p-4 rounded-xl border border-paper-200 whitespace-pre-line">
                        {property.description || "Immaculate standalone family residence set on a lush plot in prime Lusaka. Features open-plan living, private swimming pool, dedicated staff quarters, high-yield borehole, and automated solar inverter backup."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: GEOSPATIAL & STAND BOUNDARY EDITOR */}
            {activeTab === "GEOSPATIAL" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-ink-900 flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-contour-red" />
                      <span>Geospatial Coordinates & Stand Boundary Editor</span>
                    </h3>
                    <p className="text-xs text-ink-600 mt-0.5">
                      Adjust property latitude/longitude and individual corner node points (Points A, B, C, D...)
                    </p>
                  </div>
                </div>

                <PropertyStandEditor
                  latitude={isEditing ? editFormData.latitude : property.latitude || -15.421100}
                  longitude={isEditing ? editFormData.longitude : property.longitude || 28.334100}
                  standBoundary={isEditing ? editFormData.standBoundary : property.standBoundary || []}
                  plotSizeSqm={isEditing ? editFormData.plotSizeSqm : property.plotSizeSqm || 500}
                  onChange={({ latitude, longitude, standBoundary, plotSizeSqm }) => {
                    if (isEditing) {
                      setEditFormData((prev: any) => ({
                        ...prev,
                        latitude,
                        longitude,
                        standBoundary,
                        plotSizeSqm,
                      }));
                    }
                  }}
                />
              </div>
            )}

            {/* TAB 3: DEAL PARTIES & CONTACTS */}
            {activeTab === "PARTIES" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-ink-900">Mandate Parties & Stakeholders</h3>
                    <p className="text-xs text-ink-600">30-Day Anti-Poaching Protected Contact Records</p>
                  </div>
                  <button
                    onClick={() => setIsAddingContact(!isAddingContact)}
                    className="px-3 py-1.5 rounded-full bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold flex items-center gap-1 shadow-subtle"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Stakeholder</span>
                  </button>
                </div>

                {isAddingContact && (
                  <form onSubmit={handleAddDealParty} className="p-4 bg-paper-100 rounded-2xl border border-paper-300 space-y-3">
                    <h4 className="font-bold text-xs text-ink-900">Add New Stakeholder to Mandate</h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Full Name (e.g. Chipo Banda)"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="bg-white px-3 py-1.5 rounded-xl border border-border text-xs focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Role Title (e.g. Escrow Conveyancer)"
                        value={newContact.title}
                        onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                        className="bg-white px-3 py-1.5 rounded-xl border border-border text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingContact(false)}
                        className="px-3 py-1 text-xs text-ink-600 hover:text-ink-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-contour-red text-white text-xs font-bold shadow-subtle"
                      >
                        Save Contact
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {partiesList.map((party) => (
                    <div key={party.id} className="p-4 bg-paper-100/70 rounded-2xl border border-paper-200 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-bold bg-ink-900 text-white px-2 py-0.5 rounded-full uppercase">
                            {party.roleType}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-ink-900 mt-1">{party.name}</h4>
                          <p className="text-[11px] font-semibold text-contour-red">{party.title}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveDealParty(party.id)}
                          className="text-ink-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-ink-600">{party.dealAssociation}</p>
                      <div className="pt-2 border-t border-paper-200 flex items-center justify-between text-xs text-ink-800 font-mono">
                        <span>📞 {party.phone}</span>
                        <span>✉️ {party.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: LEGAL VAULT & DEEDS */}
            {activeTab === "DOCUMENTS" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-ink-900">Encrypted Legal Custody Vault</h3>
                    <p className="text-xs text-ink-600">POPIA Sovereignty & MinIO S3 Presigned Tokens</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {attachedDocuments.map((doc) => (
                    <div key={doc.id} className="p-3.5 bg-paper-100/70 rounded-2xl border border-paper-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-contour-red/10 border border-contour-red/20 text-contour-red flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-ink-900">{doc.name}</h4>
                          <span className="text-[10px] text-ink-600 font-mono">Ref: {doc.refNumber} • {doc.fileSize}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`[DOWNLOAD PRE-SIGNED TOKEN GENERATED] Downloading ${doc.name} (Valid 15 mins)`)}
                        className="px-3 py-1.5 rounded-xl bg-ink-900 hover:bg-ink-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-subtle"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DEAL TIMELINE */}
            {activeTab === "TIMELINE" && (
              <div className="space-y-6">
                <div className="border-b border-border pb-3">
                  <h3 className="font-serif font-bold text-base text-ink-900">Chronological Deal Log & Tasks</h3>
                  <p className="text-xs text-ink-600">Audit Trail of Mandate Milestones</p>
                </div>

                {/* Next Actions Checklist */}
                <div className="p-4 bg-paper-100 rounded-2xl border border-paper-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-ink-900">Next Priority Actions</h4>
                  <div className="space-y-1.5">
                    {nextActions.map((act) => {
                      const isDone = !!completedActions[act.id];
                      return (
                        <div
                          key={act.id}
                          onClick={() => toggleAction(act.id)}
                          className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl bg-white border border-border hover:border-contour-red transition-all"
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-ink-400 bg-white"
                          }`}>
                            {isDone && <Check className="w-3 h-3" />}
                          </div>
                          <span className={`text-xs ${isDone ? "line-through opacity-70" : "font-semibold text-ink-900"}`}>
                            {act.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline History */}
                <div className="space-y-3 border-l-2 border-contour-red/30 ml-3 pl-4">
                  {timelineEvents.map((evt, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-contour-red border-2 border-white shadow-subtle" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink-900">{evt.title}</span>
                        <span className="text-[10px] text-ink-500 font-mono">{evt.date}</span>
                      </div>
                      <div className="text-[11px] text-ink-600">{evt.detail}</div>
                      <div className="text-[10px] font-semibold text-ink-500">By {evt.actor}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
