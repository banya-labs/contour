export const ZAMBIA_LATITUDE_MIN = -18;
export const ZAMBIA_LATITUDE_MAX = 12;
export const ZAMBIA_LONGITUDE_MIN = 22;
export const ZAMBIA_LONGITUDE_MAX = 34;

export type PropertyLocation = {
  province: string;
  cityTown: string;
  locationArea: string;
  latitude: number;
  longitude: number;
};

export type LocationBoundary = {
  south: number;
  north: number;
  west: number;
  east: number;
};

export type LocationGeometry = Record<string, unknown> & {
  type: string;
};

export type LocationSearchResult = {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  province: string;
  cityTown: string;
  locationArea: string;
  boundingBox: LocationBoundary | null;
  geometry: LocationGeometry | null;
};

type NominatimAddress = {
  state?: string;
  province?: string;
  region?: string;
  county?: string;
  municipality?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  locality?: string;
  country?: string;
};

export function isValidZambiaCoordinate(latitude: number, longitude: number) {
  return (
    latitude >= ZAMBIA_LATITUDE_MIN &&
    latitude <= ZAMBIA_LATITUDE_MAX &&
    longitude >= ZAMBIA_LONGITUDE_MIN &&
    longitude <= ZAMBIA_LONGITUDE_MAX
  );
}

export function parseCoordinatePair(input: string) {
  const normalized = input.trim().replace(/\s+/g, " ");
  const match = normalized.match(
    /^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/,
  );

  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export function formatCoordinatePair(latitude: number, longitude: number) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function parseBoundingBox(value: unknown): LocationBoundary | null {
  if (!Array.isArray(value) || value.length !== 4) {
    return null;
  }

  const [south, north, west, east] = value.map((entry) => Number(entry));
  if (![south, north, west, east].every(Number.isFinite)) {
    return null;
  }

  return {
    south,
    north,
    west,
    east,
  };
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim())?.trim() ?? "";
}

export function buildLocationParts(address: NominatimAddress, fallbackLabel = "") {
  const province = firstNonEmpty(address.state, address.province, address.region, address.county);
  const cityTown = firstNonEmpty(address.city, address.town, address.village, address.municipality, address.county);
  const locationArea = firstNonEmpty(address.suburb, address.neighbourhood, address.locality, cityTown);

  return {
    province,
    cityTown,
    locationArea,
    displayName: firstNonEmpty(cityTown, province, fallbackLabel),
  };
}
