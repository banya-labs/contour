"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pill";
  className?: string;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className = "",
}: AnimatedTabsProps) {
  return (
    <div
      role="tablist"
      className={`relative flex items-center border-b border-editorial-border overflow-x-auto no-scrollbar whitespace-nowrap ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none shrink-0 ${
              isActive
                ? "text-editorial-black"
                : "text-editorial-muted hover:text-editorial-black"
            } ${variant === "pill" && isActive ? "bg-neutral-100" : ""}`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? "text-contour-red" : "text-editorial-muted"}`} />}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-geist font-medium ${
                  isActive
                    ? "bg-contour-red text-white"
                    : "bg-neutral-100 text-editorial-muted"
                }`}
              >
                {tab.count}
              </span>
            )}

            {/* Sliding Underline / Active indicator using framer-motion layoutId */}
            {variant === "underline" && isActive && (
              <motion.div
                layoutId="active-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-contour-red"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
