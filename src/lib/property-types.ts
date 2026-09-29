export const PROPERTY_TYPE_OPTIONS = [
  { value: "STANDALONE_HOUSE", label: "Standalone House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "COMMERCIAL_OFFICE", label: "Commercial Office" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "VACANT_LAND_PLOT", label: "Vacant Land Plot" },
  { value: "FARM_AGRICULTURAL", label: "Farm / Agricultural" },
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPE_OPTIONS)[number]["value"];

export function propertyTypeLabel(value: string | null | undefined): string {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === value)?.label || "Property type not specified";
}
