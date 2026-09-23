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
import QRCode from "qrcode";
import { formatCurrency } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import { getAgencySettings, AgencySettings } from "@/lib/settings/agency-settings";
import { publicPropertyPath } from "@/lib/public-property";
import { resolveFlyerContact, FlyerContactSource } from "./flyer-contact";
import { FLYER_CANVAS } from "@/lib/flyer-render-model";

async function waitForFlyerAssets(root: HTMLElement): Promise<number> {
  const images = Array.from(root.querySelectorAll("img"));
  let failedImages = 0;
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => {
            failedImages += 1;
            resolve();
          }, { once: true });
        });
      }
      if (image.complete && image.naturalWidth === 0) failedImages += 1;
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
  return failedImages;
}

export type FlyerTemplate = "SWISS_LIGHT" | "SWISS_DARK" | "NAVY_EDITORIAL" | "GOLD_CLASSIC";
export type FlyerAspectRatio = keyof typeof FLYER_CANVAS;

function formatFlyerPrice(value: number | null | undefined): string {
  return value == null ? "—" : new Intl.NumberFormat("en-US").format(value).replace(/,/g, " ");
}

function FlyerFooter({
  qrCodeUrl,
  contactName,
  contactPhone,
  isSale,
}: {
  qrCodeUrl: string;
  contactName: string;
  contactPhone: string;
  isSale: boolean;
}) {
  return (
    <div className="flex min-h-12 shrink-0 border-t border-[#282828] bg-black text-white">
      <div className="flex w-14 shrink-0 items-center justify-center bg-white p-1.5">
        {qrCodeUrl ? <img src={qrCodeUrl} alt="Scan to view this property" className="h-full w-full object-contain" /> : <span className="text-[7px] font-mono text-[#282828]">SCAN</span>}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5">
        <img src="/images/whatsapp-icon.svg" alt="WhatsApp" className="h-4 w-4 shrink-0 object-contain" />
        <div className="min-w-0">
          <div className="font-heading text-[9px] font-bold uppercase tracking-wider">Contact {contactName}</div>
          <div className="truncate text-[8px] font-mono text-neutral-300">WhatsApp {formatPhoneDisplay(contactPhone) || "number unavailable"}</div>
        </div>
      </div>
      <div className="flex items-center bg-[#fa3600] px-3 font-heading text-[8.5px] font-bold uppercase tracking-wider text-white">
        {isSale ? "BOOK NOW" : "SCHEDULE TOUR"}
      </div>
    </div>
  );
}

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
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState("");
  const [contactSource, setContactSource] = useState<FlyerContactSource>("agent");
  const [logoFailed, setLogoFailed] = useState(false);
  const [imageSlots, setImageSlots] = useState({ hero: 0, secondaryOne: 1, secondaryTwo: 2 });
  const [imagePickerSlot, setImagePickerSlot] = useState<keyof typeof imageSlots | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Editable Narrative State derived directly from property.description
  const [flyerCopy, setFlyerCopy] = useState<string>("");
  const [flyerFeatures, setFlyerFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && property) {
      setAgencySettings(getAgencySettings());
      setOrganizationLogoUrl("");
      setContactSource("agent");
      setLogoFailed(false);
      setImageSlots({ hero: 0, secondaryOne: 1, secondaryTwo: 2 });
      void fetch("/api/organization/profile")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const organization = data?.organization;
          if (!organization) return;
          setAgencySettings((current) => ({
            ...(current || getAgencySettings()),
            agencyName: organization.name || current?.agencyName || "",
            // The profile endpoint exposes the persisted object key. Resolve the
            // key through the logo endpoint below before using it in the flyer.
            phone: organization.profile?.primaryPhone || current?.phone || "",
            whatsApp: organization.profile?.primaryPhone || current?.whatsApp || "",
            email: organization.profile?.primaryEmail || current?.email || "",
            officeAddress: organization.profile?.primaryOfficeAddress || current?.officeAddress || "",
          }));
        })
        .catch(() => undefined);

      void fetch("/api/organization/logo", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          // The organization logo is authoritative. Do not fall back to a
          // browser-stored user/avatar image when the agency has no logo.
          setLogoFailed(false);
          setOrganizationLogoUrl(typeof data?.logoUrl === "string" ? data.logoUrl : "");
          setAgencySettings((current) => ({
            ...(current || getAgencySettings()),
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
      setFlyerFeatures(
        property.features && property.features.length > 0
          ? [...property.features]
          : [
              property.bedrooms ? `${property.bedrooms} Bedrooms` : "Spacious Living Area",
              property.bathrooms ? `${property.bathrooms} Bathrooms` : "Modern Bathrooms",
              property.plotSizeSqm ? `${property.plotSizeSqm} m² Yard Size` : `Prime ${property.suburb} Location`,
              property.ownershipType === "COMPANY_OWNED" ? "Company-Owned Asset" : "Sole Agency Mandate",
              property.landmarkDirections ? property.landmarkDirections : `${property.suburb}, Lusaka`,
            ],
      );
      setNewFeature("");
    }
  }, [isOpen, property]);

  useEffect(() => {
    if (!isOpen || !property) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const publicUrl = `${origin}${publicPropertyPath(property.organization?.slug || property.organizationSlug || "organization", property.slug || property.id)}`;
    void QRCode.toDataURL(publicUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(""));
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
  const logoUrl = organizationLogoUrl.trim();

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
  const subImageSlots = ["secondaryOne", "secondaryTwo"] as const;
  const subImages = subImageSlots.map((slot, index) => ({
    src: photos[imageSlots[slot]] || photos[index + 1] || fallbackInteriorPhotos[index],
    slot,
  }));
  const brochureContentHeight = 210;

  const homeFeatures = flyerFeatures;

  const isDark = template === "SWISS_DARK" || template === "NAVY_EDITORIAL";

  // Real-Photo PNG Generation via html2canvas
  const handleDownloadCard = async () => {
    setDownloadError(null);
    setDownloadSuccess(false);
    if (!cardRef.current) {
      setDownloadError("The flyer preview is not ready yet. Close and reopen the generator, then try again.");
      return;
    }
    setIsDownloading(true);

    try {
      // Wait for every image/font used by the flyer. A fixed delay is not enough
      // for signed storage URLs or large property photos.
      const failedImages = await waitForFlyerAssets(cardRef.current);
      if (failedImages > 0) {
        throw new Error(`${failedImages} flyer image${failedImages === 1 ? "" : "s"} could not be loaded. Check the image or storage connection and try again.`);
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvasWidth = cardRef.current.getBoundingClientRect().width;
      const exportScale = FLYER_CANVAS[aspectRatio].width / canvasWidth;
      const canvas = await html2canvas(cardRef.current, {
        // Export dimensions are a contract, not a side effect of the modal's
        // responsive preview width. This guarantees 1080x1350, 1080x1080,
        // or 1080x1920 for every download.
        scale: exportScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? "#282828" : "#ffffff",
        logging: false,
        imageTimeout: 5000,
        width: cardRef.current.clientWidth,
        height: cardRef.current.clientHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const expectedCanvas = FLYER_CANVAS[aspectRatio];
      // Browser layout widths can be fractional, so html2canvas may round its
      // bitmap a few pixels short. Normalize to the export contract instead of
      // treating harmless raster rounding as a failed download.
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = expectedCanvas.width;
      exportCanvas.height = expectedCanvas.height;
      const exportContext = exportCanvas.getContext("2d");
      if (!exportContext) throw new Error("The flyer export canvas could not be created.");
      exportContext.drawImage(canvas, 0, 0, expectedCanvas.width, expectedCanvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob((value) => {
          if (value) resolve(value);
          else reject(new Error("The flyer image could not be encoded."));
        }, "image/png");
      });
      const link = document.createElement("a");
      link.download = `${(agencySettings?.agencyName || "agency").toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${property.slug || "listing"}_${aspectRatio.replace(":", "x")}_flyer.png`;
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      setDownloadSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "The flyer could not be downloaded. Please try again.";
      console.error("[FlyerModal] HTML2Canvas compilation failed:", err);
      setDownloadError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2300] bg-[#282828]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans animate-in fade-in duration-200">
      {(isDownloading || downloadSuccess || downloadError) && (
        <div className="fixed inset-0 z-[2400] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="flyer-download-title">
          <div className="w-full max-w-sm border border-[#282828] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#fa3600]">Flyer download</p>
                <h2 id="flyer-download-title" className="mt-1 text-lg font-heading font-bold text-[#282828]">
                  {isDownloading ? "Generating your flyer" : downloadError ? "Download could not be completed" : "Flyer ready"}
                </h2>
              </div>
              {!isDownloading && (
                <button
                  type="button"
                  onClick={() => { setDownloadSuccess(false); setDownloadError(null); }}
                  aria-label="Close download dialog"
                  className="border border-[#e0e0e0] p-1 text-[#282828] hover:border-[#fa3600]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isDownloading ? (
              <div className="mt-5 space-y-3">
                <div className="h-1.5 overflow-hidden bg-[#e0e0e0]"><div className="h-full w-2/3 animate-pulse bg-[#fa3600]" /></div>
                <p className="text-xs font-mono text-[#6b6b6b]">Loading images, rendering the flyer, and preparing the PNG download…</p>
              </div>
            ) : downloadError ? (
              <div className="mt-4 space-y-4">
                <p className="border-l-2 border-[#fa3600] bg-[#fff5f3] p-3 text-xs font-mono leading-relaxed text-[#282828]">{downloadError}</p>
                <button type="button" onClick={handleDownloadCard} className="w-full bg-[#fa3600] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-[#d92f00]">Try again</button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-mono leading-relaxed text-[#282828]">Your flyer has been generated and the PNG download has started.</p>
                <button type="button" onClick={() => setDownloadSuccess(false)} className="w-full border border-[#282828] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-[#282828] hover:bg-[#282828] hover:text-white">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
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
              <div className="inline-flex border border-[#e0e0e0] bg-white p-0.5" role="group" aria-label="Flyer color mode">
                <button
                  type="button"
                  onClick={() => setTemplate("SWISS_LIGHT")}
                  aria-pressed={template === "SWISS_LIGHT" || template === "GOLD_CLASSIC"}
                  className={`min-w-[76px] px-3 py-1.5 text-center text-[10px] font-mono font-bold uppercase transition-all ${
                    template === "SWISS_LIGHT" || template === "GOLD_CLASSIC"
                      ? "bg-[#282828] text-white"
                      : "text-[#6b6b6b] hover:bg-[#f5f5f5]"
                  }`}
                >
                  Light
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate("SWISS_DARK")}
                  aria-pressed={template === "SWISS_DARK" || template === "NAVY_EDITORIAL"}
                  className={`min-w-[76px] px-3 py-1.5 text-center text-[10px] font-mono font-bold uppercase transition-all ${
                    template === "SWISS_DARK" || template === "NAVY_EDITORIAL"
                      ? "bg-[#282828] text-white"
                      : "text-[#6b6b6b] hover:bg-[#f5f5f5]"
                  }`}
                >
                  Dark
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
                ] as const).map(([slot, label]) => (
                  <div key={slot} className="flex min-w-0 items-center gap-1.5">
                    <span className="w-16 shrink-0 text-[9px] font-mono font-bold uppercase text-[#6b6b6b]">{label}</span>
                    <button type="button" onClick={() => setImagePickerSlot(slot)} className="relative h-12 min-w-0 flex-1 overflow-hidden border border-[#fa3600] bg-neutral-100 text-left">
                      <img src={photos[imageSlots[slot]] || fallbackInteriorPhotos[0]} alt={`${label} selected`} crossOrigin="anonymous" className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-[#282828]/85 px-1 py-0.5 text-center text-[8px] font-mono text-white">Choose image</span>
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["secondaryOne", "Sub-image 1"],
                    ["secondaryTwo", "Sub-image 2"],
                  ] as const).map(([slot, label], index) => (
                    <div key={slot} className="flex min-w-0 items-center gap-1.5">
                      <span className="w-16 shrink-0 text-[9px] font-mono font-bold uppercase text-[#6b6b6b]">{label}</span>
                      <button type="button" onClick={() => setImagePickerSlot(slot)} className="relative h-12 min-w-0 flex-1 overflow-hidden border border-[#fa3600] bg-neutral-100 text-left">
                        <img src={photos[imageSlots[slot]] || fallbackInteriorPhotos[index + 1]} alt={`${label} selected`} crossOrigin="anonymous" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-[#282828]/85 px-1 py-0.5 text-center text-[8px] font-mono text-white">Choose image</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {imagePickerSlot && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Choose property image">
                <div className="w-full max-w-lg border border-[#282828] bg-white p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6b6b6b]">Choose property image</p>
                      <p className="text-sm font-bold text-[#282828]">{imagePickerSlot === "hero" ? "Main image" : `Sub-image ${subImageSlots.indexOf(imagePickerSlot) + 1}`}</p>
                    </div>
                    <button type="button" onClick={() => setImagePickerSlot(null)} aria-label="Close image picker" className="border border-[#e0e0e0] p-1 hover:border-[#fa3600]"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {photos.map((photo: string, idx: number) => (
                      <button key={idx} type="button" onClick={() => { setImageSlots((current) => ({ ...current, [imagePickerSlot]: idx })); setImagePickerSlot(null); }} className={`relative aspect-square overflow-hidden border-2 ${imageSlots[imagePickerSlot] === idx ? "border-[#fa3600]" : "border-[#e0e0e0] hover:border-[#fa3600]"}`}>
                        <img src={photo} alt={`Property image ${idx + 1}`} crossOrigin="anonymous" className="h-full w-full object-cover" />
                        {imageSlots[imagePickerSlot] === idx && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-[#fa3600] text-white"><Check className="h-3 w-3" /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

            {/* 5. Editable Home Features */}
            <div className="border border-[#e0e0e0] bg-[#fafafa] p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#282828]">
                  5. Home Features
                </label>
                <span className="text-[9px] font-mono text-[#6b6b6b]">Shown on flyer</span>
              </div>
              <div className="space-y-1.5">
                {homeFeatures.map((feature, index) => (
                  <div key={`${feature}-${index}`} className="flex items-center gap-1.5">
                    <span className="text-[#fa3600]">+</span>
                    <input
                      value={feature}
                      onChange={(event) => setFlyerFeatures((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                      aria-label={`Home feature ${index + 1}`}
                      className="min-w-0 flex-1 border border-[#e0e0e0] bg-white px-2 py-1 text-[10px] font-mono text-[#282828] focus:border-[#fa3600] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setFlyerFeatures((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove home feature ${index + 1}`}
                      className="px-1 text-sm leading-none text-[#fa3600] hover:text-[#b52600]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <input
                  value={newFeature}
                  onChange={(event) => setNewFeature(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const feature = newFeature.trim();
                      if (!feature) return;
                      setFlyerFeatures((current) => [...current, feature]);
                      setNewFeature("");
                    }
                  }}
                  placeholder="Add custom feature"
                  aria-label="Custom home feature"
                  className="min-w-0 flex-1 border border-[#e0e0e0] bg-white px-2 py-1.5 text-[10px] font-mono text-[#282828] focus:border-[#fa3600] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    const feature = newFeature.trim();
                    if (!feature) return;
                    setFlyerFeatures((current) => [...current, feature]);
                    setNewFeature("");
                  }}
                  className="border border-[#282828] bg-[#282828] px-2.5 text-[10px] font-mono font-bold uppercase text-white hover:bg-[#fa3600]"
                >
                  Add
                </button>
              </div>
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
                        `🏛️ *${property.title.toUpperCase()}*\n📍 ${property.suburb}, Lusaka\n💰 ${currency} ${formatFlyerPrice(price)}\n\nVerified Public Listing & Title Deeds: ${publicUrl}`
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
                    const text = `🏡 *${property.title.toUpperCase()}* (${isSale ? "FOR SALE" : "FOR LEASE"})\n📍 Location: ${property.suburb}, Lusaka\n💰 Price: ${currency} ${formatFlyerPrice(price)}${!isSale ? "/month" : ""}\n\n📝 ${flyerCopy}\n\n_Contact ${activeContact.name} • ${activeContact.phone}_`;
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
                className={`w-full max-w-[680px] aspect-[4/5] overflow-hidden border border-[#282828] flex flex-col font-sans transition-all relative select-none ${
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
                <div className="relative min-h-56 min-w-0 flex-1 bg-neutral-200 overflow-hidden border-b border-[#282828]">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Left Floating Agency Monogram / Brand Badge */}
                  <div className="absolute left-2.5 top-2.5 flex w-fit max-w-[calc(100%-1.25rem)] items-center gap-2 border border-[#282828]/20 bg-white p-1.5 text-[#282828] sm:p-2">
                    {logoUrl && !logoFailed ? (
                      <div className="flex h-6 max-w-[90px] shrink-0 items-center justify-center bg-white px-1 py-0.5">
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
                    <div className="min-w-0 flex-1 break-words font-heading text-[9px] font-bold uppercase tracking-wider text-[#282828]">
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
                <div
                  className={`min-h-0 shrink-0 p-3.5 grid grid-cols-12 gap-3 ${isDark ? "bg-[#282828]" : "bg-white"}`}
                  style={{ flexBasis: `${brochureContentHeight}px` }}
                >
                  {/* Left Column (7 Cols) */}
                  <div className="col-span-7 space-y-2 flex flex-col justify-start">
                    <div>
                      {/* Telemetry Stand Line */}
                      <div className="text-[8px] font-mono uppercase tracking-widest text-[#fa3600] font-bold">
                        STAND # 8942-A • EXCLUSIVE MANDATE
                      </div>
                      <h4 className={`font-heading font-extrabold text-xs sm:text-sm uppercase tracking-tight leading-tight mt-0.5 ${
                        isDark ? "text-white" : "text-[#282828]"
                      }`}>
                        {(property.title || "Property").toUpperCase()}
                      </h4>
                      <p className={`text-[9.5px] font-mono leading-snug mt-1 break-words ${
                        isDark ? "text-neutral-300" : "text-[#6b6b6b]"
                      }`}>
                        <span className="line-clamp-5">{flyerCopy}</span>
                      </p>
                    </div>

                    {/* Architectural "HOME FEATURES" Bar */}
                    <div className="bg-black text-white px-2 py-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3 h-3 text-[#fa3600] shrink-0" />
                        <span className="font-heading font-bold text-[9px] uppercase tracking-wider">
                          {isSale ? "HOME FEATURES" : "RENTAL HIGHLIGHTS"}
                        </span>
                      </div>
                    </div>

                    {/* 2-Column Features Bullet List with '+' marks */}
                    <div className={`mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] font-mono ${
                      isDark ? "text-neutral-200" : "text-[#282828]"
                    }`}>
                      {homeFeatures.slice(0, 8).map((feat, idx) => (
                        <div key={idx} className="min-w-0 flex items-start gap-1">
                          <span className="text-[#fa3600] font-bold">+</span>
                        <span className="break-words line-clamp-2">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Price Box & Stacked Interior Photos (5 Cols) */}
                  <div className="col-span-5 space-y-1.5 flex flex-col justify-between">
                    {/* Top Price Card */}
                      <div className="bg-black text-white p-2.5 border border-black text-center space-y-1 min-w-0">
                      <div className="text-[9px] font-mono tracking-wider uppercase text-[#bdbdbd]">
                        {isSale ? "OFFERED AT" : "AVAILABLE LEASE"}
                      </div>
                      <div className="font-mono font-bold text-[18px] leading-none text-white break-words">
                        {currency} {formatFlyerPrice(price)}
                        {!isSale && <span className="text-[10px] text-[#fa3600]">/mo</span>}
                      </div>
                    </div>

                    {/* Secondary images stay in one equal-width row and crop safely. */}
                    {subImages.length > 0 && (
                      <div className="flex min-w-0 items-start gap-1">
                        {subImages.map(({ src, slot }, index) => (
                          <div
                            key={`${slot}-${index}`}
                            className="aspect-square min-w-0 flex-1 overflow-hidden border border-[#e0e0e0] bg-neutral-100"
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

                <FlyerFooter qrCodeUrl={qrCodeUrl} contactName={activeContact.name} contactPhone={activeContact.phone} isSale={isSale} />
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FORMAT 2: 1:1 SQUARE (Feed Post for IG / Facebook)            */}
            {/* ------------------------------------------------------------- */}
            {aspectRatio === "1:1" && (
              <div
                ref={cardRef}
                className={`w-full max-w-[680px] aspect-square overflow-hidden border border-[#282828] flex flex-col justify-between font-sans transition-all relative select-none ${
                  isDark ? "bg-[#282828] text-white" : "bg-white text-[#282828]"
                }`}
              >
                {/* Top Half: Hero Image with Floating Overlays */}
                <div className="relative h-[62%] min-h-0 shrink-0 border-b border-[#282828] overflow-hidden bg-neutral-200">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Floating Badge */}
                  <div className="absolute left-2.5 top-2.5 flex w-fit max-w-[calc(100%-1.25rem)] items-center gap-1.5 border border-[#282828]/20 bg-white px-2 py-1 text-[#282828]">
                    {logoUrl && !logoFailed ? (
                      <div className="flex h-4 max-w-[70px] shrink-0 items-center justify-center bg-white px-1 py-0.5">
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
                    <span className="min-w-0 flex-1 break-words font-heading text-[8.5px] font-bold uppercase tracking-wider text-[#282828]">
                      {agencySettings?.agencyName || "Contour"}
                    </span>
                  </div>

                  {/* Price Tag Pill */}
                  <div className="absolute bottom-2.5 right-2.5 bg-[#fa3600] text-white px-2.5 py-1 font-mono font-bold text-xs uppercase tracking-wider">
                    {currency} {formatFlyerPrice(price)}
                    {!isSale && <span className="text-[9px]">/mo</span>}
                  </div>
                </div>

                {/* Bottom Half: Title, Specs & Contact Bar */}
                <div className="min-h-0 flex-1 overflow-hidden p-3 flex flex-col justify-between">
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
                      <span className="line-clamp-2">{property.title}</span>
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

                </div>
                <FlyerFooter qrCodeUrl={qrCodeUrl} contactName={activeContact.name} contactPhone={activeContact.phone} isSale={isSale} />
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FORMAT 3: 9:16 VERTICAL STORY (WhatsApp Status & IG Story)     */}
            {/* ------------------------------------------------------------- */}
            {aspectRatio === "9:16" && (
              <div
                ref={cardRef}
                className={`w-[324px] aspect-[9/16] overflow-hidden border border-[#282828] flex flex-col justify-between font-sans transition-all relative select-none ${
                  isDark ? "bg-[#282828] text-white" : "bg-white text-[#282828]"
                }`}
              >
                {/* Top Exterior Hero (55% Height) */}
                <div className="relative h-[68%] min-h-0 shrink-0 border-b border-[#282828] overflow-hidden bg-neutral-200">
                  <img
                    src={heroPhoto}
                    alt={property.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />

                  {/* Monogram / Brand Crest */}
                  <div className="absolute left-3 top-3 flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-1.5 border border-[#282828]/20 bg-white px-2 py-1 text-[#282828]">
                    {logoUrl && !logoFailed ? (
                      <div className="flex h-5 max-w-[80px] shrink-0 items-center justify-center bg-white px-1 py-0.5">
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
                    <span className="min-w-0 flex-1 break-words font-heading text-[8px] font-bold uppercase tracking-wider text-[#282828]">
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
                <div className="min-h-0 flex-1 overflow-hidden p-3 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="text-[8px] font-mono text-[#fa3600] font-bold uppercase">
                      EXCLUSIVE AGENCY MANDATE
                    </div>
                    <h4 className={`font-heading font-bold text-xs uppercase leading-tight break-words mt-0.5 ${
                      isDark ? "text-white" : "text-[#282828]"
                    }`}>
                      <span className="line-clamp-2">{property.title}</span>
                    </h4>
                    <div className="font-mono font-bold text-sm text-[#fa3600] mt-1">
                      {currency} {formatFlyerPrice(price)}
                      {!isSale && <span className="text-[9px] text-[#9b9b9b]">/mo</span>}
                    </div>
                  </div>

                  {/* Bullet Spec Grid */}
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
                    {homeFeatures.slice(0, 4).map((f, i) => (
                      <div key={i} className="break-words flex items-start gap-1">
                        <span className="text-[#fa3600]">+</span>
                        <span className="break-words line-clamp-2">{f}</span>
                      </div>
                    ))}
                  </div>

                </div>
                <FlyerFooter qrCodeUrl={qrCodeUrl} contactName={activeContact.name} contactPhone={activeContact.phone} isSale={isSale} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
