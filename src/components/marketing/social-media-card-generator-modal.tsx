"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Download,
  Share2,
  Check,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Phone,
  MessageSquare,
  Globe,
  Instagram,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  Palette,
  Home,
  KeyRound,
  DollarSign,
  Compass,
  Edit3,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Square,
  RectangleVertical,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import html2canvas from "html2canvas";
import { formatCurrency } from "@/lib/utils";
import { getAgencySettings, AgencySettings } from "@/lib/settings/agency-settings";
import { publicPropertyPath } from "@/lib/public-property";
import { resolveFlyerContact, FlyerContactSource } from "./flyer-contact";

async function waitForFlyerAssets(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }
      if (image.complete && image.naturalWidth > 0 && typeof image.decode === "function") {
        try {
          await image.decode();
        } catch {
          // The browser may decode an image between the load event and decode().
        }
      }
    }),
  );
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
}

export type FlyerTemplate = "SWISS_LIGHT" | "SWISS_DARK" | "NAVY_EDITORIAL" | "GOLD_CLASSIC";
export type FlyerAspectRatio = "4:5" | "1:1" | "9:16";

type SocialMediaCardGeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: any;
};

export default function SocialMediaCardGeneratorModal({
  isOpen,
  onClose,
  property,
}: SocialMediaCardGeneratorModalProps) {
  const [template, setTemplate] = useState<FlyerTemplate>("SWISS_LIGHT");
  const [aspectRatio, setAspectRatio] = useState<FlyerAspectRatio>("4:5");
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null);
  const [contactSource, setContactSource] = useState<FlyerContactSource>("agent");
  const [logoFailed, setLogoFailed] = useState(false);
  const [imageSlots, setImageSlots] = useState({ hero: 0, secondaryOne: 1, secondaryTwo: 2, secondaryThree: 3, secondaryFour: 4 });
  const [subImageCount, setSubImageCount] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Editable Narrative State derived directly from property.description
  const [flyerCopy, setFlyerCopy] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && property) {
      setAgencySettings(getAgencySettings());
      setContactSource("agent");
      setLogoFailed(false);
      setImageSlots({ hero: 0, secondaryOne: 1, secondaryTwo: 2, secondaryThree: 3, secondaryFour: 4 });
      setSubImageCount(2);
      void fetch("/api/organization/profile")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const organization = data?.organization;
          if (!organization) return;
          setAgencySettings((current) => ({
            ...(current || getAgencySettings()),
            agencyName: organization.name || current?.agencyName || "",
            logoUrl: organization.logo || current?.logoUrl || "",
            phone: organization.profile?.primaryPhone || current?.phone || "",
            whatsApp: organization.profile?.primaryPhone || current?.whatsApp || "",
            email: organization.profile?.primaryEmail || current?.email || "",
            officeAddress: organization.profile?.primaryOfficeAddress || current?.officeAddress || "",
          }));
        })
        .catch(() => undefined);

      // Use exact property description without making things up
      const initialDescription = property.description
        ? property.description
        : `${property.title} located in ${property.suburb}, Lusaka.${
            property.landmarkDirections ? ` Driving directions: ${property.landmarkDirections}.` : ""
          } Features ${property.bedrooms || 0} bedrooms, ${property.bathrooms || 0} bathrooms, on a ${
            property.plotSizeSqm ? `${property.plotSizeSqm} m²` : "prime"
          } plot.`;
      setFlyerCopy(initialDescription);
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const isSale = property.listingType !== "FOR_RENT";
  const price = isSale
    ? property.askingPrice || 3500000
    : property.rentalPrice || (property.askingPrice ? Math.round(property.askingPrice / 150) : 2500);
  const currency = property.currency || "ZMW";
  const assignedAgent = property.assignedAgent || {
    name: property.assignedAgentName,
    phone: property.assignedAgentPhone,
    email: property.assignedAgentEmail,
    instagram: property.assignedAgentInstagram,
    website: property.assignedAgentWebsite,
  };
  const flyerContact = resolveFlyerContact("agent", assignedAgent, {
    name: agencySettings?.agencyName,
    phone: agencySettings?.whatsApp || agencySettings?.phone,
    email: agencySettings?.email,
    instagram: agencySettings?.instagramHandle,
    website: agencySettings?.website,
  });
  const activeContact = resolveFlyerContact(
    contactSource,
    assignedAgent,
    {
      name: agencySettings?.agencyName,
      phone: agencySettings?.whatsApp || agencySettings?.phone,
      email: agencySettings?.email,
      instagram: agencySettings?.instagramHandle,
      website: agencySettings?.website,
    },
  );
  const logoUrl = agencySettings?.logoUrl?.trim() || "";

  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : [
        property.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
      ];

  const heroPhoto = photos[imageSlots.hero] || photos[0];
  const fallbackInteriorPhotos = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
  ];
  const subImageSlots = ["secondaryOne", "secondaryTwo", "secondaryThree", "secondaryFour"] as const;
  const subImages = subImageSlots.slice(0, subImageCount).map((slot, index) => ({
    src: photos[imageSlots[slot]] || photos[index + 1] || fallbackInteriorPhotos[index],
    slot,
  }));

  // Dynamic feature bullet points derived strictly from property data
  const homeFeatures: string[] = property.features && property.features.length > 0
    ? property.features
    : [
        property.bedrooms ? `${property.bedrooms} Bedrooms` : "Spacious Living Area",
        property.bathrooms ? `${property.bathrooms} Bathrooms` : "Modern Bathrooms",
        property.plotSizeSqm ? `${property.plotSizeSqm} m² Yard Size` : `Prime ${property.suburb} Location`,
        property.ownershipType === "COMPANY_OWNED" ? "Company-Owned Asset" : "Sole Agency Mandate",
        property.landmarkDirections ? property.landmarkDirections : `${property.suburb}, Lusaka`,
      ];

  const isDark = template === "SWISS_DARK" || template === "NAVY_EDITORIAL";

  // Real-Photo PNG Generation via html2canvas
  const handleDownloadCard = async () => {
    console.log("[FlyerModal] handleDownloadCard triggered, hasCardRef:", !!cardRef.current);
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      // Wait for every image/font used by the flyer. A fixed delay is not enough
      // for signed storage URLs or large property photos.
      await waitForFlyerAssets(cardRef.current);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High-DPI 2x social media export
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? "#282828" : "#ffffff",
        logging: false,
        imageTimeout: 5000,
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      console.log("[FlyerModal] html2canvas finished successfully, canvas width:", canvas.width);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${(agencySettings?.agencyName || "agency").toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${property.slug || "listing"}_${aspectRatio.replace(":", "x")}_flyer.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      console.log("[FlyerModal] setDownloadSuccess true");
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error("[FlyerModal] HTML2Canvas compilation failed:", err?.message || err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2300] bg-[#282828]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white border border-[#e0e0e0] flex flex-col overflow-hidden w-full max-w-[1500px] max-h-[96vh] rounded-none shadow-none">
        {/* Modal Header: Swiss Editorial Rule Grid */}
        <div className="px-5 py-3.5 bg-white border-b border-[#e0e0e0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-[#fa3600] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#fa3600] font-bold uppercase tracking-widest">
                  [MKTG-01]
                </span>
                <h3 className="font-heading font-bold text-base text-[#282828] uppercase tracking-tight">
                  Social Media Marketing Flyer Generator
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#fff5f3] text-[#fa3600] border border-[#fa3600]/30 uppercase">
                  Swiss Editorial
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#6b6b6b] mt-0.5">
                Authentic listing specs compiled with 1px architectural grid rules &amp; Contour Red accents.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-none border border-[#e0e0e0] bg-white text-[#282828] hover:bg-[#282828] hover:text-white transition-all shadow-xs"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Controls (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-r border-[#e0e0e0] overflow-y-auto space-y-4 bg-white">
            {/* 1. Format / Aspect Ratio Switcher */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block mb-1.5">
                2. Social Media Format &amp; Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio("4:5")}
                  className={`py-2 px-2 text-[11px] font-heading font-semibold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    aspectRatio === "4:5"
                      ? "bg-[#282828] text-white border-[#282828]"
                      : "bg-white text-[#282828] border-[#e0e0e0] hover:bg-[#fff5f3]"
                  }`}
                >
                  <RectangleVertical className="w-3.5 h-3.5 text-[#fa3600]" />
                  <span>4:5</span>
                  <span className="text-[8.5px] font-mono text-[#9b9b9b]">Brochure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio("1:1")}
                  className={`py-2 px-2 text-[11px] font-heading font-semibold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    aspectRatio === "1:1"
                      ? "bg-[#282828] text-white border-[#282828]"
                      : "bg-white text-[#282828] border-[#e0e0e0] hover:bg-[#fff5f3]"
                  }`}
                >
                  <Square className="w-3.5 h-3.5 text-[#fa3600]" />
                  <span>1:1</span>
                  <span className="text-[8.5px] font-mono text-[#9b9b9b]">Square</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  className={`py-2 px-2 text-[11px] font-heading font-semibold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    aspectRatio === "9:16"
                      ? "bg-[#282828] text-white border-[#282828]"
                      : "bg-white text-[#282828] border-[#e0e0e0] hover:bg-[#fff5f3]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#fa3600]" />
                  <span>9:16</span>
                  <span className="text-[8.5px] font-mono text-[#9b9b9b]">Story</span>
                </button>
              </div>
            </div>

            {/* 2. Design Style Switcher */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block mb-1.5">
                3. Choose Flyer Design Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate("SWISS_LIGHT")}
                  className={`p-2.5 text-left border transition-all flex flex-col justify-between ${
                    template === "SWISS_LIGHT" || template === "GOLD_CLASSIC"
                      ? "bg-[#fff5f3] border-[#fa3600] text-[#282828]"
                      : "bg-white border-[#e0e0e0] text-[#282828] hover:border-[#9b9b9b]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider">
                      Swiss Light Grid
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fa3600]" />
                  </div>
                  <span className="text-[10px] font-mono text-[#6b6b6b] mt-1">
                    Stark white canvas, ruled lines &amp; red sun badge.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate("SWISS_DARK")}
                  className={`p-2.5 text-left border transition-all flex flex-col justify-between ${
                    template === "SWISS_DARK" || template === "NAVY_EDITORIAL"
                      ? "bg-[#282828] border-[#282828] text-white"
                      : "bg-white border-[#e0e0e0] text-[#282828] hover:border-[#9b9b9b]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase tracking-wider">
                      Modern Navy Editorial
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fa3600]" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-300 mt-1">
                    Charcoal canvas with high-contrast typography.
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Image slots */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block mb-1.5">
                3. Choose Flyer Images ({photos.length} available)
              </label>
              <div className="space-y-2">
                {([
                  ["hero", "Main image"],
                  ["secondaryOne", "Sub-image 1"],
                  ["secondaryTwo", "Sub-image 2"],
                  ["secondaryThree", "Sub-image 3"],
                  ["secondaryFour", "Sub-image 4"],
                ] as const).map(([slot, label]) => (
                  <div key={slot} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[10px] font-mono font-bold uppercase text-[#6b6b6b]">{label}</span>
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {photos.map((photo: string, idx: number) => (
                        <button key={idx} type="button" aria-label={`${label}: image ${idx + 1}`} onClick={() => setImageSlots((current) => ({ ...current, [slot]: idx }))} className={`relative h-12 border overflow-hidden ${imageSlots[slot] === idx ? "border-[#fa3600] ring-2 ring-[#fa3600]" : "border-[#e0e0e0] opacity-75 hover:opacity-100"}`}>
                          <img src={photo} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" />
                          {imageSlots[slot] === idx && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#fa3600] text-white flex items-center justify-center"><Check className="w-2.5 h-2.5" /></span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#e0e0e0] pt-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#6b6b6b]">Sub-images on flyer</span>
                <select
                  value={subImageCount}
                  onChange={(event) => setSubImageCount(Number(event.target.value))}
                  className="border border-[#e0e0e0] bg-white px-2 py-1 text-[10px] font-mono text-[#282828] focus:border-[#fa3600] focus:outline-hidden"
                  aria-label="Number of sub-images on flyer"
                >
                  {[0, 1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Exact Property Description / Editable Flyer Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828]">
                  4. Flyer Narrative Copy
                </label>
                <button
                  type="button"
                  onClick={() => setFlyerCopy(property.description || "")}
                  className="text-[10px] font-mono text-[#fa3600] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
              <textarea
                value={flyerCopy}
                onChange={(e) => setFlyerCopy(e.target.value)}
                placeholder="Listing narrative..."
                rows={3}
                className="w-full p-2.5 text-xs font-mono text-[#282828] bg-white border border-[#e0e0e0] focus:border-[#fa3600] focus:outline-hidden transition-all"
              />
              <span className="text-[9.5px] font-mono text-[#6b6b6b] mt-1 block">
                Sourced directly from this property&apos;s verified listing record.
              </span>
            </div>

            {/* Agency Details Summary */}
            <div className="p-3 border border-[#e0e0e0] bg-[#fafafa] space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block mb-1.5">
                  Flyer contact details
                </span>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Flyer contact details">
                  {(["agent", "agency"] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setContactSource(source)}
                      className={`border px-2.5 py-2 text-left text-[10px] font-mono uppercase transition-colors ${
                        contactSource === source
                          ? "border-[#fa3600] bg-[#fff5f3] text-[#282828]"
                          : "border-[#e0e0e0] bg-white text-[#6b6b6b] hover:border-[#9b9b9b]"
                      }`}
                    >
                      <span className="block font-bold">{source === "agent" ? "Assigned agent" : "Agency"}</span>
                      <span className="block mt-0.5 normal-case truncate">
                        {source === "agent" ? flyerContact.name : agencySettings?.agencyName || "Agency"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block">
                  Applied {contactSource === "agent" ? "Agent" : "Agency"} Details:
                </span>
                <p className="text-xs font-heading font-semibold text-[#282828] mt-0.5">
                  {activeContact.name}
                </p>
                <p className="text-[10px] font-mono text-[#6b6b6b]">
                  Phone: {activeContact.phone}
                </p>
              </div>
              {contactSource === "agency" && (
                <Link href="/dashboard/settings" className="text-[11px] font-mono text-[#fa3600] hover:underline font-semibold">
                  Agency settings &rarr;
                </Link>
              )}
            </div>

            {/* Download Button */}
            <div>
              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={isDownloading}
                className="w-full py-3 px-4 bg-[#fa3600] hover:bg-[#d92f00] text-white font-heading font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Flyer Downloaded Successfully!</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <ContourSunLoader size="sm" label="Compiling high-resolution flyer…" decorative />
                    <span>Compiling High-Res Flyer (PNG)…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Download {isSale ? "For-Sale" : "For-Rent"} Flyer (PNG)
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Sharing Hub */}
            <div className="pt-2 border-t border-[#e0e0e0]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828] block mb-2">
                Share to Client via WhatsApp:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
                    const publicUrl = `${origin}${publicPropertyPath(property.organization?.slug || property.organizationSlug || "organization", property.slug || property.id)}`;
                    navigator.clipboard.writeText(publicUrl);
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        `🏛️ *${property.title.toUpperCase()}*\n📍 ${property.suburb}, Lusaka\n💰 ${currency} ${price?.toLocaleString()}\n\nVerified Public Listing & Title Deeds: ${publicUrl}`
                      )}`,
                      "_blank"
                    );
                  }}
                  className="py-2 px-2.5 border border-[#e0e0e0] hover:border-[#282828] bg-white text-[#282828] font-heading text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#fa3600]" />
                  <span>Share Web Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `🏡 *${property.title.toUpperCase()}* (${isSale ? "FOR SALE" : "FOR LEASE"})\n📍 Location: ${property.suburb}, Lusaka\n💰 Price: ${currency} ${price?.toLocaleString()}${!isSale ? "/month" : ""}\n\n📝 ${flyerCopy}\n\n_Contact ${activeContact.name} • ${activeContact.phone}_`;
                    navigator.clipboard.writeText(text);
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="py-2 px-2.5 border border-[#282828] bg-[#282828] hover:bg-black text-white font-heading text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#fa3600]" />
                  <span>Share Pitch Text</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Dynamic Flyer Render Preview (7 Cols) */}
          <div className="lg:col-span-7 min-h-0 p-3 sm:p-5 flex flex-col items-center justify-start overflow-y-auto bg-[#fafafa]">
            {/* ------------------------------------------------------------- */}
            {/* FORMAT 1: 4:5 BROCHURE (Portrait)                             */}
            {/* ------------------------------------------------------------- */}
            {aspectRatio === "4:5" && (
              <div
                ref={cardRef}
                className={`w-full max-w-[680px] border border-[#282828] flex flex-col font-sans transition-all relative select-none ${
                  isDark ? "bg-[#282828] text-white" : "bg-white text-[#282828]"
                }`}
              >
                {/* Registration Corner Marks (+) */}
                <span className="absolute top-1 left-1.5 font-mono text-[10px] text-[#9b9b9b] pointer-events-none">
                  +
                </span>
                <span className="absolute top-1 right-1.5 font-mono text-[10px] text-[#9b9b9b] pointer-events-none">
                  +
                </span>

                {/* 1. Top Section - Hero Exterior Photo */}
                <div className="relative h-56 bg-neutral-200 overflow-hidden border-b border-[#282828]">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Left Floating Agency Monogram / Brand Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-[#282828] text-white p-1.5 sm:p-2 flex items-center gap-2 border border-white/20">
                    {logoUrl && !logoFailed ? (
                      <div className="h-6 max-w-[70px] bg-white px-1 py-0.5 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt={agencySettings?.agencyName || "Agency Logo"}
                          crossOrigin="anonymous"
                          className="h-full w-auto max-w-full object-contain"
                          onError={() => setLogoFailed(true)}
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-5 h-5 rounded-full bg-[#fa3600] shrink-0"
                      />
                    )}
                    <div className="font-heading font-bold text-[9px] uppercase tracking-wider text-white truncate max-w-[110px]">
                      {agencySettings?.agencyName || "Contour"}
                    </div>
                  </div>

                  {/* Suburb & Elevation Pill */}
                  <div className="absolute bottom-2 right-2 bg-black text-white text-[9px] font-mono px-2 py-0.5 border border-white/20 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#fa3600]" />
                    <span>{property.suburb}, Lusaka</span>
                  </div>
                </div>

                {/* 2. Middle Body Section */}
                <div className={`p-3.5 grid grid-cols-12 gap-3 ${isDark ? "bg-[#282828]" : "bg-white"}`}>
                  {/* Left Column (7 Cols) */}
                  <div className="col-span-7 space-y-2 flex flex-col justify-between">
                    <div>
                      {/* Telemetry Stand Line */}
                      <div className="text-[8px] font-mono uppercase tracking-widest text-[#fa3600] font-bold">
                        STAND # 8942-A • EXCLUSIVE MANDATE
                      </div>
                      <h4 className={`font-heading font-extrabold text-xs sm:text-sm uppercase tracking-tight leading-tight mt-0.5 ${
                        isDark ? "text-white" : "text-[#282828]"
                      }`}>
                        {isSale ? "MODERN HOME FOR SALE" : "LUXURY RESIDENCE FOR RENT"}
                      </h4>
                      <p className={`text-[8.5px] font-mono leading-snug mt-1 break-words ${
                        isDark ? "text-neutral-300" : "text-[#6b6b6b]"
                      }`}>
                        {flyerCopy}
                      </p>
                    </div>

                    {/* Architectural "HOME FEATURES" Bar */}
                    <div className="bg-[#282828] text-white px-2 py-1 flex items-center justify-between border-l-2 border-[#fa3600]">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3 h-3 text-[#fa3600] shrink-0" />
                        <span className="font-heading font-bold text-[9px] uppercase tracking-wider">
                          {isSale ? "HOME FEATURES" : "RENTAL HIGHLIGHTS"}
                        </span>
                      </div>
                      <span className="font-mono text-[8px] text-neutral-400">8 SPECS</span>
                    </div>

                    {/* 2-Column Features Bullet List with '+' marks */}
                    <div className={`grid grid-cols-2 gap-x-1 gap-y-0.5 text-[8px] font-mono ${
                      isDark ? "text-neutral-200" : "text-[#282828]"
                    }`}>
                      {homeFeatures.slice(0, 8).map((feat, idx) => (
                        <div key={idx} className="min-w-0 flex items-start gap-1">
                          <span className="text-[#fa3600] font-bold">+</span>
                          <span className="break-words">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Price Box & Stacked Interior Photos (5 Cols) */}
                  <div className="col-span-5 space-y-1.5 flex flex-col justify-between">
                    {/* Top Price Card */}
                      <div className="bg-[#282828] text-white p-2 border border-[#404040] text-center space-y-0.5 min-w-0">
                      <div className="text-[7.5px] font-mono tracking-wider uppercase text-[#9b9b9b]">
                        {isSale ? "OFFERED AT" : "AVAILABLE LEASE"}
                      </div>
                      <div className="font-mono font-bold text-[10px] leading-tight text-white break-words">
                        {currency} {price?.toLocaleString()}
                        {!isSale && <span className="text-[8px] text-[#fa3600]">/mo</span>}
                      </div>
                      <div className="text-[7px] font-mono text-[#fa3600]">
                        VERIFIED CLEAN TITLE
                      </div>
                    </div>

                    {/* Responsive sub-image grid: images crop centrally, never stretch. */}
                    {subImages.length > 0 && (
                      <div className={`grid gap-1 ${subImages.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {subImages.map(({ src, slot }, index) => (
                          <div
                            key={`${slot}-${index}`}
                            className={`border border-[#e0e0e0] overflow-hidden bg-neutral-100 ${
                              subImages.length === 1 ? "h-24" : "aspect-square"
                            }`}
                          >
                            <img
                              src={src}
                              alt={`Property sub-image ${index + 1}`}
                              crossOrigin="anonymous"
                              className="block h-full w-full object-cover object-center"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Bottom 2-Tier Footer */}
                <div className="flex flex-col shrink-0 border-t border-[#282828] text-[8px] font-mono">
                  {/* Contact Info Tier */}
                  <div className="bg-[#282828] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#404040]">
                    <span className="flex items-center gap-1">
                      <span className="text-[#fa3600]">TEL:</span> {activeContact.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#fa3600]">IG:</span> {activeContact.instagram || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#fa3600]">WEB:</span> {activeContact.website || "—"}
                    </span>
                  </div>

                  {/* Address & Booking Tier */}
                  <div className="flex min-h-8 bg-black text-white">
                    <div className="flex-1 flex items-center px-3 gap-1.5 text-[8px] text-neutral-300 min-w-0 py-1">
                      <MapPin className="w-3 h-3 text-[#fa3600] shrink-0" />
                      <span className="break-words">
                        {property.suburb}, Lusaka ({property.landmarkDirections || "Prime Area"})
                      </span>
                    </div>
                    <div className="bg-[#fa3600] px-3.5 flex items-center justify-center font-heading uppercase tracking-wider text-[8.5px] text-white font-bold">
                      {isSale ? "BOOK NOW" : "SCHEDULE TOUR"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FORMAT 2: 1:1 SQUARE (Feed Post for IG / Facebook)            */}
            {/* ------------------------------------------------------------- */}
            {aspectRatio === "1:1" && (
              <div
                ref={cardRef}
                className={`w-full max-w-[680px] aspect-square border border-[#282828] flex flex-col justify-between font-sans transition-all relative select-none ${
                  isDark ? "bg-[#282828] text-white" : "bg-white text-[#282828]"
                }`}
              >
                {/* Top Half: Hero Image with Floating Overlays */}
                <div className="relative h-[280px] border-b border-[#282828] overflow-hidden bg-neutral-200">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Floating Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-[#282828] text-white px-2 py-1 flex items-center gap-1.5 border border-white/20">
                    {logoUrl && !logoFailed ? (
                      <div className="h-4 max-w-[50px] bg-white px-1 py-0.5 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt={agencySettings?.agencyName || "Agency Logo"}
                          crossOrigin="anonymous"
                          className="h-full w-auto max-w-full object-contain"
                          onError={() => setLogoFailed(true)}
                        />
                      </div>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#fa3600] shrink-0" />
                    )}
                    <span className="font-heading font-bold text-[8.5px] uppercase tracking-wider truncate max-w-[120px]">
                      {agencySettings?.agencyName || "Contour"}
                    </span>
                  </div>

                  {/* Price Tag Pill */}
                  <div className="absolute bottom-2.5 right-2.5 bg-[#fa3600] text-white px-2.5 py-1 font-mono font-bold text-xs uppercase tracking-wider">
                    {currency} {price?.toLocaleString()}
                    {!isSale && <span className="text-[9px]">/mo</span>}
                  </div>
                </div>

                {/* Bottom Half: Title, Specs & Contact Bar */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono uppercase text-[#fa3600] font-bold">
                        {property.suburb}, Lusaka
                      </span>
                      <span className="text-[8px] font-mono text-[#9b9b9b]">
                        {isSale ? "FOR SALE" : "MONTHLY LEASE"}
                      </span>
                    </div>
                    <h4 className={`font-heading font-bold text-sm uppercase tracking-tight break-words mt-0.5 ${
                      isDark ? "text-white" : "text-[#282828]"
                    }`}>
                      {property.title}
                    </h4>
                  </div>

                  {/* 4 Feature Badges */}
                  <div className="grid grid-cols-4 gap-1 py-1.5 border-y border-[#e0e0e0] font-mono text-[8px] text-center">
                    <div className="bg-[#fafafa] p-1 border border-[#e0e0e0] text-[#282828] break-words">
                      🛏 {property.bedrooms || 4} Beds
                    </div>
                    <div className="bg-[#fafafa] p-1 border border-[#e0e0e0] text-[#282828] break-words">
                      🛁 {property.bathrooms || 3} Baths
                    </div>
                    <div className="bg-[#fafafa] p-1 border border-[#e0e0e0] text-[#282828] break-words">
                      📐 {property.plotSizeSqm || "2400"} m²
                    </div>
                    <div className="bg-[#fff5f3] p-1 border border-[#fa3600]/30 text-[#fa3600] font-bold break-words">
                      ✓ Title
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="flex items-center justify-between text-[8px] font-mono pt-1">
                    <span className="text-[#6b6b6b]">
                      TEL: {activeContact.phone}
                    </span>
                    <span className="font-heading font-bold uppercase text-[#fa3600]">
                      {isSale ? "BOOK VIEWING &rarr;" : "SCHEDULE TOUR &rarr;"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FORMAT 3: 9:16 VERTICAL STORY (WhatsApp Status & IG Story)     */}
            {/* ------------------------------------------------------------- */}
            {aspectRatio === "9:16" && (
              <div
                ref={cardRef}
                className={`w-[290px] h-[515px] border border-[#282828] flex flex-col justify-between font-sans transition-all relative select-none ${
                  isDark ? "bg-[#282828] text-white" : "bg-white text-[#282828]"
                }`}
              >
                {/* Top Exterior Hero (55% Height) */}
                <div className="relative h-[290px] border-b border-[#282828] overflow-hidden bg-neutral-200">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Monogram / Brand Crest */}
                  <div className="absolute top-3 left-3 bg-[#282828] text-white px-2 py-1 border border-white/20 flex items-center gap-1.5">
                    {logoUrl && !logoFailed ? (
                      <div className="h-5 max-w-[60px] bg-white px-1 py-0.5 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt={agencySettings?.agencyName || "Agency Logo"}
                          crossOrigin="anonymous"
                          className="h-full w-auto max-w-full object-contain"
                          onError={() => setLogoFailed(true)}
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-4 h-4 rounded-full bg-[#fa3600] shrink-0"
                      />
                    )}
                    <span className="font-heading font-bold text-[8px] uppercase tracking-wider truncate max-w-[100px]">
                      {agencySettings?.agencyName || "Contour"}
                    </span>
                  </div>

                  {/* Stand badge */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black text-white px-2 py-0.5 text-[8px] font-mono border border-white/20">
                    📍 {property.suburb}, Lusaka
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-[#fa3600] text-white px-2 py-0.5 text-[8px] font-mono font-bold">
                    {isSale ? "FOR SALE" : "FOR LEASE"}
                  </div>
                </div>

                {/* Bottom Story Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="text-[8px] font-mono text-[#fa3600] font-bold uppercase">
                      EXCLUSIVE AGENCY MANDATE
                    </div>
                    <h4 className={`font-heading font-bold text-xs uppercase leading-tight break-words mt-0.5 ${
                      isDark ? "text-white" : "text-[#282828]"
                    }`}>
                      {property.title}
                    </h4>
                    <div className="font-mono font-bold text-sm text-[#fa3600] mt-1">
                      {currency} {price?.toLocaleString()}
                      {!isSale && <span className="text-[9px] text-[#9b9b9b]">/mo</span>}
                    </div>
                  </div>

                  {/* Bullet Spec Grid */}
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
                    {homeFeatures.slice(0, 4).map((f, i) => (
                      <div key={i} className="break-words flex items-start gap-1">
                        <span className="text-[#fa3600]">+</span>
                        <span className="break-words">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Story CTA Swipe / Tap */}
                  <div className="bg-[#282828] text-white p-2 text-center border border-[#404040]">
                    <div className="font-heading font-bold text-[9px] uppercase tracking-wider text-[#fa3600]">
                      DIRECT WHATSAPP INQUIRY
                    </div>
                    <div className="text-[8px] font-mono text-neutral-300 mt-0.5">
                      📞 {activeContact.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
