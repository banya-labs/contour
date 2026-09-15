import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  PhoneCall,
  MessageSquare,
  ChevronLeft,
  CheckCircle2,
  Compass,
  ArrowRight,
} from "lucide-react";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const property = MOCK_PROPERTIES.find((p) => p.slug === resolvedParams.slug);

  if (!property) {
    return {
      title: "Property Not Found | Contour",
      description: "The requested property listing could not be found.",
    };
  }

  const priceText =
    property.listingType === "FOR_RENT"
      ? `${formatCurrency(property.rentalPrice, property.currency)}/month`
      : formatCurrency(property.askingPrice, property.currency);

  const title = `${property.title} — ${property.suburb}, ${property.city} (${priceText})`;
  const description = property.description
    ? `${property.description.slice(0, 155)}...`
    : `Exclusive real estate listing in ${property.suburb}, ${property.city}. Certified title deed and mandate verification on Contour.`;
  const canonicalUrl = `${siteUrl}/p/${property.slug}`;
  const photoUrl = property.featuredPhoto || property.photos[0];

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
  const property = MOCK_PROPERTIES.find((p) => p.slug === resolvedParams.slug);

  if (!property) {
    notFound();
  }

  const priceText =
    property.listingType === "FOR_RENT"
      ? `${formatCurrency(property.rentalPrice, property.currency)} / month`
      : formatCurrency(property.askingPrice, property.currency);

  const whatsappMessage = encodeURIComponent(
    `Hello ${property.assignedAgentName || "Contour Agent"}, I am inquiring about the property: "${property.title}" (${property.suburb}) priced at ${priceText}. Link: ${siteUrl}/p/${property.slug}`
  );

  const otherProperties = MOCK_PROPERTIES.filter((p) => p.slug !== property.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description || property.title,
    "url": `${siteUrl}/p/${property.slug}`,
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

      {/* Top Header & Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 py-4 border-b border-editorial-border">
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-editorial-muted">
            <Link href="/" className="hover:text-editorial-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/dashboard/map" className="hover:text-editorial-black transition-colors">Lusaka</Link>
            <span>/</span>
            <span className="text-editorial-black font-semibold truncate max-w-[200px] sm:max-w-none">{property.suburb}</span>
          </nav>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-none bg-editorial-paper border border-editorial-border text-editorial-black uppercase tracking-widest">
            {property.listingType === "FOR_RENT" ? "FOR RENT // LEASE" : "FOR SALE // TITLE"}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 pt-6">
        {/* Photo Gallery Hero */}
        <div className="relative w-full h-72 sm:h-96 rounded-none overflow-hidden border border-editorial-border bg-editorial-paper/40">
          <Image
            src={property.featuredPhoto || property.photos[0]}
            alt={`${property.title} in ${property.suburb}, ${property.city}`}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
          <div className="absolute top-4 left-4 bg-editorial-black text-white text-xs font-mono font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            {property.suburb}, {property.city}
          </div>
          <div className="absolute bottom-4 right-4 bg-editorial-red text-white text-base font-mono font-bold px-4 py-2 rounded-none">
            {priceText}
          </div>
        </div>

        {/* Title & Specs */}
        <div className="bg-white rounded-none p-6 sm:p-8 border border-editorial-border space-y-6">
          <div>
            <span className="text-[11px] font-mono font-bold text-editorial-red uppercase tracking-widest">
              {property.ownershipType === "COMPANY_OWNED" ? "COMPANY OWNED PORTFOLIO" : "EXCLUSIVE AGENCY MANDATE"}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-editorial-black tracking-tight mt-1">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono text-editorial-neutral mt-2">
              <MapPin className="w-4 h-4 text-editorial-red shrink-0" />
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
                <Compass className="w-4 h-4 text-editorial-red" />
                <span>Landmark Navigation Directions (Lusaka)</span>
              </div>
              <p className="text-xs text-editorial-black leading-relaxed">
                {property.landmarkDirections}
              </p>
              {property.latitude && property.longitude && (
                <div className="text-[11px] font-mono text-editorial-neutral mt-2">
                  GPS COORDINATES: {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
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
                Key Features & Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-editorial-black">
                {property.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-editorial-red shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assigned Agent Contact Card */}
        <div className="bg-white rounded-none p-6 border border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-none bg-editorial-black text-white font-serif font-bold flex items-center justify-center text-lg shrink-0">
              {property.assignedAgentName ? property.assignedAgentName[0] : "A"}
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-editorial-neutral uppercase tracking-widest">
                LISTING AGENT
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
              href={`https://wa.me/${property.assignedAgentPhone?.replace(/\+/g, "") || "260971234567"}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-6 py-3 rounded-none bg-editorial-black hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-editorial-red" />
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

        {/* Internal Cross-Linking Section: Other Featured Mandates */}
        <div className="pt-6 border-t border-editorial-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-editorial-black">
              Other Featured Mandates in Lusaka
            </h3>
            <Link
              href="/dashboard/map"
              className="text-xs font-mono text-editorial-red hover:underline flex items-center gap-1"
            >
              <span>Explore Spatial Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherProperties.map((other) => (
              <Link
                key={other.id}
                href={`/p/${other.slug}`}
                className="group border border-editorial-border bg-white hover:border-editorial-black transition-colors flex flex-col"
              >
                <div className="relative w-full h-32 overflow-hidden bg-neutral-100">
                  <Image
                    src={other.featuredPhoto || other.photos[0]}
                    alt={other.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 bg-editorial-black/90 text-white text-[10px] font-mono px-2 py-0.5">
                    {other.suburb}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h4 className="font-serif text-xs font-bold text-editorial-black line-clamp-2 group-hover:text-editorial-red transition-colors">
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
        </div>
      </div>
    </div>
  );
}
