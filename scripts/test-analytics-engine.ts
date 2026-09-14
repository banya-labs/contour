import { db } from "../src/lib/db";
import { ContourReportEngine } from "../src/lib/analytics/report-engine";

async function main() {
  console.log("================================================================================");
  console.log("CONTOUR ANALYTICS ENGINE & PERFORMANCE REPORT — INTEGRITY & VALIDATION SUITE");
  console.log("================================================================================\n");

  // 1. Find or create a demo organization for testing
  let org = await db.organization.findFirst({
    where: { slug: "demo-banya-org" },
  });

  if (!org) {
    org = await db.organization.findFirst();
  }

  if (!org) {
    console.log("Creating temporary test organization...");
    org = await db.organization.create({
      data: {
        name: "Mals Property Consultancy",
        slug: "mals-property-test",
        currency: "ZMW",
      },
    });
  }

  console.log(`✓ Using Organization: ${org.name} (${org.id}) [${org.currency}]`);

  // 2. Test Report Computation for August 2026 window
  const fromDate = new Date("2026-08-01T00:00:00.000Z");
  const toDate = new Date("2026-08-31T23:59:59.999Z");

  console.log(`\n▶ Computing report for period: 01 Aug 2026 – 31 Aug 2026...`);
  const startTime = Date.now();
  const report = await ContourReportEngine.compute(
    org.id,
    fromDate,
    toDate,
    "August 2026"
  );
  const elapsed = Date.now() - startTime;
  console.log(`✓ Report computed in ${elapsed}ms!\n`);

  // 3. Mathematical & Integrity Assertions
  console.log("--- EXECUTING INTEGRITY ASSERTIONS ---");

  // Assertion 1: Non-null metadata
  if (!report.meta.companyName || !report.period.label) {
    throw new Error("FAIL: Report metadata is missing companyName or label.");
  }
  console.log("✓ Assertion 1 PASSED: Report metadata valid.");

  // Assertion 2: Commission arithmetic
  const { companyCommission, agentCommissions, netCompanyCommission } = report.financialKpis;
  const expectedNet = Math.max(0, companyCommission - agentCommissions);
  if (netCompanyCommission !== expectedNet) {
    throw new Error(`FAIL: Net commission mismatch: got ${netCompanyCommission}, expected ${expectedNet}`);
  }
  console.log(`✓ Assertion 2 PASSED: Commission math exact: Gross K${companyCommission} - Agent K${agentCommissions} = Net K${netCompanyCommission}`);

  // Assertion 3: Match Rate Percentage
  const { totalInquiries, fullyMatched, partiallyMatched, matchRatePct } = report.matching;
  const expectedMatchRate =
    totalInquiries > 0
      ? Math.round(((fullyMatched + partiallyMatched) / totalInquiries) * 1000) / 10
      : 0;
  if (matchRatePct !== expectedMatchRate) {
    throw new Error(`FAIL: Match rate math mismatch: got ${matchRatePct}, expected ${expectedMatchRate}`);
  }
  console.log(`✓ Assertion 3 PASSED: Matching efficiency exact: ${fullyMatched + partiallyMatched}/${totalInquiries} = ${matchRatePct}%`);

  // Assertion 4: Viewing Completion Rate
  const { scheduled, completed, completionRatePct } = report.viewings;
  const expectedCompletion =
    scheduled > 0 ? Math.round((completed / scheduled) * 1000) / 10 : 0;
  if (completionRatePct !== expectedCompletion) {
    throw new Error(`FAIL: Viewing completion mismatch: got ${completionRatePct}, expected ${expectedCompletion}`);
  }
  console.log(`✓ Assertion 4 PASSED: Viewing completion exact: ${completed}/${scheduled} = ${completionRatePct}%`);

  // Assertion 5: Pipeline stages non-empty
  if (!report.pipelineFunnel.stages || report.pipelineFunnel.stages.length < 5) {
    throw new Error("FAIL: Pipeline funnel stages incomplete.");
  }
  console.log(`✓ Assertion 5 PASSED: Pipeline funnel contains all ${report.pipelineFunnel.stages.length} stages.`);

  // Assertion 6: AI Narrative structure
  const { executiveSummaryText, whatIsWorking, whatNeedsAttention, actionPlan, conclusionText } = report.aiNarrative;
  if (!executiveSummaryText || whatIsWorking.length === 0 || whatNeedsAttention.length === 0 || !conclusionText) {
    throw new Error("FAIL: AI Narrative is missing critical sections.");
  }
  if (!actionPlan.immediatePriority1 || !actionPlan.thisWeekPriority2 || !actionPlan.nextMonthPriority3) {
    throw new Error("FAIL: AI 3-Tier Action plan is incomplete.");
  }
  console.log("✓ Assertion 6 PASSED: AI Executive Narrative sections fully populated.");

  // Assertion 7: Month-on-Month Trends
  if (!report.momComparison || report.momComparison.length < 5) {
    throw new Error("FAIL: Month-on-Month comparison rows missing.");
  }
  console.log(`✓ Assertion 7 PASSED: Month-on-Month comparison contains ${report.momComparison.length} audited indicators.`);

  console.log("\n================================================================================");
  console.log("ALL 7 CRITICAL INTEGRITY ASSERTIONS PASSED WITH ZERO ERRORS!");
  console.log("================================================================================");
}

main()
  .catch((e) => {
    console.error("\n❌ TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
