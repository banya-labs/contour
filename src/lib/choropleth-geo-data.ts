import { PropertyMapItem } from "@/components/map/interactive-property-map";

export type ChoroplethLevel = "COUNTRY" | "PROVINCE" | "DISTRICT";

export type RegionGeoFeature = {
  id: string;
  name: string;
  level: ChoroplethLevel;
  parentId?: string; // e.g. country ID or province ID
  center: [number, number]; // [lat, lng]
  zoom: number;
  coordinates: [number, number][][]; // Polygon geometry rings [[[lat, lng], ...]]
};

export type RegionStats = {
  id: string;
  name: string;
  level: ChoroplethLevel;
  totalCount: number;
  forSaleCount: number;
  soldCount: number;
  forRentCount: number;
  rentedCount: number;
  avgAskingPrice: number;
  avgRentalPrice: number;
  currency: string;
};

// 🗺️ REALISTIC GEOGRAPHIC REGIONAL BOUNDARIES FOR SOUTHERN AFRICA
export const CHOROPLETH_REGIONS: RegionGeoFeature[] = [
  // ==================== LEVEL 1: COUNTRIES ====================
  {
    id: "country-zambia",
    name: "Zambia 🇿🇲",
    level: "COUNTRY",
    center: [-15.4167, 28.2833],
    zoom: 6,
    coordinates: [
      [
        [-8.22, 30.83],
        [-9.31, 32.85],
        [-10.98, 33.68],
        [-14.05, 33.02],
        [-15.63, 30.41],
        [-17.95, 25.85],
        [-17.80, 24.20],
        [-17.65, 23.40],
        [-16.10, 22.00],
        [-13.00, 22.00],
        [-11.00, 24.00],
        [-11.20, 29.00],
        [-8.22, 30.83],
      ],
    ],
  },
  {
    id: "country-zimbabwe",
    name: "Zimbabwe 🇿🇼",
    level: "COUNTRY",
    center: [-17.8252, 31.0335],
    zoom: 6,
    coordinates: [
      [
        [-15.61, 29.85],
        [-16.20, 32.80],
        [-17.80, 33.00],
        [-20.00, 32.70],
        [-22.40, 31.30],
        [-22.20, 29.90],
        [-21.60, 28.00],
        [-20.00, 26.50],
        [-17.90, 25.80],
        [-15.61, 29.85],
      ],
    ],
  },
  {
    id: "country-south-africa",
    name: "South Africa 🇿🇦",
    level: "COUNTRY",
    center: [-26.2041, 28.0473],
    zoom: 5,
    coordinates: [
      [
        [-22.15, 29.35],
        [-24.50, 31.80],
        [-26.85, 32.89],
        [-31.00, 30.20],
        [-33.95, 25.60],
        [-34.83, 20.00],
        [-33.00, 17.90],
        [-28.60, 16.45],
        [-26.80, 20.00],
        [-25.80, 22.70],
        [-22.15, 29.35],
      ],
    ],
  },

  // ==================== LEVEL 2: PROVINCES ====================
  // Zambia Provinces
  {
    id: "prov-lusaka",
    name: "Lusaka Province",
    level: "PROVINCE",
    parentId: "country-zambia",
    center: [-15.4167, 28.2833],
    zoom: 10,
    coordinates: [
      [
        [-14.95, 27.90],
        [-15.05, 28.95],
        [-15.40, 29.60],
        [-15.80, 29.10],
        [-15.85, 28.40],
        [-15.65, 27.95],
        [-14.95, 27.90],
      ],
    ],
  },
  {
    id: "prov-copperbelt",
    name: "Copperbelt Province",
    level: "PROVINCE",
    parentId: "country-zambia",
    center: [-12.8, 28.2],
    zoom: 9,
    coordinates: [
      [
        [-12.20, 27.20],
        [-12.10, 28.70],
        [-13.10, 29.00],
        [-13.70, 28.40],
        [-13.40, 27.20],
        [-12.20, 27.20],
      ],
    ],
  },
  {
    id: "prov-southern-zm",
    name: "Southern Province",
    level: "PROVINCE",
    parentId: "country-zambia",
    center: [-16.8, 27.0],
    zoom: 8,
    coordinates: [
      [
        [-15.80, 25.50],
        [-15.85, 28.40],
        [-16.50, 29.00],
        [-18.00, 26.80],
        [-17.80, 25.20],
        [-16.80, 24.80],
        [-15.80, 25.50],
      ],
    ],
  },

  // South Africa Provinces
  {
    id: "prov-gauteng",
    name: "Gauteng Province",
    level: "PROVINCE",
    parentId: "country-south-africa",
    center: [-26.2, 28.0],
    zoom: 10,
    coordinates: [
      [
        [-25.10, 28.10],
        [-25.50, 29.00],
        [-26.90, 28.80],
        [-26.95, 27.20],
        [-25.90, 27.10],
        [-25.10, 28.10],
      ],
    ],
  },
  {
    id: "prov-western-cape",
    name: "Western Cape",
    level: "PROVINCE",
    parentId: "country-south-africa",
    center: [-33.9, 18.4],
    zoom: 8,
    coordinates: [
      [
        [-31.10, 17.80],
        [-31.50, 24.20],
        [-34.20, 24.00],
        [-34.83, 20.00],
        [-33.80, 18.30],
        [-31.10, 17.80],
      ],
    ],
  },

  // Zimbabwe Provinces
  {
    id: "prov-harare",
    name: "Harare Province",
    level: "PROVINCE",
    parentId: "country-zimbabwe",
    center: [-17.8, 31.0],
    zoom: 10,
    coordinates: [
      [
        [-17.50, 30.70],
        [-17.50, 31.40],
        [-18.20, 31.35],
        [-18.15, 30.65],
        [-17.50, 30.70],
      ],
    ],
  },

  // ==================== LEVEL 3: DISTRICTS / SUBURBS ====================
  // Lusaka Province Districts
  {
    id: "dist-kabulonga-woodlands",
    name: "Kabulonga & Woodlands",
    level: "DISTRICT",
    parentId: "prov-lusaka",
    center: [-15.43, 28.33],
    zoom: 13,
    coordinates: [
      [
        [-15.405, 28.310],
        [-15.412, 28.358],
        [-15.445, 28.365],
        [-15.465, 28.340],
        [-15.455, 28.305],
        [-15.405, 28.310],
      ],
    ],
  },
  {
    id: "dist-roma-kalundu",
    name: "Roma Park, Kalundu & Mass Media",
    level: "DISTRICT",
    parentId: "prov-lusaka",
    center: [-15.39, 28.31],
    zoom: 13,
    coordinates: [
      [
        [-15.355, 28.275],
        [-15.362, 28.345],
        [-15.405, 28.340],
        [-15.408, 28.280],
        [-15.355, 28.275],
      ],
    ],
  },
  {
    id: "dist-leopards-hill",
    name: "Leopards Hill & New Kasama",
    level: "DISTRICT",
    parentId: "prov-lusaka",
    center: [-15.46, 28.40],
    zoom: 12,
    coordinates: [
      [
        [-15.425, 28.355],
        [-15.435, 28.480],
        [-15.520, 28.475],
        [-15.515, 28.350],
        [-15.425, 28.355],
      ],
    ],
  },
  {
    id: "dist-lusaka-cbd-west",
    name: "Lusaka CBD & Industrial West",
    level: "DISTRICT",
    parentId: "prov-lusaka",
    center: [-15.42, 28.27],
    zoom: 13,
    coordinates: [
      [
        [-15.385, 28.235],
        [-15.390, 28.290],
        [-15.455, 28.285],
        [-15.450, 28.230],
        [-15.385, 28.235],
      ],
    ],
  },
];

// 🎨 CALCULATE CHOROPLETH COLOR INTENSITY SCALE (EMPTY REGIONS ARE NULL / TRANSPARENT)
export function getChoroplethColor(count: number, maxCount: number): string | null {
  if (count === 0) return null; // No color overlay for empty regions!
  const ratio = count / Math.max(maxCount, 1);
  if (ratio <= 0.2) return "#fde6d2"; // Light Soft Amber
  if (ratio <= 0.4) return "#fca582"; // Coral Warm Orange
  if (ratio <= 0.65) return "#fb6a4a"; // Bright Contour Coral
  if (ratio <= 0.85) return "#de2d26"; // Contour Red
  return "#8b1e1e"; // Deep Burgundy Ink (Maximum Density)
}

export function getChoroplethOpacity(count: number): number {
  if (count === 0) return 0; // 100% transparent for empty regions!
  if (count < 3) return 0.45;
  if (count < 7) return 0.65;
  return 0.8;
}

// 📊 COMPUTE LIVE REGIONAL STATS & BREAKDOWN FROM PROPERTIES LIST
export function computeRegionStats(
  region: RegionGeoFeature,
  properties: PropertyMapItem[]
): RegionStats {
  const regionNameLower = region.name.toLowerCase();

  const matchedProperties = properties.filter((p) => {
    const pSuburb = p.suburb.toLowerCase();
    const pCity = p.city.toLowerCase();

    if (region.id === "country-zambia") return pCity.includes("lusaka") || pCity.includes("ndola") || pCity.includes("kitwe") || pCity.includes("livingstone") || true;
    if (region.id === "country-zimbabwe") return pCity.includes("harare") || pCity.includes("bulawayo");
    if (region.id === "country-south-africa") return pCity.includes("johannesburg") || pCity.includes("cape town") || pCity.includes("sandton");

    if (region.id === "prov-lusaka") return pCity.includes("lusaka");
    if (region.id === "prov-copperbelt") return pCity.includes("ndola") || pCity.includes("kitwe");
    if (region.id === "prov-gauteng") return pCity.includes("johannesburg") || pCity.includes("sandton");

    if (region.id === "dist-kabulonga-woodlands") return pSuburb.includes("kabulonga") || pSuburb.includes("woodlands") || pSuburb.includes("sunningdale");
    if (region.id === "dist-roma-kalundu") return pSuburb.includes("roma") || pSuburb.includes("kalundu") || pSuburb.includes("mass media");
    if (region.id === "dist-leopards-hill") return pSuburb.includes("leopards") || pSuburb.includes("kasama");
    if (region.id === "dist-lusaka-cbd-west") return pSuburb.includes("cbd") || pSuburb.includes("rhodespark") || pSuburb.includes("industrial");

    return pSuburb.includes(regionNameLower) || regionNameLower.includes(pSuburb);
  });

  const totalCount = matchedProperties.length;
  const forSaleCount = matchedProperties.filter((p) => p.listingType === "FOR_SALE" && p.status !== "SOLD").length;
  const soldCount = matchedProperties.filter((p) => p.status === "SOLD").length;
  const forRentCount = matchedProperties.filter((p) => p.listingType === "FOR_RENT" && p.status !== "RENTED").length;
  const rentedCount = matchedProperties.filter((p) => p.status === "RENTED").length;

  const askingPrices = matchedProperties.filter((p) => p.askingPrice).map((p) => p.askingPrice!);
  const rentalPrices = matchedProperties.filter((p) => p.rentalPrice).map((p) => p.rentalPrice!);

  const avgAskingPrice = askingPrices.length > 0 ? Math.round(askingPrices.reduce((a, b) => a + b, 0) / askingPrices.length) : 0;
  const avgRentalPrice = rentalPrices.length > 0 ? Math.round(rentalPrices.reduce((a, b) => a + b, 0) / rentalPrices.length) : 0;

  return {
    id: region.id,
    name: region.name,
    level: region.level,
    totalCount,
    forSaleCount,
    soldCount,
    forRentCount,
    rentedCount,
    avgAskingPrice,
    avgRentalPrice,
    currency: matchedProperties[0]?.currency || "ZMW",
  };
}
