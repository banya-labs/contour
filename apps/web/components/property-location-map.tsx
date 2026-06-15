"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { LocationBoundary, LocationGeometry } from "../lib/property-location";
import { isValidZambiaCoordinate } from "../lib/property-location";

type PropertyLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  boundary?: LocationBoundary | null;
  geometry?: LocationGeometry | null;
  className?: string;
  interactive?: boolean;
};

const DEFAULT_CENTER: [number, number] = [-15.4167, 28.2833];

function markerSvg() {
  return `
    <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 45C17 45 31 30.8 31 18.6C31 10.2 24.732 4 17 4C9.268 4 3 10.2 3 18.6C3 30.8 17 45 17 45Z" fill="#8B1E1E"/>
      <path d="M17 24.2C20.0919 24.2 22.6 21.695 22.6 18.6C22.6 15.505 20.0919 13 17 13C13.9081 13 11.4 15.505 11.4 18.6C11.4 21.695 13.9081 24.2 17 24.2Z" fill="white"/>
    </svg>
  `;
}

function buildMarkerIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "",
    html: markerSvg(),
    iconSize: [34, 46],
    iconAnchor: [17, 45],
    popupAnchor: [0, -42],
  });
}

export function PropertyLocationMap({
  latitude,
  longitude,
  boundary = null,
  geometry = null,
  className = "",
  interactive = false,
}: PropertyLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const geometryRef = useRef<Leaflet.GeoJSON | Leaflet.Rectangle | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const outlineGeometry = geometry && geometry.type !== "Point" ? geometry : null;

  useEffect(() => {
    let mounted = true;

    async function initializeMap() {
      const container = containerRef.current;
      if (!container || mapRef.current) {
        return;
      }

      const leaflet = await import("leaflet");
      if (!mounted || !containerRef.current) {
        return;
      }

      leafletRef.current = leaflet;
      const map = leaflet.map(container, {
        center: latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER,
        zoom: latitude != null && longitude != null ? 14 : 6,
        zoomControl: true,
        scrollWheelZoom: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      });

      leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (latitude != null && longitude != null && isValidZambiaCoordinate(latitude, longitude)) {
        const marker = leaflet.marker([latitude, longitude], {
          icon: buildMarkerIcon(leaflet),
          keyboard: interactive,
        }).addTo(map);
        marker.bindPopup(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        markerRef.current = marker;
      } else if (outlineGeometry) {
        const areaLayer = leaflet.geoJSON(outlineGeometry as never, {
          style: {
            color: "#8B1E1E",
            weight: 2,
            fillColor: "#C77D1E",
            fillOpacity: 0.08,
          },
        }).addTo(map);
        geometryRef.current = areaLayer;

        map.fitBounds(areaLayer.getBounds(), {
          padding: [24, 24],
        });
      } else if (boundary) {
        const areaLayer = leaflet.rectangle(
          [
            [boundary.south, boundary.west],
            [boundary.north, boundary.east],
          ],
          {
            color: "#8B1E1E",
            weight: 2,
            fillColor: "#C77D1E",
            fillOpacity: 0.08,
          },
        ).addTo(map);
        geometryRef.current = areaLayer;

        map.fitBounds(areaLayer.getBounds(), {
          padding: [24, 24],
        });
      }

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    }

    void initializeMap();

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      geometryRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map) {
      return;
    }

    markerRef.current?.remove();
    markerRef.current = null;
    geometryRef.current?.remove();
    geometryRef.current = null;

    if (latitude != null && longitude != null && isValidZambiaCoordinate(latitude, longitude)) {
      const nextLatLng: [number, number] = [latitude, longitude];
      map.setView(nextLatLng, 14, { animate: true });

      const marker =
        markerRef.current ??
        leaflet.marker(nextLatLng, {
          icon: buildMarkerIcon(leaflet),
          keyboard: interactive,
        }).addTo(map);
      marker.setLatLng(nextLatLng);
      marker.bindPopup(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      markerRef.current = marker;
      return;
    }

    if (outlineGeometry) {
      const areaLayer = leaflet.geoJSON(outlineGeometry as never, {
        style: {
          color: "#8B1E1E",
          weight: 2,
          fillColor: "#C77D1E",
          fillOpacity: 0.08,
        },
      }).addTo(map);
      geometryRef.current = areaLayer;

      map.fitBounds(areaLayer.getBounds(), {
        padding: [24, 24],
        animate: true,
      });
      return;
    }

    if (boundary) {
      const areaLayer = leaflet.rectangle(
        [
          [boundary.south, boundary.west],
          [boundary.north, boundary.east],
        ],
        {
          color: "#8B1E1E",
          weight: 2,
          fillColor: "#C77D1E",
          fillOpacity: 0.08,
        },
      ).addTo(map);
      geometryRef.current = areaLayer;

      map.fitBounds(areaLayer.getBounds(), {
        padding: [24, 24],
        animate: true,
      });
      return;
    }

    map.setView(DEFAULT_CENTER, 6, { animate: true });
  }, [boundary, interactive, latitude, longitude, outlineGeometry]);

  return (
    <div className={`overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] ${className}`}>
      <div ref={containerRef} className="h-full min-h-[260px] w-full" />
    </div>
  );
}
