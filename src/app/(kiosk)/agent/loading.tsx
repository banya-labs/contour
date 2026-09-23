import React from "react";
import { SectionPendingState } from "@/components/ui/section-pending-state";

export default function Loading() {
  return <main data-field-console className="min-h-screen bg-[#F7F4EE] p-4"><SectionPendingState label="Opening field workspace…" compact /></main>;
}
