"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PropertyMapPoint {
  id: string;
  title: string;
  suburb: string;
  category?: string;
  type: "FOR SALE" | "FOR RENT";
  priceUSD: string;
  priceZMW: string;
  priceUsd?: string;
  priceZmw?: string;
  badgePrice: string;
  rawPrice?: number;
  commission: string;
  commissionZmw?: string;
  coordinates: [number, number];
  bedrooms?: number;
  bathrooms?: number;
  plotSize?: string;
  standSize?: string;
  standNumber: string;
  mandateType?: string;
  landmark?: string;
  landmarkDirections?: string;
  elevation?: string;
  status?: string;
  image?: string;
  featuredImage?: string;
  titleDeedNumber?: string;
  standBoundary?: [number, number][];
}

export type AgencyMapItem = PropertyMapPoint;

interface AgencyLeafletCanvasProps {
  properties: PropertyMapPoint[];
  selectedProperty: PropertyMapPoint | null;
  onSelectProperty: (property: PropertyMapPoint) => void;
  onActionClick?: (action: string, property: PropertyMapPoint) => void;
}

export default function AgencyLeafletCanvas({
  properties,
  selectedProperty,
  onSelectProperty,
  onActionClick,
}: AgencyLeafletCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const polygonRef = useRef<L.Polygon | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Ensure Leaflet CSS & Custom Pin styling is injected
    if (!document.getElementById("leaflet-custom-pins-css")) {
      const style = document.createElement("style");
      style.id = "leaflet-custom-pins-css";
      style.innerHTML = `
        .custom-agency-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          font-family: inherit;
          background-color: #f5f0e8;
        }
      `;
      document.head.appendChild(style);
    }

    // Default center on Lusaka Prime Real Estate Corridor (Rhodes Park / Kabulonga)
    const initialCenter: L.LatLngTuple = selectedProperty
      ? [selectedProperty.coordinates[0], selectedProperty.coordinates[1]]
      : [-15.418, 28.328];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, high-performance OpenStreetMap standard tiles (Zero API key required, zero watermarks)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Zoom control on top right
    L.control.zoom({ position: "topright" }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size immediately and after layout settle
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    properties.forEach((prop) => {
      const isSelected = selectedProperty?.id === prop.id;
      const isForSale = prop.type === "FOR SALE";

      const iconHtml = `
        <div class="group relative cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-300 pointer-events-auto">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-tight shadow-md border transition-all ${
            isSelected
              ? "bg-[#16382B] text-[#E8C265] border-[#E8C265] scale-110 ring-4 ring-[#C89B3C]/30 z-50 shadow-xl"
              : isForSale
              ? "bg-white text-[#16382B] border-stone-300 hover:border-[#16382B] hover:scale-105"
              : "bg-[#FDFBF7] text-[#FA3600] border-stone-300 hover:border-[#FA3600] hover:scale-105"
          }">
            <span class="w-2 h-2 rounded-full shrink-0 ${
              isSelected ? "bg-[#E8C265] animate-ping" : isForSale ? "bg-emerald-500" : "bg-amber-500"
            }"></span>
            <span class="whitespace-nowrap">${prop.badgePrice}</span>
          </div>
          <div class="w-2.5 h-2.5 rotate-45 mx-auto -mt-1 shadow-sm ${
            isSelected ? "bg-[#16382B]" : "bg-stone-300"
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-agency-pin",
        iconSize: [120, 50],
        iconAnchor: [60, 50],
      });

      const marker = L.marker(prop.coordinates, { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        onSelectProperty(prop);
        map.flyTo(prop.coordinates, 15, { duration: 0.8 });
      });

      markersRef.current[prop.id] = marker;
    });

    // Invalidate size to ensure markers are placed precisely
    map.invalidateSize();
  }, [properties, selectedProperty, onSelectProperty]);

  // Handle Selected Property Pan & Cadastral Boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedProperty) return;

    map.flyTo(selectedProperty.coordinates, 15, { duration: 0.8 });
    setTimeout(() => map.invalidateSize(), 300);

    // Draw stand boundary polygon if available
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (selectedProperty.standBoundary && selectedProperty.standBoundary.length >= 3) {
      const poly = L.polygon(selectedProperty.standBoundary, {
        color: "#C89B3C",
        weight: 2.5,
        dashArray: "5, 5",
        fillColor: "#16382B",
        fillOpacity: 0.18,
      }).addTo(map);
      polygonRef.current = poly;
    }
  }, [selectedProperty]);

  return (
    <div className="w-full h-[640px] relative z-0">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: "640px", width: "100%" }}
      />
    </div>
  );
}
