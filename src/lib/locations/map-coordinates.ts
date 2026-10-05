export type Coordinates = [number, number];
export const WORLD_MAP_CENTER: Coordinates = [0, 0];

export function hasValidCoordinates(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function getMapViewport(properties: readonly { latitude?: number | null; longitude?: number | null }[]): { center: Coordinates; zoom: number } {
  const property = properties.find((item) => hasValidCoordinates(item.latitude, item.longitude));
  return property ? { center: [property.latitude!, property.longitude!], zoom: 13 } : { center: WORLD_MAP_CENTER, zoom: 2 };
}

/** Compare actual map positions, independently of object identity or inventory ordering. */
export function getMapCoordinateKey(properties: readonly { latitude?: number | null; longitude?: number | null }[]): string {
  const positions = properties
    .filter((property) => hasValidCoordinates(property.latitude, property.longitude))
    .map((property) => [property.latitude!, property.longitude!] as Coordinates)
    .sort(([leftLat, leftLng], [rightLat, rightLng]) => leftLat - rightLat || leftLng - rightLng);
  return JSON.stringify(positions);
}
