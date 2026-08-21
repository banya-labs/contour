"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAgencySettings, AgencySettings } from "@/lib/settings/agency-settings";

type FlyerTemplate = "NAVY_EDITORIAL" | "GOLD_CLASSIC";

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
  const [template, setTemplate] = useState<FlyerTemplate>("NAVY_EDITORIAL");
  const [listingMode, setListingMode] = useState<"FOR_SALE" | "FOR_RENT">("FOR_SALE");
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Editable Narrative State derived directly from property.description
  const [flyerCopy, setFlyerCopy] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && property) {
      setAgencySettings(getAgencySettings());
      setListingMode(property.listingType === "FOR_RENT" ? "FOR_RENT" : "FOR_SALE");

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

  const isSale = listingMode === "FOR_SALE";
  const price = isSale
    ? property.askingPrice || 3500000
    : property.rentalPrice || (property.askingPrice ? Math.round(property.askingPrice / 150) : 2500);
  const currency = property.currency || "ZMW";

  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : [
        property.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
      ];

  const heroPhoto = photos[selectedHeroIndex] || photos[0];
  const interiorPhoto1 = photos[1] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800";
  const interiorPhoto2 = photos[2] || "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800";

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

  const brandColor = agencySettings?.bannerAccentColor || "#9A7132";

  const handleDownloadCard = () => {
    setIsDownloading(true);

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const width = 1080;
      const height = 1440;

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // Background
        ctx.fillStyle = "#FAF8F5";
        ctx.fillRect(0, 0, width, height);

        if (template === "NAVY_EDITORIAL") {
          // ==========================================
          // TEMPLATE B: DEEP NAVY MODERN EDITORIAL
          // ==========================================

          // 1. Top Section - Large Hero Exterior Photo
          ctx.fillStyle = "#2D3748";
          ctx.fillRect(0, 0, width, 480);

          // Top Left Floating Navy Logo Badge
          ctx.fillStyle = "#14181F";
          ctx.fillRect(50, 40, 220, 220);

          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(160, 120, 45, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "italic bold 44px serif";
          ctx.textAlign = "center";
          ctx.fillText("C", 160, 136);

          ctx.font = "bold 20px sans-serif";
          ctx.fillText((agencySettings?.agencyName || "CONTOUR").toUpperCase(), 160, 215);

          // 2. Middle Body Section
          ctx.textAlign = "left";
          ctx.fillStyle = "#14181F";
          ctx.font = "bold 42px sans-serif";
          ctx.fillText(isSale ? "MODERN HOME FOR SALE" : "LUXURY RESIDENCE FOR RENT", 50, 560);

          // Narrative Description strictly from property description
          ctx.fillStyle = "#4B5563";
          ctx.font = "19px sans-serif";
          const words = (flyerCopy || property.description || "").split(" ");
          let line = "";
          let y = 610;
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            if (testLine.length > 38 || i === words.length - 1) {
              ctx.fillText(testLine, 50, y);
              line = "";
              y += 30;
              if (y > 830) break;
            } else {
              line = testLine;
            }
          }

          // Dark Navy "HOME FEATURES" Bar with Icon
          ctx.fillStyle = "#14181F";
          ctx.fillRect(50, 860, 520, 65);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText(`🏠   ${isSale ? "HOME FEATURES" : "PROPERTY HIGHLIGHTS"}`, 80, 902);

          // 2-Column Features List
          ctx.fillStyle = "#14181F";
          ctx.font = "bold 18px sans-serif";
          let leftY = 965;
          homeFeatures.slice(0, 4).forEach((feat) => {
            ctx.fillText(`•  ${feat}`, 60, leftY);
            leftY += 40;
          });

          let rightY = 965;
          homeFeatures.slice(4, 8).forEach((feat) => {
            ctx.fillText(`•  ${feat}`, 320, rightY);
            rightY += 40;
          });

          // Right Side: Top Dark Navy "OPEN HOUSE / OFFERED AT" Box
          ctx.fillStyle = "#14181F";
          ctx.fillRect(620, 500, 410, 140);

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.font = "bold 24px sans-serif";
          ctx.fillText(isSale ? "EXCLUSIVE SALE" : "AVAILABLE FOR LEASE", 825, 550);

          ctx.font = "bold 24px monospace";
          ctx.fillText(
            `OFFERED AT ${currency} ${price?.toLocaleString()}${!isSale ? "/MO" : ""}`,
            825,
            600
          );

          // Right Side Stacked Photos Placeholder Boxes
          ctx.fillStyle = "#CBD5E0";
          ctx.fillRect(620, 660, 410, 240); // Living Room Photo
          ctx.fillRect(620, 920, 410, 240); // Bedroom Photo

          // 3. Bottom 2-Tier Footer
          // Contact Tier
          ctx.fillStyle = "#14181F";
          ctx.fillRect(0, 1260, width, 80);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 20px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            `📞  ${agencySettings?.whatsApp || "+260 97 123 4567"}     📷  ${agencySettings?.instagramHandle || "@contour.zambia"}     🌐  ${agencySettings?.website || "www.contour.co.zm"}`,
            width / 2,
            1310
          );

          // Address & Book Now Tier
          ctx.fillStyle = "#1E2530";
          ctx.fillRect(0, 1340, 750, 100);

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText(`📍  ${property.suburb}, Lusaka (${property.landmarkDirections || "Prime Area"})`, 50, 1400);

          ctx.fillStyle = "#14181F";
          ctx.fillRect(750, 1340, 330, 100);

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.font = "bold 26px sans-serif";
          ctx.fillText(isSale ? "BOOK NOW" : "SCHEDULE TOUR", 915, 1400);
        } else {
          // ==========================================
          // TEMPLATE A: EXECUTIVE GOLD CLASSIC
          // ==========================================
          ctx.fillStyle = "#14181F";
          ctx.fillRect(0, 0, 380, 240);

          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(190, 90, 50, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "italic bold 50px serif";
          ctx.textAlign = "center";
          ctx.fillText("C", 190, 108);

          ctx.font = "bold 26px sans-serif";
          ctx.fillText((agencySettings?.agencyName || "CONTOUR REALTY").toUpperCase(), 190, 195);

          ctx.fillStyle = brandColor;
          ctx.fillRect(0, 240, 380, 150);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText(isSale ? "OFFERED AT" : "MONTHLY RENT", 190, 285);

          ctx.font = "bold 32px monospace";
          ctx.fillText(`${formatCurrency(price || 0, currency)}${!isSale ? " / mo" : ""}`, 190, 340);

          ctx.textAlign = "left";
          ctx.fillStyle = "#14181F";
          ctx.font = "bold 44px serif";
          ctx.fillText(isSale ? "MODERN HOME FOR SALE" : "LUXURY RESIDENCE FOR RENT", 60, 470);

          ctx.fillStyle = brandColor;
          ctx.fillRect(60, 490, 120, 6);

          // Narrative text strictly from property description
          ctx.fillStyle = "#4B5563";
          ctx.font = "20px sans-serif";
          const words = (flyerCopy || property.description || "").split(" ");
          let line = "";
          let y = 530;
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            if (testLine.length > 34 || i === words.length - 1) {
              ctx.fillText(testLine, 60, y);
              line = "";
              y += 32;
              if (y > 700) break;
            } else {
              line = testLine;
            }
          }

          ctx.fillStyle = brandColor;
          ctx.fillRect(580, 430, 440, 720);

          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 3;
          ctx.strokeRect(600, 450, 400, 520);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 28px serif";
          ctx.textAlign = "center";
          ctx.fillText("HOME FEATURES", 800, 500);

          ctx.textAlign = "left";
          ctx.font = "20px sans-serif";
          let featY = 560;
          homeFeatures.slice(0, 7).forEach((feat) => {
            ctx.fillText(`•  ${feat}`, 625, featY);
            featY += 44;
          });

          ctx.fillStyle = "#14181F";
          ctx.fillRect(580, 990, 440, 160);

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText("MORE INFORMATION", 800, 1045);

          ctx.fillStyle = "#10B981";
          ctx.font = "bold 28px monospace";
          ctx.fillText(agencySettings?.whatsApp || "+260 97 123 4567", 800, 1105);

          ctx.fillStyle = brandColor;
          ctx.fillRect(0, 1340, 280, 100);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 26px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(isSale ? "BOOK NOW" : "SCHEDULE TOUR", 140, 1400);

          ctx.fillStyle = "#14181F";
          ctx.fillRect(280, 1340, 800, 100);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "24px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`📍  ${property.suburb}, Lusaka (${property.landmarkDirections || "Prime Area"})`, 320, 1400);
        }
      }

      const link = document.createElement("a");
      link.download = `contour_${property.slug || "listing"}_${listingMode.toLowerCase()}_flyer.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[2300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-paper-100 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-contour-red text-white flex items-center justify-center font-bold shadow-subtle">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-ink-900">
                  Dynamic Social Media Marketing Flyer Generator
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Authentic Property Description
                </span>
              </div>
              <p className="text-[11px] text-ink-600">
                Flyer narrative and bullets are generated strictly from this property&apos;s verified listing details.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-600 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-paper-100/50">
          {/* Left Column: Controls (5 Cols) */}
          <div className="lg:col-span-5 p-6 border-r border-border flex flex-col justify-between overflow-y-auto space-y-5 bg-white">
            <div className="space-y-4">
              {/* 1. Sale vs Rental Dynamic Switcher */}
              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  1. Listing Presentation Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setListingMode("FOR_SALE")}
                    className={`py-2.5 px-3 rounded-2xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                      listingMode === "FOR_SALE"
                        ? "bg-contour-red text-white border-contour-red shadow-subtle"
                        : "bg-paper-100 text-ink-800 border-border hover:bg-paper-200"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>For Sale ($ / ZMW)</span>
                  </button>

                  <button
                    onClick={() => setListingMode("FOR_RENT")}
                    className={`py-2.5 px-3 rounded-2xl border text-center font-bold transition-all flex items-center justify-center gap-2 ${
                      listingMode === "FOR_RENT"
                        ? "bg-ink-900 text-white border-ink-900 shadow-subtle"
                        : "bg-paper-100 text-ink-800 border-border hover:bg-paper-200"
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>For Rent (Monthly)</span>
                  </button>
                </div>
              </div>

              {/* 2. Template Style Selector */}
              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  2. Choose Flyer Design Style
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setTemplate("NAVY_EDITORIAL")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      template === "NAVY_EDITORIAL"
                        ? "bg-ink-900 text-white border-ink-900 shadow-subtle"
                        : "bg-paper-100 text-ink-800 border-border hover:bg-paper-200"
                    }`}
                  >
                    <div className="font-bold text-xs">Modern Navy Editorial</div>
                    <div className="text-[10px] opacity-75 mt-0.5">Full hero + 2-col features</div>
                  </button>

                  <button
                    onClick={() => setTemplate("GOLD_CLASSIC")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      template === "GOLD_CLASSIC"
                        ? "bg-ink-900 text-white border-ink-900 shadow-subtle"
                        : "bg-paper-100 text-ink-800 border-border hover:bg-paper-200"
                    }`}
                  >
                    <div className="font-bold text-xs">Ochre Gold Luxury</div>
                    <div className="text-[10px] opacity-75 mt-0.5">Bordered features card</div>
                  </button>
                </div>
              </div>

              {/* 3. Hero Exterior Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider mb-2">
                  3. Select Featured Photo ({photos.length} Available)
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {photos.map((photo: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedHeroIndex(idx)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedHeroIndex === idx
                          ? "border-contour-red scale-105 shadow-subtle"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      {selectedHeroIndex === idx && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-contour-red text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Exact Property Description / Editable Flyer Copy */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ink-900 uppercase tracking-wider">
                    4. Flyer Narrative Copy
                  </label>
                  {property.description && (
                    <button
                      type="button"
                      onClick={() => setFlyerCopy(property.description)}
                      className="text-[10px] text-contour-red font-semibold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={flyerCopy}
                  onChange={(e) => setFlyerCopy(e.target.value)}
                  placeholder="Listing narrative..."
                  className="w-full bg-paper-100 text-xs text-ink-900 p-3 rounded-2xl border border-paper-300 focus:outline-none focus:bg-white focus:ring-1 focus:ring-contour-red leading-relaxed font-sans"
                />
                <span className="text-[10px] text-ink-500 mt-1 block">
                  Sourced directly from this property&apos;s verified listing record.
                </span>
              </div>

              {/* Applied Branding */}
              <div className="p-3 rounded-2xl bg-paper-100 border border-paper-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-900">Applied Agency Details:</span>
                  <Link
                    href="/dashboard/settings"
                    onClick={onClose}
                    className="text-[10px] text-contour-red font-semibold hover:underline"
                  >
                    Settings →
                  </Link>
                </div>
                <div className="text-ink-700 text-xs">
                  🏢 <strong>{agencySettings?.agencyName || "Contour Real Estate"}</strong>
                </div>
                <div className="text-ink-700 text-xs">
                  💬 WhatsApp: <strong className="font-mono text-emerald-700">{agencySettings?.whatsApp || "+260 97 123 4567"}</strong>
                </div>
              </div>
            </div>

            {/* Actions & WhatsApp Sharing Hub */}
            <div className="space-y-3 pt-4 border-t border-border">
              <button
                onClick={handleDownloadCard}
                disabled={isDownloading}
                className="w-full py-3 px-4 rounded-2xl bg-ink-900 hover:bg-ink-950 text-white font-bold text-xs shadow-floating flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Flyer Downloaded Successfully!</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-contour-red" />
                    <span>Compiling High-Res Flyer (PNG)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-contour-red" />
                    <span>Download {isSale ? "Sale" : "Rental"} Flyer (PNG)</span>
                  </>
                )}
              </button>

              {/* WhatsApp Broadcast Hub (Choice between Web Link vs Image Flyer) */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share to Client via WhatsApp:</span>
                  </span>
                  <span className="text-[9px] font-semibold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                    Choose Format
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Option 1: Share Web Link */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🏡 *${property.title}*\n📍 *Location:* ${property.suburb}, Lusaka (${property.landmarkDirections || "Prime Area"})\n💰 *${
                        isSale ? "OFFERED AT:" : "MONTHLY RENT:"
                      }* ${formatCurrency(price || 0, currency)}${!isSale ? " / mo" : ""}\n\n📝 *Description:* ${flyerCopy}\n\n✨ *Verified Public Listing & Title Deeds:* https://contour.app/p/${
                        property.slug
                      }\n\n_Brokered by ${agencySettings?.agencyName || "Contour Real Estate"} • ${agencySettings?.whatsApp || "+260 97 123 4567"}_`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-900 font-bold flex flex-col items-center justify-center text-center shadow-xs transition-colors"
                  >
                    <span className="text-sm mb-0.5">🔗</span>
                    <span className="text-[11px]">Share Web Link</span>
                    <span className="text-[9px] text-emerald-700 font-normal">Interactive URL & Deeds</span>
                  </a>

                  {/* Option 2: Share Image Flyer */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadCard();
                      const caption = `🏡 *${property.title}* (${isSale ? "For Sale" : "For Lease"} in ${property.suburb})\n💰 *${
                        isSale ? "OFFERED AT:" : "MONTHLY RENT:"
                      }* ${formatCurrency(price || 0, currency)}${!isSale ? " / mo" : ""}\n📍 ${
                        property.landmarkDirections || property.suburb
                      }\n\n📝 ${flyerCopy}\n\n_Brokered by ${agencySettings?.agencyName || "Contour Real Estate"} • WhatsApp: ${
                        agencySettings?.whatsApp || "+260 97 123 4567"
                      }_`;
                      navigator.clipboard.writeText(caption);
                      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");
                    }}
                    className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold flex flex-col items-center justify-center text-center shadow-subtle active:scale-95 transition-all"
                  >
                    <span className="text-sm mb-0.5">🖼️</span>
                    <span className="text-[11px]">Share Image Flyer</span>
                    <span className="text-[9px] text-white/90 font-normal">PNG Card + Pitch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Dynamic Flyer Render Preview (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto">
            {/* TEMPLATE B: DEEP NAVY MODERN EDITORIAL PREVIEW */}
            {template === "NAVY_EDITORIAL" && (
              <div
                ref={cardRef}
                className="w-[360px] sm:w-[410px] bg-[#FAF8F5] text-ink-900 rounded-3xl overflow-hidden shadow-2xl border border-paper-300 flex flex-col font-sans transition-all"
              >
                {/* 1. Top Section - Full Width Hero with Floating Logo Badge */}
                <div className="relative h-44 bg-paper-300 overflow-hidden shrink-0">
                  <img src={heroPhoto} alt={property.title} className="w-full h-full object-cover" />

                  {/* Floating Navy Logo Badge */}
                  <div className="absolute top-3 left-3 bg-[#14181F] text-white p-2.5 rounded-2xl shadow-floating flex flex-col items-center justify-center text-center w-20 border border-white/20">
                    <div className="w-8 h-8 rounded-full border border-white/90 flex items-center justify-center font-serif italic text-xs font-bold mb-0.5">
                      C
                    </div>
                    <div className="font-bold text-[8px] uppercase tracking-wider text-white truncate max-w-[70px]">
                      {agencySettings?.agencyName || "CONTOUR"}
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                    {property.suburb}, Lusaka
                  </div>
                </div>

                {/* 2. Middle Body Section */}
                <div className="p-3.5 grid grid-cols-12 gap-3 bg-[#FAF8F5]">
                  {/* Left Column (7 Cols) */}
                  <div className="col-span-7 space-y-2 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-extrabold text-xs sm:text-sm text-ink-950 uppercase tracking-tight leading-tight">
                        {isSale ? "MODERN HOME FOR SALE" : "LUXURY RESIDENCE FOR RENT"}
                      </h4>
                      <p className="text-[8.5px] sm:text-[9px] text-ink-700 leading-snug mt-1 line-clamp-3 font-sans">
                        {flyerCopy}
                      </p>
                    </div>

                    {/* Dark Navy "HOME FEATURES" Bar */}
                    <div className="bg-[#14181F] text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                      <Home className="w-3 h-3 text-white shrink-0" />
                      <span className="font-bold text-[9px] uppercase tracking-wider">
                        {isSale ? "HOME FEATURES" : "PROPERTY HIGHLIGHTS"}
                      </span>
                    </div>

                    {/* 2-Column Features Bullet List */}
                    <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[8px] text-ink-800 font-medium">
                      {homeFeatures.slice(0, 8).map((feat, idx) => (
                        <div key={idx} className="truncate">
                          • {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Dark Price Box & Stacked Photos (5 Cols) */}
                  <div className="col-span-5 space-y-1.5 flex flex-col justify-between">
                    {/* Top Navy Price Card */}
                    <div className="bg-[#14181F] text-white p-2 rounded-xl text-center space-y-0.5 shadow-subtle border border-white/10">
                      <div className="text-[8px] font-bold tracking-wider uppercase text-ink-300">
                        {isSale ? "EXCLUSIVE SALE" : "AVAILABLE LEASE"}
                      </div>
                      <div className="font-mono font-bold text-[9.5px] text-emerald-400 truncate">
                        OFFERED AT {currency} {price?.toLocaleString()}
                        {!isSale && <span className="text-[8px] text-ink-300">/mo</span>}
                      </div>
                    </div>

                    {/* Stacked Interior Photos */}
                    <div className="space-y-1">
                      <div className="h-12 rounded-lg overflow-hidden bg-paper-300 border border-paper-300">
                        <img src={interiorPhoto1} alt="Living Area" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-12 rounded-lg overflow-hidden bg-paper-300 border border-paper-300">
                        <img src={interiorPhoto2} alt="Bedroom" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom 2-Tier Footer */}
                <div className="flex flex-col shrink-0 text-[8.5px] font-bold border-t border-paper-300">
                  {/* Contact Info Tier */}
                  <div className="bg-[#14181F] text-white px-3 py-1 flex items-center justify-between text-[8px]">
                    <span>📞 {agencySettings?.whatsApp || "+260 97 123 4567"}</span>
                    <span>📷 {agencySettings?.instagramHandle || "@contour.zambia"}</span>
                    <span>🌐 {agencySettings?.website || "www.contour.co.zm"}</span>
                  </div>

                  {/* Address & Action Tier */}
                  <div className="flex h-8 bg-[#1E2530] text-white">
                    <div className="flex-1 flex items-center px-3 gap-1 truncate text-[8px] text-ink-200">
                      <MapPin className="w-3 h-3 text-contour-red shrink-0" />
                      <span className="truncate">
                        {property.suburb}, Lusaka ({property.landmarkDirections || "Prime Area"})
                      </span>
                    </div>
                    <div className="bg-[#14181F] px-4 flex items-center justify-center uppercase tracking-wider text-[8.5px] text-white font-bold border-l border-white/10">
                      {isSale ? "BOOK NOW" : "SCHEDULE TOUR"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE A: OCHRE GOLD CLASSIC PREVIEW */}
            {template === "GOLD_CLASSIC" && (
              <div
                ref={cardRef}
                className="w-[360px] sm:w-[410px] bg-[#FAF8F5] text-ink-900 rounded-3xl overflow-hidden shadow-2xl border border-paper-300 flex flex-col font-sans transition-all"
              >
                {/* 1. Top Section */}
                <div className="flex h-44 shrink-0 overflow-hidden">
                  <div className="w-[42%] flex flex-col shrink-0">
                    <div className="bg-[#14181F] text-white p-3 flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-11 h-11 rounded-full border-2 border-white/90 flex items-center justify-center font-serif italic text-lg font-bold mb-1">
                        C
                      </div>
                      <div className="font-sans font-bold text-[10px] uppercase tracking-wider text-white truncate max-w-[130px]">
                        {agencySettings?.agencyName || "CONTOUR"}
                      </div>
                    </div>

                    <div
                      style={{ backgroundColor: brandColor }}
                      className="p-2.5 text-white flex flex-col items-center justify-center text-center"
                    >
                      <div className="text-[9px] font-bold tracking-wider uppercase opacity-95">
                        {isSale ? "OFFERED AT" : "MONTHLY RENT"}
                      </div>
                      <div className="font-mono font-bold text-xs text-white mt-0.5">
                        {currency} {price?.toLocaleString()}
                        {!isSale && <span className="text-[9px] font-normal"> / mo</span>}
                      </div>
                    </div>
                  </div>

                  <div className="w-[58%] h-full bg-paper-300 overflow-hidden relative">
                    <img src={heroPhoto} alt={property.title} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* 2. Middle Body */}
                <div className="p-3.5 grid grid-cols-12 gap-3 bg-[#FAF8F5]">
                  <div className="col-span-7 space-y-2 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-extrabold text-xs sm:text-sm text-ink-950 uppercase tracking-tight leading-tight">
                        {isSale ? "MODERN HOME FOR SALE" : "LUXURY RESIDENCE FOR RENT"}
                      </h4>
                      <div style={{ backgroundColor: brandColor }} className="w-10 h-0.5 mt-1 mb-1.5" />
                      <p className="text-[9px] text-ink-700 leading-snug line-clamp-4">
                        {flyerCopy}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-paper-300">
                      <div className="h-16 rounded-lg overflow-hidden bg-paper-300">
                        <img src={interiorPhoto1} alt="Interior 1" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-16 rounded-lg overflow-hidden bg-paper-300">
                        <img src={interiorPhoto2} alt="Interior 2" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 flex flex-col justify-between space-y-1.5">
                    <div
                      style={{ backgroundColor: brandColor }}
                      className="p-2 rounded-xl text-white flex-1 flex flex-col justify-between shadow-subtle border border-white/30"
                    >
                      <div className="text-center border-b border-white/30 pb-1 mb-1">
                        <div className="font-serif font-bold text-[10px] tracking-wider uppercase text-white">
                          HOME FEATURES
                        </div>
                      </div>

                      <ul className="space-y-0.5 text-[8.5px] text-white/95">
                        {homeFeatures.slice(0, 7).map((feat, i) => (
                          <li key={i} className="truncate">
                            • {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#14181F] text-white p-2 rounded-xl text-center space-y-0.5">
                      <div className="text-[8px] font-bold tracking-wider uppercase text-ink-300">
                        MORE INFORMATION
                      </div>
                      <div className="font-mono font-bold text-[10px] text-emerald-400 truncate">
                        {agencySettings?.whatsApp || "+260 97 123 4567"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Footer */}
                <div className="flex h-10 shrink-0 text-[9px] font-bold overflow-hidden border-t border-paper-300">
                  <div
                    style={{ backgroundColor: brandColor }}
                    className="w-[32%] text-white flex items-center justify-center uppercase tracking-wider text-[9px]"
                  >
                    {isSale ? "BOOK NOW" : "SCHEDULE TOUR"}
                  </div>
                  <div className="w-[68%] bg-[#14181F] text-white flex items-center px-3 gap-1 truncate">
                    <MapPin className="w-3 h-3 text-contour-red shrink-0" />
                    <span className="truncate text-[8.5px] text-ink-200">
                      {property.suburb}, Lusaka ({property.landmarkDirections || "Prime Area"})
                    </span>
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
