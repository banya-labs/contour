"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Edit, MapPinned, Search } from "lucide-react";
import type { ContourListingWithDocuments } from "@contour/db";
import { buildPropertyMapSearchIndex, matchesPropertyMapSearch } from "../lib/property-map-search";
import { pickPrimaryListingImage } from "../lib/listing-attachments";

type ListingsMapViewProps = {
  listings: ContourListingWithDocuments[];
};

const DEFAULT_CENTER: [number, number] = [-15.4167, 28.2833];

function hasCoordinates(listing: ContourListingWithDocuments) {
  return listing.latitude != null && listing.longitude != null;
}

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

function escapePopupText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string) {
  return escapePopupText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function ListingsMapView({ listings }: ListingsMapViewProps) {
  const [query, setQuery] = useState("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);

  const searchableListings = useMemo(
    () =>
      listings.map((listing) => ({
        listing,
        searchIndex: buildPropertyMapSearchIndex(listing),
      })),
    [listings],
  );

  const filteredListings = useMemo(() => {
    if (!query.trim()) {
      return searchableListings;
    }

    return searchableListings.filter(({ searchIndex }) => matchesPropertyMapSearch(query, searchIndex));
  }, [query, searchableListings]);

  const listingsWithCoordinates = useMemo(
    () => filteredListings.filter(({ listing }) => hasCoordinates(listing)),
    [filteredListings],
  );

  useEffect(() => {
    let mounted = true;

    async function initializeMap() {
      const container = mapContainerRef.current;
      if (!container || mapRef.current) {
        return;
      }

      const leaflet = await import("leaflet");
      if (!mounted || !mapContainerRef.current) {
        return;
      }

      leafletRef.current = leaflet;
      const map = leaflet.map(container, {
        center: DEFAULT_CENTER,
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        touchZoom: true,
      });

      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
          maxZoom: 19,
        })
        .addTo(map);

      markersLayerRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    }

    void initializeMap();

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!leaflet || !map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();

    if (!listingsWithCoordinates.length) {
      map.setView(DEFAULT_CENTER, 6);
      return;
    }

    const bounds = leaflet.latLngBounds([]);

    for (const { listing } of listingsWithCoordinates) {
      const latLng: [number, number] = [listing.latitude as number, listing.longitude as number];
      const locationLabel =
        listing.address ||
        [listing.locationArea, listing.cityTown, listing.province].filter(Boolean).join(", ") ||
        "No address saved";
      const primaryImageUrl = pickPrimaryListingImage(listing.documents);
      const imageMarkup = primaryImageUrl
        ? `<img src="${escapeAttribute(primaryImageUrl)}" alt="${escapeAttribute(listing.title)}" style="width:100%;height:140px;object-fit:cover;border-radius:16px;margin-bottom:12px;" />`
        : "";
      const marker = leaflet
        .marker(latLng, {
          icon: buildMarkerIcon(leaflet),
          keyboard: true,
        })
        .bindPopup(`
          <div style="min-width: 220px; max-width: 260px">
            ${imageMarkup}
            <strong>${escapePopupText(listing.title)}</strong><br />
            <span>${escapePopupText(locationLabel)}</span>
            <p style="margin: 10px 0 0; font-size: 12px; line-height: 1.5; color: #5b5b5b;">${escapePopupText(
              listing.description?.trim() || "No description added yet",
            )}</p>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <a href="/listings/${escapeAttribute(listing.id)}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:#f6f2e8;text-decoration:none;color:#271a00;font-size:12px;font-weight:600;">View</a>
              <a href="/listings/${escapeAttribute(listing.id)}/edit" style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:#8b1e1e;text-decoration:none;color:white;font-size:12px;font-weight:600;">
                <span>Edit</span>
              </a>
            </div>
          </div>
        `);

      marker.addTo(markersLayer);
      bounds.extend(latLng);
    }

    if (listingsWithCoordinates.length === 1) {
      map.setView(
        [listingsWithCoordinates[0].listing.latitude as number, listingsWithCoordinates[0].listing.longitude as number],
        13,
      );
      return;
    }

    map.fitBounds(bounds, { padding: [36, 36] });
  }, [listingsWithCoordinates]);

  return (
    <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
      <aside className="space-y-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Portfolio map</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">Search by address fragment</h2>
          <p className="mt-2 text-[14px] leading-7 text-[color:var(--muted)]">
            Type any part of an address, town, area, owner, or even the plot number. Matching properties stay on the
            map and in the list.
          </p>
        </div>

        <label className="relative block">
          <span className="sr-only">Search properties</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Unit 104, East Park Mall, Thabo Mbeki Rd..."
            className="h-12 w-full rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] pl-11 pr-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Visible</p>
            <p className="mt-2 text-[18px] font-semibold">{filteredListings.length}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Mapped</p>
            <p className="mt-2 text-[18px] font-semibold">{listingsWithCoordinates.length}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Total</p>
            <p className="mt-2 text-[18px] font-semibold">{listings.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredListings.length ? (
            filteredListings.slice(0, 12).map(({ listing }) => {
              const primaryImageUrl = pickPrimaryListingImage(listing.documents);

              return (
                <article
                key={listing.id}
                className="block rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[color:var(--surface)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium">{listing.title}</p>
                    <p className="mt-1 text-[12px] leading-6 text-[color:var(--muted)]">
                      {listing.description?.trim() || "No description added yet"}
                    </p>
                    <p className="mt-1 text-[12px] leading-6 text-[color:var(--muted)]">
                      {listing.address ||
                        [listing.locationArea, listing.cityTown, listing.province].filter(Boolean).join(", ") ||
                        "No address saved"}
                    </p>
                  </div>
                  <MapPinned className="size-4 shrink-0 text-[color:var(--muted)]" />
                </div>
                {primaryImageUrl ? (
                  <img
                    src={primaryImageUrl}
                    alt={listing.title}
                    className="mt-3 aspect-[16/10] w-full rounded-[16px] object-cover"
                  />
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="inline-flex h-9 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[12px] font-medium"
                  >
                    View
                  </Link>
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="inline-flex h-9 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-3 text-[12px] font-medium text-[color:var(--primary-foreground)]"
                  >
                    <Edit className="size-3.5" />
                    Edit
                  </Link>
                </div>
              </article>
              );
            })
          ) : (
            <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-[13px] text-[color:var(--muted)]">
              No properties match this search.
            </div>
          )}
        </div>
      </aside>

      <section className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Map</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">All mapped properties</h2>
        </div>
        <div ref={mapContainerRef} className="min-h-[720px] w-full" />
      </section>
    </section>
  );
}
