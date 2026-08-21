"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  Share2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PropertyMapItem } from "@/components/map/interactive-property-map";

export type PropertySpotlightProps = {
  property: PropertyMapItem | any;
};

export default function PropertySpotlightCard({ property }: PropertySpotlightProps) {
  if (!property) return null;

  const isSale = property.listingType === "FOR_SALE";
  const price = isSale ? property.askingPrice : property.rentalPrice;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden transition-all space-y-3">
      {/* Featured Photo Banner */}
      <div className="relative h-44 bg-paper-200 overflow-hidden group">
        <img
          src={property.featuredPhoto || (property.photos && property.photos[0]) || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span
            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-subtle ${
              isSale ? "bg-contour-red" : "bg-contour-amber"
            }`}
          >
            {isSale ? "FOR SALE 🔴" : "FOR RENT 🟡"}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-ink-900/80 text-white backdrop-blur-sm">
            {property.suburb}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Title & Price */}
        <div>
          <div className="font-mono text-base font-bold text-ink-900">
            {formatCurrency(price || 0, property.currency || "ZMW")}
            {!isSale && <span className="text-xs font-normal text-ink-600"> / month</span>}
          </div>
          <h4 className="font-serif text-sm font-bold text-ink-900 mt-0.5 line-clamp-1">
            {property.title}
          </h4>
          <div className="flex items-center gap-1 text-[11px] text-ink-600 mt-1">
            <MapPin className="w-3 h-3 text-contour-red shrink-0" />
            <span className="truncate">{property.landmarkDirections || `${property.suburb}, Lusaka`}</span>
          </div>
        </div>

        {/* Specs Pill Grid */}
        <div className="flex items-center gap-3 text-[11px] text-ink-800 pt-2 border-t border-paper-200">
          {property.bedrooms != null && (
            <div className="flex items-center gap-1">
              <Bed className="w-3 h-3 text-ink-500" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-1">
              <Bath className="w-3 h-3 text-ink-500" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {property.plotSizeSqm != null && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3 h-3 text-ink-500" />
              <span>{property.plotSizeSqm} m²</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <Link
            href={`/p/${property.slug}`}
            className="flex-1 py-2 px-3 rounded-full bg-contour-red hover:bg-contour-red/90 text-white text-center text-xs font-semibold shadow-subtle flex items-center justify-center gap-1 transition-transform active:scale-95"
          >
            <span>View Full Card</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Check out this listing in ${property.suburb}: ${property.title} for ${formatCurrency(price || 0, property.currency || "ZMW")}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full border border-border hover:bg-paper-200 text-ink-800 transition-colors"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
