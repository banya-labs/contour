/**
 * Contour Agency Branding & Social Media Settings Engine
 * Stores and provides agency branding configuration for social media cards, flyers, and client statements.
 */

export type AgencySettings = {
  agencyName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  whatsApp: string;
  email: string;
  website: string;
  licenseNumber: string;
  officeAddress: string;
  bannerAccentColor: string;
  instagramHandle: string;
  facebookPage: string;
};

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: "Contour Real Estate Zambia",
  tagline: "Lusaka's Premier Property Advisory & Mandate Vault",
  logoUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&auto=format&fit=crop&q=80",
  phone: "+260 97 123 4567",
  whatsApp: "+260 97 123 4567",
  email: "mandates@contour.co.zm",
  website: "www.contour.co.zm",
  licenseNumber: "ZREIC/LUS/2026/0488",
  officeAddress: "Suite 402, Centro Mall Complex, Kabulonga, Lusaka",
  bannerAccentColor: "#8B1E1E",
  instagramHandle: "@contour.zambia",
  facebookPage: "Contour Real Estate Zambia",
};

let currentAgencySettings: AgencySettings = { ...DEFAULT_AGENCY_SETTINGS };

export function getAgencySettings(): AgencySettings {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("contour_agency_settings");
    if (stored) {
      try {
        currentAgencySettings = JSON.parse(stored);
      } catch (e) {
        // use default
      }
    }
  }
  return currentAgencySettings;
}

export function saveAgencySettings(newSettings: Partial<AgencySettings>): AgencySettings {
  currentAgencySettings = {
    ...currentAgencySettings,
    ...newSettings,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("contour_agency_settings", JSON.stringify(currentAgencySettings));
  }
  return currentAgencySettings;
}
