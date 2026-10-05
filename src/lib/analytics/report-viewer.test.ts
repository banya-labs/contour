import { describe, expect, it, vi } from "vitest";
import type { AiNarrative, ContourReportPayload } from "./types";
import { buildReportUrls, loadReportForViewer } from "./report-viewer";

const insights: AiNarrative = {
  executiveSummaryText: "No completed transactions in this period.",
  whatIsWorking: [], whatNeedsAttention: [],
  actionPlan: { immediatePriority1: [], thisWeekPriority2: [], nextMonthPriority3: [] },
  conclusionText: "Review the current pipeline.",
};
const report = { meta: { companyName: "Test Agency" }, aiNarrative: null } as ContourReportPayload;
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("analytics report viewer handoff", () => {
  it("preserves the custom reporting window and title in a reloadable URL", () => {
    const { apiUrl, viewerUrl } = buildReportUrls({ preset: "custom", from: "2026-09-01", to: "2026-09-30", title: "September & sales" });
    const url = new URL(viewerUrl, "https://contour.test");
    expect(url.searchParams.get("preset")).toBe("custom");
    expect(url.searchParams.get("from")).toBe("2026-09-01");
    expect(url.searchParams.get("to")).toBe("2026-09-30");
    expect(url.searchParams.get("title")).toBe("September & sales");
    expect(apiUrl).toBe("/api/analytics/report?preset=custom&from=2026-09-01&to=2026-09-30");
  });

  it("rejects an incomplete custom window instead of defaulting to this month", () => {
    expect(() => buildReportUrls({ preset: "custom", from: "2026-09-01", title: "Report" })).toThrow("Choose both");
  });

  it("reuses a complete authenticated AI snapshot without generating again", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ success: true, report: { ...report, aiNarrative: insights } }));
    expect((await loadReportForViewer("/api/analytics/report?preset=last_month", fetcher)).aiNarrative).toEqual(insights);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("enriches a report only after the AI endpoint succeeds", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, report }))
      .mockResolvedValueOnce(response({ success: true, insights }));
    expect((await loadReportForViewer("/api/analytics/report?preset=last_month", fetcher)).aiNarrative).toEqual(insights);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({ reportPayload: report });
  });

  it("blocks preview when AI generation fails rather than returning a partial report", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, report }))
      .mockResolvedValueOnce(response({ success: false, error: "AI provider unavailable" }, 503));
    await expect(loadReportForViewer("/api/analytics/report?preset=last_month", fetcher)).rejects.toThrow("AI provider unavailable");
  });

  it("blocks malformed AI output even when the API reports success", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ success: true, report }))
      .mockResolvedValueOnce(response({ success: true, insights: { executiveSummaryText: "Partial output" } }));
    await expect(loadReportForViewer("/api/analytics/report?preset=last_month", fetcher)).rejects.toThrow("complete AI insights");
  });

  it("does not call AI when the authenticated report request is denied", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ success: false, error: "Access denied" }, 403));
    await expect(loadReportForViewer("/api/analytics/report?preset=last_month", fetcher)).rejects.toThrow("Access denied");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
