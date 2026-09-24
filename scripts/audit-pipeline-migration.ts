import { db } from "@/lib/db";
import { mapLegacyPipelineState } from "@/lib/deal-workflow";

type AuditRow = {
  organizationId: string;
  sourceStatus: string;
  count: number;
  targetStatus: string;
  targetOutcome: string | null;
};

async function main() {
  const grouped = await db.inquiry.groupBy({
    by: ["organizationId", "status", "outcome"],
    _count: { _all: true },
    orderBy: [{ organizationId: "asc" }, { status: "asc" }],
  });

  const rows: AuditRow[] = grouped.map((group) => {
    const mapped = mapLegacyPipelineState(group.status, group.outcome);
    return {
      organizationId: group.organizationId,
      sourceStatus: group.status,
      count: group._count._all,
      targetStatus: mapped.status,
      targetOutcome: mapped.outcome,
    };
  });

  const manualReview = rows.filter((row) => row.targetStatus === "NEW_INQUIRY" && row.sourceStatus !== "NEW_INQUIRY");
  const organizationIds = new Set(rows.map((row) => row.organizationId));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  console.log(JSON.stringify({
    readOnly: true,
    organizations: organizationIds.size,
    inquiries: total,
    statusDistribution: rows,
    manualReview,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error("Pipeline migration audit failed.", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
