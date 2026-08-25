"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock, Calendar } from "lucide-react";

export function EditorialMarketNotes() {
  const articles = [
    {
      title: "Lusaka Real Estate: Dry Season Slowdown or High-Yield Acquisition Window?",
      excerpt:
        "Analyzing Q3 transaction velocity across Kabulonga and Leopards Hill. Why institutional family offices are locking commercial land parcels before infrastructure expansion.",
      date: "August 2026",
      readTime: "4 min read",
      category: "Market Report",
      image: "/images/solidroad/asset_28_mFBjbn51LwCjG5D3RgYP.png",
      slug: "lusaka-real-estate-dry-season-analysis",
    },
    {
      title: "What $500,000 Buys Across Kabulonga vs Leopards Hill vs Roma Park",
      excerpt:
        "A deep comparative analysis of price-per-square-meter, borehole water tables, solar microgrid resilience, and title verification speed in Lusaka's top 3 residential enclaves.",
      date: "August 2026",
      readTime: "6 min read",
      category: "Neighborhood Index",
      image: "/images/solidroad/asset_33_qq46LRopVAERA1djCvgl.png",
      slug: "what-500k-buys-in-lusaka",
    },
    {
      title: "The Diplomatic Tenancy Standard: Security Mandates & USD Cap Rates",
      excerpt:
        "How embassy leases evaluate perimeter security, 100% off-grid power continuity, and direct PACRA escrow contracts for multi-year executive postings.",
      date: "July 2026",
      readTime: "5 min read",
      category: "Diplomatic Leasing",
      image: "/images/solidroad/asset_38_lRau233hnNDJEhOiUyWJ.png",
      slug: "diplomatic-tenancy-standard-2026",
    },
  ];

  return (
    <section id="market-notes" className="py-24 bg-[#FAF8F5] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-stone-200">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
              Market Intelligence & Research
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#141715] mt-2 tracking-tight">
              Lusaka Editorial Notes
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 md:mt-0 text-xs font-bold text-stone-700 hover:text-black flex items-center gap-1.5 group"
          >
            <span>View All Research Dispatches</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((item, idx) => (
            <article
              key={idx}
              className="group bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative w-full h-52 bg-stone-900 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-4 text-stone-400 text-xs font-mono mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{item.date}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{item.readTime}</span>
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-xl text-[#141715] group-hover:text-[#E57A1A] transition-colors leading-snug mb-3">
                    {item.title}
                  </h3>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="px-6 pb-6 pt-2 border-t border-stone-100 mt-2">
                <Link
                  href="/dashboard"
                  className="text-xs font-bold text-[#141715] hover:text-[#E57A1A] inline-flex items-center gap-1.5 group/link"
                >
                  <span>Read Full Analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-link:translate-x-0.5 group-link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
