import { z } from "zod";
import type { ContourReportPayload } from "./types";

const narrativeSchema = z.object({
  executiveSummaryText: z.string().trim().min(1),
  whatIsWorking: z.array(z.string()),
  whatNeedsAttention: z.array(z.string()),
  actionPlan: z.object({
    immediatePriority1: z.array(z.string()),
    thisWeekPriority2: z.array(z.string()),
    nextMonthPriority3: z.array(z.string()),
  }),
  conclusionText: z.string().trim().min(1),
});

export function buildReportUrls(selection: { preset: string; title: string; from?: string | null; to?: string | null }) {
  const params = new URLSearchParams({ preset: selection.preset });
  if (selection.preset === "custom") {
    if (!selection.from || !selection.to) throw new Error("Choose both the start and end dates for your report.");
    params.set("from", selection.from);
    params.set("to", selection.to);
  }
  const apiUrl = `/api/analytics/report?${params}`;
  params.set("title", selection.title);
  return { apiUrl, viewerUrl: `/dashboard/analytics/print?${params}` };
}

/** Resolve through authenticated APIs; never return an exportable report without AI. */
export async function loadReportForViewer(apiUrl: string, fetcher: typeof fetch = fetch, signal?: AbortSignal, onReportLoaded?: () => void): Promise<ContourReportPayload> {
  const response = await fetcher(apiUrl, { signal, cache: "no-store" });
  const data = await response.json() as { success?: boolean; report?: ContourReportPayload; error?: string };
  if (!response.ok || !data.success || !data.report) {
    throw new Error(data.error || "Unable to prepare the selected report.");
  }
  const report = data.report;
  onReportLoaded?.();
  const saved = narrativeSchema.safeParse(report.aiNarrative);
  if (saved.success) return { ...report, aiNarrative: saved.data };

  const aiResponse = await fetcher("/api/analytics/ai-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportPayload: report }),
    signal,
  });
  const aiData = await aiResponse.json() as { success?: boolean; insights?: unknown; error?: string };
  if (!aiResponse.ok || !aiData.success) {
    throw new Error(aiData.error || "Unable to generate AI insights. Please try again.");
  }
  const generated = narrativeSchema.safeParse(aiData.insights);
  if (!generated.success) throw new Error("Unable to prepare complete AI insights. Please try again.");
  return { ...report, aiNarrative: generated.data };
}
