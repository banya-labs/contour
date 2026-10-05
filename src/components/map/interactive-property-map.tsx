"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Navigation,
  Bed,
  Bath,
  ExternalLink,
  Layers,
  Sparkles,
  MessageSquare,
  X,
  Building2,
  TrendingUp,
  Compass,
  Plus,
  Minus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { publicPropertyPath } from "@/lib/public-property";
import {
  ChoroplethLevel,
  CHOROPLETH_REGIONS,
  computeRegionStats,
  getChoroplethColor,
  getChoroplethOpacity,
  RegionStats,
} from "@/lib/choropleth-geo-data";

import type { PropertyMapItem } from "@/types/property-map";
export type { PropertyMapItem } from "@/types/property-map";

type InteractivePropertyMapProps = {
  properties: PropertyMapItem[];
  initialCenter?: [number, number];
  initialZoom?: number;
  onSelectProperty?: (property: PropertyMapItem) => void;
  className?: string;
  // External search & filter from Page Header
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterType?: string;
  onFilterChange?: (filter: string) => void;
  suburbIntelOpen?: boolean;
  onToggleSuburbIntel?: () => void;
  selectedPropertyId?: string | null;
  // Choropleth View Props
  viewMode?: "STANDARD" | "CHOROPLETH";
  onViewModeChange?: (mode: "STANDARD" | "CHOROPLETH") => void;
  minimal?: boolean;
  searchPosition?: "top" | "bottom";
  hideZoomControls?: boolean;
  hideLocateButton?: boolean;
};

const DEFAULT_LUSAKA_CENTER: [number, number] = [-15.4167, 28.2833];
const CARDS_PER_PAGE = 3;

function getStatusColor(listingType: string, status: string): string {
  if (status === "SOLD") return "#10b981"; // Emerald
  if (status === "RENTED") return "#3b82f6"; // Cobalt
  if (listingType === "FOR_RENT") return "#f59e0b"; // Amber Yellow
  return "#FA3600"; // Contour Burgundy / Red
}

function createMarkerIconSvg(color: string) {
  return `
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 41C16 41 29 27.8 29 16.5C29 8.7 23.18 2.5 16 2.5C8.82 2.5 3 8.7 3 16.5C3 27.8 16 41 16 41Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="16" cy="16.5" r="6" fill="#ffffff"/>
    </svg>
  `;
}


const PRESET_BUTTONS = [
  { label: "🛏️ 3 Bedrooms", query: "3 bedroom" },
  { label: "🏠 4 Bedrooms", query: "4 bedroom" },
  { label: "🏊 Swimming Pool", query: "swimming pool" },
  { label: "🏡 Gated Estate", query: "estate" },
  { label: "🟡 For Rent", query: "For Rent" },
  { label: "🔴 For Sale", query: "For Sale" },
];

export default function InteractivePropertyMap({
  properties,
  initialCenter = DEFAULT_LUSAKA_CENTER,
  initialZoom = 13,
  onSelectProperty,
  className = "",
  searchQuery: externalSearchQuery,
  onSearchChange,
  filterType: externalFilterType,
  onFilterChange,
  suburbIntelOpen = false,
  onToggleSuburbIntel,
  selectedPropertyId: externalSelectedPropertyId,
  viewMode: externalViewMode,
  onViewModeChange,
  minimal = false,
  searchPosition,
  hideZoomControls = false,
  hideLocateButton = false,
}: InteractivePropertyMapProps) {
  const isBottomSearch = searchPosition === "bottom" || minimal;
  const shouldHideZoom = hideZoomControls || minimal;
  const shouldHideLocate = hideLocateButton || minimal;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const choroplethLayerGroupRef = useRef<any>(null);

  // Choropleth View Mode & Hierarchy State
  const [internalViewMode, setInternalViewMode] = useState<"STANDARD" | "CHOROPLETH">("STANDARD");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  const [choroplethLevel, setChoroplethLevel] = useState<ChoroplethLevel>("COUNTRY");
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>("country-zambia");
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>("prov-lusaka");
  const [hoveredRegionStats, setHoveredRegionStats] = useState<RegionStats | null>(null);

  const [flyToSearchQuery, setFlyToSearchQuery] = useState<string>("");

  // Fallback internal state
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalFilterType, setInternalFilterType] = useState<string>("ALL");

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const filterType = externalFilterType !== undefined ? externalFilterType : internalFilterType;

  const [activePropertyId, setActivePropertyId] = useState<string | null>(
    externalSelectedPropertyId !== undefined ? externalSelectedPropertyId : null
  );

  // Synchronize activePropertyId whenever external selection changes
  useEffect(() => {
    if (externalSelectedPropertyId !== undefined) {
      setActivePropertyId(externalSelectedPropertyId);
    }
  }, [externalSelectedPropertyId]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  // Floating Map Keyword Filter State
  const [filterInput, setFilterInput] = useState("");

  // Handle Search input change
  const handleSearchUpdate = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
    setCurrentPage(0);
  };

  // Filter properties by normal search term, status filter, and AI filter
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(lowerQuery) ||
        p.suburb.toLowerCase().includes(lowerQuery) ||
        (p.landmarkDirections && p.landmarkDirections.toLowerCase().includes(lowerQuery)) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
        (p.features && p.features.some((f) => f.toLowerCase().includes(lowerQuery))) ||
        (lowerQuery.includes("3 bed") && p.bedrooms === 3) ||
        (lowerQuery.includes("4 bed") && p.bedrooms === 4) ||
        (lowerQuery.includes("pool") && (p.description?.toLowerCase().includes("pool") || p.features?.some(f => f.toLowerCase().includes("pool"))));

      const matchesFilter =
        filterType === "ALL" ||
        (filterType === "FOR_SALE" && p.listingType === "FOR_SALE") ||
        (filterType === "FOR_RENT" && p.listingType === "FOR_RENT") ||
        (filterType === "SOLD" && p.status === "SOLD") ||
        (filterType === "RENTED" && p.status === "RENTED");

      return matchesSearch && matchesFilter;
    });
  }, [properties, searchQuery, filterType]);

  const propertiesWithCoords = useMemo(() => {
    return filteredProperties.filter((p) => p.latitude != null && p.longitude != null);
  }, [filteredProperties]);

  const totalPages = Math.ceil(propertiesWithCoords.length / CARDS_PER_PAGE);
  const paginatedProperties = useMemo(() => {
    const start = currentPage * CARDS_PER_PAGE;
    return propertiesWithCoords.slice(start, start + CARDS_PER_PAGE);
  }, [propertiesWithCoords, currentPage]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      leafletRef.current = L;

      if (!isMounted || !mapContainerRef.current) return;

      // Ensure no stale _leaflet_id is attached to the DOM element
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        doubleClickZoom: false, // Disable default map dblclick zoom to handle custom property stand zoom
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
      setMapLoaded(true);

      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [initialCenter, initialZoom]);

  // Handle mobile orientation changes & window resize to ensure full-bleed map without blank tiles
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    const handleResize = () => {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 120);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [mapLoaded]);

  // Choropleth Layer Rendering & Hierarchical Drill-Down Effect
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    async function renderChoropleth() {
      const L = leafletRef.current || (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (!choroplethLayerGroupRef.current) {
        choroplethLayerGroupRef.current = L.layerGroup().addTo(map);
      }
      const group = choroplethLayerGroupRef.current;
      group.clearLayers();

      if (viewMode !== "CHOROPLETH") return;

      // Filter regions matching active level & parent
      const activeRegions = CHOROPLETH_REGIONS.filter((r) => {
        if (r.level !== choroplethLevel) return false;
        if (choroplethLevel === "PROVINCE" && selectedCountryId) {
          return r.parentId === selectedCountryId;
        }
        if (choroplethLevel === "DISTRICT" && selectedProvinceId) {
          return r.parentId === selectedProvinceId;
        }
        return true;
      });

      // Calculate stats for all active regions to determine max count scale
      const statsList = activeRegions.map((r) => computeRegionStats(r, propertiesWithCoords));
      const maxCount = Math.max(...statsList.map((s) => s.totalCount), 1);

      activeRegions.forEach((region) => {
        const stats = computeRegionStats(region, propertiesWithCoords);
        const fillColor = getChoroplethColor(stats.totalCount, maxCount);
        const opacity = getChoroplethOpacity(stats.totalCount);

        const polygon = L.polygon(region.coordinates, {
          color: stats.totalCount > 0 ? "#FA3600" : "#cccccc",
          weight: stats.totalCount > 0 ? 2 : 1,
          fillColor: fillColor || undefined,
          fillOpacity: opacity,
        }).addTo(group);

        // Render Region Center Label Badge
        const badgeHtml = `<div style="background:rgba(39,37,30,0.92); color:#ffffff; font-weight:800; font-size:11px; padding:3px 10px; border-radius:9999px; border:1px solid #E57A1A; box-shadow:0 2px 8px rgba(0,0,0,0.3); white-space:nowrap; text-align:center;">${region.name} <span style="background:#FA3600; padding:1px 6px; border-radius:9999px; font-size:10px; margin-left:4px;">${stats.totalCount} Mandates</span></div>`;
        const badgeIcon = L.divIcon({
          className: "choropleth-badge-label",
          html: badgeHtml,
          iconSize: [160, 26],
          iconAnchor: [80, 13],
        });
        L.marker(region.center, { icon: badgeIcon }).addTo(group);

        // Hover events
        polygon.on("mouseover", () => {
          polygon.setStyle({ weight: 4, color: "#E57A1A", fillOpacity: Math.min(opacity + 0.2, 0.9) });
          setHoveredRegionStats(stats);
        });

        polygon.on("mouseout", () => {
          polygon.setStyle({ weight: 2, color: "#FA3600", fillOpacity: opacity });
        });

        // Click drill-down event
        polygon.on("click", () => {
          if (region.level === "COUNTRY") {
            setSelectedCountryId(region.id);
            setChoroplethLevel("PROVINCE");
            map.flyTo(region.center, region.zoom, { duration: 1.2 });
          } else if (region.level === "PROVINCE") {
            setSelectedProvinceId(region.id);
            setChoroplethLevel("DISTRICT");
            map.flyTo(region.center, region.zoom, { duration: 1.2 });
          } else if (region.level === "DISTRICT") {
            map.flyTo(region.center, 15, { duration: 1.2 });
            // Switch to standard view to view property markers!
            setInternalViewMode("STANDARD");
            if (onViewModeChange) onViewModeChange("STANDARD");
          }
        });
      });
    }

    renderChoropleth();
  }, [viewMode, choroplethLevel, selectedCountryId, selectedProvinceId, propertiesWithCoords, mapLoaded]);

  const LUSAKA_SUBURBS: Record<string, [number, number]> = {
    kabulonga: [-15.4211, 28.3341],
    roma: [-15.3789, 28.3012],
    "roma park": [-15.375, 28.305],
    "leopards hill": [-15.4612, 28.3989],
    woodlands: [-15.4389, 28.3211],
    "mass media": [-15.4056, 28.3189],
    sunningdale: [-15.4289, 28.3289],
    chudleigh: [-15.385, 28.329],
    kalundu: [-15.391, 28.322],
    rhodespark: [-15.412, 28.291],
  };

  const handleFlyToAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyToSearchQuery.trim() || !mapInstanceRef.current) return;
    const q = flyToSearchQuery.toLowerCase().trim();
    const matchedKey = Object.keys(LUSAKA_SUBURBS).find((key) => q.includes(key));
    if (matchedKey) {
      const coords = LUSAKA_SUBURBS[matchedKey];
      mapInstanceRef.current.flyTo(coords, 17, { duration: 1.5 });
    } else {
      mapInstanceRef.current.flyTo(DEFAULT_LUSAKA_CENTER, 16, { duration: 1.5 });
    }
  };

  // Update Map Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersGroupRef.current) return;

    async function updateMarkers() {
      const L = leafletRef.current || (await import("leaflet")).default;
      const markersGroup = markersGroupRef.current;

      if (markersGroup) markersGroup.clearLayers();
      markersMapRef.current.clear();

      if (propertiesWithCoords.length === 0) return;

      const bounds = L.latLngBounds([]);

      propertiesWithCoords.forEach((property) => {
        const lat = property.latitude!;
        const lng = property.longitude!;
        const color = getStatusColor(property.listingType, property.status);

        // 2. Custom Marker Pin
        const customIcon = L.divIcon({
          className: "custom-property-marker",
          html: createMarkerIconSvg(color),
          iconSize: [32, 42],
          iconAnchor: [16, 41],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const priceText =
          property.listingType === "FOR_RENT"
            ? `${formatCurrency(property.rentalPrice, property.currency)} / mo`
            : formatCurrency(property.askingPrice, property.currency);

        const heroImage =
          property.featuredPhoto ||
          property.photos[0] ||
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80";

        const popupContent = `
          <div style="width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="position: relative; width: 100%; height: 120px; border-radius: 0px; overflow: hidden; margin-bottom: 8px; border: 1px solid #e0e0e0;">
              <img src="${heroImage}" alt="${property.title}" style="width:100%; height:100%; object-fit: cover;" />
              <span style="position: absolute; top: 6px; left: 6px; background: #111111; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 0px; font-family: monospace;">
                ${property.listingType === "FOR_RENT" ? "FOR RENT" : "FOR SALE"}
              </span>
            </div>
            <div style="font-weight: 700; font-size: 14px; color: #111111; line-height: 1.2; margin-bottom: 2px;">
              ${property.title}
            </div>
            <div style="font-size: 11px; color: #6a6860; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <span>📍 ${property.suburb}, ${property.city}</span>
            </div>
            ${
              property.landmarkDirections
                ? `<div style="font-size: 10px; background: #f6f2e8; color: #3d3a31; padding: 4px 6px; border-radius: 6px; margin-bottom: 8px;">
                    🧭 ${property.landmarkDirections}
                   </div>`
                : ""
            }
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #ece5d8; padding-top: 8px;">
              <span style="font-weight: 800; font-size: 13px; color: #FA3600;">
                ${priceText}
              </span>
              <a href="${publicPropertyPath(property.organizationSlug || "organization", property.slug)}" style="display: inline-flex; align-items: center; gap: 4px; background: #27251e; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">
                View Card
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Click handler on marker
        marker.on("click", () => {
          setActivePropertyId(property.id);
          if (onSelectProperty) onSelectProperty(property);
        });

        // Double click handler on marker: zoom in on the location pin
        marker.on("dblclick", (e: any) => {
          if (e.originalEvent) e.originalEvent.stopPropagation();
          setActivePropertyId(property.id);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 18, {
              duration: 1.5,
            });
          }
          marker.openPopup();
          if (onSelectProperty) onSelectProperty(property);
        });

        if (markersGroup) marker.addTo(markersGroup);
        markersMapRef.current.set(property.id, marker);

        bounds.extend([lat, lng]);
      });

      if (propertiesWithCoords.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }

    updateMarkers();
  }, [propertiesWithCoords, mapLoaded, onSelectProperty]);

  // Pan Map smoothly to property (handles card click)
  const handleCardClick = (property: PropertyMapItem) => {
    setActivePropertyId(property.id);
    if (mapInstanceRef.current) {
      if (property.latitude != null && property.longitude != null) {
        mapInstanceRef.current.flyTo([property.latitude, property.longitude], 16, {
          duration: 1.2,
        });
      }
      const marker = markersMapRef.current.get(property.id);
      if (marker) {
        marker.openPopup();
      }
    }
    if (onSelectProperty) onSelectProperty(property);
  };

  // User location trigger
  const handleLocateUser = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current.flyTo([latitude, longitude], 15);
      });
    }
  };

  // Reset fit bounds
  const handleFitBounds = () => {
    if (mapInstanceRef.current && propertiesWithCoords.length > 0) {
      async function fit() {
        const L = (await import("leaflet")).default;
        const bounds = L.latLngBounds(
          propertiesWithCoords.map((p) => [p.latitude!, p.longitude!])
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
      }
      fit();
    }
  };

  // Handle Map Quick Search Filter Submission
  const handleMapFilter = (customPrompt?: string) => {
    const prompt = (customPrompt !== undefined ? customPrompt : filterInput).trim();
    handleSearchUpdate(prompt);
    setFilterInput(prompt);
  };

  const handleClearFilter = () => {
    handleSearchUpdate("");
    setFilterInput("");
  };

  return (
    <div data-map-minimal={minimal ? "true" : undefined} className={`relative w-full h-full flex flex-col rounded-2xl overflow-hidden border border-border shadow-card bg-paper-100 ${className}`}>
      
      {/* 1. MAP SEARCH BAR WITH FILTER PRESETS */}
      <div className={`map-search-shell absolute ${isBottomSearch ? "bottom-4" : "top-4"} left-1/2 -translate-x-1/2 z-[1000] max-w-xl w-full px-4 pointer-events-none font-sans flex ${isBottomSearch ? "flex-col-reverse" : "flex-col"} items-center gap-2`}>
        {/* Clean Input Bar */}
        <div className="relative w-full group pointer-events-auto">
          <div className="relative w-full flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3.5 sm:px-4 py-2 rounded-none border border-editorial-border shadow-sm">
            <div className="w-7 h-7 rounded-none shrink-0 bg-neutral-100 border border-editorial-border flex items-center justify-center text-editorial-black">
              <Search className="w-3.5 h-3.5" />
            </div>

            <input
              type="text"
              placeholder="Filter by suburb, stand #, bedrooms, features..."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleMapFilter();
                }
              }}
              className="flex-1 bg-transparent text-xs sm:text-sm text-editorial-black placeholder:text-editorial-muted focus:outline-none font-geist"
            />

            {filterInput && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="p-1 hover:bg-neutral-100 text-editorial-muted hover:text-editorial-black"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => handleMapFilter()}
              className="px-3.5 py-1.5 rounded-none bg-editorial-black hover:bg-contour-red text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="map-search-presets pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
          {PRESET_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleMapFilter(btn.query)}
              className="bg-white/95 hover:bg-white text-editorial-black px-2.5 py-1 rounded-none border border-editorial-border text-[11px] font-mono shadow-xs hover:border-contour-red/40 transition-colors flex items-center gap-1"
            >
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🗺️ CHOROPLETH DRILL-DOWN BREADCRUMB & CONTROL BAR */}
      {viewMode === "CHOROPLETH" && !minimal && (
        <div className="absolute top-4 left-4 z-[1100] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-border shadow-floating flex items-center gap-2 text-xs font-sans">
          <span className="font-bold text-contour-red flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-contour-amber" />
            <span>Choropleth</span>
          </span>

          <span className="text-paper-400">/</span>

          <button
            onClick={() => {
              setChoroplethLevel("COUNTRY");
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo(DEFAULT_LUSAKA_CENTER, 6, { duration: 1 });
            }}
            className={`font-semibold transition-colors hover:text-contour-red ${
              choroplethLevel === "COUNTRY" ? "text-ink-900 font-bold" : "text-ink-600"
            }`}
          >
            Southern Africa
          </button>

          {choroplethLevel !== "COUNTRY" && (
            <>
              <span className="text-paper-400">/</span>
              <button
                onClick={() => {
                  setChoroplethLevel("PROVINCE");
                  if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-15.4167, 28.2833], 8, { duration: 1 });
                }}
                className={`font-semibold transition-colors hover:text-contour-red ${
                  choroplethLevel === "PROVINCE" ? "text-ink-900 font-bold" : "text-ink-600"
                }`}
              >
                🇿🇲 Zambia
              </button>
            </>
          )}

          {choroplethLevel === "DISTRICT" && (
            <>
              <span className="text-paper-400">/</span>
              <span className="font-bold text-ink-900">📍 Lusaka Province</span>
            </>
          )}
        </div>
      )}

      {/* 📊 CHOROPLETH HOVER TOOLTIP LEGEND CARD */}
      {viewMode === "CHOROPLETH" && hoveredRegionStats && !minimal && (
        <div className="absolute bottom-6 left-4 z-[1100] w-72 bg-ink-900/95 text-white backdrop-blur-xl p-3.5 rounded-2xl border border-paper-300 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="text-[9px] font-bold text-contour-amber uppercase tracking-wider">
                {hoveredRegionStats.level} LEVEL DENSITY
              </span>
              <h4 className="font-serif font-bold text-sm text-white">{hoveredRegionStats.name}</h4>
            </div>
            <div className="bg-contour-red px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {hoveredRegionStats.totalCount} Mandates
            </div>
          </div>

          {/* Breakdown Bars */}
          <div className="space-y-1.5 text-xs">
            {/* For Sale */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-contour-red inline-block" />
                  <span>For Sale</span>
                </span>
                <span className="font-mono font-bold">{hoveredRegionStats.forSaleCount}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-contour-red h-full rounded-full"
                  style={{
                    width: `${hoveredRegionStats.totalCount > 0 ? (hoveredRegionStats.forSaleCount / hoveredRegionStats.totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Sold */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Sold</span>
                </span>
                <span className="font-mono font-bold">{hoveredRegionStats.soldCount}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${hoveredRegionStats.totalCount > 0 ? (hoveredRegionStats.soldCount / hoveredRegionStats.totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Up For Rent */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>For Rent</span>
                </span>
                <span className="font-mono font-bold">{hoveredRegionStats.forRentCount}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{
                    width: `${hoveredRegionStats.totalCount > 0 ? (hoveredRegionStats.forRentCount / hoveredRegionStats.totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Rented */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Rented / Leased</span>
                </span>
                <span className="font-mono font-bold">{hoveredRegionStats.rentedCount}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${hoveredRegionStats.totalCount > 0 ? (hoveredRegionStats.rentedCount / hoveredRegionStats.totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pricing Insight */}
          {hoveredRegionStats.avgAskingPrice > 0 && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-paper-200">
              <span>Avg Asking Price:</span>
              <span className="font-mono font-bold text-contour-amber">
                {formatCurrency(hoveredRegionStats.avgAskingPrice, hoveredRegionStats.currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Map Render Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 min-h-0" />

      {/* Dockable Suburb Intelligence Drawer Overlay */}
      {suburbIntelOpen && !minimal && (
        <div className="absolute top-16 right-4 bottom-24 z-[1000] w-80 bg-white/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 flex flex-col space-y-3 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-contour-red" />
              <h3 className="font-serif font-bold text-sm text-ink-900">Lusaka Suburb Intel</h3>
            </div>
            <button
              onClick={onToggleSuburbIntel}
              className="p-1 text-ink-600 hover:text-ink-900 hover:bg-paper-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-ink-600">
            Real-time visual density & average market pricing across active Lusaka agency mandates.
          </p>

          <div className="space-y-2 flex-1">
            {[
              { suburb: "Kabulonga", count: "8 Mandates", avgPrice: "K 3,200,000", tag: "Prime Residential" },
              { suburb: "Leopards Hill", count: "12 Mandates", avgPrice: "$ 2,400 / mo", tag: "Diplomatic Belt" },
              { suburb: "Roma Park", count: "5 Mandates", avgPrice: "$ 850,000", tag: "Commercial / Mixed" },
              { suburb: "Woodlands", count: "9 Mandates", avgPrice: "K 18,500 / mo", tag: "High-Yield Rentals" },
              { suburb: "Mass Media", count: "4 Mandates", avgPrice: "K 35,000 / mo", tag: "Commercial Hub" },
              { suburb: "Sunningdale", count: "6 Mandates", avgPrice: "K 4,200,000", tag: "Luxury Villas" },
            ].map((area) => (
              <div
                key={area.suburb}
                onClick={() => {
                  handleSearchUpdate(area.suburb);
                  if (onToggleSuburbIntel) onToggleSuburbIntel();
                }}
                className="bg-paper-100 hover:bg-paper-200 cursor-pointer rounded-xl p-3 border border-border/60 transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-ink-900">{area.suburb}</span>
                  <span className="text-[9px] bg-contour-red/10 px-2 py-0.5 rounded-full font-bold text-contour-red">
                    {area.tag}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-ink-900">
                  {area.avgPrice}
                </div>
                <div className="text-[10px] text-ink-600 mt-0.5">
                  {area.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Property Cards Carousel */}
      {propertiesWithCoords.length > 0 && !minimal && (
        <div className="map-property-carousel absolute bottom-4 left-4 right-4 z-[1010] pointer-events-none">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Cards Grid / Mobile Horizontal Swipe Carousel */}
            <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pointer-events-auto pb-1">
              {paginatedProperties.map((property) => {
                const isActive = activePropertyId === property.id;
                const priceText =
                  property.listingType === "FOR_RENT"
                    ? `${formatCurrency(property.rentalPrice, property.currency)} / mo`
                    : formatCurrency(property.askingPrice, property.currency);

                const heroImage =
                  property.featuredPhoto ||
                  property.photos[0] ||
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80";

                return (
                  <div
                    key={property.id}
                    onClick={() => handleCardClick(property)}
                    className={`cursor-pointer group flex bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border transition-all duration-200 shadow-floating w-[82vw] max-w-[340px] md:w-auto shrink-0 snap-center md:shrink ${
                      isActive
                        ? "border-contour-red ring-2 ring-contour-red/20 scale-[1.02] relative z-30 shadow-2xl"
                        : "border-border hover:border-ink-600/40 relative z-10"
                    }`}
                  >
                    <div className="relative w-20 sm:w-24 h-20 sm:h-24 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={heroImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{
                          backgroundColor: getStatusColor(property.listingType, property.status),
                        }}
                      >
                        {property.listingType === "FOR_RENT" ? "RENT" : "SALE"}
                      </span>
                    </div>

                    <div className="ml-3 flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-ink-600 uppercase tracking-wider">
                            {property.suburb}
                          </span>
                          <span className="text-xs font-mono font-bold text-contour-red">
                            {priceText}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-ink-900 truncate mt-0.5" title={property.title}>
                          {property.title}
                        </h4>
                        {property.landmarkDirections && (
                          <p className="text-[10px] text-ink-600 truncate mt-0.5" title={property.landmarkDirections}>
                            🧭 {property.landmarkDirections}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-paper-300 text-[10px] text-ink-600">
                        <div className="flex items-center gap-2">
                          {property.bedrooms && (
                            <span className="flex items-center gap-0.5">
                              <Bed className="w-3 h-3" /> {property.bedrooms}
                            </span>
                          )}
                          {property.bathrooms && (
                            <span className="flex items-center gap-0.5">
                              <Bath className="w-3 h-3" /> {property.bathrooms}
                            </span>
                          )}
                        </div>
                        <Link
                          href={publicPropertyPath(property.organizationSlug || "organization", property.slug)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-semibold text-ink-900 hover:text-contour-red flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pointer-events-auto flex items-center justify-center gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 bg-white/90 backdrop-blur-md rounded-full border border-border shadow-subtle disabled:opacity-40 text-ink-900"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-border text-ink-800">
                  Page {currentPage + 1} of {totalPages} ({propertiesWithCoords.length} properties)
                </span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="p-1.5 bg-white/90 backdrop-blur-md rounded-full border border-border shadow-subtle disabled:opacity-40 text-ink-900"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
