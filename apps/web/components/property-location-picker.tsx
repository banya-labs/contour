"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  formatCoordinatePair,
  isValidZambiaCoordinate,
  parseCoordinatePair,
  type LocationBoundary,
  type LocationGeometry,
  type LocationSearchResult,
} from "../lib/property-location";
import { PropertyLocationMap } from "./property-location-map";

type PropertyLocationPickerProps = {
  initialLocation: {
    province: string;
    cityTown: string;
    locationArea: string;
    latitude: string;
    longitude: string;
  };
  onResolvedAddress?: (address: string | null) => void;
  onCoordinatesStateChange?: (hasCoordinates: boolean) => void;
};

const searchCache = new Map<string, LocationSearchResult[]>();
let lastSearchAt = 0;

function normalizeInput(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getSearchLabel(location: { province: string; cityTown: string; locationArea: string }) {
  return [location.locationArea, location.cityTown, location.province].filter(Boolean).join(", ");
}

function toLocationPayload(result: LocationSearchResult) {
  return {
    province: result.province,
    cityTown: result.cityTown,
    locationArea: result.locationArea,
    latitude: "",
    longitude: "",
  };
}

export function PropertyLocationPicker({
  initialLocation,
  onResolvedAddress,
  onCoordinatesStateChange,
}: PropertyLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(getSearchLabel(initialLocation));
  const [province, setProvince] = useState(initialLocation.province);
  const [cityTown, setCityTown] = useState(initialLocation.cityTown);
  const [locationArea, setLocationArea] = useState(initialLocation.locationArea);
  const [latitude, setLatitude] = useState(initialLocation.latitude);
  const [longitude, setLongitude] = useState(initialLocation.longitude);
  const [boundary, setBoundary] = useState<LocationBoundary | null>(null);
  const [geometry, setGeometry] = useState<LocationGeometry | null>(null);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const lastSyncedCoordinates = useRef<string | null>(null);

  const numericLatitude = latitude ? Number(latitude) : null;
  const numericLongitude = longitude ? Number(longitude) : null;

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function updateLocation(nextLocation: {
    province: string;
    cityTown: string;
    locationArea: string;
    latitude: string;
    longitude: string;
  }) {
    setProvince(nextLocation.province);
    setCityTown(nextLocation.cityTown);
    setLocationArea(nextLocation.locationArea);
    setLatitude(nextLocation.latitude);
    setLongitude(nextLocation.longitude);
    setSearchQuery(getSearchLabel(nextLocation));
  }

  async function searchLocation(query: string) {
    const normalized = normalizeInput(query);
    if (!normalized) {
      setResults([]);
      if (!hasValidCoordinates) {
        setBoundary(null);
        setGeometry(null);
      }
      return;
    }

    const coordinatePair = parseCoordinatePair(normalized);
    if (coordinatePair) {
      if (!isValidZambiaCoordinate(coordinatePair.latitude, coordinatePair.longitude)) {
        showToast("Coordinates must stay within Zambia. Try -15.4167, 28.2833.");
        return;
      }

      setLatitude(String(coordinatePair.latitude));
      setLongitude(String(coordinatePair.longitude));
      setBoundary(null);
      setGeometry(null);
      setResults([]);
      showToast("Centered on the entered coordinates.");
      return;
    }

    const cached = searchCache.get(normalized.toLowerCase());
    if (cached) {
      setResults(cached);
      if (cached[0]) {
        setBoundary(cached[0].boundingBox);
        setGeometry(cached[0].geometry);
      }
      return;
    }

    const sinceLast = Date.now() - lastSearchAt;
    if (sinceLast < 1000) {
      await new Promise((resolve) => window.setTimeout(resolve, 1000 - sinceLast));
    }

    setLoading(true);
    try {
      lastSearchAt = Date.now();
      const response = await fetch(`/api/location-search?q=${encodeURIComponent(normalized)}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { results: LocationSearchResult[] };
      const nextResults = payload.results.slice(0, 8);
      searchCache.set(normalized.toLowerCase(), nextResults);
      setResults(nextResults);
      if (nextResults[0]) {
        setBoundary(nextResults[0].boundingBox);
        setGeometry(nextResults[0].geometry);
      }

      if (!nextResults.length) {
        showToast("Location not found. Try entering coordinates.");
      }
    } catch {
      showToast("Location not found. Try entering coordinates.");
    } finally {
      setLoading(false);
    }
  }

  async function syncAddressFromCoordinates(latitudeValue: number, longitudeValue: number) {
    try {
      const response = await fetch(
        `/api/location-reverse?lat=${encodeURIComponent(String(latitudeValue))}&lon=${encodeURIComponent(String(longitudeValue))}`,
      );

      if (!response.ok) {
        onResolvedAddress?.(null);
        return;
      }

      const payload = (await response.json()) as { address?: string | null };
      onResolvedAddress?.(payload.address ?? null);
    } catch {
      onResolvedAddress?.(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchLocation(searchQuery);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const hasValidCoordinates =
    numericLatitude != null &&
    numericLongitude != null &&
    Number.isFinite(numericLatitude) &&
    Number.isFinite(numericLongitude);

  const mapBoundary = hasValidCoordinates ? null : boundary;
  const mapGeometry = hasValidCoordinates ? null : geometry;

  useEffect(() => {
    if (!hasValidCoordinates) {
      onCoordinatesStateChange?.(false);
      lastSyncedCoordinates.current = null;
      return;
    }

    onCoordinatesStateChange?.(true);
    const syncKey = `${numericLatitude},${numericLongitude}`;
    if (lastSyncedCoordinates.current === syncKey) {
      return;
    }

    lastSyncedCoordinates.current = syncKey;
    void syncAddressFromCoordinates(numericLatitude, numericLongitude);
  }, [hasValidCoordinates, numericLatitude, numericLongitude, onCoordinatesStateChange]);

  return (
    <section className="space-y-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Location</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Search and pin the property</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
            Search a place in Zambia, choose from the suggestions, or paste coordinates directly. The map will center and pin the property immediately.
          </p>
        </div>
        <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] text-[color:var(--muted)]">
          {loading ? "Searching..." : "Leaflet + Nominatim"}
        </div>
      </div>

      {toast ? (
        <div className="rounded-[18px] border border-[color:rgba(141,43,31,0.18)] bg-[color:rgba(141,43,31,0.08)] px-4 py-3 text-[13px] text-[color:var(--danger)]">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="relative block">
            <span className="sr-only">Search location</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Lusaka, Ndola, Livingstone or type -15.4167, 28.2833"
              className="h-12 w-full rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] pl-11 pr-11 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--muted)] transition-colors hover:bg-[color:rgba(39,26,0,0.08)] hover:text-[color:var(--foreground)]"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>

          {results.length ? (
            <div className="overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_12px_28px_rgba(39,26,0,0.08)]">
              {results.map((result) => (
                <button
                  key={result.placeId}
                  type="button"
                  onClick={() => {
                    updateLocation(toLocationPayload(result));
                    setBoundary(result.boundingBox);
                    setGeometry(result.geometry);
                    setResults([]);
                  }}
                  className="block w-full border-b border-[color:var(--border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[color:var(--surface-muted)]"
                >
                  <p className="text-[13px] font-medium">{result.displayName}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                    {result.province}
                    {result.cityTown ? `, ${result.cityTown}` : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[12px] font-medium text-[color:var(--foreground)]">Province</span>
              <input
                name="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
                placeholder="Lusaka"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-medium text-[color:var(--foreground)]">City / Town</span>
              <input
                name="cityTown"
                value={cityTown}
                onChange={(event) => setCityTown(event.target.value)}
                className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
                placeholder="Lusaka"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-[12px] font-medium text-[color:var(--foreground)]">Area / neighborhood</span>
              <input
                name="locationArea"
                value={locationArea}
                onChange={(event) => setLocationArea(event.target.value)}
                className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
                placeholder="Roma, Kabulonga, Kabulonga West"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-medium text-[color:var(--foreground)]">Latitude</span>
              <input
                name="latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                onBlur={() => {
                  if (!latitude || !longitude) {
                    return;
                  }

                  const nextLatitude = Number(latitude);
                  const nextLongitude = Number(longitude);
                  if (!isValidZambiaCoordinate(nextLatitude, nextLongitude)) {
                    showToast("Coordinates must stay within Zambia. Try -15.4167, 28.2833.");
                    return;
                  }

                  setBoundary(null);
                  setGeometry(null);
                  setSearchQuery(formatCoordinatePair(nextLatitude, nextLongitude));
                }}
                inputMode="decimal"
                className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
                placeholder="-15.4167"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-medium text-[color:var(--foreground)]">Longitude</span>
              <input
                name="longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                onBlur={() => {
                  if (!latitude || !longitude) {
                    return;
                  }

                  const nextLatitude = Number(latitude);
                  const nextLongitude = Number(longitude);
                  if (!isValidZambiaCoordinate(nextLatitude, nextLongitude)) {
                    showToast("Coordinates must stay within Zambia. Try -15.4167, 28.2833.");
                    return;
                  }

                  setBoundary(null);
                  setGeometry(null);
                  setSearchQuery(formatCoordinatePair(nextLatitude, nextLongitude));
                }}
                inputMode="decimal"
                className="h-11 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[14px] outline-none transition focus:border-[color:var(--primary)]"
                placeholder="28.2833"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <PropertyLocationMap
            latitude={hasValidCoordinates ? numericLatitude : null}
            longitude={hasValidCoordinates ? numericLongitude : null}
            boundary={mapBoundary}
            geometry={mapGeometry}
            className="min-h-[520px]"
            interactive
          />
        </div>
      </div>
    </section>
  );
}
