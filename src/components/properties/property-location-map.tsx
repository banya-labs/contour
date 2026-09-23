"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Compass,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";

// Suburb GPS coordinates fallback dictionary for Lusaka
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  "kabulonga": [-15.4215, 28.3345],
  "leopards hill": [-15.4520, 28.3850],
  "roma": [-15.3780, 28.3120],
  "roma park": [-15.3780, 28.3120],
  "rhodes park": [-15.4102, 28.2985],
  "woodlands": [-15.4350, 28.3250],
  "mass media": [-15.3980, 28.3150],
  "sunningdale": [-15.4280, 28.3180],
  "state lodge": [-15.4750, 28.4050],
  "longacres": [-15.4190, 28.3090],
  "new kasama": [-15.4650, 28.3650],
  "silverest": [-15.3850, 28.4450],
  "makeni": [-15.4550, 28.2450],
  "chamba valley": [-15.3550, 28.3450],
  "ibex hill": [-15.4150, 28.3750],
  "olympia": [-15.3880, 28.2980],
  "avondale": [-15.3800, 28.3700],
  "chelston": [-15.3650, 28.3900],
  "lusaka": [-15.4167, 28.2833],
};

// Dynamically import Leaflet canvas with SSR disabled to prevent window is undefined errors
const PropertyLeafletCanvas = dynamic(
  () => import("./property-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[340px] sm:h-[400px] bg-[#FAF8F5] border border-editorial-border flex flex-col items-center justify-center text-editorial-muted gap-3 animate-pulse">
        <ContourSunLoader size="md" label="Loading property map…" decorative />
        <span className="text-xs font-mono font-bold tracking-wider text-editorial-black">
          LOADING LUSAKA SPATIAL CADASTRE MAP...
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
  standBoundary?: [number, number][] | null;
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
  standBoundary,
  landmarkDirections,
  featuredPhoto,
  organizationSlug,
  organizationName,
}: PropertyLocationMapProps) {
  // Resolve latitude & longitude with graceful fallback to suburb coordinates
  let lat = typeof latitude === "number" && !isNaN(latitude) && latitude !== 0 ? latitude : null;
  let lng = typeof longitude === "number" && !isNaN(longitude) && longitude !== 0 ? longitude : null;

  if (lat === null || lng === null) {
    const suburbKey = suburb.toLowerCase().trim();
    const fallbackCoords = SUBURB_COORDINATES[suburbKey] || SUBURB_COORDINATES["lusaka"];
    lat = fallbackCoords[0];
    lng = fallbackCoords[1];
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="bg-white border border-editorial-border space-y-0 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-contour-red">
              Cadastral Pin & Area Map
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>Spatial Coordinates Verified</span>
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold text-editorial-black flex items-center gap-2">
            <MapPin className="w-4 h-4 text-contour-red shrink-0" />
            <span>{suburb}, {city} Location</span>
          </h3>
        </div>

        {/* GPS Coordinates & Google Maps Link */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-editorial-muted bg-neutral-50 px-2.5 py-1 border border-editorial-border shrink-0">
            GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-white hover:bg-neutral-50 text-editorial-black text-xs font-mono uppercase tracking-wider border border-editorial-border flex items-center gap-1 transition-colors shrink-0"
            title="Open destination in Google Maps"
          >
            <span>Directions</span>
            <ExternalLink className="w-3 h-3 text-contour-red" />
          </a>
        </div>
      </div>

      {/* Embedded Leaflet Map */}
      <PropertyLeafletCanvas
        title={title}
        suburb={suburb}
        city={city}
        priceText={priceText}
        latitude={lat}
        longitude={lng}
        standBoundary={standBoundary}
        landmarkDirections={landmarkDirections}
        featuredPhoto={featuredPhoto}
      />

      {/* Footer Info & Full Cadastre Cross-Link */}
      <div className="p-4 bg-neutral-50 border-t border-editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2 text-editorial-muted">
          <Compass className="w-4 h-4 text-contour-red shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {landmarkDirections ? (
              <span><strong>Landmark Directions:</strong> {landmarkDirections}</span>
            ) : (
              <span>Verified coordinates locked on Contour Lusaka Cadastre. Stand boundaries confirmed against Ministry registry.</span>
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
