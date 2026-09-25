"use client";

import React from "react";
import { PageTabs, type PageTab } from "@/components/ui/page-tabs";

export type TabItem = PageTab;

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
  return <PageTabs tabs={tabs} activeTab={activeTab} onChange={onChange} className={className} />;
}
