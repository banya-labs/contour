"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  MapPin,
  MessageSquare,
  Share2,
  Lock,
  Compass,
  Bed,
  Bath,
  PhoneCall,
  Search,
  Sparkles,
  ChevronLeft,
  Bot,
  Menu,
  X,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  LogOut,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Calendar,
  Check,
  ExternalLink,
  Plus,
  Building2,
  Home,
  Users,
  Briefcase,
  Wallet,
  Mic,
  Camera,
  Send,
  SlidersHorizontal,
  ArrowUpRight,
  Filter,
  CheckCheck,
  Phone,
  Layers,
  Sparkle,
  Map as MapIcon,
  Navigation,
  Crosshair,
  ClipboardList,
  CalendarClock,
  Upload,
  Tag,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PowerSyncProvider, usePowerSync } from "@/lib/powersync";
import type { PropertyMapItem } from "@/types/property-map";
import { ContourLogo } from "@/components/brand/contour-logo";
import { authClient, signOut } from "@/lib/auth-client";
import PropertyImageUploader from "@/components/properties/property-image-uploader";
import { canManagePropertyPhotos } from "@/lib/authorization";
import SocialMediaCardGeneratorModal from "@/components/marketing/social-media-card-generator-modal";
import { normalizePhoneNumber, formatWhatsAppDigits } from "@/lib/phone-utils";

// Dynamically import InteractivePropertyMap with SSR disabled to prevent Leaflet window errors
const InteractivePropertyMap = dynamic(
  () => import("@/components/map/interactive-property-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[60vh] rounded-2xl bg-[#0F1B14] border border-emerald-900/50 flex flex-col items-center justify-center text-xs text-emerald-400 gap-2 animate-pulse">
        <MapPin className="w-6 h-6 text-[#E57A1A]" />
        <span>Loading Lusaka Spatial Map...</span>
      </div>
    ),
  }
);

export default function FieldAgentPwaPage() {
  return (
    <PowerSyncProvider>
      <AgentKioskContent />
    </PowerSyncProvider>
  );
}

type TabType = "QUEUE" | "PROPERTIES" | "MAP" | "CLIENTS" | "DEALS" | "EARNINGS";
type IntakeType = "NONE" | "PROPERTY" | "CLIENT" | "OFFER";

function AgentKioskContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const {
    isOnline,
    loading,
    properties,
    clients,
    outboxCount,
    toggleNetwork,
    syncData,
    addToOutbox,
    playNeutralTone,
    playSuccessTone,
  } = usePowerSync();

  // Active Bottom Navigation Tab & Sub-View
  const [activeTab, setActiveTab] = useState<TabType>("QUEUE");
  const [propertyViewMode, setPropertyViewMode] = useState<"LIST" | "MAP">("LIST");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState("ALL");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"ALL" | "SALE" | "RENT">("ALL");

  // Selection & Modal States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [matchedProperty, setMatchedProperty] = useState<any | null>(null);
  const [selectedMapProperty, setSelectedMapProperty] = useState<any | null>(null);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState<any | null>(null);
  const [intakeDrawer, setIntakeDrawer] = useState<IntakeType>("NONE");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [selectedCommissionSlip, setSelectedCommissionSlip] = useState<any | null>(null);
  const [flyerModalProperty, setFlyerModalProperty] = useState<any | null>(null);


  // Real Agent Persona & Summary State
  const [agentSummary, setAgentSummary] = useState<any>(null);
  const [propertyAssignmentFilter, setPropertyAssignmentFilter] = useState<"ALL" | "ASSIGNED">("ALL");
  const [clientAssignmentFilter, setClientAssignmentFilter] = useState<"ALL" | "ASSIGNED">("ALL");

  const [currentAgent, setCurrentAgent] = useState({
    id: session?.user?.id || "",
    name: session?.user?.name || "Field Agent",
    role: "Field Agent",
    zone: "Lusaka Real Estate",
    phone: (session?.user as any)?.phone || "",
    email: session?.user?.email || "",
    earnedSplitUsd: 0,
    earnedSplitZmw: 0,
    pendingSplitZmw: 0,
    pendingSplitUsd: 0,
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
  const isManagerOrAdmin = Boolean(userRole && (userRole === "SUPER_ADMIN" || userRole === "BROKER_MANAGER"));

  // Ensure field agents never remain in management-only PROPERTY drawer
  useEffect(() => {
    if (!isManagerOrAdmin && intakeDrawer === "PROPERTY") {
      setIntakeDrawer("CLIENT");
    }
  }, [isManagerOrAdmin, intakeDrawer]);

  // Client Edit Modal State (Issue 9)
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientBudget, setEditClientBudget] = useState("");
  const [editClientCurrency, setEditClientCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [editClientSuburb, setEditClientSuburb] = useState("Kabulonga");
  const [isCustomEditSuburb, setIsCustomEditSuburb] = useState(false);
  const [editClientNotes, setEditClientNotes] = useState("");
  const [isSavingClientEdit, setIsSavingClientEdit] = useState(false);
  const [editClientError, setEditClientError] = useState<string | null>(null);

  const handleOpenEditClient = (client: any) => {
    setEditingClient(client);
    setEditClientName(client.name || client.clientName || "");
    setEditClientPhone(client.phone || client.clientPhone || "");
    const rawBudget = client.budget || client.budgetMax || "";
    const numBudget = typeof rawBudget === "string" ? rawBudget.replace(/[^0-9.]/g, "") : String(rawBudget || "");
    setEditClientBudget(numBudget);
    setEditClientCurrency((client.currency as "ZMW" | "USD") || "ZMW");
    const sub = client.preferredArea || (client.preferredSuburbs && client.preferredSuburbs[0]) || "Kabulonga";
    setEditClientSuburb(sub);
    setIsCustomEditSuburb(!dynamicSuburbs.includes(sub));
    setEditClientNotes(client.notes || "");
    setEditClientError(null);
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    if (!editClientName.trim()) {
      setEditClientError("Client name is required.");
      return;
    }
    if (!editClientPhone.trim() || editClientPhone.replace(/[^0-9]/g, "").length < 6) {
      setEditClientError("Please provide a valid phone number.");
      return;
    }

    setIsSavingClientEdit(true);
    setEditClientError(null);
    try {
      const normalizedPhone = normalizePhoneNumber(editClientPhone);
      const parsedBudget = editClientBudget ? parseFloat(editClientBudget) : undefined;
      const payload = {
        clientName: editClientName.trim(),
        clientPhone: normalizedPhone,
        budgetMax: parsedBudget,
        currency: editClientCurrency,
        preferredSuburbs: editClientSuburb ? [editClientSuburb] : [],
        notes: editClientNotes || undefined,
      };

      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update client profile.");
      }

      playSuccessTone();
      setEditingClient(null);
      void syncData();
    } catch (err: any) {
      setEditClientError(err.message || "Failed to save client changes.");
    } finally {
      setIsSavingClientEdit(false);
    }
  };

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch("/api/agent/summary");
        const data = await res.json();
        if (data.success) {
          setAgentSummary(data);
          if (data.agent) {
            setCurrentAgent((current) => ({
              ...current,
              id: data.agent.id,
              name: data.agent.name || current.name,
              email: data.agent.email || current.email,
              phone: data.agent.phone || current.phone,
              role: data.agent.role === "SUPER_ADMIN" ? "Principal Broker" : data.agent.role === "BROKER_MANAGER" ? "Broker Manager" : "Field Agent",
              zone: data.agent.organizationName || current.zone,
              earnedSplitUsd: data.earnings?.earnedSplitUsd || 0,
              earnedSplitZmw: data.earnings?.earnedSplitZmw || 0,
              pendingSplitUsd: data.earnings?.pendingSplitUsd || 0,
              pendingSplitZmw: data.earnings?.pendingSplitZmw || 0,
            }));
          }
          if (data.deals && data.deals.length > 0) {
            setAgentDeals(data.deals);
          }
        }
      } catch (err) {
        console.error("Failed to fetch agent summary:", err);
      }
    }

    if (session?.user) {
      setCurrentAgent((current) => ({
        ...current,
        id: session.user.id,
        name: session.user.name || current.name,
        email: session.user.email || current.email,
      }));
      loadSummary();
      void syncData();
    }
  }, [session, syncData]);

  useEffect(() => {
    const handleFocus = () => {
      void syncData();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
    };
  }, [syncData]);

  const handleSignOut = async () => {
    await signOut();
    router.replace(`/sign-in?redirect_url=${encodeURIComponent("/agent")}`);
    router.refresh();
  };

  const activeTabMeta: Record<TabType, { eyebrow: string; title: string; description: string }> = {
    QUEUE: {
      eyebrow: "Today in the field",
      title: "Your work queue",
      description: "The next actions that keep viewings, offers, and commissions moving.",
    },
    PROPERTIES: {
      eyebrow: "Field inventory",
      title: "Active mandates",
      description: "Search listings, confirm title status, and move buyers forward.",
    },
    MAP: {
      eyebrow: "Spatial view",
      title: "Lusaka field map",
      description: "Navigate active mandates by suburb and location.",
    },
    CLIENTS: {
      eyebrow: "Protected registry",
      title: "Your clients",
      description: "Keep every inquiry protected and ready for follow-up.",
    },
    DEALS: {
      eyebrow: "Deal velocity",
      title: "Move deals forward",
      description: "Track the next action from viewing to settlement.",
    },
    EARNINGS: {
      eyebrow: "Commission ledger",
      title: "Your earnings",
      description: "See cleared splits and what is still in the pipeline.",
    },
  };

  // Real Deals State with optimistic transitions
  const [agentDeals, setAgentDeals] = useState<any[]>([]);

  // Form States for Intake
  const [newPropTitle, setNewPropTitle] = useState("");
  const [newPropSuburb, setNewPropSuburb] = useState("Kabulonga");
  const [newPropPrice, setNewPropPrice] = useState("");
  const [newPropType, setNewPropType] = useState<"SALE" | "RENT">("SALE");
  const [newPropCurrency, setNewPropCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [newPropBeds, setNewPropBeds] = useState("4");
  const [newPropMandate, setNewPropMandate] = useState<"SOLE_MANDATE" | "OPEN_MANDATE" | "COMPANY_OWNED">("SOLE_MANDATE");
  const [newPropPhotos, setNewPropPhotos] = useState<string[]>([]);
  const [newPropFeaturedPhoto, setNewPropFeaturedPhoto] = useState<string | undefined>(undefined);
  const [copiedPublicLinkId, setCopiedPublicLinkId] = useState<string | null>(null);
  const [isAddingPhotosToDetail, setIsAddingPhotosToDetail] = useState(false);
  const [isCustomAgentSuburb, setIsCustomAgentSuburb] = useState(false);

  const handleShareClientLink = (p: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const link = `${origin}/p/${p.slug || p.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedPublicLinkId(p.id);
    playSuccessTone();
    setTimeout(() => setCopiedPublicLinkId(null), 2500);
  };

  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientBudget, setNewClientBudget] = useState("");
  const [newClientCurrency, setNewClientCurrency] = useState<"ZMW" | "USD">("ZMW");
  const [newClientSuburb, setNewClientSuburb] = useState("Kabulonga");
  const [newClientLookingFor, setNewClientLookingFor] = useState<"FOR_SALE" | "FOR_RENT">("FOR_SALE");
  const [newClientPropertyType, setNewClientPropertyType] = useState("");
  const [newClientMinBeds, setNewClientMinBeds] = useState("");
  const [newClientRequestNotes, setNewClientRequestNotes] = useState("");
  const [newClientAttachOffer, setNewClientAttachOffer] = useState(false);
  const [newClientOfferPropertyId, setNewClientOfferPropertyId] = useState("");
  const [newClientOfferAmount, setNewClientOfferAmount] = useState("");

  const [offerPropertyId, setOfferPropertyId] = useState("");
  const [offerClientMode, setOfferClientMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [selectedExistingClientId, setSelectedExistingClientId] = useState("");
  const [offerClientName, setOfferClientName] = useState("");
  const [offerClientPhone, setOfferClientPhone] = useState("");
  const [offerAmount, setOfferAmount] = useState("");

  // Dynamic Suburbs List derived directly from loaded properties
  const dynamicSuburbs = React.useMemo(() => {
    const set = new Set<string>();
    (properties || []).forEach((p: any) => {
      if (p.suburb && typeof p.suburb === "string" && p.suburb.trim()) {
        set.add(p.suburb.trim());
      }
    });
    const sorted = Array.from(set).sort();
    return ["ALL", ...sorted];
  }, [properties]);

  const suburbs = dynamicSuburbs;

  const displayProperties = properties || [];

  const isPropertyAssignedToMe = (p: any) => {
    if (!p) return false;
    const userId = session?.user?.id || currentAgent.id;
    const userName = session?.user?.name || currentAgent.name;
    const userEmail = session?.user?.email || currentAgent.email;
    return Boolean(
      (p.assignedAgentId && p.assignedAgentId === userId) ||
      (p.assignedAgent?.id && p.assignedAgent.id === userId) ||
      (p.assignedAgent?.email && userEmail && p.assignedAgent.email.toLowerCase() === userEmail.toLowerCase()) ||
      (p.assignedAgent?.name && userName && p.assignedAgent.name.toLowerCase() === userName.toLowerCase()) ||
      (p.createdById && p.createdById === userId)
    );
  };

  // Filtered Properties for List view
  const filteredProperties = displayProperties.filter((p: any) => {
    const isAssigned = isPropertyAssignedToMe(p);
    const matchesAssigned =
      propertyAssignmentFilter === "ALL" || (propertyAssignmentFilter === "ASSIGNED" && isAssigned);
    const matchesSub = selectedSub === "ALL" || p.suburb?.toLowerCase() === selectedSub.toLowerCase();
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb?.toLowerCase().includes(search.toLowerCase()) ||
      p.propertyType?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      propertyTypeFilter === "ALL" ||
      (propertyTypeFilter === "SALE" && (p.listingType === "FOR_SALE" || !p.listingType)) ||
      (propertyTypeFilter === "RENT" && p.listingType === "FOR_RENT");
    return matchesAssigned && matchesSub && matchesSearch && matchesType;
  });

  // Map Pins: Shows properties matching assignment, search, and suburb filters
  const mapFilteredProperties = displayProperties.filter((p: any) => {
    const isAssigned = isPropertyAssignedToMe(p);
    const matchesAssigned =
      propertyAssignmentFilter === "ALL" || (propertyAssignmentFilter === "ASSIGNED" && isAssigned);
    const matchesSub = selectedSub === "ALL" || p.suburb?.toLowerCase() === selectedSub.toLowerCase();
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.suburb?.toLowerCase().includes(search.toLowerCase()) ||
      p.propertyType?.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      propertyTypeFilter === "ALL" ||
      (propertyTypeFilter === "SALE" && (p.listingType === "FOR_SALE" || !p.listingType)) ||
      (propertyTypeFilter === "RENT" && p.listingType === "FOR_RENT");
    return matchesAssigned && matchesSub && matchesSearch && matchesType;
  });

  // Map Format for InteractivePropertyMap
  const mapItems: PropertyMapItem[] = mapFilteredProperties.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug || p.id,
    listingType: p.listingType || "FOR_SALE",
    status: p.status || "AVAILABLE",
    ownershipType: p.ownershipType || "MANAGED_ON_BEHALF",
    askingPrice: p.price || p.askingPrice || null,
    rentalPrice: p.rentalPrice || (p.listingType === "FOR_RENT" ? p.price : null),
    currency: p.currency || "ZMW",
    bedrooms: p.bedrooms || 4,
    bathrooms: p.bathrooms || 3,
    plotSizeSqm: p.plotSizeSqm || 2000,
    suburb: p.suburb || "Kabulonga",
    city: p.city || "Lusaka",
    latitude: p.latitude || -15.4215,
    longitude: p.longitude || 28.3345,
    photos: p.photos && p.photos.length > 0 ? p.photos : ["/images/villa-hero.webp"],
    description: p.description,
  }));

  // 1-Click WhatsApp Pitch Generator
  const generateWhatsAppFlyer = (p: any) => {
    const rawPrice = p.price || p.askingPrice || p.rentalPrice || 0;
    const priceStr = formatCurrency(Number(rawPrice), p.currency || "ZMW");
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const clientLink = `${origin}/p/${p.slug || p.id}`;
    const text = `*🏡 CONTOUR EXCLUSIVE MANDATE — ${p.title.toUpperCase()}*\n\n` +
      `📍 *Location:* ${p.suburb}, Lusaka\n` +
      `💰 *Price:* ${priceStr}${p.listingType === "FOR_RENT" ? " / month" : ""}\n` +
      `🛏 *Specs:* ${p.bedrooms || 4} Beds | ${p.bathrooms || 3} Baths\n` +
      `📐 *Zoning/Land:* Verified Ministry Clean Title\n` +
      `🔗 *Direct Client Link:* ${clientLink}\n\n` +
      `⚡ *Viewing Coordinates & Key Custody:* Available via Contour Broker Portal.\n\n` +
      `_Contact ${currentAgent.name} (${currentAgent.role}) on ${currentAgent.phone} to arrange private access._`;

    return text;
  };

  const copyWhatsAppFlyer = (p: any) => {
    const flyer = generateWhatsAppFlyer(p);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(flyer).catch(() => {});
    }
    setCopiedId(p.id);
    playSuccessTone();
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Submit Intake: New Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newPropPrice);
    const titleTrimmed = newPropTitle.trim();
    if (titleTrimmed.length < 5) {
      setCaptureError("Add a property title with at least 5 characters.");
      return;
    }
    const isDuplicate = (properties || []).some(
      (p: any) => p.title?.trim().toLowerCase() === titleTrimmed.toLowerCase()
    );
    if (isDuplicate) {
      setCaptureError(`A property named "${titleTrimmed}" already exists. Property titles must be unique.`);
      return;
    }
    if (!newPropSuburb || !newPropSuburb.trim()) {
      setCaptureError("Select or type a suburb / area for this property.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setCaptureError("Enter a property price greater than zero.");
      return;
    }
    setCaptureError(null);

    const payload = {
      title: titleTrimmed,
      description: titleTrimmed.length >= 10 ? titleTrimmed : `${titleTrimmed} located in ${newPropSuburb.trim()}, Lusaka.`,
      suburb: newPropSuburb.trim(),
      price,
      askingPrice: newPropType === "SALE" ? price : undefined,
      rentalPrice: newPropType === "RENT" ? price : undefined,
      currency: newPropCurrency,
      propertyType: "STANDALONE_HOUSE",
      listingType: newPropType === "SALE" ? "FOR_SALE" : "FOR_RENT",
      bedrooms: Number(newPropBeds),
      bathrooms: Math.max(1, Number(newPropBeds) - 1),
      mandateType: newPropMandate === ("EXCLUSIVE" as any) ? "SOLE_MANDATE" : (newPropMandate || "SOLE_MANDATE"),
      mandateDeclarationAgreed: true,
      assignedAgentId: session?.user?.id || undefined,
      assignedAgentName: session?.user?.name || currentAgent.name,
      agentId: session?.user?.id || undefined,
      agentName: session?.user?.name || currentAgent.name,
      photos: newPropPhotos,
      featuredPhoto: newPropFeaturedPhoto || newPropPhotos[0],
      latitude: newPropSuburb === "Kabulonga" ? -15.4215 : newPropSuburb === "Leopards Hill" ? -15.4480 : -15.3850,
      longitude: newPropSuburb === "Kabulonga" ? 28.3345 : newPropSuburb === "Leopards Hill" ? 28.3810 : 28.3120,
      createdAt: new Date().toISOString(),
    };

    await addToOutbox("PROPERTY", "/api/properties", payload);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setNewPropTitle("");
    setNewPropPrice("");
    setNewPropPhotos([]);
    setNewPropFeaturedPhoto(undefined);
  };

  // Submit Intake: New Client (Search Request & Optional Immediate Offer)
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim().length < 2) {
      setCaptureError("Enter the client or company name.");
      return;
    }
    const normalizedClientPhone = normalizePhoneNumber(newClientPhone.trim());
    if (!normalizedClientPhone || normalizedClientPhone.length < 10) {
      setCaptureError("Enter a valid WhatsApp phone number (e.g. 097... or +260...).");
      return;
    }
    if (newClientBudget && Number(newClientBudget) < 0) {
      setCaptureError("Budget cannot be negative.");
      return;
    }

    let attachedOfferProperty: any = null;
    let offerVal = 0;

    if (newClientAttachOffer) {
      if (!newClientOfferPropertyId) {
        setCaptureError("Select the mandate connected to the client's offer.");
        return;
      }
      offerVal = Number(newClientOfferAmount);
      if (!Number.isFinite(offerVal) || offerVal <= 0) {
        setCaptureError("Enter an offer amount greater than zero.");
        return;
      }
      attachedOfferProperty = displayProperties.find((p: any) => p.id === newClientOfferPropertyId);
    }

    setCaptureError(null);

    const clientCurrency = attachedOfferProperty ? (attachedOfferProperty.currency || "ZMW") : newClientCurrency;
    const finalBudget = newClientBudget ? Number(newClientBudget) : (newClientAttachOffer ? offerVal : undefined);

    const enrichedNotes = [
      newClientRequestNotes ? newClientRequestNotes.trim() : "",
      newClientPropertyType ? `Type: ${newClientPropertyType.replace(/_/g, " ")}` : "",
      newClientMinBeds ? `Min ${newClientMinBeds} beds` : "",
      newClientAttachOffer && attachedOfferProperty ? `[Immediate Offer] ${clientCurrency} ${offerVal.toLocaleString()} for ${attachedOfferProperty.title} (${attachedOfferProperty.suburb})` : "",
    ].filter(Boolean).join(" | ");

    const payload: any = {
      clientName: newClientName.trim(),
      clientPhone: normalizedClientPhone,
      budgetMax: finalBudget,
      currency: clientCurrency,
      preferredSuburbs: attachedOfferProperty?.suburb ? [attachedOfferProperty.suburb] : (newClientSuburb ? [newClientSuburb] : []),
      assignedAgentId: session?.user?.id || undefined,
      lookingFor: attachedOfferProperty ? (attachedOfferProperty.listingType || "FOR_SALE") : newClientLookingFor,
      propertyType: newClientPropertyType ? newClientPropertyType : undefined,
      notes: enrichedNotes || undefined,
      status: newClientAttachOffer ? "OFFER_MADE" : "NEW_INQUIRY",
      propertyId: newClientAttachOffer && attachedOfferProperty ? attachedOfferProperty.id : undefined,
      dealValue: newClientAttachOffer && offerVal > 0 ? offerVal : undefined,
      exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (newClientAttachOffer && attachedOfferProperty) {
      const newDeal = {
        id: `deal_${Date.now()}`,
        propertyTitle: attachedOfferProperty.title,
        suburb: attachedOfferProperty.suburb || "Lusaka",
        clientName: newClientName.trim(),
        value: `${clientCurrency === "USD" ? "$" : "K"} ${offerVal.toLocaleString()}`,
        stage: "OFFER_MADE",
        stageLabel: "Formal Offer Submitted",
        agentSplitEst: `${clientCurrency === "USD" ? "$" : "K"} ${(offerVal * 0.025).toLocaleString()} (50% Split)`,
        lockDaysRemaining: 30,
        updatedAt: "Just now",
      };
      setAgentDeals((prev) => [newDeal, ...prev]);
    }

    await addToOutbox("INQUIRY", "/api/clients", payload);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setNewClientName("");
    setNewClientPhone("");
    setNewClientBudget("");
    setNewClientRequestNotes("");
    setNewClientPropertyType("");
    setNewClientMinBeds("");
    setNewClientAttachOffer(false);
    setNewClientOfferPropertyId("");
    setNewClientOfferAmount("");
  };

  // Submit Intake: Formal Offer (Select Existing or New Client)
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOfferProperty = displayProperties.find((p: any) => p.id === offerPropertyId);
    if (!selectedOfferProperty) {
      setCaptureError("Select the mandate connected to this offer.");
      return;
    }

    let resolvedClientName = "";
    let resolvedClientPhone = "";

    if (offerClientMode === "EXISTING") {
      const existingClient = (clients || []).find(
        (c: any) => c.id === selectedExistingClientId || c.name === offerClientName
      );
      if (!existingClient && !offerClientName.trim()) {
        setCaptureError("Select a registered client or switch to add a new client.");
        return;
      }
      resolvedClientName = existingClient ? existingClient.name : offerClientName.trim();
      resolvedClientPhone = existingClient ? existingClient.phone : "+260 97 000 0000";
    } else {
      if (offerClientName.trim().length < 2) {
        setCaptureError("Enter the buyer or client name.");
        return;
      }
      if (!offerClientPhone.trim() || normalizePhoneNumber(offerClientPhone.trim()).length < 10) {
        setCaptureError("Enter a valid WhatsApp phone number for the client (e.g. 097... or +260...).");
        return;
      }
      resolvedClientName = offerClientName.trim();
      resolvedClientPhone = normalizePhoneNumber(offerClientPhone.trim());
    }

    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCaptureError("Enter an offer amount greater than zero.");
      return;
    }
    setCaptureError(null);

    const offerCurrency = selectedOfferProperty.currency || "ZMW";

    const newDeal = {
      id: `deal_${Date.now()}`,
      propertyTitle: selectedOfferProperty.title,
      suburb: selectedOfferProperty.suburb || "Lusaka",
      clientName: resolvedClientName,
      value: `${offerCurrency === "USD" ? "$" : "K"} ${amount.toLocaleString()}`,
      stage: "OFFER_MADE",
      stageLabel: "Formal Offer Submitted",
      agentSplitEst: `${offerCurrency === "USD" ? "$" : "K"} ${(amount * 0.025).toLocaleString()} (50% Split)`,
      lockDaysRemaining: 30,
      updatedAt: "Just now",
    };

    setAgentDeals((prev) => [newDeal, ...prev]);

    const payload: any = {
      clientName: resolvedClientName,
      clientPhone: normalizePhoneNumber(resolvedClientPhone),
      budgetMax: amount,
      dealValue: amount,
      currency: offerCurrency,
      preferredSuburbs: [selectedOfferProperty.suburb || "Lusaka"],
      assignedAgentId: session?.user?.id || undefined,
      propertyId: selectedOfferProperty.id,
      status: "OFFER_MADE",
      lookingFor: selectedOfferProperty.listingType || "FOR_SALE",
      notes: `[Lodge Offer Intake] Formal offer of ${offerCurrency} ${amount.toLocaleString()} submitted by ${session?.user?.name || currentAgent.name}`,
      exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await addToOutbox("INQUIRY", "/api/clients", payload);
    playSuccessTone();
    setIntakeDrawer("NONE");
    setOfferPropertyId("");
    setSelectedExistingClientId("");
    setOfferClientName("");
    setOfferClientPhone("");
    setOfferAmount("");
  };

  // Deal Stage Advancement with real-time server synchronization
  const advanceDealStage = async (dealId: string) => {
    let nextStage: string = "";
    let nextStageLabel: string = "";
    let nextOutcome: "WON" | undefined = undefined;

    const currentDeal = agentDeals.find((d) => d.id === dealId);
    if (!currentDeal) return;

    if (currentDeal.stage === "VIEWING_SCHEDULED" || currentDeal.stage === "CONTACTED" || currentDeal.stage === "NEW_INQUIRY") {
      nextStage = "OFFER_MADE";
      nextStageLabel = "Written Offer Submitted";
    } else if (currentDeal.stage === "NEGOTIATING") {
      nextStage = "OFFER_MADE";
      nextStageLabel = "Written Offer Submitted";
    } else if (currentDeal.stage === "OFFER_MADE" || currentDeal.stage === "OFFER_ACCEPTED" || currentDeal.stage === "DEEDS_LODGED") {
      nextStage = "CLOSED";
      nextStageLabel = "Deal Closed Won";
      nextOutcome = "WON";
    } else {
      return;
    }

    setAgentDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        return { ...deal, stage: nextStage, stageLabel: nextStageLabel, updatedAt: "Just now" };
      })
    );
    playSuccessTone();

    // If it's a real database inquiry, sync to server immediately
    if (!dealId.startsWith("deal_")) {
      try {
        const payload: any = { status: nextStage };
        if (nextOutcome) payload.outcome = nextOutcome;
        await fetch(`/api/clients/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Failed to sync deal advancement to server:", err);
      }
    }
  };

  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === "true";
  const [isLoggingInDev, setIsLoggingInDev] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !session) {
      const target = `/sign-in?redirect_url=${encodeURIComponent("/agent")}`;
      const timer = setTimeout(() => {
        window.location.href = target;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSessionPending, session]);

  const handleDevQuickLogin = async () => {
    setIsLoggingInDev(true);
    try {
      await authClient.signIn.email({
        email: "tembo@contour.app",
        password: "Password123!",
      });
      window.location.href = "/agent";
    } catch {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent("/agent")}`;
    }
  };

  if (isSessionPending) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FAF8F5] px-6 text-center text-editorial-black font-sans">
        <div className="w-full max-w-sm border border-editorial-border bg-white p-8 shadow-lg space-y-4">
          <div className="flex justify-center">
            <ContourLogo size="md" />
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="h-3 w-3 rounded-full bg-contour-red animate-ping" />
            <span className="h-2 w-2 rounded-full bg-contour-red" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-editorial-muted">
            Checking Contour Session…
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FAF8F5] px-6 text-center text-editorial-black font-sans">
        <div className="w-full max-w-sm border border-editorial-border bg-white p-6 sm:p-8 shadow-xl space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-editorial-border pb-4">
            <ContourLogo size="sm" />
            <span className="font-mono text-[9px] uppercase tracking-widest bg-stone-100 px-2 py-1 border border-stone-200 text-stone-600 font-bold">
              Field OS
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700 font-bold">
                Authentication Required
              </p>
            </div>
            <h1 className="font-heading text-lg font-bold uppercase tracking-tight text-editorial-black">
              Redirecting to Secure Sign-In
            </h1>
            <p className="text-xs text-editorial-muted leading-relaxed">
              The Field Agent PWA requires an authenticated Contour session to access protected client mandates and Lusaka spatial registries.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <a
              href="/sign-in?redirect_url=%2Fagent"
              className="flex w-full items-center justify-center gap-2 bg-editorial-black hover:bg-contour-red text-white py-3 px-4 text-xs font-heading font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <span>Continue to Sign In</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {isDev && (
              <button
                type="button"
                disabled={isLoggingInDev}
                onClick={() => void handleDevQuickLogin()}
                className="flex w-full items-center justify-center gap-2 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-editorial-black py-2.5 px-4 text-[11px] font-heading font-bold uppercase tracking-wider transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-contour-red" />
                <span>{isLoggingInDev ? "Logging in..." : "Fast Dev Login (Tembo - Agent)"}</span>
              </button>
            )}
          </div>

          <p className="text-[10px] font-mono text-center text-editorial-muted pt-2 border-t border-stone-100">
            SSL 256-Bit Encrypted · POPIA Compliant
          </p>
        </div>
      </main>
    );
  }

  return (
    <div data-field-console className="field-shell min-h-dvh bg-[#FBF9F5] text-editorial-black font-sans flex flex-col justify-between max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto relative shadow-2xl border-x border-editorial-border">
      
      {/* 1. Top Fixed Field Bar with Contour Branding */}
      <header className="field-header relative sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-editorial-border px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Contour Branding */}
          <div className="flex items-center gap-2.5">
            <Link href="/agent" className="flex items-center gap-2 group">
              <ContourLogo size="sm" variant="light" />
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-editorial-muted border-l border-editorial-border pl-2.5">
                Field OS
              </span>
            </Link>
          </div>

          {/* Right Controls: Online/Offline Dot & Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Minimal Online/Offline Status Dot (no square container) */}
            <button
              onClick={toggleNetwork}
              type="button"
              aria-label={isOnline ? "Live: synced with Contour (click to toggle offline mode)" : "Offline: working locally (click to toggle online)"}
              title={isOnline ? "Live · Synced with Contour" : "Offline · Changes queued locally"}
              className="p-2 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  isOnline
                    ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                    : "bg-amber-500 shadow-xs shadow-amber-500/50"
                }`}
              />
            </button>

            {/* Hamburger Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="field-mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="field-mobile-menu-trigger inline-flex h-9 w-9 items-center justify-center border border-editorial-border bg-white text-editorial-black hover:bg-neutral-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Hamburger Dropdown Menu (Contains Avatar, Profile, Dashboard, and Logout) */}
        <div
          id="field-mobile-menu"
          className={`${
            isMobileMenuOpen ? "block" : "hidden"
          } field-mobile-menu-panel absolute left-3 right-3 top-full mt-1 border border-editorial-border bg-white p-3 text-editorial-black shadow-xl z-50`}
        >
          {/* User Profile Header with Avatar */}
          <div className="flex items-center gap-3 border-b border-editorial-border pb-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-editorial-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentAgent.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-heading font-bold text-editorial-black truncate">{currentAgent.name}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-editorial-muted truncate">
                {currentAgent.role} · {currentAgent.zone}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPersonaModalOpen(true);
              }}
              className="flex min-h-10 w-full items-center gap-3 px-3 text-left text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
            >
              <User className="h-4 w-4 text-editorial-muted" />
              <span>View Agent Profile</span>
            </button>

            {isManagerOrAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-10 items-center gap-3 px-3 text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black hover:bg-neutral-50 transition-colors"
              >
                <Home className="h-4 w-4 text-editorial-muted" />
                <span>Operations Dashboard</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex min-h-10 w-full items-center gap-3 border-t border-editorial-border pt-2 mt-2 px-3 text-left text-xs font-heading font-semibold uppercase tracking-wider text-contour-red hover:bg-red-50/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollable Canvas */}
      <main className="field-main flex-1 px-4 py-4 space-y-4 pb-28 overflow-y-auto">
        <section className="border-b border-editorial-border pb-4 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-contour-red font-bold">
            {activeTabMeta[activeTab].eyebrow}
          </p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-editorial-black">
                {activeTabMeta[activeTab].title}
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-editorial-muted">
                {activeTabMeta[activeTab].description}
              </p>
            </div>
            <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-editorial-muted sm:block">
              {isOnline ? "Synced workspace" : "Local workspace"}
            </span>
          </div>
        </section>

        {(!isOnline || outboxCount > 0 || loading) && (
          <section className="field-sync-notice flex items-center justify-between gap-3 border border-editorial-border bg-white px-3 py-3 text-xs">
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${loading ? "bg-amber-500 animate-pulse" : isOnline ? "bg-emerald-600" : "bg-amber-500"}`} />
              <div>
                <p className="font-heading font-bold text-editorial-black uppercase text-xs">
                  {loading ? "Refreshing field data" : isOnline ? "Actions queued for sync" : "Working offline"}
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-editorial-muted">
                  {loading ? "Keep working; the local workspace remains available." : outboxCount > 0 ? `${outboxCount} action${outboxCount === 1 ? "" : "s"} saved locally and waiting for confirmation.` : "New captures will be stored on this device until the connection returns."}
                </p>
              </div>
            </div>
            {isOnline && outboxCount > 0 && (
              <button onClick={() => syncData()} className="shrink-0 border border-editorial-border bg-neutral-100 hover:bg-editorial-black hover:text-white px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-editorial-black transition-colors">
                Sync now
              </button>
            )}
          </section>
        )}
        
        {/* ================= TAB 0: WORK QUEUE ================= */}
        {activeTab === "QUEUE" && (
          <div className="space-y-4">
            <section className="bg-editorial-black text-white p-4 sm:p-5 border border-editorial-black">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-contour-red font-bold">Good morning, {currentAgent.name.split(" ")[0]}</p>
                  <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight leading-tight">Keep the day moving.</h2>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-300">Your field actions stay protected locally and sync when the connection returns.</p>
                </div>
                <div className="w-10 h-10 border border-neutral-700 bg-neutral-900 flex items-center justify-center text-contour-red shrink-0">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-neutral-800 pt-3 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                <span>{isOnline ? "Workspace synced" : "Working locally"}</span>
                <span>{outboxCount > 0 ? `${outboxCount} queued` : "No queued actions"}</span>
              </div>
            </section>

            {/* Quick Field Intake Actions: Listing, Client, Offer */}
            <div className={`grid ${isManagerOrAdmin ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
              {isManagerOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCaptureError(null);
                    setIntakeDrawer("PROPERTY");
                    playSuccessTone();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-editorial-black border border-editorial-border font-heading text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:border-editorial-black"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E57A1A]" />
                  <span>Listing</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCaptureError(null);
                  setIntakeDrawer("CLIENT");
                  playSuccessTone();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-editorial-black border border-editorial-border font-heading text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:border-editorial-black"
              >
                <Plus className="w-3.5 h-3.5 text-[#E57A1A]" />
                <span>Client</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCaptureError(null);
                  setIntakeDrawer("OFFER");
                  playSuccessTone();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-editorial-black border border-editorial-border font-heading text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:border-editorial-black"
              >
                <Plus className="w-3.5 h-3.5 text-[#E57A1A]" />
                <span>Offer</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Viewings", value: String(agentSummary?.metrics?.viewingsCount ?? 0).padStart(2, "0"), tone: "text-editorial-black" },
                { label: "Follow-ups", value: String(agentSummary?.metrics?.followUpsCount ?? 0).padStart(2, "0"), tone: "text-editorial-black" },
                { label: "Active deals", value: String(agentSummary?.metrics?.activeDealsCount ?? agentDeals.length).padStart(2, "0"), tone: "text-contour-red" },
              ].map((stat) => (
                <div key={stat.label} className="border border-editorial-border bg-white p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-editorial-muted">{stat.label}</p>
                  <p className={`mt-1 font-heading text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <section className="border border-editorial-border bg-white">
              <div className="flex items-center justify-between border-b border-editorial-border px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-contour-red font-bold">Next actions</p>
                  <h2 className="mt-1 font-heading text-lg font-bold uppercase text-editorial-black">Start here</h2>
                </div>
                <CalendarClock className="h-5 w-5 text-contour-red" />
              </div>
              <div className="divide-y divide-editorial-border">
                {(agentSummary?.queue && agentSummary.queue.length > 0 ? agentSummary.queue : [
                  {
                    id: "queue_default_inquiry",
                    title: "Capture a new field inquiry",
                    subtitle: "Protect the client relationship for 30 days under Contour registry",
                    targetTab: "CLIENTS",
                    type: "CLIENT",
                  }
                ]).map((action: any) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.targetTab === "CLIENTS" && action.type === "CLIENT") {
                        setIntakeDrawer("CLIENT");
                      } else if (action.targetTab) {
                        setActiveTab(action.targetTab);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <span>
                      <span className="block text-sm font-bold text-editorial-black font-heading">{action.title}</span>
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-editorial-muted">{action.subtitle}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-editorial-black" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB 1: PROPERTIES (CATALOG & SPATIAL MAP) ================= */}
        {(activeTab === "PROPERTIES" || activeTab === "MAP") && (
          <div className={activeTab === "MAP" ? "field-map-viewport fixed inset-0 z-[60] bg-white" : "space-y-4"}>
            
            {/* Search, Suburb Chips & Layout Switcher */}
            <div className={activeTab === "MAP" ? "hidden" : "space-y-2.5"}>
              
              {/* Assignment Switcher: All Mandates vs Assigned to Me */}
              <div className="flex bg-neutral-100 p-1 border border-editorial-border text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPropertyAssignmentFilter("ALL");
                    playNeutralTone();
                  }}
                  className={`flex-1 py-1.5 font-heading font-semibold uppercase tracking-wider text-center transition-all ${
                    propertyAssignmentFilter === "ALL"
                      ? "bg-editorial-black text-white shadow-xs"
                      : "text-editorial-muted hover:text-editorial-black"
                  }`}
                >
                  All Mandates ({displayProperties.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPropertyAssignmentFilter("ASSIGNED");
                    playNeutralTone();
                  }}
                  className={`flex-1 py-1.5 font-heading font-semibold uppercase tracking-wider text-center transition-all ${
                    propertyAssignmentFilter === "ASSIGNED"
                      ? "bg-editorial-black text-white shadow-xs"
                      : "text-editorial-muted hover:text-editorial-black"
                  }`}
                >
                  Assigned to Me ({displayProperties.filter((p: any) => isPropertyAssignedToMe(p)).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-editorial-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Lusaka properties, suburbs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-editorial-border pl-9 pr-3 py-2 text-xs text-editorial-black placeholder-neutral-400 focus:outline-none focus:border-editorial-black transition-colors font-sans"
                  />
                </div>

                {/* View Mode Toggle: [ 📋 List | 🗺️ Map ] */}
                <div className="flex bg-neutral-100 p-1 border border-editorial-border text-xs shrink-0">
                  <button
                    onClick={() => {
                      setPropertyViewMode("LIST");
                      setActiveTab("PROPERTIES");
                      playNeutralTone();
                    }}
                    className={`px-2.5 py-1 font-heading font-semibold uppercase tracking-wider text-xs transition-all ${
                      propertyViewMode === "LIST" && activeTab === "PROPERTIES"
                        ? "bg-editorial-black text-white shadow-xs"
                        : "text-editorial-muted hover:text-editorial-black"
                    }`}
                  >
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => {
                      setPropertyViewMode("MAP");
                      setActiveTab("MAP");
                      playNeutralTone();
                    }}
                    className={`px-2.5 py-1 font-heading font-semibold uppercase tracking-wider text-xs flex items-center gap-1 transition-all ${
                      propertyViewMode === "MAP" || activeTab === "MAP"
                        ? "bg-editorial-black text-white shadow-xs"
                        : "text-editorial-muted hover:text-editorial-black"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Map</span>
                  </button>
                </div>
              </div>

              {/* Suburb Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {suburbs.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSub(sub);
                      playNeutralTone();
                    }}
                    className={`px-3 py-1 font-mono uppercase tracking-wider text-[11px] whitespace-nowrap transition-all border ${
                      selectedSub === sub
                        ? "bg-editorial-black text-white border-editorial-black font-bold"
                        : "bg-white text-editorial-muted border-editorial-border hover:border-editorial-black hover:text-editorial-black"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Type Filter Pill Switcher */}
              <div className="flex items-center gap-2 pt-0.5 text-xs">
                <span className="text-[10px] uppercase font-mono text-editorial-muted font-bold">Type:</span>
                <div className="flex bg-neutral-100 p-0.5 border border-editorial-border text-[11px]">
                  {(["ALL", "SALE", "RENT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPropertyTypeFilter(t)}
                      className={`px-2.5 py-0.5 font-mono uppercase font-semibold transition-colors ${
                        propertyTypeFilter === t
                          ? "bg-editorial-black text-white"
                          : "text-editorial-muted hover:text-editorial-black"
                      }`}
                    >
                      {t === "ALL" ? "All" : t === "SALE" ? "For Sale" : "For Rent"}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-[10px] text-editorial-black font-mono font-bold">
                  {filteredProperties.length} Mandates
                </span>
              </div>
            </div>

            {/* A. MAP VIEW MODE */}
            {(propertyViewMode === "MAP" || activeTab === "MAP") && (
              <div className="space-y-3">
                {/* Embedded Mobile Map Container */}
                <div className={activeTab === "MAP" ? "h-dvh w-full overflow-hidden relative bg-white" : "h-[52vh] overflow-hidden border border-editorial-border relative bg-neutral-100"}>
                  {activeTab === "MAP" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("PROPERTIES");
                          setPropertyViewMode("LIST");
                          setSelectedMapProperty(null);
                        }}
                        className="absolute left-4 top-4 z-[1100] inline-flex h-10 items-center gap-2 border border-editorial-border bg-white/95 px-3 text-xs font-heading font-bold uppercase tracking-wider text-editorial-black shadow-sm backdrop-blur hover:bg-neutral-50"
                        aria-label="Exit full-screen map"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>

                      <div className="absolute right-4 top-4 z-[1100] flex bg-white/95 border border-editorial-border p-1 shadow-sm backdrop-blur text-[10px] font-heading font-semibold uppercase tracking-wider">
                        <button
                          type="button"
                          onClick={() => {
                            setPropertyAssignmentFilter("ALL");
                            playNeutralTone();
                          }}
                          className={`px-2.5 py-1.5 transition-all ${
                            propertyAssignmentFilter === "ALL"
                              ? "bg-editorial-black text-white"
                              : "text-editorial-muted hover:text-editorial-black"
                          }`}
                        >
                          All ({displayProperties.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPropertyAssignmentFilter("ASSIGNED");
                            playNeutralTone();
                          }}
                          className={`px-2.5 py-1.5 transition-all ${
                            propertyAssignmentFilter === "ASSIGNED"
                              ? "bg-editorial-black text-white"
                              : "text-editorial-muted hover:text-editorial-black"
                          }`}
                        >
                          Mine ({displayProperties.filter((p: any) => isPropertyAssignedToMe(p)).length})
                        </button>
                      </div>
                    </>
                  )}
                  <InteractivePropertyMap
                    properties={mapItems}
                    onSelectProperty={(prop) => {
                      setSelectedMapProperty(prop);
                      playSuccessTone();
                    }}
                    searchQuery={search}
                    onSearchChange={setSearch}
                    filterType={propertyTypeFilter}
                    minimal={true}
                    searchPosition="bottom"
                    className="w-full h-full"
                  />
                </div>

                {/* Selected Property Floating Detail Card on Map */}
                {selectedMapProperty ? (
                  <div className={`${activeTab === "MAP" ? "fixed bottom-4 left-4 right-4 z-[1100] max-w-lg mx-auto" : ""} bg-white border border-editorial-border p-4 space-y-3 shadow-2xl animate-in slide-in-from-bottom-3 text-editorial-black`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-editorial-black bg-neutral-100 px-2 py-0.5 border border-editorial-border">
                            {selectedMapProperty.suburb}
                          </span>
                          {isPropertyAssignedToMe(selectedMapProperty) ? (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-contour-red bg-red-50 px-2 py-0.5 border border-red-200">
                              Your Mandate
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-medium uppercase tracking-wider text-editorial-muted bg-neutral-100 px-2 py-0.5 border border-editorial-border">
                              Estate Mandate
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-heading font-bold text-editorial-black mt-1 leading-snug">
                          {selectedMapProperty.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-editorial-black font-mono">
                          {formatCurrency(Number(selectedMapProperty.askingPrice || selectedMapProperty.rentalPrice || 0), selectedMapProperty.currency || "ZMW")}
                        </div>
                        <span className="text-[9px] text-editorial-muted uppercase font-mono">
                          {selectedMapProperty.listingType === "FOR_RENT" ? "Per Month" : "Price"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-editorial-muted py-2 border-y border-editorial-border font-mono">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-editorial-black" />
                        <span>{selectedMapProperty.bedrooms || 4} Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-editorial-black" />
                        <span>{selectedMapProperty.bathrooms || 3} Baths</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapProperty.latitude || -15.4215},${selectedMapProperty.longitude || 28.3345}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] ml-auto hover:text-contour-red transition-colors"
                        title="Get Driving Directions"
                      >
                        <Navigation className="w-3 h-3 text-contour-red" />
                        <span>Navigate ({Number(selectedMapProperty.latitude || 0).toFixed(3)}, {Number(selectedMapProperty.longitude || 0).toFixed(3)})</span>
                      </a>
                    </div>

                    {/* Action Bar on Map Card */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        onClick={() => setSelectedPropertyDetail(selectedMapProperty)}
                        className="col-span-2 py-2.5 px-3 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-contour-red" />
                        <span>{isPropertyAssignedToMe(selectedMapProperty) ? "Manage Mandate Details" : "Open Mandate Record"}</span>
                      </button>
                      <button
                        onClick={() => copyWhatsAppFlyer(selectedMapProperty)}
                        className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-contour-red" />
                        <span>{copiedId === selectedMapProperty.id ? "Pitch Copied" : "WhatsApp Pitch"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setMatchedProperty(selectedMapProperty);
                          playNeutralTone();
                        }}
                        className="py-2.5 px-3 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Match Buyers</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`${activeTab === "MAP" ? "hidden" : "block"} bg-white p-3 border border-editorial-border text-center text-xs text-editorial-muted`}>
                    <span>💡 Tap any property pin on the Lusaka map above to preview mandating specs, generate WhatsApp copy, or match registered buyers.</span>
                  </div>
                )}
              </div>
            )}

            {/* B. LIST VIEW MODE */}
            {propertyViewMode === "LIST" && activeTab === "PROPERTIES" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredProperties.length === 0 ? (
                  <div className="col-span-full bg-white border border-editorial-border p-8 text-center space-y-3">
                    <Building2 className="w-8 h-8 text-neutral-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-heading font-bold text-editorial-black uppercase">
                        {displayProperties.length === 0 ? "Welcome to Your Agency Workspace" : "No mandates found"}
                      </h4>
                      <p className="text-xs text-editorial-muted mt-1 max-w-sm mx-auto">
                        {displayProperties.length === 0
                          ? "Your catalog is currently a clean slate. Start by capturing your first estate property listing below."
                          : propertyAssignmentFilter === "ASSIGNED"
                          ? "You currently have no properties assigned to your profile in this organization."
                          : "No properties match your current search or filter criteria."}
                      </p>
                    </div>
                    {isManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setIntakeDrawer("PROPERTY")}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{displayProperties.length === 0 ? "Add First Mandate" : "Add New Mandate"}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProperties.map((p: any) => {
                  const isCopied = copiedId === p.id;
                  const priceStr = formatCurrency(Number(p.price || p.askingPrice || p.rentalPrice || 0), p.currency || "ZMW");

                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-editorial-border p-4 flex flex-col justify-between space-y-3 text-editorial-black transition-colors hover:border-editorial-black/50"
                    >
                      <div className="relative h-44 sm:h-48 overflow-hidden border border-editorial-border bg-neutral-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            p.photos?.[0] ||
                            p.featuredPhoto ||
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
                          }
                          alt={p.title || "Property image"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>

                      {/* Header: Title & Suburb */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-editorial-black bg-neutral-100 px-2 py-0.5 border border-editorial-border">
                              {p.suburb || "Lusaka"}
                            </span>
                            {isPropertyAssignedToMe(p) ? (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-contour-red bg-red-50 px-2 py-0.5 border border-red-200">
                                Your Mandate
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-medium uppercase tracking-wider text-editorial-muted bg-neutral-100 px-2 py-0.5 border border-editorial-border">
                                Estate Mandate
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-base font-bold text-editorial-black mt-1 leading-snug line-clamp-2">
                            {p.title}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-editorial-black font-mono">
                            {priceStr}
                          </div>
                          <span className="text-[9px] text-editorial-muted uppercase font-mono">
                            {p.listingType === "FOR_RENT" ? "Per Month" : "Sale Price"}
                          </span>
                        </div>
                      </div>

                      {/* Property Specs Pill Grid */}
                      <div className="flex items-center gap-3 text-xs text-editorial-muted py-2 border-y border-editorial-border font-mono">
                        <div className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-editorial-black" />
                          <span>{p.bedrooms || 4} Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5 text-editorial-black" />
                          <span>{p.bathrooms || 3} Baths</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] ml-auto">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Title</span>
                        </div>
                      </div>

                      {/* Masked PII Notice */}
                      <div className="bg-neutral-50 px-2.5 py-1.5 border border-editorial-border flex items-center justify-between text-[10px] text-editorial-muted font-mono">
                        <span className="flex items-center gap-1 font-medium text-editorial-black">
                          <Lock className="w-3 h-3 text-contour-red" />
                          <span>Landlord PII Masked (Mandate Protected)</span>
                        </span>
                        <span>ID: {p.id.slice(0, 8)}</span>
                      </div>

                      <button
                        onClick={() => setSelectedPropertyDetail(p)}
                        className="w-full border-b border-editorial-border pb-2 text-left text-[10px] font-mono uppercase tracking-wider text-editorial-black hover:text-contour-red transition-colors flex items-center justify-between"
                      >
                        <span>Open full mandate record</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-contour-red" />
                      </button>

                      {/* Action Bar */}
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        {/* 1-Click Client Link */}
                        <button
                          onClick={(e) => handleShareClientLink(p, e)}
                          title="Copy Public Link for Client"
                          className={`py-2 px-1 text-[10px] font-heading font-semibold uppercase tracking-wider border transition-all flex items-center justify-center gap-0.5 ${
                            copiedPublicLinkId === p.id
                              ? "bg-emerald-800 text-white border-emerald-800"
                              : "bg-white hover:bg-neutral-50 text-editorial-black border-editorial-border"
                          }`}
                        >
                          {copiedPublicLinkId === p.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3 h-3 text-contour-red" />
                              <span>Link</span>
                            </>
                          )}
                        </button>

                        {/* WhatsApp Pitch Text */}
                        <button
                          onClick={() => copyWhatsAppFlyer(p)}
                          className={`py-2 px-1 text-[10px] font-heading font-semibold uppercase tracking-wider border transition-all flex items-center justify-center gap-0.5 ${
                            isCopied
                              ? "bg-editorial-black text-white border-editorial-black"
                              : "bg-white hover:bg-neutral-50 text-editorial-black border-editorial-border"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-contour-red" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3 text-contour-red" />
                              <span>Pitch</span>
                            </>
                          )}
                        </button>

                        {/* Visual Swiss Flyer Generator */}
                        <button
                          onClick={() => setFlyerModalProperty(p)}
                          title="Generate Swiss Editorial Flyer"
                          className="py-2 px-1 text-[10px] font-heading font-semibold uppercase tracking-wider border border-editorial-border bg-white hover:bg-[#fff5f3] text-editorial-black transition-all flex items-center justify-center gap-0.5"
                        >
                          <Sparkles className="w-3 h-3 text-contour-red" />
                          <span>Flyer</span>
                        </button>

                        {/* Match Buyers Button */}
                        <button
                          onClick={() => {
                            setMatchedProperty(p);
                            playNeutralTone();
                          }}
                          className="py-2 px-1 bg-editorial-black hover:bg-contour-red text-white text-[10px] font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-0.5 transition-colors"
                        >
                          <Users className="w-3 h-3" />
                          <span>Buyers</span>
                        </button>
                      </div>
                    </div>
                  );
                }))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CLIENTS ================= */}
        {activeTab === "CLIENTS" && (
          <div className="space-y-4">
            
            {/* Header & Intake Trigger */}
            <div className="flex items-center justify-between bg-white p-4 border border-editorial-border">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-contour-red">
                  30-Day Anti-Poaching Registry
                </h2>
                <p className="text-[11px] text-editorial-muted mt-0.5">
                  Clients locked exclusively to your agent profile.
                </p>
              </div>
              <button
                onClick={() => setIntakeDrawer("CLIENT")}
                className="px-3.5 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Client</span>
              </button>
            </div>

            {/* Assignment Switcher: All Clients vs Assigned to Me */}
            <div className="flex bg-neutral-100 p-1 border border-editorial-border text-xs">
              <button
                type="button"
                onClick={() => {
                  setClientAssignmentFilter("ALL");
                  playNeutralTone();
                }}
                className={`flex-1 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-center transition-all ${
                  clientAssignmentFilter === "ALL"
                    ? "bg-white text-editorial-black shadow-sm border border-editorial-border"
                    : "text-editorial-muted hover:text-editorial-black"
                }`}
              >
                All Inquiries ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientAssignmentFilter("ASSIGNED");
                  playNeutralTone();
                }}
                className={`flex-1 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-center transition-all ${
                  clientAssignmentFilter === "ASSIGNED"
                    ? "bg-editorial-black text-white shadow-sm"
                    : "text-editorial-muted hover:text-editorial-black"
                }`}
              >
                Assigned to Me ({clients.filter((c: any) => c.assignedAgentId === currentAgent.id || c.assignedAgent?.id === currentAgent.id || c.assignedAgent?.name === currentAgent.name).length})
              </button>
            </div>

            {/* Clients List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {(() => {
                const filteredClients = clients.filter((c: any) => {
                  const isAssigned =
                    c.assignedAgentId === currentAgent.id ||
                    c.assignedAgent?.id === currentAgent.id ||
                    c.assignedAgent?.name === currentAgent.name;
                  return clientAssignmentFilter === "ALL" || (clientAssignmentFilter === "ASSIGNED" && isAssigned);
                });

                if (filteredClients.length === 0) {
                  return (
                    <div className="col-span-full bg-white border border-editorial-border p-8 text-center space-y-3">
                      <Users className="w-8 h-8 text-editorial-muted mx-auto" />
                      <div>
                        <h4 className="text-sm font-heading font-semibold text-editorial-black">No client inquiries found</h4>
                        <p className="text-xs text-editorial-muted mt-1 max-w-sm mx-auto">
                          {clientAssignmentFilter === "ASSIGNED"
                            ? "You currently have no clients assigned to your profile in this organization."
                            : "No registered clients in the organization registry yet."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIntakeDrawer("CLIENT")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register New Client</span>
                      </button>
                    </div>
                  );
                }

                return filteredClients.map((c: any) => (
                  <div
                    key={c.id}
                    className="bg-white border border-editorial-border p-4 flex flex-col justify-between space-y-3 hover:border-editorial-black/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-heading font-semibold text-editorial-black">{c.name}</h3>
                          <span className="text-[10px] bg-neutral-100 text-editorial-black px-2 py-0.5 border border-editorial-border font-mono font-bold">
                            {c.preferredArea}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-editorial-muted font-mono">{c.phone}</p>
                          {c.assignedAgent?.name && (
                            <span className="text-[10px] text-editorial-muted font-mono">
                              • Agent: {c.assignedAgent.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-contour-red">
                          {c.budget}
                        </div>
                        <span className="text-[9px] text-editorial-muted uppercase font-mono">
                          Budget Max
                        </span>
                      </div>
                    </div>

                    {/* Anti-Poaching Countdown Badge */}
                    <div className="bg-neutral-50 p-2.5 border border-editorial-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-editorial-black font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-contour-red" />
                        <span>{c.lockExpiry}</span>
                      </div>
                      <span className="text-[10px] text-contour-red font-mono font-bold uppercase tracking-wider">
                        Protected
                      </span>
                    </div>

                    {/* Direct Communication & Edit Buttons */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${c.phone}`}
                          className="py-2.5 px-3 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-contour-red" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${formatWhatsAppDigits(c.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditClient(c)}
                        className="w-full py-2 px-3 bg-neutral-50 hover:bg-neutral-100 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-editorial-muted" />
                        <span>Edit Client Details</span>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DEALS ================= */}
        {activeTab === "DEALS" && (
          <div className="space-y-4">
            
            {/* Header & Quick Offer */}
            <div className="flex items-center justify-between bg-white p-4 border border-editorial-border">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-contour-red">
                  Deal Velocity Pipeline
                </h2>
                <p className="text-[11px] text-editorial-muted mt-0.5">
                  Track viewings, offers, and title deed completions.
                </p>
              </div>
              <button
                onClick={() => setIntakeDrawer("OFFER")}
                className="px-3.5 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lodge Offer</span>
              </button>
            </div>

            {/* Deals Stream */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {agentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white border border-editorial-border p-4 flex flex-col justify-between space-y-3 hover:border-editorial-black/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-neutral-100 text-editorial-black px-2 py-0.5 border border-editorial-border font-bold">
                        {deal.suburb}
                      </span>
                      <h3 className="text-sm font-heading font-semibold text-editorial-black mt-1.5 leading-tight">
                        {deal.propertyTitle}
                      </h3>
                      <p className="text-xs text-editorial-muted mt-0.5">
                        Client: <span className="text-editorial-black font-semibold">{deal.clientName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-editorial-black font-mono">
                        {deal.value}
                      </div>
                      <div className="text-[10px] text-contour-red font-mono font-bold mt-0.5">
                        Split: {deal.agentSplitEst}
                      </div>
                    </div>
                  </div>

                  {/* Stage Badge & Status */}
                  <div className="bg-neutral-50 p-2.5 border border-editorial-border flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-editorial-muted font-bold">
                        Current Status
                      </div>
                      <div className="text-xs font-heading font-semibold text-editorial-black mt-0.5">
                        {deal.stageLabel}
                      </div>
                    </div>
                    <span className="text-[10px] text-editorial-muted font-mono">
                      {deal.updatedAt}
                    </span>
                  </div>

                  {/* Stage Advancement Action */}
                  <button
                    onClick={() => advanceDealStage(deal.id)}
                    className="w-full py-2.5 px-3 bg-editorial-black hover:bg-contour-red text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-contour-red" />
                    <span>
                      {deal.stage === "VIEWING_SCHEDULED" && "Advance: Lodge Buyer Offer"}
                      {deal.stage === "OFFER_MADE" && "Advance: Mark Offer Accepted"}
                      {deal.stage === "OFFER_ACCEPTED" && "Advance: Lodge Deeds at Ministry"}
                      {deal.stage === "DEEDS_LODGED" && "Advance: Confirm Payout Settled"}
                      {deal.stage === "COMMISSION_PAID" && "Deal Completed & Settled ✅"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: EARNINGS ================= */}
        {activeTab === "EARNINGS" && (
          <div className="space-y-4">
            
            {/* Commissions Overview Card */}
            <div className="bg-white border border-editorial-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-contour-red tracking-wider">
                    My Commission Splits
                  </span>
                  <h2 className="text-xl font-heading font-bold text-editorial-black mt-0.5">
                    {currentAgent.name}
                  </h2>
                </div>
                <div className="p-2.5 bg-neutral-100 border border-editorial-border text-contour-red">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Earnings Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-neutral-50 p-3 border border-editorial-border">
                  <span className="text-[10px] text-editorial-muted uppercase font-mono">Paid (USD)</span>
                  <div className="text-base font-bold text-editorial-black font-mono mt-0.5">
                    ${currentAgent.earnedSplitUsd.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-editorial-muted font-mono">50% Broker Split</span>
                </div>
                <div className="bg-neutral-50 p-3 border border-editorial-border">
                  <span className="text-[10px] text-editorial-muted uppercase font-mono">Paid (ZMW)</span>
                  <div className="text-base font-bold text-editorial-black font-mono mt-0.5">
                    K{currentAgent.earnedSplitZmw.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-editorial-muted font-mono">Cleared to Bank</span>
                </div>
              </div>

              {/* Pending In Pipeline */}
              <div className="bg-neutral-50 p-3.5 border border-editorial-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-contour-red uppercase font-mono font-bold">
                    Pending In Pipeline
                  </span>
                  <div className="text-sm font-bold text-editorial-black font-mono mt-0.5">
                    K {currentAgent.pendingSplitZmw.toLocaleString()} + ${currentAgent.pendingSplitUsd.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] bg-neutral-100 text-editorial-black px-2 py-0.5 border border-editorial-border font-mono font-bold">
                  3 Deals
                </span>
              </div>
            </div>

            {/* Recent Closed Transactions & Receipts */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-muted">
                Closed Transaction Slips
              </h3>

              {(() => {
                const slips = agentSummary?.earnings?.slips || [];
                if (slips.length === 0) {
                  return (
                    <div className="bg-white border border-editorial-border p-8 text-center space-y-2">
                      <Wallet className="w-8 h-8 text-editorial-muted mx-auto" />
                      <h4 className="text-sm font-heading font-semibold text-editorial-black">No closed transaction slips yet</h4>
                      <p className="text-xs text-editorial-muted max-w-xs mx-auto">
                        When sales or rental mandates close under your profile, verified digital commission payout vouchers will appear here.
                      </p>
                    </div>
                  );
                }

                return slips.map((slip: any) => (
                  <div
                    key={slip.id}
                    className="bg-white border border-editorial-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-heading font-semibold text-editorial-black">{slip.property}</h4>
                        <p className="text-[11px] text-editorial-muted mt-0.5">Suburb: {slip.suburb || "Lusaka"}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-contour-red">
                          {slip.agentSplit}
                        </div>
                        <span className="text-[9px] text-editorial-muted font-mono">{slip.date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCommissionSlip(slip)}
                      className="w-full py-2 px-3 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-heading font-semibold uppercase tracking-wider border border-editorial-border flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-contour-red" />
                      <span>View Digital Commission Slip</span>
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </main>

      {/* 3. Dedicated Bottom Dock Navigation Bar */}
      <footer className="field-footer fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-editorial-border max-w-md md:max-w-2xl mx-auto pb-safe">
        <div className="grid grid-cols-5 items-center px-2 py-1.5 sm:py-2">
          
          {/* Properties (Catalog & Map) Tab */}
          <button
            onClick={() => {
              setActiveTab("PROPERTIES");
              playNeutralTone();
            }}
            aria-label="Properties"
            title="Properties"
            aria-current={activeTab === "PROPERTIES" || activeTab === "MAP" ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === "PROPERTIES" || activeTab === "MAP" ? "text-contour-red font-semibold" : "text-editorial-muted hover:text-editorial-black"
            }`}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight tracking-tight">Properties</span>
          </button>

          {/* Clients Tab */}
          <button
            onClick={() => {
              setActiveTab("CLIENTS");
              playNeutralTone();
            }}
            aria-label="Clients"
            title="Clients"
            aria-current={activeTab === "CLIENTS" ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === "CLIENTS" ? "text-contour-red font-semibold" : "text-editorial-muted hover:text-editorial-black"
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight tracking-tight">Clients</span>
          </button>

          {/* Center Home Action Button (Round Contour Red #FA3600 Circle with Home Icon) */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={() => {
                setActiveTab("QUEUE");
                playNeutralTone();
              }}
              aria-label="Home"
              title="Home"
              aria-current={activeTab === "QUEUE" ? "page" : undefined}
              className="field-home-action w-12 h-12 rounded-full !rounded-full text-white flex items-center justify-center shadow-lg transition-all ring-4 ring-white active:scale-95 bg-[#FA3600] md:w-full md:h-12 md:!rounded-md md:ring-0 md:gap-3 md:justify-start md:px-4"
              style={{ borderRadius: "9999px", backgroundColor: "#FA3600" }}
            >
              <Home className="w-6 h-6 text-white shrink-0" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-white">
                Today / Home
              </span>
            </button>
            <span
              className={`text-[10px] font-semibold leading-tight tracking-tight mt-1 md:hidden ${
                activeTab === "QUEUE" ? "text-contour-red font-semibold" : "text-editorial-muted"
              }`}
            >
              Home
            </span>
          </div>

          {/* Deals Tab */}
          <button
            onClick={() => {
              setActiveTab("DEALS");
              playNeutralTone();
            }}
            aria-label="Deals"
            title="Deals"
            aria-current={activeTab === "DEALS" ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === "DEALS" ? "text-contour-red font-semibold" : "text-editorial-muted hover:text-editorial-black"
            }`}
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight tracking-tight">Deals</span>
          </button>

          {/* Earnings Tab */}
          <button
            onClick={() => {
              setActiveTab("EARNINGS");
              playNeutralTone();
            }}
            aria-label="Earnings"
            title="Earnings"
            aria-current={activeTab === "EARNINGS" ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === "EARNINGS" ? "text-contour-red font-semibold" : "text-editorial-muted hover:text-editorial-black"
            }`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight tracking-tight">Earnings</span>
          </button>
        </div>
      </footer>

      {/* ================= MODAL: INTAKE DRAWER (FAB) ================= */}
      {intakeDrawer !== "NONE" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="field-capture-drawer bg-white border border-editorial-border w-full max-w-md p-5 space-y-4 text-editorial-black max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom-6 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-100 text-contour-red flex items-center justify-center font-bold text-xs border border-editorial-border">
                  +
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-editorial-black">Field Intake & Mandate Capture</h3>
                  <p className="text-[10px] text-editorial-muted font-mono">Offline-first local SQLite sync</p>
                </div>
              </div>
              <button
                onClick={() => setIntakeDrawer("NONE")}
                className="p-1.5 text-editorial-muted hover:text-editorial-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Intake Mode Switcher */}
            <div className={`grid ${isManagerOrAdmin ? "grid-cols-3" : "grid-cols-2"} gap-1 bg-neutral-100 p-1 border border-editorial-border text-xs`}>
              {isManagerOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCaptureError(null);
                    setIntakeDrawer("PROPERTY");
                  }}
                  className={`py-1.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                    intakeDrawer === "PROPERTY" ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Listing</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCaptureError(null);
                  setIntakeDrawer("CLIENT");
                }}
                className={`py-1.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  intakeDrawer === "CLIENT" ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Client</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaptureError(null);
                  setIntakeDrawer("OFFER");
                }}
                className={`py-1.5 font-heading text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  intakeDrawer === "OFFER" ? "bg-editorial-black text-white" : "text-editorial-muted hover:text-editorial-black"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Offer</span>
              </button>
            </div>

            <div className="field-capture-note flex items-start gap-2 border border-editorial-border bg-neutral-50 p-3 text-[11px] leading-relaxed text-editorial-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-contour-red" />
              <span>{isOnline ? "This capture will sync to the agency workspace after you save it." : "You are offline. Save confidently; this capture will remain in the local field outbox until the connection returns."}</span>
            </div>

            {captureError && (
              <div role="alert" className="border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-700">
                {captureError}
              </div>
            )}

            {/* 1. Property Intake Form */}
            {intakeDrawer === "PROPERTY" && isManagerOrAdmin && (
              <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">Property Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern 4-Bed Standalone Villa"
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none focus:border-editorial-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-editorial-black font-heading font-semibold text-xs">Suburb *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomAgentSuburb;
                          setIsCustomAgentSuburb(next);
                          if (next) setNewPropSuburb("");
                        }}
                        className="text-[10px] font-heading font-semibold text-contour-red hover:underline"
                      >
                        {isCustomAgentSuburb ? "← List" : "✍️ Type"}
                      </button>
                    </div>
                    {isCustomAgentSuburb ? (
                      <input
                        type="text"
                        required
                        placeholder="e.g. Avondale, Prospect..."
                        value={newPropSuburb}
                        onChange={(e) => setNewPropSuburb(e.target.value)}
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                      />
                    ) : (
                      <select
                        value={newPropSuburb}
                        onChange={(e) => {
                          if (e.target.value === "__CUSTOM__") {
                            setIsCustomAgentSuburb(true);
                            setNewPropSuburb("");
                          } else {
                            setNewPropSuburb(e.target.value);
                          }
                        }}
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                      >
                        {dynamicSuburbs.filter((s) => s !== "ALL").map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="__CUSTOM__">✍️ Type Custom Area...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-editorial-black font-heading font-semibold mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={newPropBeds}
                      onChange={(e) => setNewPropBeds(e.target.value)}
                      className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-editorial-black font-heading font-semibold mb-1">Price</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3500000"
                      value={newPropPrice}
                      onChange={(e) => setNewPropPrice(e.target.value)}
                      className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-editorial-black font-heading font-semibold mb-1">Currency</label>
                    <select
                      value={newPropCurrency}
                      onChange={(e) => setNewPropCurrency(e.target.value as any)}
                      className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                    >
                      <option value="ZMW">ZMW (K)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-editorial-black font-heading font-semibold text-xs">
                    Listing Photos (Upload File / Camera)
                  </label>
                  <PropertyImageUploader
                    photos={newPropPhotos}
                    featuredPhoto={newPropFeaturedPhoto}
                    onChange={(updated, cover) => {
                      setNewPropPhotos(updated);
                      setNewPropFeaturedPhoto(cover);
                    }}
                    theme="light"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-xs uppercase tracking-wider transition-all mt-2 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Mandate to Field Outbox</span>
                </button>
              </form>
            )}

            {/* 2. Client Intake Form */}
            {intakeDrawer === "CLIENT" && (
              <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    Client Full Name <span className="text-contour-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mwamba & Sons Holdings"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none focus:border-editorial-black"
                  />
                </div>

                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    WhatsApp Phone Number <span className="text-contour-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +260 97 999 8888"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                  />
                </div>

                {/* Optional Search Criteria & Request Accordion/Box */}
                <div className="border border-editorial-border p-3 bg-neutral-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-editorial-black text-xs uppercase tracking-wider">
                      Search Criteria & Matchmaker (Optional)
                    </span>
                    <span className="text-[10px] text-editorial-muted font-mono">Optional</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Looking For</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setNewClientLookingFor("FOR_SALE")}
                          className={`py-1 text-center font-heading font-semibold text-[11px] uppercase transition-colors border ${
                            newClientLookingFor === "FOR_SALE"
                              ? "bg-editorial-black text-white border-editorial-black"
                              : "bg-white text-editorial-muted border-editorial-border"
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewClientLookingFor("FOR_RENT")}
                          className={`py-1 text-center font-heading font-semibold text-[11px] uppercase transition-colors border ${
                            newClientLookingFor === "FOR_RENT"
                              ? "bg-editorial-black text-white border-editorial-black"
                              : "bg-white text-editorial-muted border-editorial-border"
                          }`}
                        >
                          Rent
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Target Zone</label>
                      <select
                        value={newClientSuburb}
                        onChange={(e) => setNewClientSuburb(e.target.value)}
                        className="w-full bg-white border border-editorial-border px-2.5 py-1.5 text-editorial-black focus:outline-none"
                      >
                        {dynamicSuburbs.filter((s) => s !== "ALL").map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Property Type</label>
                      <select
                        value={newClientPropertyType}
                        onChange={(e) => setNewClientPropertyType(e.target.value)}
                        className="w-full bg-white border border-editorial-border px-2.5 py-1.5 text-editorial-black focus:outline-none"
                      >
                        <option value="">Any Type</option>
                        <option value="STANDALONE_HOUSE">Standalone House</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="COMMERCIAL_OFFICE">Commercial Office</option>
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="VACANT_LAND_PLOT">Vacant Land Plot</option>
                        <option value="FARM_AGRICULTURAL">Farm / Agricultural</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Min Bedrooms</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={newClientMinBeds}
                        onChange={(e) => setNewClientMinBeds(e.target.value)}
                        className="w-full bg-white border border-editorial-border px-2.5 py-1.5 text-editorial-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Budget Max</label>
                      <input
                        type="number"
                        placeholder="e.g. 4000000"
                        value={newClientBudget}
                        onChange={(e) => setNewClientBudget(e.target.value)}
                        className="w-full bg-white border border-editorial-border px-2.5 py-1.5 text-editorial-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">Currency</label>
                      <select
                        value={newClientCurrency}
                        onChange={(e) => setNewClientCurrency(e.target.value as any)}
                        className="w-full bg-white border border-editorial-border px-2.5 py-1.5 text-editorial-black focus:outline-none"
                      >
                        <option value="ZMW">ZMW (K)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-editorial-muted font-heading font-medium text-[11px] mb-1">
                      Specific Client Requirements / Features
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 4-bed standalone with swimming pool, borehole, large garden for pets, near American School..."
                      value={newClientRequestNotes}
                      onChange={(e) => setNewClientRequestNotes(e.target.value)}
                      className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none resize-none placeholder:text-editorial-muted/60"
                    />
                  </div>
                </div>

                {/* Optional Immediate Offer Section */}
                <div className="border border-editorial-border bg-neutral-50/50 p-3 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newClientAttachOffer}
                      onChange={(e) => setNewClientAttachOffer(e.target.checked)}
                      className="w-4 h-4 text-editorial-black rounded border-editorial-border focus:ring-0"
                    />
                    <span className="font-heading font-semibold text-editorial-black text-xs">
                      Attach an Immediate Offer to a House (Optional)
                    </span>
                  </label>

                  {newClientAttachOffer && (
                    <div className="space-y-2.5 pt-2 border-t border-editorial-border animate-in fade-in-50 duration-200">
                      <div>
                        <label className="block text-editorial-black font-heading font-semibold mb-1">
                          Select House / Mandate <span className="text-contour-red">*</span>
                        </label>
                        <select
                          value={newClientOfferPropertyId}
                          onChange={(e) => {
                            setNewClientOfferPropertyId(e.target.value);
                            const p = displayProperties.find((item: any) => item.id === e.target.value);
                            if (p && !newClientOfferAmount) {
                              setNewClientOfferAmount((p.price || p.askingPrice || p.rentalPrice || "").toString());
                            }
                          }}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                        >
                          <option value="">Choose Mandate...</option>
                          {displayProperties.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.suburb}) — {formatCurrency(Number(p.price || p.askingPrice || p.rentalPrice || 0), p.currency || "ZMW")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-editorial-black font-heading font-semibold mb-1">
                          Offer Amount <span className="text-contour-red">*</span>
                        </label>
                        <input
                          type="number"
                          required={newClientAttachOffer}
                          placeholder="e.g. 3200000"
                          value={newClientOfferAmount}
                          onChange={(e) => setNewClientOfferAmount(e.target.value)}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                        />
                        {Number(newClientOfferAmount) > 0 && (
                          <p className="mt-1 text-[11px] font-mono text-contour-red font-semibold">
                            Est. 50% Agent Split: {formatCurrency(
                              Number(newClientOfferAmount) * 0.025,
                              displayProperties.find((p: any) => p.id === newClientOfferPropertyId)?.currency || newClientCurrency
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 p-2.5 border border-editorial-border text-[11px] text-editorial-black flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-contour-red" />
                  <span>30-Day Anti-Poaching Lock automatically activated upon save.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-xs uppercase tracking-wider transition-all mt-2 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{newClientAttachOffer ? "Lock Client & Submit Offer to Pipeline" : "Lock & Register Client"}</span>
                </button>
              </form>
            )}

            {/* 3. Offer Intake Form */}
            {intakeDrawer === "OFFER" && (
              <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    Select Mandate <span className="text-contour-red">*</span>
                  </label>
                  <select
                    value={offerPropertyId}
                    onChange={(e) => {
                      setOfferPropertyId(e.target.value);
                      const p = displayProperties.find((item: any) => item.id === e.target.value);
                      if (p && !offerAmount) {
                        setOfferAmount((p.price || p.askingPrice || p.rentalPrice || "").toString());
                      }
                    }}
                    className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                  >
                    <option value="">Choose Mandate...</option>
                    {displayProperties.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.suburb}) — {formatCurrency(Number(p.price || p.askingPrice || p.rentalPrice || 0), p.currency || "ZMW")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Selection: Choose Existing or Register New */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-editorial-black font-heading font-semibold">
                      Buyer / Client <span className="text-contour-red">*</span>
                    </label>
                    <div className="flex items-center gap-1 text-[10px] font-heading font-semibold uppercase">
                      <button
                        type="button"
                        onClick={() => setOfferClientMode("EXISTING")}
                        className={`px-2 py-0.5 border transition-colors ${
                          offerClientMode === "EXISTING"
                            ? "bg-editorial-black text-white border-editorial-black"
                            : "bg-white text-editorial-muted border-editorial-border hover:text-editorial-black"
                        }`}
                      >
                        Registered Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferClientMode("NEW")}
                        className={`px-2 py-0.5 border transition-colors ${
                          offerClientMode === "NEW"
                            ? "bg-editorial-black text-white border-editorial-black"
                            : "bg-white text-editorial-muted border-editorial-border hover:text-editorial-black"
                        }`}
                      >
                        + New Client
                      </button>
                    </div>
                  </div>

                  {offerClientMode === "EXISTING" ? (
                    <div>
                      <select
                        value={selectedExistingClientId}
                        onChange={(e) => {
                          setSelectedExistingClientId(e.target.value);
                          const found = (clients || []).find((c: any) => c.id === e.target.value);
                          if (found) {
                            setOfferClientName(found.name);
                            setOfferClientPhone(found.phone);
                          }
                        }}
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                      >
                        <option value="">Choose Registered Client...</option>
                        {(clients || []).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                      {(!clients || clients.length === 0) && (
                        <p className="mt-1 text-[11px] text-editorial-muted">
                          No registered clients found. Click <strong>+ New Client</strong> above to add one.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-neutral-50 p-3 border border-editorial-border">
                      <div>
                        <label className="block text-editorial-black font-heading font-semibold mb-1">
                          Client Full Name <span className="text-contour-red">*</span>
                        </label>
                        <input
                          type="text"
                          required={offerClientMode === "NEW"}
                          placeholder="e.g. Nchimunya Mweene"
                          value={offerClientName}
                          onChange={(e) => setOfferClientName(e.target.value)}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-editorial-black font-heading font-semibold mb-1">
                          WhatsApp Phone Number <span className="text-contour-red">*</span>
                        </label>
                        <input
                          type="text"
                          required={offerClientMode === "NEW"}
                          placeholder="e.g. +260 97 999 8888"
                          value={offerClientPhone}
                          onChange={(e) => setOfferClientPhone(e.target.value)}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-editorial-muted">
                        This client will automatically be protected under your 30-day anti-poaching registry.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    Offer Amount <span className="text-contour-red">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3200000"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full bg-white border border-editorial-border px-3 py-2 text-editorial-black focus:outline-none"
                  />
                  {Number(offerAmount) > 0 && (
                    <p className="mt-1 text-[11px] font-mono text-contour-red font-semibold">
                      Est. 50% Agent Split: {formatCurrency(
                        Number(offerAmount) * 0.025,
                        displayProperties.find((p: any) => p.id === offerPropertyId)?.currency || "ZMW"
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-xs uppercase tracking-wider transition-all mt-2 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Offer to Deal Pipeline</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= SHEET: PROPERTY DETAIL ================= */}
      {selectedPropertyDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg space-y-5 border border-editorial-border bg-white p-5 text-editorial-black shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-editorial-border pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-contour-red font-bold">
                  {selectedPropertyDetail.suburb || "Lusaka"} · {selectedPropertyDetail.listingType === "FOR_RENT" ? "For rent" : "For sale"}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold leading-tight text-editorial-black">
                  {selectedPropertyDetail.title}
                </h2>
                <p className="mt-2 font-mono text-xs font-bold text-editorial-black">
                  {formatCurrency(Number(selectedPropertyDetail.price || selectedPropertyDetail.askingPrice || selectedPropertyDetail.rentalPrice || 0), selectedPropertyDetail.currency || "ZMW")}
                  <span className="ml-2 text-[10px] uppercase font-normal text-editorial-muted">
                    {selectedPropertyDetail.listingType === "FOR_RENT" ? "/ month" : "asking price"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPropertyDetail(null)}
                aria-label="Close mandate record"
                className="shrink-0 border border-editorial-border p-2 text-editorial-muted hover:border-editorial-black hover:text-editorial-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Bedrooms", value: selectedPropertyDetail.bedrooms || 0 },
                { label: "Bathrooms", value: selectedPropertyDetail.bathrooms || 0 },
                { label: "Plot sqm", value: selectedPropertyDetail.plotSizeSqm || "—" },
              ].map((item) => (
                <div key={item.label} className="border border-editorial-border bg-neutral-50 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-editorial-muted">{item.label}</p>
                  <p className="mt-1 font-heading text-lg font-bold text-editorial-black">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-y border-editorial-border py-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-editorial-muted"><ShieldCheck className="h-4 w-4 text-contour-red" /> Title status</span>
                <span className="font-mono font-bold text-editorial-black">Verified reference</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-editorial-muted"><Lock className="h-4 w-4 text-contour-red" /> Privacy</span>
                <span className="font-mono font-bold text-editorial-black">Landlord PII masked</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-editorial-muted"><Navigation className="h-4 w-4 text-contour-red" /> Coordinates</span>
                <span className="font-mono text-[10px] text-editorial-muted">
                  {Number(selectedPropertyDetail.latitude || 0).toFixed(4)}, {Number(selectedPropertyDetail.longitude || 0).toFixed(4)}
                </span>
              </div>
            </div>

            {/* Photos & Direct Mobile Upload */}
            {(() => {
              const detailPhotos = Array.isArray(selectedPropertyDetail.photos) && selectedPropertyDetail.photos.length > 0
                ? selectedPropertyDetail.photos
                : selectedPropertyDetail.featuredPhoto
                ? [selectedPropertyDetail.featuredPhoto]
                : [];
              const canAgentUpload = isManagerOrAdmin ||
                selectedPropertyDetail.assignedAgentId === currentAgent.id ||
                selectedPropertyDetail.createdById === currentAgent.id ||
                selectedPropertyDetail.assignedAgent?.id === currentAgent.id;

              return (
                <div className="space-y-2 border-b border-editorial-border pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-contour-red" />
                      <span>Photos ({detailPhotos.length})</span>
                    </span>
                    {canAgentUpload && (
                      <button
                        type="button"
                        onClick={() => setIsAddingPhotosToDetail((prev) => !prev)}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-contour-red hover:underline flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isAddingPhotosToDetail ? "Close Uploader" : "+ Add Photos"}</span>
                      </button>
                    )}
                  </div>

                  {detailPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {detailPhotos.map((url: string, idx: number) => (
                        <div key={idx} className="relative w-20 h-16 border border-editorial-border shrink-0 bg-neutral-100">
                          <Image src={url} alt="" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {isAddingPhotosToDetail && canAgentUpload && (
                    <div className="p-3 bg-neutral-50 border border-editorial-border">
                      <PropertyImageUploader
                        photos={detailPhotos}
                        featuredPhoto={selectedPropertyDetail.featuredPhoto}
                        propertyId={selectedPropertyDetail.id}
                        onChange={(updatedPhotos, updatedCover) => {
                          setSelectedPropertyDetail({
                            ...selectedPropertyDetail,
                            photos: updatedPhotos,
                            featuredPhoto: updatedCover,
                          });
                          syncData();
                        }}
                        theme="light"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 1-Tap Swiss Visual Flyer Button */}
            <button
              onClick={() => {
                setFlyerModalProperty(selectedPropertyDetail);
              }}
              className="w-full py-3 px-4 bg-[#fa3600] hover:bg-[#d92f00] text-white font-heading font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors mb-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Swiss Editorial Flyer</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={(e) => handleShareClientLink(selectedPropertyDetail, e)}
                title="Copy Client Public Link"
                className="flex items-center justify-center gap-1.5 border border-editorial-border bg-white hover:bg-neutral-50 px-2.5 py-3 text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black transition-colors"
              >
                {copiedPublicLinkId === selectedPropertyDetail.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-contour-red" />
                    <span>Link</span>
                  </>
                )}
              </button>
              <button
                onClick={() => copyWhatsAppFlyer(selectedPropertyDetail)}
                className="field-primary-action flex items-center justify-center gap-1.5 border border-editorial-border bg-white hover:bg-neutral-50 px-2.5 py-3 text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-contour-red" />
                <span>{copiedId === selectedPropertyDetail.id ? "Copied" : "Pitch"}</span>
              </button>
              <button
                onClick={() => {
                  setMatchedProperty(selectedPropertyDetail);
                  setSelectedPropertyDetail(null);
                }}
                className="flex items-center justify-center gap-1.5 bg-editorial-black hover:bg-contour-red px-2.5 py-3 text-xs font-heading font-semibold uppercase tracking-wider text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Buyers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MATCH REGISTERED BUYERS ================= */}
      {matchedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-editorial-border w-full max-w-md p-5 space-y-4 text-editorial-black max-h-[85vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-contour-red uppercase font-bold">Reverse Matchmaker</span>
                <h3 className="text-sm font-heading font-semibold text-editorial-black mt-0.5">{matchedProperty.title}</h3>
              </div>
              <button
                onClick={() => setMatchedProperty(null)}
                className="p-1.5 text-editorial-muted hover:text-editorial-black rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-editorial-muted">
              Matched <span className="text-editorial-black font-bold font-mono">{clients.length} registered clients</span> with active budgets in {matchedProperty.suburb || "Lusaka"}:
            </p>

            <div className="space-y-2.5">
              {clients.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-neutral-50 p-3 border border-editorial-border flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-heading font-semibold text-editorial-black">{c.name}</div>
                    <div className="text-[11px] text-editorial-muted font-mono">{c.budget} • {c.preferredArea}</div>
                  </div>
                  <a
                    href={`https://wa.me/${formatWhatsAppDigits(c.phone)}?text=${encodeURIComponent(generateWhatsAppFlyer(matchedProperty))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Pitch</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIGITAL COMMISSION SLIP ================= */}
      {selectedCommissionSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-editorial-border w-full max-w-md p-6 space-y-4 text-editorial-black animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-editorial-black text-white flex items-center justify-center font-bold font-heading text-xs">
                  C
                </div>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-editorial-black">Commission Payout Slip</h3>
                  <p className="text-[10px] text-editorial-muted font-mono">CONTOUR VOUCHER #{selectedCommissionSlip.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommissionSlip(null)}
                className="p-1.5 text-editorial-muted hover:text-editorial-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-50 p-4 border border-editorial-border space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-editorial-muted">Mandate:</span>
                <span className="font-heading font-semibold text-editorial-black">{selectedCommissionSlip.property}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-editorial-muted">Settlement Date:</span>
                <span className="font-mono text-editorial-black">{selectedCommissionSlip.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-editorial-muted">Total Agency Commission (5%):</span>
                <span className="font-mono text-editorial-black">{selectedCommissionSlip.grossCommission}</span>
              </div>
              <div className="flex justify-between border-t border-editorial-border pt-2 text-sm font-bold">
                <span className="text-editorial-black">Agent Split (50%):</span>
                <span className="font-mono text-contour-red">{selectedCommissionSlip.agentSplit}</span>
              </div>
            </div>

            <div className="bg-neutral-100 p-3 border border-editorial-border flex items-center gap-2 text-[11px] text-editorial-black">
              <CheckCircle2 className="w-4 h-4 text-contour-red shrink-0" />
              <span>Settlement verified and cleared to agent bank account.</span>
            </div>

            <button
              onClick={() => {
                setSelectedCommissionSlip(null);
                playSuccessTone();
              }}
              className="w-full py-2.5 bg-editorial-black hover:bg-contour-red text-white font-heading font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}



      {/* ================= MODAL: AUTHENTICATED PROFILE ================= */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-editorial-border w-full max-w-md p-5 space-y-4 text-editorial-black animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-contour-red" />
                <h3 className="text-sm font-bold">Signed-in profile</h3>
              </div>
              <button
                onClick={() => setIsPersonaModalOpen(false)}
                className="p-1.5 text-editorial-muted hover:text-editorial-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border border-editorial-border bg-neutral-50 p-3">
                <p className="font-bold">{session.user.name}</p>
                <p className="mt-1 text-editorial-muted">{session.user.email}</p>
              </div>
              <p className="leading-5 text-editorial-muted">Your access is tied to your authenticated Contour organization membership. Contact an organization admin to change your role or workspace access.</p>
            </div>

            <div className="flex items-center justify-between border-t border-editorial-border pt-3">
              <Link href="/dashboard/settings?tab=ACCOUNT" className="text-xs font-bold uppercase tracking-wider text-contour-red">Account settings</Link>
              <button onClick={() => setIsPersonaModalOpen(false)} className="bg-editorial-black px-4 py-2 text-xs font-bold text-white">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CLIENT PROFILE (Issue 9) ================= */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-editorial-border w-full max-w-md p-5 space-y-4 text-editorial-black animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-editorial-border pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-contour-red" />
                <h3 className="text-sm font-heading font-bold uppercase tracking-wider">Edit Client Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1.5 text-editorial-muted hover:text-editorial-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editClientError && (
              <div role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {editClientError}
              </div>
            )}

            <form onSubmit={handleSaveClientEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-editorial-black font-heading font-semibold mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="e.g. Kondwani Phiri"
                  className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                />
              </div>

              <div>
                <label className="block text-editorial-black font-heading font-semibold mb-1">
                  Phone Number (WhatsApp Ready) *
                </label>
                <input
                  type="text"
                  required
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  placeholder="e.g. 0977 123 456 or +260 977..."
                  className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                />
                <p className="mt-1 text-[10px] text-editorial-muted font-mono">
                  Normalized automatically with Zambia country code (+260) for 1-click WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    Budget Max
                  </label>
                  <input
                    type="number"
                    value={editClientBudget}
                    onChange={(e) => setEditClientBudget(e.target.value)}
                    placeholder="e.g. 2500000"
                    className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                  />
                </div>
                <div>
                  <label className="block text-editorial-black font-heading font-semibold mb-1">
                    Currency
                  </label>
                  <select
                    value={editClientCurrency}
                    onChange={(e) => setEditClientCurrency(e.target.value as "ZMW" | "USD")}
                    className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                  >
                    <option value="ZMW">ZMW (Kwacha)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-editorial-black font-heading font-semibold">
                    Preferred Area / Suburb
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomEditSuburb(!isCustomEditSuburb);
                      if (isCustomEditSuburb) setEditClientSuburb("Kabulonga");
                    }}
                    className="text-[10px] font-mono text-contour-red hover:underline"
                  >
                    {isCustomEditSuburb ? "← Choose from list" : "✍️ Type area manually"}
                  </button>
                </div>
                {isCustomEditSuburb ? (
                  <input
                    type="text"
                    value={editClientSuburb}
                    onChange={(e) => setEditClientSuburb(e.target.value)}
                    placeholder="Type custom suburb name..."
                    className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                  />
                ) : (
                  <select
                    value={editClientSuburb}
                    onChange={(e) => setEditClientSuburb(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black"
                  >
                    {dynamicSuburbs.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-editorial-black font-heading font-semibold mb-1">
                  Agent Notes / Requirements
                </label>
                <textarea
                  rows={3}
                  value={editClientNotes}
                  onChange={(e) => setEditClientNotes(e.target.value)}
                  placeholder="e.g. Looking for 4-bed standalone with swimming pool in Kabulonga or Woodlands."
                  className="w-full p-2.5 bg-neutral-50 border border-editorial-border font-mono text-xs focus:bg-white focus:outline-hidden focus:border-editorial-black resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-editorial-border">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  disabled={isSavingClientEdit}
                  className="px-4 py-2 border border-editorial-border text-editorial-black font-heading text-xs font-semibold uppercase tracking-wider hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingClientEdit}
                  className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white font-heading text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isSavingClientEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swiss Editorial Social Flyer Generator Modal */}
      <SocialMediaCardGeneratorModal
        isOpen={!!flyerModalProperty}
        onClose={() => setFlyerModalProperty(null)}
        property={flyerModalProperty}
      />
    </div>
  );
}
