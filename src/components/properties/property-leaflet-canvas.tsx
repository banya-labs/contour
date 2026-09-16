"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyLeafletCanvasProps {
  title: string;
  suburb: string;
  city: string;
  priceText: string;
  latitude: number;
  longitude: number;
  standBoundary?: [number, number][] | null;
  landmarkDirections?: string | null;
  featuredPhoto?: string | null;
}

export default function PropertyLeafletCanvas({
  title,
  suburb,
  city,
  priceText,
  latitude,
  longitude,
  standBoundary,
  landmarkDirections,
  featuredPhoto,
}: PropertyLeafletCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Inject custom styling for Leaflet marker and pin animation if needed
    if (!document.getElementById("leaflet-single-property-pins-css")) {
      const style = document.createElement("style");
      style.id = "leaflet-single-property-pins-css";
      style.innerHTML = `
        .custom-single-prop-pin {
          background: transparent !important;
          border: none !important;
        }
        .single-pin-pulse {
          animation: pinPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pinPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.4); opacity: 0.2; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0px !important;
          border: 1px solid #e0e0e0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
      `;
      document.head.appendChild(style);
    }

    const center: L.LatLngTuple = [latitude, longitude];

    // Initialize Map with clean settings (disable scroll wheel zoom by default to preserve smooth page scroll)
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 15,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    // Clean OpenStreetMap standard tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // 1. Draw Stand Cadastral Boundary if available
    if (standBoundary && standBoundary.length >= 3) {
      const polygonPoints = standBoundary.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      L.polygon(polygonPoints, {
        color: "#FA3600",
        weight: 2.5,
        fillColor: "#FA3600",
        fillOpacity: 0.18,
        dashArray: "4, 4",
      }).addTo(map);
    }

    // 2. Draw subtle neighborhood area indicator circle
    L.circle(center, {
      radius: 450,
      color: "#1C1C1A",
      weight: 1,
      dashArray: "3, 6",
      fillColor: "#FA3600",
      fillOpacity: 0.04,
    }).addTo(map);

    // 3. Custom Interactive Pin
    const pinHtml = `
      <div class="custom-single-prop-pin transform -translate-x-1/2 -translate-y-full cursor-pointer group pointer-events-auto">
        <div class="relative flex flex-col items-center">
          <!-- Floating Badge -->
          <div class="mb-1 flex items-center gap-1.5 bg-[#1C1C1A] text-white px-2.5 py-1 text-[10px] font-mono font-bold tracking-tight shadow-lg border border-[#3D3A31] whitespace-nowrap transition-transform group-hover:scale-105">
            <span class="w-2 h-2 rounded-full bg-[#FA3600] animate-pulse"></span>
            <span>${suburb}</span>
            <span class="text-[#9E9A90]">•</span>
            <span class="text-[#FA3600]">${priceText}</span>
          </div>

          <!-- Main Pin Icon -->
          <div class="relative flex items-center justify-center">
            <!-- Pulsing outer halo -->
            <div class="absolute w-8 h-8 rounded-full bg-[#FA3600] single-pin-pulse"></div>
            <!-- Pin Center -->
            <div class="relative w-6 h-6 rounded-full bg-[#FA3600] text-white flex items-center justify-center shadow-md border-2 border-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
          <!-- Ground shadow dot -->
          <div class="w-2 h-1 rounded-full bg-black/40 mt-0.5"></div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: pinHtml,
      className: "custom-single-prop-pin",
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -48],
    });

    const marker = L.marker(center, { icon }).addTo(map);

    // Rich Popup on Click
    const popupContent = `
      <div style="font-family: inherit; width: 220px; background: #ffffff; color: #1c1c1a;">
        ${featuredPhoto ? `
          <div style="width: 100%; height: 95px; overflow: hidden; position: relative;">
            <img src="${featuredPhoto}" style="width: 100%; height: 100%; object-fit: cover;" alt="${title}" />
          </div>
        ` : ""}
        <div style="padding: 10px 12px;">
          <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #fa3600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;">
            ${suburb}, ${city}
          </div>
          <div style="font-size: 11px; font-weight: 700; line-height: 1.3; color: #1c1c1a; margin-bottom: 6px;">
            ${title}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f0f0f0; padding-top: 6px;">
            <span style="font-size: 11px; font-family: monospace; font-weight: 800; color: #1c1c1a;">
              ${priceText}
            </span>
            <span style="font-size: 9px; font-family: monospace; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 2px 6px; border: 1px solid #a7f3d0;">
              GPS Verified
            </span>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Initial resize settle
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    mapInstanceRef.current = map;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, suburb, city, title, priceText, standBoundary, featuredPhoto]);

  return (
    <div className="relative w-full h-[340px] sm:h-[400px] overflow-hidden bg-[#FAF8F5]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Recenter button overlay */}
      <button
        type="button"
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
          }
        }}
        className="absolute bottom-3 right-3 z-20 bg-white/95 hover:bg-white text-editorial-black px-2.5 py-1.5 text-[11px] font-mono font-semibold border border-editorial-border shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        title="Recenter Map on Property Pin"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Recenter Pin</span>
      </button>
    </div>
  );
}
