"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, KeyRound, Building, FileCheck2, Sparkles } from "lucide-react";

export function CuratedServicesBento() {
  const services = [
    {
      title: "Exclusive Mandates & Luxury Brokerage",
      category: "Sales & Acquisitions",
      desc: "White-glove representation for prime Lusaka properties with pre-screened diplomatic and institutional buyers.",
      features: ["5% Commission Transparency", "Direct Title Verification", "Private WhatsApp Syndication"],
      image: "/images/solidroad/asset_28_mFBjbn51LwCjG5D3RgYP.png",
      cta: "View Sales Mandates",
      link: "/dashboard/sales",
    },
    {
      title: "Diplomatic Property & Rental Management",
      category: "Leases & Custody",
      desc: "End-to-end lease administration, automated WhatsApp rent collections, and vetted contractor maintenance.",
      features: ["4-Day Cooldown WhatsApp Nudges", "PowerSync Offline Field Inspections", "Automated Landlord Statements"],
      image: "/images/solidroad/asset_33_qq46LRopVAERA1djCvgl.png",
      cta: "Explore Lease OS",
      link: "/dashboard/leases",
    },
    {
      title: "Commercial Acreage & Title Deed Vault",
      category: "Development & Custody",
      desc: "Legal-grade digital escrow for Certificates of Title, NRC ID scans, and cadastral survey coordinate records.",
      features: ["100% POPIA / PACRA Sovereignty", "MinIO S3 Presigned Legal Custody", "Beacon & Cadastral Mapping"],
      image: "/images/solidroad/asset_38_lRau233hnNDJEhOiUyWJ.png",
      cta: "Access Title Vault",
      link: "/dashboard/documents",
    },
  ];

  return (
    <section id="services" className="py-24 bg-[#FAF8F5] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
            Full-Spectrum Real Estate Operating System
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#141715] mt-2 tracking-tight">
            Institutional Rigor. Local Precision.
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-4 leading-relaxed font-medium">
            Whether you are liquidating a high-value estate, managing diplomatic leases, or locking title custody, Contour delivers the complete operating infrastructure.
          </p>
        </div>

        {/* 3-Column Services Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((svc, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Image Thumbnail with Overlay */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6 bg-stone-900">
                  <Image
                    src={svc.image}
                    alt={svc.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900 shadow">
                    {svc.category}
                  </div>
                </div>

                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#141715] mb-3 group-hover:text-[#E57A1A] transition-colors leading-snug">
                  {svc.title}
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  {svc.desc}
                </p>

                {/* Features List */}
                <div className="space-y-2.5 mb-8 border-t border-stone-100 pt-4">
                  {svc.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E57A1A]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={svc.link}
                className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-[#141715] text-stone-800 hover:text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <span>{svc.cta}</span>
                <ArrowUpRight className="w-4 h-4 text-stone-500 group-hover/btn:text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
