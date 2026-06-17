"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { ChevronLeft, ChevronRight, Edit, MapPinned, Search } from "lucide-react";
import type { ContourListingWithDocuments } from "@contour/db";
import { buildPropertyMapSearchIndex, matchesPropertyMapSearch } from "../lib/property-map-search";
import { pickPrimaryListingImage } from "../lib/listing-attachments";

type ListingsMapViewProps = {
  listings: ContourListingWithDocuments[];
};

const DEFAULT_CENTER: [number, number] = [-15.4167, 28.2833];
const CARDS_PER_PAGE = 3;

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

function renderMarkers(
  leaflet: typeof Leaflet,
  map: Leaflet.Map,
  markersLayer: Leaflet.LayerGroup,
  listings: Array<{ listing: ContourListingWithDocuments }>,
  markersById: Map<string, Leaflet.Marker>,
) {
  markersLayer.clearLayers();
  markersById.clear();

  if (!listings.length) {
    map.setView(DEFAULT_CENTER, 6);
    return;
  }

  const bounds = leaflet.latLngBounds([]);

  for (const { listing } of listings) {
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
    markersById.set(listing.id, marker);
    bounds.extend(latLng);
  }

  if (listings.length === 1) {
    map.setView(
      [listings[0].listing.latitude as number, listings[0].listing.longitude as number],
      13,
    );
    return;
  }

  map.fitBounds(bounds, { padding: [36, 36] });
}

export function ListingsMapView({ listings }: ListingsMapViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const mapReadyRef = useRef(false);
  const markersById = useRef(new Map<string, Leaflet.Marker>());

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

  // Reset to page 0 when search changes
  useEffect(() => {
    setPage(0);
  }, [query]);

  const listingsWithCoordinates = useMemo(
    () => filteredListings.filter(({ listing }) => hasCoordinates(listing)),
    [filteredListings],
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / CARDS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pagedListings = useMemo(
    () => filteredListings.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE),
    [filteredListings, currentPage],
  );

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);

  // Fly to a listing's marker and open its popup
  const flyToMarker = useCallback((listingId: string) => {
    const marker = markersById.current.get(listingId);
    const map = mapRef.current;
    if (!marker || !map) return;

    setSelectedListingId(listingId);
    const latLng = marker.getLatLng();
    map.flyTo(latLng, 13, { duration: 0.7 });
    marker.openPopup();
  }, []);

  // Initialize map + render markers in a single effect chain
  useEffect(() => {
    let mounted = true;

    async function init() {
      const container = mapContainerRef.current;
      if (!container) return;

      const leaflet = await import("leaflet");
      if (!mounted || !mapContainerRef.current) return;

      // Only create the map once
      if (!mapRef.current) {
        const map = leaflet.map(container, {
          center: DEFAULT_CENTER,
          zoom: 7,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: true,
          touchZoom: true,
        });

        // ── Base layer ──────────────────────────────────────────────────────
        // OSM Standard — roads, buildings, parks, water, landmarks, labels
        const osmBase = leaflet.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          },
        );

        // ── Label overlay ───────────────────────────────────────────────────
        // Crisp neighborhood / district / city labels from CartoDB
        const labelOverlay = leaflet.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; CARTO",
            maxZoom: 19,
            opacity: 0.9,
          },
        );

        // ── Boundary overlays ───────────────────────────────────────────────
        // We use Overpass API to pull admin boundaries from OSM and render
        // them as colored polylines.  Hierarchy:
        //   admin_level=2  → country border      — thick dark stroke
        //   admin_level=4  → province / region   — medium stroke
        //   admin_level=6  → district            — thinner stroke
        //   admin_level=8  → municipality / town — thin stroke
        //   admin_level=9  → neighborhood / ward — thin dashed stroke
        //   admin_level=10 → suburb              — thinnest dashed stroke

        const BOUNDARY_STYLE: Record<number, L.PathOptions> = {
          2: { color: "#1a1a2e", weight: 4, opacity: 0.9, fill: false },
          4: { color: "#6b2fa0", weight: 3, opacity: 0.8, fill: false },
          6: { color: "#d4760a", weight: 2.5, opacity: 0.7, fill: false },
          8: { color: "#0a7e8c", weight: 2, opacity: 0.65, fill: false },
          9: { color: "#2e8b57", weight: 1.5, opacity: 0.55, fill: false, dashArray: "6 4" },
          10: { color: "#7b68ee", weight: 1, opacity: 0.45, fill: false, dashArray: "4 4" },
        };

        const boundaryLayer = leaflet.layerGroup();

        async function loadBoundaries() {
          // Bounding box covering Zambia with a small margin
          const bbox = "-18.5,21.5,-7.5,34.0";

          // Query: administrative boundaries levels 2–10
          // We split into two queries to stay within Overpass limits
          const levels = [
            { levels: "2",   ...BOUNDARY_STYLE[2]  },
            { levels: "4",   ...BOUNDARY_STYLE[4]  },
            { levels: "6",   ...BOUNDARY_STYLE[6]  },
            { levels: "8",   ...BOUNDARY_STYLE[8]  },
            { levels: "9",   ...BOUNDARY_STYLE[9]  },
            { levels: "10",  ...BOUNDARY_STYLE[10] },
          ];

          // Try multiple Overpass endpoints in case one is rate-limited
          const endpoints = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
          ];

          for (const { levels: lvl, color, weight, opacity, dashArray } of levels) {
            const query = `[out:json][timeout:15];relation["admin_level"="${lvl}"]["boundary="administrative"](${bbox});out geom 200;`;

            let success = false;
            for (const endpoint of endpoints) {
              if (success) break;
              try {
                const res = await fetch(
                  `${endpoint}?data=${encodeURIComponent(query)}`,
                  { signal: AbortSignal.timeout(12000) },
                );
                if (!res.ok) continue; // try next endpoint on 429/504 etc.

                const contentType = res.headers.get("content-type") || "";
                if (!contentType.includes("json")) continue; // XML error page — try next

                const data = await res.json();
                if (!data?.elements?.length) continue;

                const elements = data.elements;

                for (const el of elements) {
                  const members = el.members || [];
                  for (const member of members) {
                    if (member.type !== "way" || !member.geometry) continue;
                    const coords: [number, number][] = member.geometry.map(
                      (pt: any) => [pt.lat, pt.lon] as [number, number],
                    );
                    if (coords.length < 2) continue;

                    leaflet
                      .polyline(coords, {
                        color,
                        weight,
                        opacity,
                        fill: false,
                        dashArray,
                        interactive: true,
                      })
                      .bindTooltip(el.tags?.name ?? "", {
                        sticky: true,
                        className: "boundary-tooltip",
                        direction: "top",
                        opacity: 0.9,
                      })
                      .addTo(boundaryLayer);
                  }
                }

                success = true; // this level loaded, move to next level
              } catch {
                // network error or timeout — try next endpoint
              }
            }
          }
        }

        // Fire-and-forget — boundaries load async so the map is usable immediately
        loadBoundaries();

        // ── Assemble layers ─────────────────────────────────────────────────
        osmBase.addTo(map);
        boundaryLayer.addTo(map);
        labelOverlay.addTo(map);

        // Layer control — users can toggle overlays
        leaflet.control
          .layers(
            { "Map": osmBase },
            {
              "Boundaries": boundaryLayer,
              "Labels": labelOverlay,
            },
            { position: "bottomright", collapsed: true },
          )
          .addTo(map);

        const layer = leaflet.layerGroup().addTo(map);
        markersLayerRef.current = layer;
        mapRef.current = map;
        leafletRef.current = leaflet;

        requestAnimationFrame(() => {
          map.invalidateSize();
        });
      }

      // Render markers every time (map is guaranteed to exist now)
      const map = mapRef.current!;
      const layer = markersLayerRef.current!;
      renderMarkers(leaflet, map, layer, listingsWithCoordinates, markersById.current);
      mapReadyRef.current = true;
    }

    void init();

    return () => {
      mounted = false;
    };
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
          {pagedListings.length ? (
            pagedListings.map(({ listing }) => {
              const primaryImageUrl = pickPrimaryListingImage(listing.documents);
              const isSelected = selectedListingId === listing.id;

              return (
                <article
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => flyToMarker(listing.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flyToMarker(listing.id); } }}
                  className={`block cursor-pointer rounded-[20px] border p-4 transition-transform duration-150 hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-[color:var(--primary)] bg-[color:var(--surface)] shadow-[0_0_0_2px_rgba(139,30,30,0.15)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)]"
                  }`}
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
                    <MapPinned className={`size-4 shrink-0 ${isSelected ? "text-[color:var(--primary)]" : "text-[color:var(--muted)]"}`} />
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
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-9 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[12px] font-medium"
                    >
                      View
                    </Link>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
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

        {/* Pagination */}
        {filteredListings.length > CARDS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-4">
            <p className="text-[12px] text-[color:var(--muted)]">
              Showing {currentPage * CARDS_PER_PAGE + 1}–{Math.min((currentPage + 1) * CARDS_PER_PAGE, filteredListings.length)} of {filteredListings.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] transition disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-[12px] font-medium transition ${
                    i === currentPage
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] transition disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
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
