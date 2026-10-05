"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { hasValidCoordinates, WORLD_MAP_CENTER } from "@/lib/locations/map-coordinates";

interface LocationLeafletPickerCanvasProps {
  latitude: number | null;
  longitude: number | null;
  suburb: string;
  onChangeCoordinates: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function LocationLeafletPickerCanvas({
  latitude,
  longitude,
  onChangeCoordinates,
  interactive = true,
}: LocationLeafletPickerCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onChangeRef = useRef(onChangeCoordinates);
  onChangeRef.current = onChangeCoordinates;
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Inject custom pin styles if not present
    if (!document.getElementById("contour-picker-pin-css")) {
      const style = document.createElement("style");
      style.id = "contour-picker-pin-css";
      style.innerHTML = `
        .contour-picker-custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .contour-picker-pin {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        }
        .contour-picker-pulse {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(229, 122, 26, 0.35);
          animation: pickerPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pickerPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0.15; }
        }
      `;
      document.head.appendChild(style);
    }

    const map = L.map(mapContainerRef.current, {
      center: hasValidCoordinates(latitude, longitude) ? [latitude!, longitude!] : WORLD_MAP_CENTER,
      zoom: hasValidCoordinates(latitude, longitude) ? 15 : 2,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Custom pulse marker icon
    const createPinIcon = () =>
      L.divIcon({
        className: "contour-picker-custom-marker",
        html: `
          <div class="contour-picker-pin">
            <div class="contour-picker-pulse"></div>
            <div style="width: 22px; height: 22px; background: #E57A1A; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

    const createMarker = (lat: number, lng: number) => {
      const marker = L.marker([lat, lng], { icon: createPinIcon(), draggable: interactive, autoPan: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = map.wrapLatLng(marker.getLatLng());
        onChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });
      markerRef.current = marker;
      return marker;
    };
    if (hasValidCoordinates(latitude, longitude)) createMarker(latitude!, longitude!);
    if (interactive) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const position = map.wrapLatLng(e.latlng);
        const lat = Number(position.lat.toFixed(6));
        const lng = Number(position.lng.toFixed(6));
        if (!hasValidCoordinates(lat, lng)) return;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else createMarker(lat, lng);
        onChangeRef.current(lat, lng);
      });
    }

    mapInstanceRef.current = map;

    // Trigger resize after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, interactive]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[220px] bg-neutral-100 relative z-0 cursor-crosshair"
    />
  );
}
