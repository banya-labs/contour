export type FlyerContactSource = "agent" | "agency";

export type FlyerContact = {
  name: string;
  phone: string;
  email: string;
  instagram: string;
  website: string;
};

export function resolveFlyerContact(
  source: FlyerContactSource,
  agent: Partial<FlyerContact> | null | undefined,
  agency: Partial<FlyerContact> | null | undefined,
): FlyerContact {
  const selected = source === "agent" ? agent : agency;
  return {
    name: selected?.name?.trim() || "Contour Agent",
    phone: selected?.phone?.trim() || "Contact for details",
    email: selected?.email?.trim() || "",
    instagram: selected?.instagram?.trim() || "",
    website: selected?.website?.trim() || "",
  };
}
