type PropertyMapSearchSource = {
  title: string;
  address: string | null;
  description: string | null;
  locationArea: string | null;
  cityTown: string | null;
  province: string | null;
  ownerName: string | null;
  latitude: number | null;
  longitude: number | null;
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildPropertyMapSearchIndex(source: PropertyMapSearchSource) {
  return normalizeSearchText(
    [
      source.title,
      source.address,
      source.description,
      source.locationArea,
      source.cityTown,
      source.province,
      source.ownerName,
      source.latitude,
      source.longitude,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" "),
  );
}

export function matchesPropertyMapSearch(query: string, searchIndex: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  return normalizedQuery.split(" ").every((token) => searchIndex.includes(token));
}
