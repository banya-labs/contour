"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Share2,
  ShieldCheck,
  Download,
  UserCheck,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Palette,
  Edit3,
  Save,
  Trash2,
  UserPlus,
  FileText,
  Users,
  Upload,
  X,
  Sparkles,
  FileUp,
  Send,
  Copy,
  ScanLine,
  Image as ImageIcon,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { PendingButtonContent } from "@/components/ui/pending-button-content";
import { SectionPendingState } from "@/components/ui/section-pending-state";
import { formatCurrency } from "@/lib/utils";
import PropertyImageUploader from "@/components/properties/property-image-uploader";
import TitleDeedOcrUploader, { TitleDeedOcrResult } from "@/components/properties/title-deed-ocr-uploader";
import { useSession } from "@/lib/auth-client";
import { canManagePropertyPhotos } from "@/lib/authorization";
import { formatWhatsAppDigits } from "@/lib/phone-utils";

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

type ActiveSection = "DETAILS" | "VAULT" | "STAKEHOLDERS";

const LUSAKA_SUBURBS = [
  "Kabulonga",
  "Leopards Hill",
  "Roma Park",
  "Woodlands",
  "Rhodes Park",
  "Mass Media",
  "Ibex Hill",
  "Chudleigh",
  "Longacres",
  "New Kasama",
  "Silverest",
  "Makeni",
  "Olympia Park",
  "Northmead",
  "Sunningdale",
  "State Lodge",
];

export default function PropertyFullDetailModal({
  isOpen,
  onClose,
  property,
  onUpdateProperty,
  onOpenSocialGenerator,
  onOpenMatchingBuyers,
}: PropertyFullDetailModalProps) {
  const { data: session } = useSession();

  // Active section & view/edit modes
  const [activeSection, setActiveSection] = useState<ActiveSection>("DETAILS");
  const [isEditing, setIsEditing] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddingPhotosViewMode, setIsAddingPhotosViewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real Organization Agents State
  const [orgAgents, setOrgAgents] = useState<Array<{ id: string; name: string; phone?: string; email?: string; roleKey?: string }>>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Real Documents State
  const [vaultDocuments, setVaultDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadCategory, setDocUploadCategory] = useState("TITLE_DEED");
  const [docUploadTitle, setDocUploadTitle] = useState("");
  const [uploadingFileLoading, setUploadingFileLoading] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Document Request State
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);
  const [requestDocTitle, setRequestDocTitle] = useState("");
  const [requestDocType, setRequestDocType] = useState("TITLE_DEED");
  const [requestDocMessage, setRequestDocMessage] = useState("");
  const [requestDocLoading, setRequestDocLoading] = useState(false);
  const [requestDocResult, setRequestDocResult] = useState<{ shareableUrl: string; whatsAppUrl?: string } | null>(null);

  // Title Deed OCR Modal State (In Details Tab)
  const [showOcrUploader, setShowOcrUploader] = useState(false);

  // Stakeholders / Deal Parties State (Real, not hardcoded dummy data)
  const [stakeholders, setStakeholders] = useState<DealParty[]>([]);
  const [isAddingStakeholder, setIsAddingStakeholder] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState<Omit<DealParty, "id">>({
    name: "",
    title: "",
    dealAssociation: "",
    phone: "",
    email: "",
    roleType: "SELLER",
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<any>(null);

  // Check photo upload permissions (all agency team members can manage listing media)
  const userRole = (session?.user as any)?.role || "";
  const canUploadPhotos = property ? !["LANDLORD", "TENANT"].includes(userRole) : false;

  // 1. Fetch Real Organization Agents
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadAgents() {
      setLoadingAgents(true);
      try {
        const res = await fetch("/api/organization/agents");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.agents) && isMounted) {
            setOrgAgents(data.agents);
          }
        }
      } catch (err) {
        console.error("Failed to load organization agents:", err);
      } finally {
        if (isMounted) setLoadingAgents(false);
      }
    }
    loadAgents();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Fetch Real Vault Documents for Property
  const loadVaultDocuments = async () => {
    if (!property?.id) return;
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/vault/documents");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          // Filter strictly for this property
          const propertyDocs = data.documents.filter(
            (d: any) => d.propertyId === property.id
          );
          setVaultDocuments(propertyDocs);
        }
      }
    } catch (err) {
      console.error("Failed to load property vault documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isOpen && property?.id) {
      loadVaultDocuments();
    }
  }, [isOpen, property?.id]);

  // 3. Initialize Form & Stakeholders when property changes
  useEffect(() => {
    if (property) {
      const initPhotos =
        Array.isArray(property.photos) && property.photos.length > 0
          ? property.photos
          : property.featuredPhoto
          ? [property.featuredPhoto]
          : [];

      setEditFormData({
        title: property.title || "",
        listingType: property.listingType || "FOR_SALE",
        propertyType: property.propertyType || "HOUSE",
        suburb: property.suburb || "Kabulonga",
        city: property.city || "Lusaka",
        askingPrice: property.askingPrice !== undefined ? String(property.askingPrice) : "",
        rentalPrice: property.rentalPrice !== undefined ? String(property.rentalPrice) : "",
        currency: property.currency || "ZMW",
        bedrooms: property.bedrooms !== undefined ? property.bedrooms : 3,
        bathrooms: property.bathrooms !== undefined ? property.bathrooms : 2,
        plotSizeSqm: property.plotSizeSqm || 500,
        latitude: property.latitude !== undefined ? property.latitude : -15.4211,
        longitude: property.longitude !== undefined ? property.longitude : 28.3341,
        standBoundary: property.standBoundary || [],
        titleDeedNumber: property.titleDeedNumber || "",
        landmarkDirections: property.landmarkDirections || "",
        description: property.description || "",
        assignedAgentName: property.assignedAgentName || property.assignedAgent?.name || "",
        assignedAgentPhone: property.assignedAgentPhone || property.assignedAgent?.phone || "",
        status: property.status || "AVAILABLE",
        photos: initPhotos,
        featuredPhoto: property.featuredPhoto || initPhotos[0] || "",
      });

      // Load real stakeholders if attached to property object, otherwise empty array
      if (Array.isArray(property.dealParties)) {
        setStakeholders(property.dealParties);
      } else {
        setStakeholders([]);
      }
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const isSale = (isEditing ? editFormData?.listingType : property.listingType) === "FOR_SALE";
  const price = isSale ? property.askingPrice : property.rentalPrice;
  const photos =
    Array.isArray(property.photos) && property.photos.length > 0
      ? property.photos
      : property.featuredPhoto
      ? [property.featuredPhoto]
      : [];

  // Share Public Link
  const handleSharePropertyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const publicUrl = `${origin}/p/${property.slug || property.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(publicUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Save Listing Details (All Fields Editable)
  const handleSaveListingDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editFormData.title.trim()) {
      alert("Property title cannot be empty.");
      return;
    }

    setIsSaving(true);
    const priceNum =
      editFormData.listingType === "FOR_SALE"
        ? parseFloat(editFormData.askingPrice) || 0
        : parseFloat(editFormData.rentalPrice) || 0;

    const updatedProp = {
      ...property,
      title: editFormData.title.trim(),
      listingType: editFormData.listingType,
      propertyType: editFormData.propertyType,
      suburb: editFormData.suburb.trim(),
      city: editFormData.city.trim() || "Lusaka",
      askingPrice: editFormData.listingType === "FOR_SALE" ? priceNum : undefined,
      rentalPrice: editFormData.listingType === "FOR_RENT" ? priceNum : undefined,
      currency: editFormData.currency,
      bedrooms: parseInt(editFormData.bedrooms) || 0,
      bathrooms: parseFloat(editFormData.bathrooms) || 0,
      plotSizeSqm: parseFloat(editFormData.plotSizeSqm) || 0,
      latitude: parseFloat(editFormData.latitude) || -15.4211,
      longitude: parseFloat(editFormData.longitude) || 28.3341,
      standBoundary: editFormData.standBoundary || [],
      titleDeedNumber: editFormData.titleDeedNumber?.trim() || null,
      landmarkDirections: editFormData.landmarkDirections?.trim() || "",
      description: editFormData.description?.trim() || "",
      assignedAgentName: editFormData.assignedAgentName?.trim() || "",
      assignedAgentPhone: editFormData.assignedAgentPhone?.trim() || "",
      status: editFormData.status,
      photos: Array.isArray(editFormData.photos) ? editFormData.photos : (property.photos || []),
      featuredPhoto: editFormData.featuredPhoto ?? (editFormData.photos && editFormData.photos[0]) ?? null,
      dealParties: stakeholders,
    };

    const patchPayload = {
      id: property.id,
      title: editFormData.title.trim(),
      listingType: editFormData.listingType,
      propertyType: editFormData.propertyType,
      suburb: editFormData.suburb.trim(),
      city: editFormData.city.trim() || "Lusaka",
      askingPrice: editFormData.listingType === "FOR_SALE" ? priceNum : undefined,
      rentalPrice: editFormData.listingType === "FOR_RENT" ? priceNum : undefined,
      currency: editFormData.currency,
      bedrooms: parseInt(editFormData.bedrooms) || 0,
      bathrooms: parseFloat(editFormData.bathrooms) || 0,
      plotSizeSqm: parseFloat(editFormData.plotSizeSqm) || 0,
      latitude: parseFloat(editFormData.latitude) || -15.4211,
      longitude: parseFloat(editFormData.longitude) || 28.3341,
      standBoundary: editFormData.standBoundary || [],
      titleDeedNumber: editFormData.titleDeedNumber?.trim() || null,
      landmarkDirections: editFormData.landmarkDirections?.trim() || "",
      description: editFormData.description?.trim() || "",
      assignedAgentName: editFormData.assignedAgentName?.trim() || "",
      assignedAgentPhone: editFormData.assignedAgentPhone?.trim() || "",
      status: editFormData.status,
      photos: Array.isArray(editFormData.photos) ? editFormData.photos : (property.photos || []),
      featuredPhoto: editFormData.featuredPhoto ?? (editFormData.photos && editFormData.photos[0]) ?? null,
    };

    try {
      const res = await fetch("/api/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update property details on server.");
      }
    } catch (err: any) {
      console.error("API save error:", err);
      alert(`Unable to save property: ${err.message || err}`);
      return;
    } finally {
      setIsSaving(false);
    }

    if (onUpdateProperty) {
      onUpdateProperty(updatedProp);
    }
    setIsEditing(false);
  };

  // Title Deed OCR coordinates extracted
  const handleOcrExtracted = (result: TitleDeedOcrResult) => {
    if (!result) return;
    const centerLat = result.beacons?.[0]?.lat || result.standBoundary?.[0]?.[0];
    const centerLng = result.beacons?.[0]?.lng || result.standBoundary?.[0]?.[1];

    setEditFormData((prev: any) => ({
      ...prev,
      standBoundary: result.standBoundary || [],
      plotSizeSqm: result.plotSizeSqm || prev?.plotSizeSqm || 500,
      titleDeedNumber: result.titleDeedNumber || prev?.titleDeedNumber || "",
      ...(centerLat && centerLng ? { latitude: centerLat, longitude: centerLng } : {}),
    }));

    setShowOcrUploader(false);
    loadVaultDocuments();
  };

  // Direct Document Upload to Vault
  const handleDirectDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFileLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", docUploadTitle.trim() || file.name);
      formData.append("docType", docUploadCategory);
      formData.append("propertyId", property.id);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setDocUploadTitle("");
        setIsUploadingDoc(false);
        await loadVaultDocuments();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Upload failed: ${errData.error || "Unable to upload document"}`);
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      alert("Error uploading document to vault.");
    } finally {
      setUploadingFileLoading(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  // Download Vault Document
  const handleDownloadDoc = async (doc: any) => {
    setDownloadingDocId(doc.id);
    try {
      const res = await fetch(`/api/vault/documents/${doc.id}/download?direct=true`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(doc.title || doc.name || "document").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (err) {
      console.warn("Direct download fallback triggered:", err);
    }

    // Client-side fallback PDF
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFillColor(28, 28, 26);
      pdf.rect(0, 0, 210, 24, "F");
      pdf.setFillColor(250, 54, 0);
      pdf.circle(18, 12, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text("CONTOUR", 26, 14);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 200, 200);
      pdf.text("LEGAL CUSTODY & VAULT ARCHIVE // REPUBLIC OF ZAMBIA", 80, 14);

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(28, 28, 26);
      pdf.text(doc.title || doc.name || "Property Document", 15, 40);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Property: ${property.title} | Suburb: ${property.suburb}, Lusaka`, 15, 48);

      pdf.setDrawColor(220, 220, 220);
      pdf.line(15, 53, 195, 53);

      pdf.save(`${(doc.title || doc.name || "document").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Submit Document Request
  const handleCreateDocumentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDocTitle.trim()) return;

    setRequestDocLoading(true);
    try {
      const res = await fetch("/api/vault/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: requestDocTitle.trim(),
          propertyId: property.id,
          requiredTypes: [requestDocType],
          message: requestDocMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
        const shareableUrl = data.shareableUrl || (data.token ? `${origin}/upload/${data.token}` : `${origin}/upload`);
        const text = encodeURIComponent(
          `Hello, please upload the requested document (${requestDocTitle}) for property "${property.title}" via our secure Contour Vault link: ${shareableUrl}`
        );
        const whatsAppUrl = `https://wa.me/?text=${text}`;

        setRequestDocResult({ shareableUrl, whatsAppUrl });
      } else {
        alert("Failed to generate document request.");
      }
    } catch (err) {
      console.error("Document request error:", err);
      alert("Network error generating document request.");
    } finally {
      setRequestDocLoading(false);
    }
  };

  // Add Stakeholder
  const handleAddStakeholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStakeholder.name.trim()) return;

    const created: DealParty = {
      id: `party_${Date.now()}`,
      ...newStakeholder,
    };
    setStakeholders((prev) => [...prev, created]);
    setNewStakeholder({
      name: "",
      title: "",
      dealAssociation: "",
      phone: "",
      email: "",
      roleType: "BUYER",
    });
    setIsAddingStakeholder(false);
  };

  const handleRemoveStakeholder = (id: string) => {
    setStakeholders((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[2200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 font-sans">
      <div className="bg-[#FCFBF9] border border-[#E6E4DF] shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl h-[92vh] max-h-[92vh]">
        
        {/* TOP COMPACT HEADER */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#E6E4DF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#1C1C1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4 text-[#FA3600]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1C1A] truncate max-w-[280px] sm:max-w-md">
                  {property.title}
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#1C1C1A] text-white uppercase shrink-0">
                  {isSale ? "FOR SALE" : "FOR RENT"}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#FA3600]/10 text-[#FA3600] border border-[#FA3600]/20 uppercase shrink-0">
                  {property.status || "AVAILABLE"}
                </span>
                {isEditing && (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#FA3600] text-white animate-pulse uppercase shrink-0">
                    EDITING
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#73716B] truncate">
                📍 {property.suburb || "Lusaka"}, Zambia • {formatCurrency(price, property.currency)}
                {!isSale && " / month"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveListingDetails()}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FA3600] hover:bg-[#D92F00] text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  <PendingButtonContent pending={isSaving} pendingLabel="Saving property…" icon={<Save className="h-3.5 w-3.5" />}>Save</PendingButtonContent>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-white border border-[#E6E4DF] text-[#1C1C1A] hover:bg-[#F5F0E8] text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setActiveSection("DETAILS");
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C1C1A] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FA3600]" />
                <span>Edit Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-none border border-[#E6E4DF] bg-white text-[#1C1C1A] hover:bg-[#1C1C1A] hover:text-white transition-all shadow-xs ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: MINIMAL SIDE MENU + CONTENT CANVAS */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* CLEAN MINIMAL SIDE MENU */}
          <div className="w-52 sm:w-60 bg-white border-r border-[#E6E4DF] shrink-0 p-3 flex flex-col justify-between overflow-y-auto font-sans">
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-[#A8A6A1] uppercase tracking-widest">
                Sections
              </div>

              {/* Property Details Section */}
              <button
                type="button"
                onClick={() => setActiveSection("DETAILS")}
                className={`w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                  activeSection === "DETAILS"
                    ? "bg-[#FA3600]/10 text-[#1C1C1A] border-l-2 border-[#FA3600]"
                    : "text-[#54524D] hover:bg-[#F5F0E8] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className={`w-3.5 h-3.5 ${activeSection === "DETAILS" ? "text-[#FA3600]" : "text-[#73716B]"}`} />
                  <span>Property Details</span>
                </div>
              </button>

              {/* Legal Documents Vault Section */}
              <button
                type="button"
                onClick={() => setActiveSection("VAULT")}
                className={`w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                  activeSection === "VAULT"
                    ? "bg-[#FA3600]/10 text-[#1C1C1A] border-l-2 border-[#FA3600]"
                    : "text-[#54524D] hover:bg-[#F5F0E8] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-3.5 h-3.5 ${activeSection === "VAULT" ? "text-[#FA3600]" : "text-[#73716B]"}`} />
                  <span>Legal Vault</span>
                </div>
                <span className="text-[10px] font-mono bg-[#E6E4DF] text-[#1C1C1A] px-1.5 py-0.2">
                  {vaultDocuments.length}
                </span>
              </button>

              {/* Stakeholders Section */}
              <button
                type="button"
                onClick={() => setActiveSection("STAKEHOLDERS")}
                className={`w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-between transition-colors ${
                  activeSection === "STAKEHOLDERS"
                    ? "bg-[#FA3600]/10 text-[#1C1C1A] border-l-2 border-[#FA3600]"
                    : "text-[#54524D] hover:bg-[#F5F0E8] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-3.5 h-3.5 ${activeSection === "STAKEHOLDERS" ? "text-[#FA3600]" : "text-[#73716B]"}`} />
                  <span>Stakeholders</span>
                </div>
                <span className="text-[10px] font-mono bg-[#E6E4DF] text-[#1C1C1A] px-1.5 py-0.2">
                  {stakeholders.length}
                </span>
              </button>
            </div>

            {/* SIDE MENU ACTIONS */}
            <div className="pt-3 border-t border-[#E6E4DF] space-y-1 mt-4">
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-[#A8A6A1] uppercase tracking-widest">
                Actions
              </div>

              {/* Social Flyer Card Button */}
              <button
                type="button"
                onClick={() => onOpenSocialGenerator(property)}
                className="w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#1C1C1A] hover:bg-[#FA3600]/10 flex items-center gap-2.5 transition-colors border border-[#E6E4DF] bg-white group"
              >
                <Palette className="w-3.5 h-3.5 text-[#FA3600] group-hover:scale-110 transition-transform" />
                <span>Social Flyer Card</span>
              </button>

              {/* Matching Buyers Button */}
              <button
                type="button"
                onClick={() => onOpenMatchingBuyers(property)}
                className="w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#1C1C1A] hover:bg-[#F5F0E8] flex items-center gap-2.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FA3600]" />
                <span>Matching Buyers</span>
              </button>

              {/* Share Public Link */}
              <button
                type="button"
                onClick={handleSharePropertyLink}
                className="w-full text-left px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#1C1C1A] hover:bg-[#F5F0E8] flex items-center gap-2.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#73716B]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN CONTENT CANVAS */}
          <div className="flex-1 bg-[#FCFBF9] p-4 sm:p-6 overflow-y-auto min-w-0">
            
            {/* SECTION 1: PROPERTY DETAILS */}
            {activeSection === "DETAILS" && (
              <div className="space-y-6 max-w-4xl">
                {isEditing ? (
                  /* EDIT MODE FORM */
                  <form onSubmit={handleSaveListingDetails} className="space-y-5">
                    
                    {/* Photos Upload & Management */}
                    <div className="p-4 bg-white border border-[#E6E4DF] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-heading font-bold text-xs text-[#1C1C1A] flex items-center gap-1.5 uppercase tracking-wider">
                          <ImageIcon className="w-4 h-4 text-[#FA3600]" />
                          <span>Property Photos &amp; Media</span>
                        </label>
                        <span className="text-[10px] font-mono text-[#73716B]">
                          {canUploadPhotos ? "Drag to reorder or upload new photos" : "Upload restricted to authorized agents"}
                        </span>
                      </div>

                      <PropertyImageUploader
                        photos={editFormData.photos || []}
                        featuredPhoto={editFormData.featuredPhoto}
                        propertyId={property.id}
                        disabled={!canUploadPhotos}
                        onChange={(updatedPhotos, updatedCover) => {
                          setEditFormData({
                            ...editFormData,
                            photos: updatedPhotos,
                            featuredPhoto: updatedCover,
                          });
                        }}
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                        Property Title *
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full bg-white px-3.5 py-2.5 border border-[#E6E4DF] text-[#1C1C1A] font-semibold text-sm focus:outline-none focus:border-[#FA3600]"
                        placeholder="e.g. 4-Bedroom Executive Villa with Pool"
                        required
                      />
                    </div>

                    {/* Listing Type, Price & Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Listing Type
                        </label>
                        <select
                          value={editFormData.listingType}
                          onChange={(e) => setEditFormData({ ...editFormData, listingType: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="FOR_SALE">For Sale</option>
                          <option value="FOR_RENT">For Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
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
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] font-mono font-bold text-xs focus:outline-none focus:border-[#FA3600]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Currency
                        </label>
                        <select
                          value={editFormData.currency}
                          onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="ZMW">ZMW (Zambian Kwacha)</option>
                          <option value="USD">USD (United States Dollar)</option>
                        </select>
                      </div>
                    </div>

                    {/* Suburb (Manual or Preset), Property Type & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Suburb / Area (Type or Pick) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            list="lusaka-suburb-options"
                            value={editFormData.suburb}
                            onChange={(e) => setEditFormData({ ...editFormData, suburb: e.target.value })}
                            placeholder="Type or select suburb..."
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                            required
                          />
                          <datalist id="lusaka-suburb-options">
                            {LUSAKA_SUBURBS.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          value={editFormData.city}
                          onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Property Type
                        </label>
                        <select
                          value={editFormData.propertyType}
                          onChange={(e) => setEditFormData({ ...editFormData, propertyType: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="HOUSE">Residential House</option>
                          <option value="APARTMENT">Apartment / Flat</option>
                          <option value="COMMERCIAL">Commercial Office / Retail</option>
                          <option value="FARM">Agricultural Farm</option>
                          <option value="PLOT">Vacant Land / Plot</option>
                          <option value="INDUSTRIAL">Industrial / Warehouse</option>
                        </select>
                      </div>
                    </div>

                    {/* Beds, Baths, Plot Size & Status */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Bedrooms
                        </label>
                        <input
                          type="number"
                          value={editFormData.bedrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bedrooms: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={editFormData.bathrooms}
                          onChange={(e) => setEditFormData({ ...editFormData, bathrooms: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Plot Size (m²)
                        </label>
                        <input
                          type="number"
                          value={editFormData.plotSizeSqm}
                          onChange={(e) => setEditFormData({ ...editFormData, plotSizeSqm: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                          Listing Status
                        </label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="UNDER_OFFER">UNDER OFFER</option>
                          <option value="SOLD">SOLD</option>
                          <option value="RENTED">RENTED</option>
                        </select>
                      </div>
                    </div>

                    {/* ASSIGNED AGENT SELECTOR (REAL DATA FROM ORG) */}
                    <div className="p-4 bg-white border border-[#E6E4DF] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-heading font-bold text-xs text-[#1C1C1A] flex items-center gap-1.5 uppercase tracking-wider">
                          <UserCheck className="w-4 h-4 text-[#FA3600]" />
                          <span>Assigned Closing Agent (Organization Members)</span>
                        </label>
                        {loadingAgents && <span className="text-[10px] font-mono text-[#73716B]">Loading agents...</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Select Active Agent</label>
                          <select
                            value={editFormData.assignedAgentName}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const matchedAgent = orgAgents.find((a) => a.name === selectedName);
                              setEditFormData({
                                ...editFormData,
                                assignedAgentName: selectedName,
                                assignedAgentPhone: matchedAgent?.phone || editFormData.assignedAgentPhone || "",
                              });
                            }}
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                          >
                            <option value="">-- Select Member from Org --</option>
                            {orgAgents.map((agent) => (
                              <option key={agent.id} value={agent.name}>
                                {agent.name} {agent.roleKey ? `(${agent.roleKey})` : ""}
                              </option>
                            ))}
                            {editFormData.assignedAgentName && !orgAgents.some((a) => a.name === editFormData.assignedAgentName) && (
                              <option value={editFormData.assignedAgentName}>{editFormData.assignedAgentName} (Current)</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Agent WhatsApp / Phone</label>
                          <input
                            type="text"
                            value={editFormData.assignedAgentPhone}
                            onChange={(e) => setEditFormData({ ...editFormData, assignedAgentPhone: e.target.value })}
                            placeholder="+260 97..."
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-mono focus:outline-none focus:border-[#FA3600]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* LOCATION & COORDINATES (Manual or Title Deed OCR) */}
                    <div className="p-4 bg-white border border-[#E6E4DF] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#FA3600]" />
                            <span>GPS Location &amp; Coordinates</span>
                          </h4>
                          <p className="text-[10px] text-[#73716B] mt-0.5">
                            Enter coordinates manually, or scan an official Title Deed to extract survey coordinates.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowOcrUploader((v) => !v)}
                          className="px-3 py-1.5 bg-[#1C1C1A] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                          <ScanLine className="w-3.5 h-3.5 text-[#FA3600]" />
                          <span>{showOcrUploader ? "Close Scanner" : "Scan Title Deed for Coordinates"}</span>
                        </button>
                      </div>

                      {/* Embedded Title Deed OCR Uploader */}
                      {showOcrUploader && (
                        <div className="p-3 bg-[#FCFBF9] border border-[#E6E4DF] mt-2">
                          <TitleDeedOcrUploader
                            onBoundaryExtracted={handleOcrExtracted}
                            onReset={() => {}}
                            initialBoundary={editFormData.standBoundary}
                            currentPlotSize={editFormData.plotSizeSqm}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={editFormData.latitude}
                            onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-mono focus:outline-none focus:border-[#FA3600]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={editFormData.longitude}
                            onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-mono focus:outline-none focus:border-[#FA3600]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Title Deed / Folio Ref</label>
                          <input
                            type="text"
                            value={editFormData.titleDeedNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, titleDeedNumber: e.target.value })}
                            placeholder="e.g. LUS/LAND/2026/..."
                            className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-mono focus:outline-none focus:border-[#FA3600]"
                          />
                        </div>
                      </div>

                      {editFormData.standBoundary && editFormData.standBoundary.length > 0 && (
                        <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 flex items-center justify-between">
                          <span>✓ Cadastral Stand Boundary verified from Title Deed ({editFormData.standBoundary.length} boundary beacons)</span>
                          <button
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, standBoundary: [] })}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Driving Directions */}
                    <div>
                      <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                        Landmark Driving Directions
                      </label>
                      <input
                        type="text"
                        value={editFormData.landmarkDirections}
                        onChange={(e) => setEditFormData({ ...editFormData, landmarkDirections: e.target.value })}
                        placeholder="e.g. 200m off Kabulonga Road, near Centro Mall"
                        className="w-full bg-white px-3.5 py-2.5 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                      />
                    </div>

                    {/* Marketing Narrative Description */}
                    <div>
                      <label className="block font-heading font-bold text-xs text-[#1C1C1A] uppercase tracking-wider mb-1.5">
                        Marketing Narrative &amp; Description
                      </label>
                      <textarea
                        rows={5}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full bg-white p-3.5 border border-[#E6E4DF] text-[#1C1C1A] text-xs leading-relaxed focus:outline-none focus:border-[#FA3600]"
                        placeholder="Detailed listing description..."
                      />
                    </div>
                  </form>
                ) : (
                  /* ── READ MODE VIEW ── */
                  <>
                    {/* Hero Photo Carousel */}
                    <div className="relative w-full h-64 sm:h-80 bg-[#1C1C1A] overflow-hidden border border-[#E6E4DF] group">
                      <img
                        src={photos[activePhotoIdx] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"}
                        alt={property.title}
                        className="w-full h-full object-cover transition-all duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-black/70 px-2 py-0.5 border border-white/20">
                            {activePhotoIdx + 1} / {photos.length} Photos
                          </span>
                          <span className="font-semibold">{property.suburb}, {property.city || "Lusaka"}</span>
                        </div>
                        <span className="font-serif font-extrabold text-xl text-amber-400">
                          {formatCurrency(price, property.currency)}
                          {!isSale && <span className="text-xs text-white/80 font-mono font-normal"> / mo</span>}
                        </span>
                      </div>
                    </div>

                    {/* Photo Thumbnails */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80%]">
                        {photos.map((url: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIdx(idx)}
                            className={`relative w-14 h-12 shrink-0 border-2 transition-all ${
                              activePhotoIdx === idx
                                ? "border-[#FA3600] opacity-100"
                                : "border-[#E6E4DF] opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Thumb ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80";
                              }}
                            />
                          </button>
                        ))}
                      </div>

                      {canUploadPhotos && (
                        <button
                          type="button"
                          onClick={() => setIsAddingPhotosViewMode((open) => !open)}
                          className="px-3 py-1.5 bg-white hover:bg-[#F5F0E8] border border-[#E6E4DF] text-[#1C1C1A] text-xs font-heading font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#FA3600]" />
                          <span>{isAddingPhotosViewMode ? "Done" : "Add Photos"}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Quick Photo Dropzone */}
                    {isAddingPhotosViewMode && canUploadPhotos && (
                      <div className="p-3 bg-white border border-[#E6E4DF] animate-in fade-in">
                        <PropertyImageUploader
                          photos={photos}
                          featuredPhoto={property.featuredPhoto}
                          propertyId={property.id}
                          onChange={async (updatedPhotos, updatedCover) => {
                            const updatedProp = {
                              ...property,
                              photos: updatedPhotos,
                              featuredPhoto: updatedCover,
                            };
                            if (onUpdateProperty) onUpdateProperty(updatedProp);

                            try {
                              await fetch("/api/properties", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: property.id,
                                  photos: updatedPhotos,
                                  featuredPhoto: updatedCover,
                                }),
                              });
                            } catch (err) {
                              console.warn("Failed to patch photo update:", err);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white border border-[#E6E4DF] flex items-center gap-2.5">
                        <Bed className="w-4 h-4 text-[#FA3600] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#73716B] font-mono uppercase">Bedrooms</div>
                          <div className="font-bold text-sm text-[#1C1C1A]">{property.bedrooms ?? 0} Beds</div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#E6E4DF] flex items-center gap-2.5">
                        <Bath className="w-4 h-4 text-[#FA3600] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#73716B] font-mono uppercase">Bathrooms</div>
                          <div className="font-bold text-sm text-[#1C1C1A]">{property.bathrooms ?? 0} Baths</div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#E6E4DF] flex items-center gap-2.5">
                        <Maximize className="w-4 h-4 text-[#FA3600] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#73716B] font-mono uppercase">Plot Size</div>
                          <div className="font-bold text-sm text-[#1C1C1A]">{property.plotSizeSqm || 0} m²</div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#E6E4DF] flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-[#FA3600] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#73716B] font-mono uppercase">Assigned Agent</div>
                          <div className="font-bold text-xs text-[#1C1C1A] line-clamp-1">
                            {property.assignedAgentName || property.assignedAgent?.name || "Unassigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Summary */}
                    <div className="p-3.5 bg-white border border-[#E6E4DF] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-heading font-bold uppercase tracking-wider text-[#1C1C1A] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FA3600]" />
                          <span>Location &amp; Coordinates</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#73716B]">
                          {property.latitude?.toFixed(6) || "-15.421100"}, {property.longitude?.toFixed(6) || "28.334100"}
                        </span>
                      </div>
                      <p className="text-xs text-[#54524D]">
                        {property.landmarkDirections || `Located in ${property.suburb}, ${property.city || "Lusaka"}.`}
                      </p>
                      {property.titleDeedNumber && (
                        <div className="text-[11px] font-mono text-[#73716B] pt-1 border-t border-[#E6E4DF]">
                          Title Deed Folio: <span className="font-bold text-[#1C1C1A]">{property.titleDeedNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                        Marketing Narrative &amp; Description
                      </h4>
                      <p className="text-xs text-[#54524D] leading-relaxed bg-white p-4 border border-[#E6E4DF] whitespace-pre-line">
                        {property.description || "No description provided for this property."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SECTION 2: LEGAL VAULT & DOCUMENTS */}
            {activeSection === "VAULT" && (
              <div className="space-y-5 max-w-4xl">
                
                {/* Vault Header Bar */}
                <div className="flex items-center justify-between border-b border-[#E6E4DF] pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1C1A] uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#FA3600]" />
                      <span>Legal Documents Vault</span>
                    </h3>
                    <p className="text-xs text-[#73716B] mt-0.5">
                      Encrypted custody for Title Deeds, Mandates, and ID verification records.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestDocModal(true);
                        setRequestDocResult(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-[#E6E4DF] hover:bg-[#F5F0E8] text-[#1C1C1A] text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FA3600]" />
                      <span>Request Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsUploadingDoc((v) => !v)}
                      className="px-3.5 py-1.5 bg-[#1C1C1A] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5 text-[#FA3600]" />
                      <span>{isUploadingDoc ? "Cancel Upload" : "Upload File"}</span>
                    </button>
                  </div>
                </div>

                {/* Direct File Upload Drawer */}
                {isUploadingDoc && (
                  <div className="p-4 bg-white border border-[#E6E4DF] space-y-3 animate-in fade-in">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                      Direct File Upload to Property Vault
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Document Category</label>
                        <select
                          value={docUploadCategory}
                          onChange={(e) => setDocUploadCategory(e.target.value)}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="TITLE_DEED">Certificate of Title Deed</option>
                          <option value="MANDATE_AGREEMENT">Sole Mandate Agreement</option>
                          <option value="SITE_SURVEY_DIAGRAM">Ministry Cadastral Survey Diagram</option>
                          <option value="NRC_PASSPORT_ID">Client NRC / Passport ID Scan</option>
                          <option value="LEASE_CONTRACT">Tenancy Lease Contract</option>
                          <option value="OTHER">Other Compliance Document</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Document Label / Title (Optional)</label>
                        <input
                          type="text"
                          value={docUploadTitle}
                          onChange={(e) => setDocUploadTitle(e.target.value)}
                          placeholder="e.g. Registered Title Folio"
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleDirectDocUpload}
                        className="hidden"
                        id="direct-vault-file-input"
                      />
                      <label
                        htmlFor="direct-vault-file-input"
                        className="px-4 py-2 bg-[#FA3600] hover:bg-[#D92F00] text-white text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        {uploadingFileLoading ? (
                          <ContourSunLoader size="sm" label="Uploading document…" decorative />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingFileLoading ? "Uploading to MinIO..." : "Choose File (PDF/Image)"}</span>
                      </label>

                      <span className="text-[10px] font-mono text-[#73716B]">Max 25MB • AES-256 Encrypted</span>
                    </div>
                  </div>
                )}

                {/* Request Document Modal */}
                {showRequestDocModal && (
                  <div className="p-4 bg-white border border-[#E6E4DF] space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                        Create Secure Document Request for this Property
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowRequestDocModal(false)}
                        className="text-[#73716B] hover:text-[#1C1C1A]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {!requestDocResult ? (
                      <form onSubmit={handleCreateDocumentRequest} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-[#73716B] font-mono mb-1">Request Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Please submit Title Deed copy"
                              value={requestDocTitle}
                              onChange={(e) => setRequestDocTitle(e.target.value)}
                              className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#73716B] font-mono mb-1">Document Type</label>
                            <select
                              value={requestDocType}
                              onChange={(e) => setRequestDocType(e.target.value)}
                              className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                            >
                              <option value="TITLE_DEED">Certificate of Title Deed</option>
                              <option value="NRC_PASSPORT_ID">NRC / Passport Identification</option>
                              <option value="MANDATE_AGREEMENT">Sole Agency Mandate</option>
                              <option value="SITE_SURVEY_DIAGRAM">Cadastral Survey Diagram</option>
                              <option value="PACRA_CERTIFICATE">PACRA Certificate</option>
                              <option value="OTHER">Other Document</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#73716B] font-mono mb-1">Optional Message / Instructions</label>
                          <textarea
                            rows={2}
                            value={requestDocMessage}
                            onChange={(e) => setRequestDocMessage(e.target.value)}
                            placeholder="Instructions for the client regarding scanning or resolution..."
                            className="w-full bg-white p-2.5 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowRequestDocModal(false)}
                            className="px-3 py-1.5 text-xs text-[#73716B]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={requestDocLoading}
                            className="px-4 py-1.5 bg-[#FA3600] text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            {requestDocLoading && <ContourSunLoader size="sm" label="Creating request…" decorative />}
                            <span>Generate Request Link</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Document Request Created Successfully!</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Share this link with the client. They can upload documents directly from their phone.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={requestDocResult.shareableUrl}
                            className="w-full bg-white px-3 py-1.5 border border-emerald-300 text-xs font-mono select-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(requestDocResult.shareableUrl);
                              alert("Upload link copied to clipboard!");
                            }}
                            className="px-3 py-1.5 bg-[#1C1C1A] text-white text-xs shrink-0 flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {requestDocResult.whatsAppUrl && (
                          <div className="pt-1">
                            <a
                              href={requestDocResult.whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-none"
                            >
                              <span>Open in WhatsApp</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Real Documents List */}
                {loadingDocs ? (
                  <SectionPendingState label="Loading property documents…" compact />
                ) : vaultDocuments.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-[#E6E4DF] space-y-2">
                    <FileText className="w-8 h-8 text-[#A8A6A1] mx-auto" />
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                      No Documents Added Yet
                    </h4>
                    <p className="text-xs text-[#73716B] max-w-sm mx-auto">
                      There are currently no legal documents uploaded for this property. Click &ldquo;Upload File&rdquo; or &ldquo;Request Document&rdquo; above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vaultDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-white border border-[#E6E4DF] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-[#FA3600]/10 text-[#FA3600] flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#1C1C1A] truncate">{doc.title || doc.name || "Untitled Document"}</h4>
                            <span className="text-[10px] text-[#73716B] font-mono">
                              Type: {doc.docType || "DOCUMENT"} • {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : "File"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          disabled={downloadingDocId === doc.id}
                          className="px-3 py-1.5 bg-[#1C1C1A] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {downloadingDocId === doc.id ? (
                            <ContourSunLoader size="sm" label="Downloading document…" decorative />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>{downloadingDocId === doc.id ? "Downloading..." : "Download"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: STAKEHOLDERS */}
            {activeSection === "STAKEHOLDERS" && (
              <div className="space-y-5 max-w-4xl">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E6E4DF] pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1C1A] uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FA3600]" />
                      <span>Mandate Stakeholders &amp; Contacts</span>
                    </h3>
                    <p className="text-xs text-[#73716B] mt-0.5">
                      Only verified stakeholders attached to this property mandate.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingStakeholder((v) => !v)}
                    className="px-3.5 py-1.5 bg-[#1C1C1A] hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#FA3600]" />
                    <span>{isAddingStakeholder ? "Cancel" : "Add Stakeholder"}</span>
                  </button>
                </div>

                {/* Add Stakeholder Form */}
                {isAddingStakeholder && (
                  <form onSubmit={handleAddStakeholder} className="p-4 bg-white border border-[#E6E4DF] space-y-3 animate-in fade-in">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                      Register New Stakeholder
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hastings Banda"
                          value={newStakeholder.name}
                          onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Role Type</label>
                        <select
                          value={newStakeholder.roleType}
                          onChange={(e) => setNewStakeholder({ ...newStakeholder, roleType: e.target.value as any })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-semibold focus:outline-none focus:border-[#FA3600]"
                        >
                          <option value="SELLER">Seller / Property Owner</option>
                          <option value="BUYER">Prospective Buyer / Lead</option>
                          <option value="BROKER">Listing / Co-Broke Agent</option>
                          <option value="LAWYER">Conveyancer / Lawyer</option>
                          <option value="ESCROW">Escrow / Trust Officer</option>
                          <option value="TENANT">Tenant / Leasee</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Official Title / Association</label>
                        <input
                          type="text"
                          placeholder="e.g. Registered Title Deed Signatory"
                          value={newStakeholder.title}
                          onChange={(e) => setNewStakeholder({ ...newStakeholder, title: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Phone / WhatsApp</label>
                        <input
                          type="text"
                          placeholder="+260 97..."
                          value={newStakeholder.phone}
                          onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs font-mono focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#73716B] font-mono mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@mail.com"
                          value={newStakeholder.email}
                          onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-[#E6E4DF] text-[#1C1C1A] text-xs focus:outline-none focus:border-[#FA3600]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingStakeholder(false)}
                        className="px-3 py-1.5 text-xs text-[#73716B]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#FA3600] text-white text-xs font-heading font-semibold uppercase tracking-wider"
                      >
                        Save Stakeholder
                      </button>
                    </div>
                  </form>
                )}

                {/* Stakeholders List */}
                {stakeholders.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-[#E6E4DF] space-y-2">
                    <Users className="w-8 h-8 text-[#A8A6A1] mx-auto" />
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1C1C1A]">
                      No Stakeholders Added
                    </h4>
                    <p className="text-xs text-[#73716B] max-w-sm mx-auto">
                      There are currently no external stakeholders attached to this mandate. Click &ldquo;Add Stakeholder&rdquo; to record title holders, buyers, or legal representatives.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {stakeholders.map((party) => (
                      <div key={party.id} className="p-4 bg-white border border-[#E6E4DF] space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-mono font-bold bg-[#1C1C1A] text-white px-2 py-0.5 uppercase">
                              {party.roleType}
                            </span>
                            <h4 className="font-heading font-bold text-sm text-[#1C1C1A] mt-1">{party.name}</h4>
                            {party.title && <p className="text-[11px] font-semibold text-[#FA3600]">{party.title}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStakeholder(party.id)}
                            className="text-[#A8A6A1] hover:text-red-600 p-1"
                            title="Remove stakeholder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {party.dealAssociation && (
                          <p className="text-xs text-[#54524D]">{party.dealAssociation}</p>
                        )}

                        <div className="pt-2 border-t border-[#E6E4DF] flex items-center justify-between text-xs text-[#1C1C1A] font-mono flex-wrap gap-2">
                          {party.phone ? (
                            <a
                              href={`https://wa.me/${formatWhatsAppDigits(party.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <span>📞 {party.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[#A8A6A1]">No phone</span>
                          )}

                          {party.email && (
                            <a href={`mailto:${party.email}`} className="text-[#73716B] hover:underline">
                              ✉️ {party.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
