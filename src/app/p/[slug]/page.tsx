import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  PhoneCall,
  MessageSquare,
  Share2,
  ChevronLeft,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default async function PublicPropertyCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const property = MOCK_PROPERTIES.find((p) => p.slug === resolvedParams.slug);

  if (!property) {
    notFound();
  }

  const priceText =
    property.listingType === "FOR_RENT"
      ? `${formatCurrency(property.rentalPrice, property.currency)} / month`
      : formatCurrency(property.askingPrice, property.currency);

  const whatsappMessage = encodeURIComponent(
    `Hello ${property.assignedAgentName || "Contour Agent"}, I am inquiring about the property: "${property.title}" (${property.suburb}) priced at ${priceText}. Link: https://contour.app/p/${property.slug}`
  );

  return (
    <div className="flex-1 bg-white text-editorial-black pb-24 font-geist">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between border-b border-editorial-border">
        <Link
          href="/dashboard/map"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-editorial-black hover:text-editorial-red transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Spatial Map
        </Link>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-none bg-editorial-paper border border-editorial-border text-editorial-black uppercase tracking-widest">
          {property.listingType === "FOR_RENT" ? "FOR RENT // LEASE" : "FOR SALE // TITLE"}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 pt-6">
        {/* Photo Gallery Hero */}
        <div className="relative w-full h-72 sm:h-96 rounded-none overflow-hidden border border-editorial-border bg-editorial-paper/40">
          <img
            src={property.featuredPhoto || property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-editorial-black text-white text-xs font-mono font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            {property.suburb}, {property.city}
          </div>
          <div className="absolute bottom-4 right-4 bg-editorial-red text-white text-base font-mono font-bold px-4 py-2 rounded-none">
            {priceText}
          </div>
        </div>

        {/* Title & Specs */}
        <div className="bg-white rounded-none p-6 sm:p-8 border border-editorial-border space-y-6">
          <div>
            <span className="text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
              {property.ownershipType === "COMPANY_OWNED" ? "COMPANY OWNED PORTFOLIO" : "EXCLUSIVE AGENCY MANDATE"}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-editorial-black tracking-tight mt-1">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono text-editorial-neutral mt-2">
              <MapPin className="w-4 h-4 text-editorial-red shrink-0" />
              <span>{property.suburb}, {property.city}, Zambia</span>
            </div>
          </div>

          {/* Quick Specs Pill Row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-editorial-border text-xs font-mono text-editorial-black">
            {property.bedrooms && (
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.bedrooms}</strong> Bedrooms</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.bathrooms}</strong> Bathrooms</span>
              </div>
            )}
            {property.plotSizeSqm && (
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.plotSizeSqm.toLocaleString()}</strong> sqm</span>
              </div>
            )}
          </div>

          {/* Landmark Directions Box */}
          {property.landmarkDirections && (
            <div className="bg-editorial-paper/40 p-5 rounded-none border border-editorial-border">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-editorial-black uppercase tracking-wider mb-1">
                <Compass className="w-4 h-4 text-editorial-red" />
                <span>Landmark Navigation Directions (Lusaka)</span>
              </div>
              <p className="text-xs text-editorial-black leading-relaxed">
                {property.landmarkDirections}
              </p>
              {property.latitude && property.longitude && (
                <div className="text-[11px] font-mono text-editorial-neutral mt-2">
                  GPS COORDINATES: {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-serif font-bold text-lg text-editorial-black mb-2">Property Overview</h3>
            <p className="text-xs text-editorial-neutral leading-relaxed">
              Prime residential listing situated in the highly sought-after neighborhood of {property.suburb}. Built to executive standards with paved driveways, high perimeter security wall, borehole water supply, and modern fittings throughout.
            </p>
          </div>
        </div>

        {/* Assigned Agent Contact Card */}
        <div className="bg-white rounded-none p-6 border border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-none bg-editorial-black text-white font-serif font-bold flex items-center justify-center text-lg shrink-0">
              {property.assignedAgentName ? property.assignedAgentName[0] : "A"}
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-editorial-neutral uppercase tracking-widest">
                LISTING AGENT
              </div>
              <div className="font-serif font-bold text-base text-editorial-black">
                {property.assignedAgentName || "Contour Verified Agent"}
              </div>
              <div className="text-xs font-mono text-editorial-neutral">
                {property.assignedAgentPhone || "+260 97 123 4567"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/${property.assignedAgentPhone?.replace(/\+/g, "") || "260971234567"}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-6 py-3 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-editorial-red" />
              <span>Inquire on WhatsApp</span>
            </a>
            <a
              href={`tel:${property.assignedAgentPhone || "+260971234567"}`}
              className="p-3 rounded-none bg-white hover:bg-editorial-paper text-editorial-black border border-editorial-border text-xs transition-colors"
              title="Call Agent"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
