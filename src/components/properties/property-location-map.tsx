"use client";

import React from "react";
import { formatPropertyLocation } from "@/lib/property-location";
import { hasValidCoordinates } from "@/lib/locations/map-coordinates";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Compass,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

// Dynamically import Leaflet canvas with SSR disabled to prevent window is undefined errors
const PropertyLeafletCanvas = dynamic(
  () => import("./property-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[340px] sm:h-[400px] bg-[#FAF8F5] border border-editorial-border flex flex-col items-center justify-center text-editorial-muted gap-3 animate-pulse">
        <ContourSunLoader size="md" label="Loading property map…" decorative />
        <span className="text-xs font-mono font-bold tracking-wider text-editorial-black">
          LOADING PROPERTY LOCATION MAP...
        </span>
      </div>
    ),
  }
);

interface PropertyLocationMapProps {
  title: string;
  suburb: string;
  city: string;
  priceText: string;
  latitude?: number | null;
  longitude?: number | null;
  landmarkDirections?: string | null;
  featuredPhoto?: string | null;
  organizationSlug?: string | null;
  organizationName?: string | null;
}

export function PropertyLocationMap({
  title,
  suburb,
  city,
  priceText,
  latitude,
  longitude,
  landmarkDirections,
  featuredPhoto,
  organizationSlug,
  organizationName,
}: PropertyLocationMapProps) {
  const hasCoordinates = hasValidCoordinates(latitude, longitude);
  const lat = hasCoordinates ? latitude! : null;
  const lng = hasCoordinates ? longitude! : null;
  const googleMapsUrl = hasCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : undefined;

  return (
    <div className="bg-white border border-editorial-border space-y-0 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-contour-red">
              Property Location Map
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>Location Reference</span>
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-editorial-black flex items-center gap-2">
            <MapPin className="w-4 h-4 text-contour-red shrink-0" />
            <span>{formatPropertyLocation({ suburb, city })}</span>
          </h3>
        </div>

        {/* GPS Coordinates & Google Maps Link */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-editorial-muted bg-neutral-50 px-2.5 py-1 border border-editorial-border shrink-0">
            {hasCoordinates ? `GPS: ${lat!.toFixed(4)}, ${lng!.toFixed(4)}` : "GPS location not recorded"}
          </div>
          {hasCoordinates && <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-mono uppercase tracking-wider border border-editorial-border flex items-center gap-1 transition-colors shrink-0"
            title="Open destination in Google Maps"
          >
            <span>Directions</span>
            <ExternalLink className="w-3 h-3 text-contour-red" />
          </a>}
        </div>
      </div>

      {/* Embedded Leaflet Map */}
      {hasCoordinates ? <PropertyLeafletCanvas
        title={title}
        suburb={suburb}
        city={city}
        priceText={priceText}
        latitude={lat!}
        longitude={lng!}
        landmarkDirections={landmarkDirections}
        featuredPhoto={featuredPhoto}
      /> : <div className="p-8 text-center text-sm text-editorial-muted">Exact location not recorded. Contact the listing agent to confirm the address.</div>}

      {/* Footer Info & Full Cadastre Cross-Link */}
      <div className="p-4 bg-neutral-50 border-t border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2 text-editorial-muted">
          <Compass className="w-4 h-4 text-contour-red shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {landmarkDirections ? (
              <span><strong>Landmark Directions:</strong> {landmarkDirections}</span>
            ) : (
              <span>Confirm the exact address with the listing agent.</span>
            )}
          </p>
        </div>

        <Link
          href={organizationSlug ? `/map/${encodeURIComponent(organizationSlug)}` : "/map"}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-editorial-black hover:text-contour-red transition-colors shrink-0"
        >
          <span>{organizationName ? `Explore ${organizationName} Map` : "Explore Public Spatial Map"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-contour-red" />
        </Link>
      </div>
    </div>
  );
}
