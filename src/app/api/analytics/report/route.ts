import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { ContourReportEngine } from "@/lib/analytics/report-engine";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (req, ctx) => {
    const { organizationId } = ctx;
    const { searchParams } = new URL(req.url);

    const preset = searchParams.get("preset") || "this_month";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    let fromDate: Date;
    let toDate: Date;
    let label = "This Month";

    if (preset === "today") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = `Today (${fromDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})`;
    } else if (preset === "this_week") {
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
      const diffToMonday = (dayOfWeek + 6) % 7;
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      toDate = new Date(now);
      label = "This Week";
    } else if (preset === "last_month") {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = fromDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    } else if (preset === "custom" && fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);
      toDate.setHours(23, 59, 59, 999);
      label = `${fromParam} – ${toParam}`;
    } else {
      // Default: this_month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = new Date(now);
      label = fromDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }

    // Safety guardrail: prevent extreme date ranges
    const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > maxRangeMs) {
      return NextResponse.json(
        { success: false, error: "Requested date window cannot exceed 366 days." },
        { status: 400 }
      );
    }

    try {
      const report = await ContourReportEngine.compute(
        organizationId!,
        fromDate,
        toDate,
        label
      );

      return NextResponse.json({ success: true, report });
    } catch (err: any) {
      console.error("[ANALYTICS_REPORT_ERROR]", err);
      return NextResponse.json(
        { success: false, error: err?.message || "Failed to generate business intelligence report." },
        { status: 500 }
      );
    }
  },
});
