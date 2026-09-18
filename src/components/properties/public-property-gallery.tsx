"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  MessageSquare,
  Maximize2,
  X,
  Camera,
  Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatWhatsAppDigits } from "@/lib/phone-utils";

export type PublicPropertyGalleryProps = {
  title: string;
  suburb: string;
  city: string;
  priceText: string;
  photos: string[];
  featuredPhoto?: string | null;
  slug: string;
  agentName?: string | null;
  agentPhone?: string | null;
};

export default function PublicPropertyGallery({
  title,
  suburb,
  city,
  priceText,
  photos = [],
  featuredPhoto,
  slug,
  agentName = "Contour Agent",
  agentPhone = "+260971234567",
}: PublicPropertyGalleryProps) {
  const displayPhotos = photos.length > 0
    ? photos
    : [featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentPhoto = displayPhotos[activeIdx] || displayPhotos[0];

  const handleCopyLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com";
    const publicUrl = `${origin}/p/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} — Contour`,
          text: `Check out this listing in ${suburb}, ${city}: ${title} (${priceText})`,
          url: publicUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${agentName}, I am inquiring about the property: "${title}" (${suburb}, ${city}) listed at ${priceText}. Link: ${typeof window !== "undefined" ? window.location.origin : "https://contour.banyalabs.com"}/p/${slug}`
  );

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Main Hero Stage */}
      <div className="relative w-full h-72 sm:h-[440px] overflow-hidden border border-editorial-border bg-editorial-paper/40 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto}
          alt={`${title} - Photo ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="bg-editorial-black text-white text-xs font-mono font-bold px-3 py-1 uppercase tracking-wider">
            {suburb}, {city}
          </span>
          <span className="bg-white/90 backdrop-blur-xs text-editorial-black border border-editorial-border text-xs font-mono font-bold px-2.5 py-1 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-contour-red" />
            <span>{activeIdx + 1} / {displayPhotos.length}</span>
          </span>
        </div>

        {/* Price Flag */}
        <div className="absolute bottom-3 right-3 bg-contour-red text-white text-base font-mono font-bold px-4 py-2 shadow-sm z-10">
          {priceText}
        </div>

        {/* Fullscreen Trigger */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          title="View Fullscreen"
          className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-none transition-colors z-10"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Left / Right Carousel Controls */}
        {displayPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1))}
              aria-label="Previous Photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0))}
              aria-label="Next Photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* 2. Photo Thumbnails & Share Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Thumbnails Row */}
        {displayPhotos.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full sm:max-w-[65%] no-scrollbar">
            {displayPhotos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`relative w-16 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                  activeIdx === idx
                    ? "border-contour-red ring-2 ring-contour-red/30 shadow-sm"
                    : "border-editorial-border opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Quick Share Buttons */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 border border-editorial-border bg-white hover:bg-editorial-paper text-editorial-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-contour-red" />
                <span>Share Listing</span>
              </>
            )}
          </button>

          <a
            href={`https://wa.me/${formatWhatsAppDigits(agentPhone || "+260971234567")}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-editorial-black hover:bg-contour-red text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-contour-red" />
            <span>WhatsApp Pitch</span>
          </a>
        </div>
      </div>

      {/* 3. Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2.5 z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto}
              alt={title}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          <div className="flex items-center gap-4 text-white text-sm font-mono mt-4">
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1))}
              className="p-2 bg-white/10 hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span>{activeIdx + 1} of {displayPhotos.length}</span>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0))}
              className="p-2 bg-white/10 hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
