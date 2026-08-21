"use client";

import React, { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Undo2, Trash2, Plus, Ruler, Layers } from "lucide-react";

export function getVertexLabel(idx: number): string {
  let label = "";
  let i = idx;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

export function calculateGeodesicAreaSqm(vertices: [number, number][]): number {
  if (vertices.length < 3) return 0;
  const RAD = Math.PI / 180;
  const EARTH_RADIUS = 6378137; // WGS84 Earth radius in meters
  let totalArea = 0;

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];

    const lat1 = p1[0] * RAD;
    const lng1 = p1[1] * RAD;
    const lat2 = p2[0] * RAD;
    const lng2 = p2[1] * RAD;

    totalArea += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  totalArea = (Math.abs(totalArea) * EARTH_RADIUS * EARTH_RADIUS) / 2;
  return Math.round(totalArea);
}

type PropertyStandEditorProps = {
  latitude: number | string;
  longitude: number | string;
  standBoundary?: [number, number][];
  plotSizeSqm?: number | string;
  onChange: (updated: {
    latitude: number;
    longitude: number;
    standBoundary: [number, number][];
    plotSizeSqm: number;
  }) => void;
};

export default function PropertyStandEditor({
  latitude,
  longitude,
  standBoundary = [],
  plotSizeSqm,
  onChange,
}: PropertyStandEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingLayerGroupRef = useRef<any>(null);

  const [latInput, setLatInput] = useState<string>(String(latitude || -15.4211));
  const [lngInput, setLngInput] = useState<string>(String(longitude || 28.3341));
  const [vertices, setVertices] = useState<[number, number][]>(standBoundary);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Sync internal state if props change from outside
  useEffect(() => {
    if (latitude) setLatInput(String(latitude));
    if (longitude) setLngInput(String(longitude));
  }, [latitude, longitude]);

  useEffect(() => {
    if (standBoundary && standBoundary.length > 0) {
      setVertices(standBoundary);
    }
  }, [standBoundary]);

  // Helper to trigger parent onChange callback
  const notifyParent = (nextVertices: [number, number][], mainLatStr?: string, mainLngStr?: string) => {
    const calcArea = calculateGeodesicAreaSqm(nextVertices);
    const nLat = Number(mainLatStr !== undefined ? mainLatStr : latInput) || -15.4211;
    const nLng = Number(mainLngStr !== undefined ? mainLngStr : lngInput) || 28.3341;

    onChange({
      latitude: nLat,
      longitude: nLng,
      standBoundary: nextVertices,
      plotSizeSqm: calcArea || Number(plotSizeSqm) || 500,
    });
  };

  // Initialize mini Leaflet map inside modal
  useEffect(() => {
    let isMounted = true;

    async function initMiniMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      const centerLat = Number(latInput) || -15.4167;
      const centerLng = Number(lngInput) || 28.2833;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      drawingLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setMapLoaded(true);

      map.getContainer().style.cursor = "crosshair";

      // Click mini map to drop stand corner node A, B, C, D...
      map.on("click", (e: any) => {
        const newVertex: [number, number] = [
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6)),
        ];
        setVertices((prev) => {
          const next = [...prev, newVertex];
          const firstLat = next[0][0];
          const firstLng = next[0][1];

          setLatInput(String(firstLat));
          setLngInput(String(firstLng));

          notifyParent(next, String(firstLat), String(firstLng));
          return next;
        });
      });
    }

    initMiniMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render vertices & polygon on mini map with A, B, C, D badges
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    async function renderShape() {
      const L = (await import("leaflet")).default;
      const group = drawingLayerGroupRef.current;
      if (!group) return;
      group.clearLayers();

      // Render main property center pin if lat/lng are valid
      const numLat = Number(latInput);
      const numLng = Number(lngInput);

      if (!isNaN(numLat) && !isNaN(numLng) && vertices.length === 0) {
        const centerIcon = L.divIcon({
          className: "center-pin-icon",
          html: `<div style="background:#8b1e1e; width:16px; height:16px; border-radius:9999px; border:3px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([numLat, numLng], { icon: centerIcon }).addTo(group);
      }

      if (vertices.length === 0) return;

      vertices.forEach((v, idx) => {
        const label = getVertexLabel(idx); // A, B, C, D...
        const nodeHtml = `<div style="background:#8b1e1e; color:#ffffff; font-weight:800; font-size:11px; padding:2px 7px; border-radius:9999px; border:2px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.4); white-space:nowrap; font-family:sans-serif;">${label}</div>`;
        const nodeIcon = L.divIcon({
          className: "custom-vertex-node-icon",
          html: nodeHtml,
          iconSize: [26, 20],
          iconAnchor: [13, 10],
        });
        L.marker([v[0], v[1]], { icon: nodeIcon }).addTo(group);
      });

      if (vertices.length === 2) {
        L.polyline(vertices, { color: "#8b1e1e", weight: 3, dashArray: "6,6" }).addTo(group);
      } else if (vertices.length >= 3) {
        L.polygon(vertices, {
          color: "#8b1e1e",
          weight: 3,
          fillColor: "#8b1e1e",
          fillOpacity: 0.25,
        }).addTo(group);
      }
    }

    renderShape();
  }, [vertices, latInput, lngInput, mapLoaded]);

  // Handle main property center coordinate change
  const handleMainCoordChange = (newLatStr: string, newLngStr: string) => {
    setLatInput(newLatStr);
    setLngInput(newLngStr);
    const nLat = Number(newLatStr);
    const nLng = Number(newLngStr);

    if (!isNaN(nLat) && !isNaN(nLng)) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([nLat, nLng]);
      }
      notifyParent(vertices, newLatStr, newLngStr);
    }
  };

  // Handle editing individual node A, B, C, D... latitude/longitude inputs
  const handleVertexValueChange = (index: number, newLatVal: string, newLngVal: string) => {
    const updated = [...vertices];
    const nLat = Number(newLatVal);
    const nLng = Number(newLngVal);
    updated[index] = [isNaN(nLat) ? 0 : nLat, isNaN(nLng) ? 0 : nLng];
    setVertices(updated);
    notifyParent(updated);
  };

  const handleAddVertex = () => {
    const lastPoint = vertices[vertices.length - 1] || [Number(latInput) || -15.4211, Number(lngInput) || 28.3341];
    // Slightly offset new vertex point
    const newPoint: [number, number] = [
      Number((lastPoint[0] + 0.0003).toFixed(6)),
      Number((lastPoint[1] + 0.0003).toFixed(6)),
    ];
    const updated = [...vertices, newPoint];
    setVertices(updated);
    notifyParent(updated);
  };

  const handleRemoveVertex = (index: number) => {
    const updated = vertices.filter((_, i) => i !== index);
    setVertices(updated);
    notifyParent(updated);
  };

  const handleUndo = () => {
    if (vertices.length === 0) return;
    const updated = vertices.slice(0, -1);
    setVertices(updated);
    notifyParent(updated);
  };

  const handleClear = () => {
    setVertices([]);
    notifyParent([]);
  };

  const computedAreaSqm = calculateGeodesicAreaSqm(vertices);

  return (
    <div className="p-3.5 rounded-2xl bg-paper-100 border border-paper-200 space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="font-bold text-ink-900 text-xs flex items-center gap-1.5">
          <Crosshair className="w-4 h-4 text-contour-red animate-pulse" />
          <span>Geospatial Coordinates & Stand Boundary</span>
        </label>
        <span className="text-[10px] text-ink-600 bg-paper-200 px-2 py-0.5 rounded-full font-mono font-bold">
          {vertices.length} Nodes Plotted ({vertices.map((_, i) => getVertexLabel(i)).join(", ") || "None"})
        </span>
      </div>

      {/* Main Property Center Latitude & Longitude Inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-ink-700 mb-1">
            Property Latitude (Center)
          </label>
          <input
            type="number"
            step="any"
            value={latInput}
            onChange={(e) => handleMainCoordChange(e.target.value, lngInput)}
            placeholder="-15.421100"
            className="w-full bg-white px-3 py-1.5 rounded-xl border border-border text-xs text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-contour-red/10"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-700 mb-1">
            Property Longitude (Center)
          </label>
          <input
            type="number"
            step="any"
            value={lngInput}
            onChange={(e) => handleMainCoordChange(latInput, e.target.value)}
            placeholder="28.334100"
            className="w-full bg-white px-3 py-1.5 rounded-xl border border-border text-xs text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-contour-red/10"
          />
        </div>
      </div>

      {/* Embedded Mini Interactive Map for mouse boundary plotting */}
      <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Mini Map Controls Overlay */}
        <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={vertices.length === 0}
            className="bg-white/95 hover:bg-white disabled:opacity-40 text-ink-900 text-[10px] font-semibold px-2 py-1 rounded-lg border border-border shadow-xs flex items-center gap-1"
            title="Undo last node point"
          >
            <Undo2 className="w-3 h-3 text-contour-red" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={vertices.length === 0}
            className="bg-white/95 hover:bg-white disabled:opacity-40 text-ink-900 text-[10px] font-semibold px-2 py-1 rounded-lg border border-border shadow-xs flex items-center gap-1"
            title="Reset all stand nodes"
          >
            <Trash2 className="w-3 h-3 text-contour-red" />
            <span>Clear</span>
          </button>
        </div>

        {/* Plot Area Badge Overlay */}
        {vertices.length >= 3 && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-ink-900/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-paper-300 shadow-md flex items-center gap-1.5">
            <Ruler className="w-3 h-3 text-contour-amber" />
            <span>Enclosed Area: <strong>{computedAreaSqm.toLocaleString()} m²</strong></span>
            {computedAreaSqm >= 10000 && (
              <span> ({(computedAreaSqm / 10000).toFixed(2)} ha)</span>
            )}
          </div>
        )}
      </div>

      {/* INDIVIDUAL STAND BOUNDARY CORNER NODE COORDINATES (Node A, B, C, D...) */}
      <div className="pt-2 border-t border-paper-200 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-ink-900 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-contour-red" />
            <span>Stand Boundary Corner Nodes (Points A, B, C, D...)</span>
          </label>
          <button
            type="button"
            onClick={handleAddVertex}
            className="px-2.5 py-1 rounded-lg bg-ink-900 hover:bg-ink-950 text-white text-[11px] font-semibold flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>Add Node Point</span>
          </button>
        </div>

        {vertices.length === 0 ? (
          <div className="p-3 bg-white rounded-xl border border-dashed border-paper-300 text-center text-[11px] text-ink-500">
            No boundary nodes added yet. Click directly on the mini-map above or click <strong>+ Add Node Point</strong> to enter coordinates manually.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {vertices.map((v, idx) => {
              const nodeLabel = getVertexLabel(idx);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white p-2 rounded-xl border border-border shadow-xs"
                >
                  <span className="w-7 h-7 rounded-full bg-contour-red text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                    {nodeLabel}
                  </span>

                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div>
                      <span className="text-[9px] font-mono text-ink-600 block">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={v[0]}
                        onChange={(e) => handleVertexValueChange(idx, e.target.value, String(v[1]))}
                        className="w-full bg-paper-100 px-2 py-1 rounded-lg border border-border text-xs text-ink-900 font-mono focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-ink-600 block">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={v[1]}
                        onChange={(e) => handleVertexValueChange(idx, String(v[0]), e.target.value)}
                        className="w-full bg-paper-100 px-2 py-1 rounded-lg border border-border text-xs text-ink-900 font-mono focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVertex(idx)}
                    className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-paper-100 rounded-lg transition-colors"
                    title={`Delete Node ${nodeLabel}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-ink-500 italic">
        💡 <strong>Tip</strong>: You can click directly on the mini-map to drop nodes OR manually edit/type exact Latitude & Longitude lines for Node A, Node B, Node C, Node D... above.
      </p>
    </div>
  );
}
