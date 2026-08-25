"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, CheckCircle2 } from "lucide-react";

export function EditorialTestimonialCard() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      company: "Kabulonga Estates & Holdings",
      quote:
        "We now know our field brokers meet our strict institutional bar before they ever present a high-stakes title deed or diplomatic lease. That’s the Contour difference.",
      author: "Chileshe Mwamba",
      role: "Managing Director, Kabulonga Holdings",
      dealType: "Diplomatic Portfolio Mandate",
      stat1: "50%",
      stat1Label: "Faster title verification",
      stat2: "33%",
      stat2Label: "Increase in deal velocity",
      image: "/images/contour/agent-5.png",
    },
    {
      company: "Leopards Hill Brokerage",
      quote:
        "Field surveys during 8-hour ZESCO load-shedding used to stall our deals for days. With Contour's offline PowerSync app, our brokers never miss a high-net-worth inquiry.",
      author: "Grace Banda",
      role: "Principal Broker, Leopards Hill",
      dealType: "Luxury Residential & Acreage",
      stat1: "100%",
      stat1Label: "Offline survey uptime",
      stat2: "K920k",
      stat2Label: "Protected monthly commission",
      image: "/images/contour/agent-2.png",
    },
  ];

  const current = testimonials[activeIndex];

  return (
    <section className="py-24 bg-[#FAF8F5] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E57A1A] font-bold">
              Executive Proof & Track Record
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#141715] mt-2 tracking-tight">
              Don’t Take Our Word for It.
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
              }
              className="p-3 rounded-full border border-stone-300 hover:border-black bg-white hover:bg-stone-100 transition-colors"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-4 h-4 text-stone-800" />
            </button>
            <button
              onClick={() =>
                setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
              }
              className="p-3 rounded-full border border-stone-300 hover:border-black bg-white hover:bg-stone-100 transition-colors"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-4 h-4 text-stone-800" />
            </button>
          </div>
        </div>

        {/* Testimonial Luxury Editorial Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 md:p-16 border border-stone-200 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Portrait & Identity */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden mb-6 bg-stone-100 border-2 border-stone-200 shadow-md">
              <Image
                src={current.image}
                alt={current.author}
                fill
                className="object-cover object-top"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Operator</span>
            </div>

            <h3 className="font-serif font-bold text-2xl text-[#141715]">
              {current.author}
            </h3>
            <p className="text-stone-500 text-xs font-medium mt-0.5">
              {current.role}
            </p>
            <p className="text-stone-400 text-xs font-mono mt-1">
              {current.company} • {current.dealType}
            </p>
          </div>

          {/* Right Column: Quote & High-Impact Metrics */}
          <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-stone-200 pt-8 lg:pt-0 lg:pl-12">
            <div>
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-6 text-[#E57A1A]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#E57A1A]" />
                ))}
              </div>

              {/* Quote text */}
              <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-stone-900 leading-snug mb-8">
                “{current.quote}”
              </p>
            </div>

            {/* Metrics Callout */}
            <div className="grid grid-cols-2 gap-6 border-t border-stone-100 pt-6">
              <div>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-[#141715]">
                  {current.stat1}
                </div>
                <div className="text-xs text-stone-500 font-medium mt-1">
                  {current.stat1Label}
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-[#E57A1A]">
                  {current.stat2}
                </div>
                <div className="text-xs text-stone-500 font-medium mt-1">
                  {current.stat2Label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
