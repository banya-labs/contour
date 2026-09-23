"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Search,
  Crosshair,
  Navigation,
  ExternalLink,
  Compass,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { SectionPendingState } from "@/components/ui/section-pending-state";

// Known Lusaka landmarks and major intersections for instant local search
const LUSAKA_LANDMARKS: Array<{ name: string; suburb: string; lat: number; lng: number }> = [
  { name: "Centro Mall Kabulonga", suburb: "Kabulonga", lat: -15.4215, lng: 28.3345 },
  { name: "Kabulonga Roundabout", suburb: "Kabulonga", lat: -15.4180, lng: 28.3280 },
  { name: "Pinnacle Mall Woodlands", suburb: "Woodlands", lat: -15.4385, lng: 28.3295 },
  { name: "Woodlands Stadium / Shopping Centre", suburb: "Woodlands", lat: -15.4340, lng: 28.3240 },
  { name: "Manda Hill Shopping Centre", suburb: "Rhodes Park", lat: -15.3995, lng: 28.3050 },
  { name: "Arcades Shopping Mall", suburb: "Mass Media", lat: -15.3940, lng: 28.3145 },
  { name: "EastPark Mall Lusaka", suburb: "Mass Media", lat: -15.3910, lng: 28.3220 },
  { name: "Roma Park Commercial & Residential Gate", suburb: "Roma Park", lat: -15.3780, lng: 28.3120 },
  { name: "Foxdale Court Roma", suburb: "Roma", lat: -15.3670, lng: 28.3190 },
  { name: "Leopards Hill Polo Club", suburb: "Leopards Hill", lat: -15.4710, lng: 28.4120 },
  { name: "The Village Complex Leopards Hill", suburb: "Leopards Hill", lat: -15.4510, lng: 28.3840 },
  { name: "American International School (AISL)", suburb: "Leopards Hill", lat: -15.4590, lng: 28.3910 },
  { name: "Ibex Hill Embassy Enclave", suburb: "Ibex Hill", lat: -15.4150, lng: 28.3750 },
  { name: "Pick n Pay Woodlands", suburb: "Woodlands", lat: -15.4370, lng: 28.3270 },
  { name: "Shoprite Manda Hill", suburb: "Rhodes Park", lat: -15.3990, lng: 28.3040 },
  { name: "Crossroads Shopping Mall", suburb: "Woodlands", lat: -15.4420, lng: 28.3330 },
  { name: "Silverest Gardens", suburb: "Silverest", lat: -15.3850, lng: 28.4450 },
  { name: "Makeni Mall", suburb: "Makeni", lat: -15.4550, lng: 28.2450 },
  { name: "Chudleigh Gate", suburb: "Chudleigh", lat: -15.3620, lng: 28.3320 },
  { name: "Longacres Mall / Roundabout", suburb: "Longacres", lat: -15.4190, lng: 28.3090 },
];

export const SUBURB_DEFAULT_COORDINATES: Record<string, [number, number]> = {
  "Kabulonga": [-15.4215, 28.3345],
  "Leopards Hill": [-15.4520, 28.3850],
  "Roma": [-15.3780, 28.3120],
  "Roma Park": [-15.3780, 28.3120],
  "Woodlands": [-15.4350, 28.3250],
  "Rhodes Park": [-15.4102, 28.2985],
  "Mass Media": [-15.3980, 28.3150],
  "Ibex Hill": [-15.4150, 28.3750],
  "Chudleigh": [-15.3620, 28.3320],
  "Longacres": [-15.4190, 28.3090],
  "New Kasama": [-15.4650, 28.3650],
  "Silverest": [-15.3850, 28.4450],
  "Makeni": [-15.4550, 28.2450],
  "Lusaka": [-15.4167, 28.2833],
};

const DynamicLeafletCanvas = dynamic(
  () => import("./location-leaflet-picker-canvas"),
  {
    ssr: false,
    loading: () => (
      <SectionPendingState label="Loading interactive map…" compact />
    ),
  }
);

interface LocationCoordinatePickerProps {
  latitude?: number;
  longitude?: number;
  suburb: string;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export default function LocationCoordinatePicker({
  latitude,
  longitude,
  suburb,
  onChange,
  disabled = false,
}: LocationCoordinatePickerProps) {
  // Resolve current active coordinates with fallback to suburb centroid
  const suburbCoords = SUBURB_DEFAULT_COORDINATES[suburb] || SUBURB_DEFAULT_COORDINATES["Lusaka"] || [-15.4215, 28.3345];
  const activeLat = typeof latitude === "number" && !isNaN(latitude) && latitude !== 0 ? latitude : suburbCoords[0];
  const activeLng = typeof longitude === "number" && !isNaN(longitude) && longitude !== 0 ? longitude : suburbCoords[1];

  // Local state for direct manual coordinate editing
  const [latInput, setLatInput] = useState<string>(activeLat.toFixed(6));
  const [lngInput, setLngInput] = useState<string>(activeLng.toFixed(6));

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ name: string; suburb?: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync inputs when active coordinates update from map/props
  useEffect(() => {
    setLatInput(activeLat.toFixed(6));
    setLngInput(activeLng.toFixed(6));
  }, [activeLat, activeLng]);

  // Handle Search Input & Autocomplete
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const lower = query.toLowerCase().trim();

    // 1. Instant local matching
    const localMatches = LUSAKA_LANDMARKS.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.suburb.toLowerCase().includes(lower)
    ).slice(0, 5);

    setSearchResults(localMatches);
    setShowDropdown(true);

    // 2. Debounced online Nominatim OpenStreetMap search if local query is distinct
    if (query.trim().length >= 3) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              `${query}, Lusaka, Zambia`
            )}&limit=4`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const remoteMatches = data.map((item: any) => ({
              name: item.display_name.split(",")[0],
              suburb: item.display_name.split(",")[1]?.trim() || "Lusaka",
              lat: parseFloat(parseFloat(item.lat).toFixed(6)),
              lng: parseFloat(parseFloat(item.lon).toFixed(6)),
            }));

            // Merge unique matches
            const combined = [...localMatches];
            for (const rm of remoteMatches) {
              if (!combined.some((c) => Math.abs(c.lat - rm.lat) < 0.001 && Math.abs(c.lng - rm.lng) < 0.001)) {
                combined.push(rm);
              }
            }
            setSearchResults(combined.slice(0, 6));
          }
        } catch {
          // Ignore external search failures gracefully
        } finally {
          setIsSearching(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  };

  // Select Search Result
  const handleSelectLocation = (loc: { name: string; lat: number; lng: number }) => {
    onChange(loc.lat, loc.lng);
    setSearchQuery(loc.name);
    setShowDropdown(false);
    setFeedbackMsg(`Selected: ${loc.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Manual Numeric Input Commits
  const handleLatBlur = () => {
    const parsed = parseFloat(latInput);
    if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
      onChange(parseFloat(parsed.toFixed(6)), activeLng);
    } else {
      setLatInput(activeLat.toFixed(6));
    }
  };

  const handleLngBlur = () => {
    const parsed = parseFloat(lngInput);
    if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
      onChange(activeLat, parseFloat(parsed.toFixed(6)));
    } else {
      setLngInput(activeLng.toFixed(6));
    }
  };

  // GPS Device Geolocation Trigger
  const handleUseDeviceLocation = () => {
    if (!navigator?.geolocation) {
      setFeedbackMsg("Geolocation not supported by device.");
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        onChange(lat, lng);
        setGpsLoading(false);
        setFeedbackMsg("Device GPS location pinned!");
        setTimeout(() => setFeedbackMsg(null), 3000);
      },
      (error) => {
        setGpsLoading(false);
        setFeedbackMsg(`GPS capture unavailable: ${error.message}`);
        setTimeout(() => setFeedbackMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reset to Suburb Centroid
  const handleResetToSuburb = () => {
    onChange(suburbCoords[0], suburbCoords[1]);
    setFeedbackMsg(`Reset to ${suburb} center.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  return (
    <div className="p-3 bg-neutral-50 border border-editorial-border space-y-2.5 font-geist">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-contour-red" />
          <label className="font-heading font-bold text-xs uppercase tracking-wider text-editorial-black">
            Property Location & Cadastral Pin
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUseDeviceLocation}
            disabled={disabled || gpsLoading}
            title="Use current device GPS location"
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-editorial-border text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-black flex items-center gap-1 transition-colors"
          >
            {gpsLoading ? (
              <ContourSunLoader size="sm" label="Finding your location…" decorative />
            ) : (
              <Crosshair className="w-3 h-3 text-contour-red" />
            )}
            <span>Use GPS</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSuburb}
            disabled={disabled}
            title={`Center on ${suburb}`}
            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-editorial-border text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted hover:text-editorial-black flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Center on {suburb}</span>
          </button>
        </div>
      </div>

      {/* Address & Landmark Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-editorial-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search address, road, or Lusaka landmark (e.g. Centro Mall, Leopards Hill Rd)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery && searchResults.length > 0 && setShowDropdown(true)}
            className="w-full bg-white pl-8 pr-8 py-1.5 border border-editorial-border text-xs text-editorial-black placeholder:text-editorial-muted focus:outline-none focus:border-editorial-black"
          />
          {isSearching && (
            <ContourSunLoader size="sm" label="Searching addresses…" decorative className="absolute right-2.5" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-editorial-border shadow-md max-h-48 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={`${res.name}-${i}`}
                type="button"
                onClick={() => handleSelectLocation(res)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between border-b border-neutral-100 last:border-b-0"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3 h-3 text-contour-red shrink-0" />
                  <span className="font-semibold text-editorial-black truncate">{res.name}</span>
                </div>
                {res.suburb && (
                  <span className="text-[10px] text-editorial-muted uppercase tracking-wider shrink-0 ml-2 font-mono">
                    {res.suburb}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Canvas */}
      <div className="h-52 w-full border border-editorial-border overflow-hidden relative">
        <DynamicLeafletCanvas
          latitude={activeLat}
          longitude={activeLng}
          suburb={suburb}
          onChangeCoordinates={(lat, lng) => onChange(lat, lng)}
          interactive={!disabled}
        />

        {/* Floating Instruction / Toast */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono">
            {feedbackMsg ? (
              <strong className="text-emerald-400">{feedbackMsg}</strong>
            ) : (
              "Click map or drag pin to fine-tune stand position"
            )}
          </span>
          <span className="px-1.5 py-0.5 bg-white/90 border border-editorial-border text-[9px] font-mono text-editorial-black">
            OSM Cadastre
          </span>
        </div>
      </div>

      {/* Manual Coordinates Direct Inputs */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <div>
          <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted mb-0.5">
            Latitude (GPS)
          </label>
          <input
            type="number"
            step="0.000001"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleLatBlur}
            disabled={disabled}
            placeholder="-15.4215"
            className="w-full bg-white px-2 py-1 border border-editorial-border text-xs font-mono text-editorial-black focus:outline-none focus:border-editorial-black"
          />
        </div>

        <div>
          <label className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-editorial-muted mb-0.5">
            Longitude (GPS)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleLngBlur}
            disabled={disabled}
            placeholder="28.3345"
            className="w-full bg-white px-2 py-1 border border-editorial-border text-xs font-mono text-editorial-black focus:outline-none focus:border-editorial-black"
          />
        </div>
      </div>
    </div>
  );
}
