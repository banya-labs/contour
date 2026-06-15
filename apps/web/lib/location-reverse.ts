type ReverseGeocodePayload = {
  display_name?: unknown;
  error?: unknown;
};

export function extractReverseGeocodedAddress(payload: ReverseGeocodePayload) {
  if (payload.error) {
    return null;
  }

  const displayName = typeof payload.display_name === "string" ? payload.display_name.trim() : "";
  return displayName || null;
}

export async function reverseGeocodeAddress(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
      String(latitude),
    )}&lon=${encodeURIComponent(String(longitude))}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "Contour Analytics Engine",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ReverseGeocodePayload;
  return extractReverseGeocodedAddress(payload);
}
