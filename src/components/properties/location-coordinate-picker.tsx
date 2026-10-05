"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { hasValidCoordinates } from "@/lib/locations/map-coordinates";
import {
  MapPin,
  Search,
  Crosshair,
} from "lucide-react";
import { ContourSunLoader } from "@/components/ui/contour-sun-loader";
import { SectionPendingState } from "@/components/ui/section-pending-state";

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
  latitude?: number | null;
  longitude?: number | null;
  suburb: string;
  city?: string;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export default function LocationCoordinatePicker({
  latitude,
  longitude,
  suburb,
  city = "",
  onChange,
  disabled = false,
}: LocationCoordinatePickerProps) {
  const hasCoordinates = hasValidCoordinates(latitude, longitude);
  const activeLat = hasCoordinates ? latitude! : null;
  const activeLng = hasCoordinates ? longitude! : null;
  const [latInput, setLatInput] = useState<string>(activeLat?.toFixed(6) || "");
  const [lngInput, setLngInput] = useState<string>(activeLng?.toFixed(6) || "");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ name: string; suburb?: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync inputs when active coordinates update from map/props
  useEffect(() => {
    setLatInput(activeLat?.toFixed(6) || "");
    setLngInput(activeLng?.toFixed(6) || "");
  }, [activeLat, activeLng]);

  const searchCache = useRef(new Map<string, Array<{ name: string; suburb?: string; lat: number; lng: number }>>());
  const searchInFlight = useRef(false);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 3 || disabled || searchInFlight.current) return;
    const address = [query, city.trim()].filter(Boolean).join(", ");
    const cached = searchCache.current.get(address);
    if (cached) {
      setSearchResults(cached);
      setShowDropdown(true);
      return;
    }
    searchInFlight.current = true;
    setIsSearching(true);
    setFeedbackMsg(null);
    try {
      const response = await fetch(`/api/property-location-search?q=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error("Address search unavailable");
      const data: { results: Array<{ name: string; lat: number; lng: number }> } = await response.json();
      const matches = data.results.filter((item) => hasValidCoordinates(item.lat, item.lng));
      searchCache.current.set(address, matches);
      setSearchResults(matches);
      setShowDropdown(true);
      if (!matches.length) setFeedbackMsg("No matching address found. Try a city or more specific address.");
    } catch {
      setSearchResults([]);
      setFeedbackMsg("Address search unavailable. Use GPS, coordinates, or select a point on the map.");
    } finally {
      searchInFlight.current = false;
      setIsSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Select Search Result
  const handleSelectLocation = (loc: { name: string; lat: number; lng: number }) => {
    onChange(loc.lat, loc.lng);
    setSearchQuery(loc.name);
    setShowDropdown(false);
    setFeedbackMsg(`Selected: ${loc.name}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Commit only complete valid pairs, including zero latitude or longitude.
  const handleCoordinatesBlur = () => {
    if (!latInput.trim() || !lngInput.trim()) return;
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (hasValidCoordinates(lat, lng)) {
      onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      setFeedbackMsg(null);
    } else {
      setFeedbackMsg("Enter latitude from -90 to 90 and longitude from -180 to 180.");
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


        </div>
      </div>

      {/* Address & Landmark Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-editorial-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search address, city, road, or landmark..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); void handleSearch(); }
            }}
            onFocus={() => searchQuery && searchResults.length > 0 && setShowDropdown(true)}
            className="w-full bg-white pl-8 pr-8 py-1.5 border border-editorial-border text-xs text-editorial-black placeholder:text-editorial-muted focus:outline-none focus:border-editorial-black"
          />
          <button type="button" onClick={() => void handleSearch()} disabled={disabled || isSearching || searchQuery.trim().length < 3} className="ml-2 px-3 py-1.5 border border-editorial-border text-xs disabled:opacity-50">
            {isSearching ? <ContourSunLoader size="sm" label="Searching addresses…" decorative /> : "Search"}
          </button>
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
              hasCoordinates ? "Click map or drag pin to fine-tune position" : "No GPS location recorded. Search, use GPS, or click the map."
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
            onBlur={handleCoordinatesBlur}
            disabled={disabled}
            placeholder="Latitude"
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
            onBlur={handleCoordinatesBlur}
            disabled={disabled}
            placeholder="Longitude"
            className="w-full bg-white px-2 py-1 border border-editorial-border text-xs font-mono text-editorial-black focus:outline-none focus:border-editorial-black"
          />
        </div>
      </div>
    </div>
  );
}
