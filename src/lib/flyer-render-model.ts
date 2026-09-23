export type FlyerAspectRatio = "4:5" | "1:1" | "9:16";
export type FlyerTemplate = "SWISS_LIGHT" | "SWISS_DARK" | "NAVY_EDITORIAL" | "GOLD_CLASSIC";
export type FlyerContactSource = "agent" | "agency";

export const FLYER_CANVAS = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const satisfies Record<FlyerAspectRatio, { width: number; height: number }>;

export type FlyerRenderModel = {
  aspectRatio: FlyerAspectRatio;
  template: FlyerTemplate;
  isSale: boolean;
  title: string;
  agencyName: string;
  suburb: string;
  price: number | null;
  currency: string;
  copy: string;
  features: string[];
  contact: { name: string; phone: string };
  imageSlots: { hero: number; secondaryOne: number; secondaryTwo: number };
};

export type FlyerModelInput = Omit<FlyerRenderModel, "features" | "title" | "agencyName" | "suburb" | "currency" | "copy" | "contact"> & {
  title?: string | null;
  agencyName?: string | null;
  suburb?: string | null;
  currency?: string | null;
  copy?: string | null;
  features?: Array<string | null | undefined> | null;
  contact?: { name?: string | null; phone?: string | null } | null;
};

const MAX_FEATURES = 8;

function clean(value: string | null | undefined, fallback = ""): string {
  return (value || fallback).replace(/\s+/g, " ").trim();
}

export function buildFlyerRenderModel(input: FlyerModelInput): FlyerRenderModel {
  return {
    aspectRatio: input.aspectRatio,
    template: input.template,
    isSale: input.isSale,
    title: clean(input.title, "Property"),
    agencyName: clean(input.agencyName, "Agency"),
    suburb: clean(input.suburb, "Lusaka"),
    price: input.price == null || Number.isFinite(input.price) ? input.price : null,
    currency: clean(input.currency, "USD").toUpperCase(),
    copy: clean(input.copy),
    features: (input.features || []).map((feature) => clean(feature)).filter(Boolean).slice(0, MAX_FEATURES),
    contact: {
      name: clean(input.contact?.name, "Agency"),
      phone: clean(input.contact?.phone, "number unavailable"),
    },
    imageSlots: {
      hero: Math.max(0, Math.floor(input.imageSlots.hero)),
      secondaryOne: Math.max(0, Math.floor(input.imageSlots.secondaryOne)),
      secondaryTwo: Math.max(0, Math.floor(input.imageSlots.secondaryTwo)),
    },
  };
}

