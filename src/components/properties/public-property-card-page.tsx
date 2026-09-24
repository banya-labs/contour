import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  PhoneCall,
  MessageSquare,
  Compass,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import PublicPropertyGallery from "@/components/properties/public-property-gallery";
import { PublicPropertyNavbar } from "@/components/properties/public-property-navbar";
import { PropertyLocationMap } from "@/components/properties/property-location-map";
import { formatWhatsAppDigits } from "@/lib/phone-utils";
import { publicPropertyPath } from "@/lib/public-property";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

async function getPropertyBySlug(slug: string) {
  const pathSegments = slug.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  const organizationSlug = pathSegments.length === 2 ? pathSegments[0] : undefined;
  const propertySlug = pathSegments.length === 2 ? pathSegments[1] : slug;
  try {
    const dbProperty = await db.property.findFirst({
      where: organizationSlug
        ? { slug: propertySlug, organization: { slug: organizationSlug }, status: { in: ["AVAILABLE", "UNDER_OFFER"] } }
        : { OR: [{ slug: propertySlug }, { id: propertySlug }], status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (dbProperty) {
      const photos = Array.isArray(dbProperty.photos) && dbProperty.photos.length > 0
        ? dbProperty.photos
        : [dbProperty.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"];

      return {
        id: dbProperty.id,
        title: dbProperty.title,
        slug: dbProperty.slug,
        ownershipType: dbProperty.ownershipType,
        propertyType: dbProperty.propertyType,
        listingType: dbProperty.listingType,
        askingPrice: dbProperty.askingPrice ? Number(dbProperty.askingPrice) : null,
        rentalPrice: dbProperty.rentalPrice ? Number(dbProperty.rentalPrice) : null,
        currency: dbProperty.currency || "ZMW",
        bedrooms: dbProperty.bedrooms,
        bathrooms: dbProperty.bathrooms ? Number(dbProperty.bathrooms) : null,
        plotSizeSqm: dbProperty.plotSizeSqm ? Number(dbProperty.plotSizeSqm) : null,
        description: dbProperty.description,
        photos,
        featuredPhoto: dbProperty.featuredPhoto || photos[0],
        suburb: dbProperty.suburb,
        city: dbProperty.city || "Lusaka",
        latitude: dbProperty.latitude,
        status: dbProperty.status,
        longitude: dbProperty.longitude,
        standBoundary: (dbProperty.standBoundary as [number, number][] | null) || null,
        landmarkDirections: dbProperty.landmarkDirections,
        assignedAgentName: dbProperty.assignedAgent?.name || "Grace Banda",
        assignedAgentPhone: dbProperty.assignedAgent?.phone || "+260 97 123 4567",
        assignedAgentEmail: dbProperty.assignedAgent?.email || "agent@contour.co.zm",
        organizationId: dbProperty.organizationId,
        organizationName: dbProperty.organization?.name || "Contour Real Estate",
        organizationSlug: dbProperty.organization?.slug || dbProperty.organizationId,
        features: [
          "Clean Ministry Certificate of Title",
          "Verified Cadastral Stand Boundary",
          "Statutory Sole Agency Mandate",
          "Direct Legal Escrow & Conveyancing Custody",
        ],
      };
    }
  } catch (err) {
    console.error("Database lookup for public property failed:", err);
    return null;
  }
}

async function getOrganizationOtherProperties(organizationId?: string, currentPropertyId?: string) {
  if (!organizationId) return [];
  try {
    const dbProperties = await db.property.findMany({
      where: {
        organizationId,
        id: currentPropertyId ? { not: currentPropertyId } : undefined,
        // Closed inventory must never be promoted from a public property page.
        // The detail route itself is also restricted to active inventory.
        status: { in: ["AVAILABLE", "UNDER_OFFER"] },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return dbProperties.map((p) => {
      const photos = Array.isArray(p.photos) && p.photos.length > 0
        ? p.photos
        : [p.featuredPhoto || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200"];

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        listingType: p.listingType,
        status: p.status,
        ownershipType: p.ownershipType,
        askingPrice: p.askingPrice ? Number(p.askingPrice) : null,
        rentalPrice: p.rentalPrice ? Number(p.rentalPrice) : null,
        currency: p.currency || "ZMW",
        suburb: p.suburb,
        city: p.city || "Lusaka",
        photos,
        featuredPhoto: p.featuredPhoto || photos[0],
      };
    });
  } catch (err) {
    console.warn("Database lookup for other organization properties failed:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const property = await getPropertyBySlug(resolvedParams.slug);

  if (!property) {
    return {
      title: "Property Not Found | Contour",
      description: "The requested property listing could not be found.",
    };
  }

  const priceText =
    property.listingType === "FOR_RENT"
      ? `${formatCurrency(Number(property.rentalPrice || 0), property.currency)}/month`
      : formatCurrency(Number(property.askingPrice || 0), property.currency);

  const title = `${property.title} — ${property.suburb}, ${property.city} (${priceText})`;
  const description = property.description
    ? `${property.description.slice(0, 155)}...`
    : `Exclusive real estate listing in ${property.suburb}, ${property.city}. Certified title deed and mandate verification on Contour.`;
  const canonicalUrl = `${siteUrl}${publicPropertyPath(property.organizationSlug, property.slug)}`;
  const photoUrl = `${siteUrl}/p/${property.organizationSlug}/${property.slug}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: photoUrl,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [photoUrl],
    },
  };
}

export default async function PublicPropertyCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const property = await getPropertyBySlug(resolvedParams.slug);

  if (!property) {
    notFound();
  }

  const priceText =
    property.listingType === "FOR_RENT"
      ? `${formatCurrency(Number(property.rentalPrice || 0), property.currency)} / month`
      : formatCurrency(Number(property.askingPrice || 0), property.currency);

  const whatsappMessage = encodeURIComponent(
    `Hello ${property.assignedAgentName || "Contour Agent"}, I am inquiring about the property: "${property.title}" (${property.suburb}) priced at ${priceText}. Link: ${siteUrl}${publicPropertyPath(property.organizationSlug, property.slug)}`
  );

  const otherProperties = await getOrganizationOtherProperties(property.organizationId, property.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description || property.title,
    "url": `${siteUrl}${publicPropertyPath(property.organizationSlug, property.slug)}`,
    "image": property.photos,
    "offers": {
      "@type": "Offer",
      "price": property.listingType === "FOR_RENT" ? property.rentalPrice : property.askingPrice,
      "priceCurrency": property.currency,
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-01-01",
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.suburb,
      "addressRegion": property.city,
      "addressCountry": "ZM",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": property.latitude,
      "longitude": property.longitude,
    },
    "broker": {
      "@type": "RealEstateAgent",
      "name": property.assignedAgentName || "Contour Verified Agent",
      "telephone": property.assignedAgentPhone || "+260971234567",
    },
  };

  return (
    <div className="flex-1 bg-white text-editorial-black pb-24 font-geist">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Global Navigation Bar linking back to Contour platform */}
      <PublicPropertyNavbar
        suburb={property.suburb}
        organizationSlug={property.organizationSlug}
        organizationName={property.organizationName}
      />

      {/* Top Header & Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 py-4 border-b border-editorial-border">
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-editorial-muted">
            <Link href="/" className="hover:text-editorial-black transition-colors">Home</Link>
            <span>/</span>
            <Link
              href={property.organizationSlug ? `/map/${encodeURIComponent(property.organizationSlug)}` : "/map"}
              className="hover:text-editorial-black transition-colors"
            >
              {property.city} Map
            </Link>
            <span>/</span>
            <span className="text-editorial-black font-semibold truncate max-w-[200px] sm:max-w-none">{property.suburb}</span>
          </nav>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-none bg-editorial-paper border border-editorial-border text-editorial-black uppercase tracking-widest">
            {property.status === "SOLD" ? "SOLD // TITLE TRANSFERRED" : property.listingType === "FOR_RENT" ? "FOR RENT // LEASE" : "FOR SALE // TITLE"}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 pt-6">
        {/* Photo Gallery with Interactive Carousel & 1-Click Client Sharing */}
        <PublicPropertyGallery
          title={property.title}
          suburb={property.suburb}
          city={property.city}
          priceText={priceText}
          photos={property.photos}
          featuredPhoto={property.featuredPhoto || undefined}
          slug={property.slug}
          organizationSlug={property.organizationSlug}
          agentName={property.assignedAgentName || undefined}
          agentPhone={property.assignedAgentPhone || undefined}
        />

        {/* Title & Specs */}
        <div className="bg-white rounded-none p-6 sm:p-8 border border-editorial-border space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-contour-red uppercase tracking-widest">
                {property.ownershipType === "COMPANY_OWNED" ? "COMPANY OWNED PORTFOLIO" : "EXCLUSIVE AGENCY MANDATE"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Title</span>
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-editorial-black tracking-tight mt-1">
              {property.title}
              {property.status === "SOLD" && <span className="ml-3 inline-block bg-[#1C1C1A] text-white px-2 py-1 text-xs align-middle uppercase tracking-wider">SOLD</span>}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono text-editorial-neutral mt-2">
              <MapPin className="w-4 h-4 text-contour-red shrink-0" />
              <span>{property.suburb}, {property.city}, Zambia</span>
            </div>
          </div>

          {/* Quick Specs Pill Row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-editorial-border text-xs font-mono text-editorial-black">
            {property.bedrooms && (
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.bedrooms}</strong> Bedrooms</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.bathrooms}</strong> Bathrooms</span>
              </div>
            )}
            {property.plotSizeSqm && (
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-editorial-neutral" />
                <span><strong className="text-editorial-black text-sm">{property.plotSizeSqm.toLocaleString()}</strong> sqm</span>
              </div>
            )}
          </div>

          {/* Landmark Directions Box */}
          {property.landmarkDirections && (
            <div className="bg-editorial-paper/40 p-5 rounded-none border border-editorial-border">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-editorial-black uppercase tracking-wider mb-1">
                <Compass className="w-4 h-4 text-contour-red" />
                <span>Landmark Navigation Directions (Lusaka)</span>
              </div>
              <p className="text-xs text-editorial-black leading-relaxed">
                {property.landmarkDirections}
              </p>
              {property.latitude && property.longitude && (
                <div className="text-[11px] font-mono text-editorial-neutral mt-2">
                  GPS COORDINATES: {Number(property.latitude).toFixed(4)}, {Number(property.longitude).toFixed(4)}
                </div>
              )}
            </div>
          )}

          {/* Detailed Overview */}
          <div>
            <h2 className="font-serif font-bold text-lg text-editorial-black mb-2">Property Overview & Specifications</h2>
            <p className="text-xs sm:text-sm text-editorial-black/80 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Features Checklist */}
          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="font-heading text-xs uppercase tracking-wider font-bold text-editorial-black mb-3">
                Key Features & Verification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-editorial-black">
                {property.features.map((feat: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-contour-red shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spatial Location Map with Area Pin & Cadastral Delineation */}
        <PropertyLocationMap
          title={property.title}
          suburb={property.suburb}
          city={property.city}
          priceText={priceText}
          latitude={property.latitude}
          longitude={property.longitude}
          standBoundary={property.standBoundary}
          landmarkDirections={property.landmarkDirections}
          featuredPhoto={property.featuredPhoto || property.photos[0]}
          organizationSlug={property.organizationSlug}
          organizationName={property.organizationName}
        />

        {/* Assigned Agent Contact Card */}
        <div className="bg-white rounded-none p-6 border border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-none bg-editorial-black text-white font-serif font-bold flex items-center justify-center text-lg shrink-0">
              {property.assignedAgentName ? property.assignedAgentName[0] : "A"}
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-editorial-neutral uppercase tracking-widest">
                EXCLUSIVE LISTING BROKER
              </div>
              <div className="font-serif font-bold text-base text-editorial-black">
                {property.assignedAgentName || "Contour Verified Agent"}
              </div>
              <div className="text-xs font-mono text-editorial-neutral">
                {property.assignedAgentPhone || "+260 97 123 4567"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/${formatWhatsAppDigits(property.assignedAgentPhone || "260971234567")}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-6 py-3 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-contour-red" />
              <span>Inquire on WhatsApp</span>
            </a>
            <a
              href={`tel:${property.assignedAgentPhone || "+260971234567"}`}
              className="p-3 rounded-none bg-white hover:bg-editorial-paper text-editorial-black border border-editorial-border text-xs transition-colors"
              title="Call Agent"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Internal Cross-Linking Section: Other Organization Mandates */}
        <div className="pt-6 border-t border-editorial-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-editorial-black">
                {property.organizationName ? `More Listings by ${property.organizationName}` : "Other Organization Mandates"}
              </h3>
              <p className="text-[11px] font-mono text-editorial-muted">
                Public property mandates from this organization
              </p>
            </div>
            <Link
              href={property.organizationSlug ? `/map/${encodeURIComponent(property.organizationSlug)}` : "/map"}
              className="text-xs font-mono text-contour-red hover:underline flex items-center gap-1 font-semibold shrink-0"
            >
              <span>Explore Public Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {otherProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherProperties.map((other) => (
                <Link
                  key={other.id}
                  href={publicPropertyPath(property.organizationSlug, other.slug)}
                  className="group border border-editorial-border bg-white hover:border-editorial-black transition-colors flex flex-col"
                >
                  <div className="relative w-full h-32 overflow-hidden bg-neutral-100">
                    <img
                      src={other.featuredPhoto || other.photos[0]}
                      alt={other.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 bg-editorial-black/90 text-white text-[10px] font-mono px-2 py-0.5">
                      {other.suburb}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-serif text-xs font-bold text-editorial-black line-clamp-2 group-hover:text-contour-red transition-colors">
                      {other.title}
                    </h4>
                    <div className="mt-2 text-xs font-mono font-bold text-editorial-black">
                      {other.listingType === "FOR_RENT"
                        ? `${formatCurrency(other.rentalPrice, other.currency)}/mo`
                        : formatCurrency(other.askingPrice, other.currency)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-editorial-border bg-neutral-50 p-6 sm:p-8 text-center space-y-2">
              <Building2 className="w-6 h-6 text-editorial-muted mx-auto" />
              <h4 className="font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-editorial-black">
                No Other Public Properties Listed
              </h4>
              <p className="text-xs text-editorial-muted max-w-md mx-auto leading-relaxed">
                There are currently no other public property mandates listed by {property.organizationName || "this organization"}.
              </p>
              <div className="pt-2">
                <Link
                  href={property.organizationSlug ? `/map/${encodeURIComponent(property.organizationSlug)}` : "/map"}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-contour-red hover:underline font-semibold"
                >
                  <span>View Organization Spatial Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
