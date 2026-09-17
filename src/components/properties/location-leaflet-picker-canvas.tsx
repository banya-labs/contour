"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationLeafletPickerCanvasProps {
  latitude: number;
  longitude: number;
  suburb: string;
  onChangeCoordinates: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function LocationLeafletPickerCanvas({
  latitude,
  longitude,
  suburb,
  onChangeCoordinates,
  interactive = true,
}: LocationLeafletPickerCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
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
      center: [latitude, longitude],
      zoom: 15,
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

    const marker = L.marker([latitude, longitude], {
      icon: createPinIcon(),
      draggable: interactive,
      autoPan: true,
    }).addTo(map);

    // Drag marker event
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const roundedLat = parseFloat(pos.lat.toFixed(6));
      const roundedLng = parseFloat(pos.lng.toFixed(6));
      onChangeCoordinates(roundedLat, roundedLng);
    });

    // Click map to reposition marker
    if (interactive) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const roundedLat = parseFloat(e.latlng.lat.toFixed(6));
        const roundedLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([roundedLat, roundedLng]);
        onChangeCoordinates(roundedLat, roundedLng);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Trigger resize after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map center & marker position when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const currentLatLng = markerRef.current.getLatLng();
    const isDifferent =
      Math.abs(currentLatLng.lat - latitude) > 0.00005 ||
      Math.abs(currentLatLng.lng - longitude) > 0.00005;

    if (isDifferent) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true, duration: 0.6 });
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[220px] bg-neutral-100 relative z-0 cursor-crosshair"
    />
  );
}
