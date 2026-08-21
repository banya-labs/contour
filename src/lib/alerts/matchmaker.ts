/**
 * Banya Labs Reverse Property-Matching & WhatsApp Alert Engine
 * Evaluates incoming properties against registered client/buyer criteria,
 * tracks automated reminder status/timestamps, and enables 1-click manual offer outreach.
 */

import { formatCurrency } from "@/lib/utils";

export type PropertyAlert = {
  id: string;
  organizationId: string;
  clientName: string;
  clientPhone: string;
  suburb: string;
  listingType: "FOR_SALE" | "FOR_RENT";
  maxPrice: number;
  currency: "ZMW" | "USD";
  minBedrooms: number;
  assignedAgentName: string;
  status: "ACTIVE" | "PAUSED" | "FULFILLED";
  matchCount: number;
  createdAt: string;
};

export type AlertMatchResult = {
  id: string;
  alert: PropertyAlert;
  matchedProperty: any;
  whatsAppMessage: string;
  dispatchTimestamp: string;
  reminderStatus: "SENT" | "QUEUED" | "DELIVERED";
  deliveryChannel: "WHATSAPP_TWILIO" | "WHATSAPP_DIRECT" | "SMS";
  matchPercentage: number;
  customOfferText: string;
};

// Realistic seed alerts for Lusaka buyers
export const INITIAL_MOCK_ALERTS: PropertyAlert[] = [
  {
    id: "alert_01",
    organizationId: "org_contour_demo",
    clientName: "Nchimunya Mweene",
    clientPhone: "+260971889900",
    suburb: "Kabulonga",
    listingType: "FOR_SALE",
    maxPrice: 4000000,
    currency: "ZMW",
    minBedrooms: 3,
    assignedAgentName: "Tembo Mwape",
    status: "ACTIVE",
    matchCount: 1,
    createdAt: "2026-08-10",
  },
  {
    id: "alert_02",
    organizationId: "org_contour_demo",
    clientName: "Dr. Thabo Zulu",
    clientPhone: "+260965223344",
    suburb: "Leopards Hill",
    listingType: "FOR_RENT",
    maxPrice: 2500,
    currency: "USD",
    minBedrooms: 3,
    assignedAgentName: "Chipo Banda",
    status: "ACTIVE",
    matchCount: 1,
    createdAt: "2026-08-12",
  },
  {
    id: "alert_03",
    organizationId: "org_contour_demo",
    clientName: "Mwamba & Sons Holdings",
    clientPhone: "+260978667788",
    suburb: "Roma Park",
    listingType: "FOR_SALE",
    maxPrice: 900000,
    currency: "USD",
    minBedrooms: 0,
    assignedAgentName: "Grace Banda",
    status: "ACTIVE",
    matchCount: 1,
    createdAt: "2026-08-14",
  },
  {
    id: "alert_04",
    organizationId: "org_contour_demo",
    clientName: "Bwalya Chilufya",
    clientPhone: "+260977443322",
    suburb: "Woodlands",
    listingType: "FOR_RENT",
    maxPrice: 20000,
    currency: "ZMW",
    minBedrooms: 2,
    assignedAgentName: "Tembo Mwape",
    status: "ACTIVE",
    matchCount: 1,
    createdAt: "2026-08-15",
  },
];

let globalAlertsStore: PropertyAlert[] = [...INITIAL_MOCK_ALERTS];

export function getActiveAlerts(): PropertyAlert[] {
  return globalAlertsStore.filter((a) => a.status === "ACTIVE");
}

export function registerPropertyAlert(
  newAlert: Omit<PropertyAlert, "id" | "matchCount" | "createdAt">
): PropertyAlert {
  const alert: PropertyAlert = {
    ...newAlert,
    id: `alert_${Date.now()}`,
    matchCount: 0,
    createdAt: new Date().toISOString().split("T")[0],
  };
  globalAlertsStore.unshift(alert);
  return alert;
}

/**
 * Event-Driven Matchmaker: Evaluates a property against all active alerts
 */
export function evaluatePropertyAgainstAlerts(newProperty: {
  title: string;
  slug: string;
  suburb: string;
  listingType: "FOR_SALE" | "FOR_RENT" | "BOTH" | string;
  askingPrice?: number | null;
  rentalPrice?: number | null;
  currency?: string | null;
  bedrooms?: number | null;
  landmarkDirections?: string | null;
  assignedAgentName?: string | null;
}): AlertMatchResult[] {
  const activeAlerts = getActiveAlerts();
  const matches: AlertMatchResult[] = [];
  const propertyPrice = newProperty.listingType === "FOR_SALE"
    ? newProperty.askingPrice || 0
    : newProperty.rentalPrice || 0;

  for (const alert of activeAlerts) {
    // 1. Suburb Match
    const matchesSuburb =
      alert.suburb.toLowerCase() === newProperty.suburb.toLowerCase() ||
      alert.suburb === "ALL";

    // 2. Listing Type Match (FOR_SALE vs FOR_RENT vs BOTH)
    const matchesType =
      alert.listingType === newProperty.listingType ||
      newProperty.listingType === "BOTH";

    // 3. Currency Match
    const matchesCurrency = alert.currency === newProperty.currency;

    // 4. Budget Constraint (Within max budget + 10% flexible negotiation window)
    const matchesBudget = propertyPrice <= alert.maxPrice * 1.1;

    // 5. Bedroom Count Constraint
    const matchesBedrooms =
      alert.minBedrooms === 0 ||
      (newProperty.bedrooms != null && newProperty.bedrooms >= alert.minBedrooms);

    if (matchesSuburb && matchesType && matchesCurrency && matchesBudget && matchesBedrooms) {
      alert.matchCount += 1;

      const priceFormatted = formatCurrency(propertyPrice, newProperty.currency || "ZMW");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://contour.app";
      const publicLink = `${appUrl}/p/${newProperty.slug}`;

      const now = new Date();
      const timeFormatted = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // Pre-formatted automated WhatsApp message
      const whatsAppMessage =
        `👋 *Hi ${alert.clientName}!*\n\n` +
        `🎯 *Matching Property Found:* A new listing in *${newProperty.suburb}* matching your exact criteria has just been published:\n\n` +
        `🏡 *${newProperty.title}*\n` +
        `📍 *Location:* ${newProperty.suburb}, Lusaka (${newProperty.landmarkDirections || "Near center"})\n` +
        `💰 *Price:* ${priceFormatted}${newProperty.listingType === "FOR_RENT" ? " / mo" : ""}\n` +
        `🛏️ *Specs:* ${newProperty.bedrooms ? `${newProperty.bedrooms} Bedrooms` : "Development Plot"}\n\n` +
        `👉 *View Full Photos & Map:* ${publicLink}\n\n` +
        `_Your assigned agent, ${alert.assignedAgentName || "Contour Broker"}, is available for an exclusive viewing today._`;

      // Pre-formatted personalized manual offer message for direct broker outreach
      const customOfferText =
        `Hi ${alert.clientName}, I just listed a brand new ${newProperty.bedrooms || ""}-bed property in ${newProperty.suburb} that fits your ${alert.currency} ${alert.maxPrice.toLocaleString()} budget perfectly:\n\n` +
        `"${newProperty.title}" for ${priceFormatted}.\n\n` +
        `Photos and full verified survey folio are here: ${publicLink}\n\n` +
        `Would you like to schedule a private viewing this afternoon?`;

      matches.push({
        id: `match_${alert.id}_${Date.now()}`,
        alert,
        matchedProperty: newProperty,
        whatsAppMessage,
        dispatchTimestamp: timeFormatted,
        reminderStatus: "SENT",
        deliveryChannel: "WHATSAPP_TWILIO",
        matchPercentage: 100,
        customOfferText,
      });
    }
  }

  return matches;
}

/**
 * Get active matches for any existing property in inventory
 */
export function getMatchesForExistingProperty(property: any): AlertMatchResult[] {
  return evaluatePropertyAgainstAlerts(property);
}
