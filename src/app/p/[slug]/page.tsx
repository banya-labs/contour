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
    <div className="flex-1 bg-paper-100 text-ink-900 pb-24">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/dashboard/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-800 hover:text-contour-red transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Map
        </Link>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-paper-200 border border-border text-ink-800 uppercase tracking-wider">
          {property.listingType === "FOR_RENT" ? "FOR RENT 🟡" : "FOR SALE 🔴"}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Photo Gallery Hero */}
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-border shadow-card bg-paper-200">
          <img
            src={property.featuredPhoto || property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-ink-900/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-subtle">
            {property.suburb}, {property.city}
          </div>
          <div className="absolute bottom-3 right-3 bg-contour-red text-white text-sm font-mono font-bold px-4 py-1.5 rounded-full shadow-floating">
            {priceText}
          </div>
        </div>

        {/* Title & Specs */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-card space-y-4">
          <div>
            <span className="text-xs font-semibold text-contour-red uppercase tracking-wider">
              {property.ownershipType === "COMPANY_OWNED" ? "Company Owned Portfolio" : "Exclusive Agency Mandate"}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-ink-600 mt-2">
              <MapPin className="w-4 h-4 text-contour-red shrink-0" />
              <span>{property.suburb}, {property.city}, Zambia</span>
            </div>
          </div>

          {/* Quick Specs Pill Row */}
          <div className="flex flex-wrap gap-4 py-4 border-y border-border text-xs text-ink-800">
            {property.bedrooms && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-ink-600" />
                <span className="font-semibold">{property.bedrooms}</span> Bedrooms
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-ink-600" />
                <span className="font-semibold">{property.bathrooms}</span> Bathrooms
              </div>
            )}
            {property.plotSizeSqm && (
              <div className="flex items-center gap-1.5">
                <Maximize className="w-4 h-4 text-ink-600" />
                <span className="font-semibold">{property.plotSizeSqm.toLocaleString()}</span> sqm Plot
              </div>
            )}
          </div>

          {/* Landmark Directions Box */}
          {property.landmarkDirections && (
            <div className="bg-paper-200 p-4 rounded-xl border border-paper-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-900 mb-1">
                <Compass className="w-4 h-4 text-contour-red" />
                <span>Landmark Navigation Directions (Lusaka)</span>
              </div>
              <p className="text-xs text-ink-800 leading-relaxed">
                {property.landmarkDirections}
              </p>
              {property.latitude && property.longitude && (
                <div className="text-[11px] font-mono text-ink-600 mt-2">
                  GPS: {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-bold text-sm text-ink-900 mb-2">Property Overview</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              Prime residential listing situated in the highly sought-after neighborhood of {property.suburb}. Built to executive standards with paved driveways, high perimeter security wall, borehole water supply, and modern fittings throughout.
            </p>
          </div>
        </div>

        {/* Assigned Agent Contact Card */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-contour-red text-white font-bold flex items-center justify-center text-base shrink-0 shadow-subtle">
              {property.assignedAgentName ? property.assignedAgentName[0] : "A"}
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-600 uppercase tracking-wider">
                Listing Agent
              </div>
              <div className="font-bold text-sm text-ink-900">
                {property.assignedAgentName || "Contour Verified Agent"}
              </div>
              <div className="text-xs text-ink-600">
                {property.assignedAgentPhone || "+260 97 123 4567"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/${property.assignedAgentPhone?.replace(/\+/g, "") || "260971234567"}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-subtle"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${property.assignedAgentPhone || "+260971234567"}`}
              className="p-2.5 rounded-full bg-paper-200 hover:bg-paper-300 text-ink-900 border border-border text-xs font-semibold transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
