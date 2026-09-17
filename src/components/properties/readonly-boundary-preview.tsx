"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExtractedBeacon } from "./title-deed-ocr-uploader";

interface ReadonlyBoundaryPreviewProps {
  standBoundary: [number, number][];
  beacons?: ExtractedBeacon[];
}

export default function ReadonlyBoundaryPreview({
  standBoundary,
  beacons = [],
}: ReadonlyBoundaryPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!standBoundary || standBoundary.length < 3) return;

    // Calculate center
    const lats = standBoundary.map((p) => p[0]);
    const lngs = standBoundary.map((p) => p[1]);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 17,
      scrollWheelZoom: false,
      attributionControl: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
    }).addTo(map);

    // Draw the verified stand boundary polygon
    const latLngPairs = standBoundary.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
    const polygon = L.polygon(latLngPairs, {
      color: "#FA3600",
      weight: 3,
      fillColor: "#FA3600",
      fillOpacity: 0.22,
      dashArray: "3, 5",
    }).addTo(map);

    // Add Beacon Markers (A, B, C, D...)
    standBoundary.forEach(([lat, lng], idx) => {
      const beaconLabel = beacons[idx]?.pointLabel || String.fromCharCode(65 + idx);
      const icon = L.divIcon({
        className: "custom-beacon-icon",
        html: `<div style="background-color: #1C1C1A; color: white; border: 2px solid #FA3600; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; font-family: monospace; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border-radius: 2px;">${beaconLabel}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([lat, lng], { icon, interactive: false }).addTo(map);
    });

    // Fit map bounds to polygon
    try {
      map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
    } catch {
      // ignore
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [standBoundary, beacons]);

  return (
    <div className="relative w-full h-56 bg-zinc-100 border border-editorial-border overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-[400] bg-editorial-black/90 text-white text-[9px] font-mono px-2 py-0.5 border border-zinc-700 shadow-sm pointer-events-none">
        OCR CADASTRAL EVIDENCE • READ-ONLY
      </div>
    </div>
  );
}
