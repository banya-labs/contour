import { db } from "@/lib/db";
import type { InquiryStatus } from "@prisma/client";

const LEGACY_STATUS_MAP = {
  CONTACTED: "QUALIFIED",
  VIEWING_SCHEDULED: "VIEWING_OR_OFFER",
  OFFER_MADE: "VIEWING_OR_OFFER",
  MANAGEMENT_HANDOVER: "VERIFICATION_CLOSING",
} as const;

const applyRequested = process.argv.includes("--apply");
const writeGuard = process.env.CONTOUR_PIPELINE_MIGRATION_ALLOW_WRITE === "true";
const stagingGuard = process.env.CONTOUR_ENV === "staging";

async function main() {
  const grouped = await db.inquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });

  const planned = grouped
    .filter((group) => group.status in LEGACY_STATUS_MAP)
    .map((group) => ({
      from: group.status,
      to: LEGACY_STATUS_MAP[group.status as keyof typeof LEGACY_STATUS_MAP],
      count: group._count._all,
    }));

  if (!applyRequested) {
    console.log(JSON.stringify({ mode: "dry-run", writePerformed: false, planned }, null, 2));
    return;
  }

  if (!writeGuard || !stagingGuard) {
    throw new Error("Refusing to write. Set CONTOUR_ENV=staging and CONTOUR_PIPELINE_MIGRATION_ALLOW_WRITE=true for an explicitly approved staging rehearsal.");
  }

  const result = await db.$transaction(async (tx) => {
    const updates: Array<{ from: string; to: string; count: number }> = [];
    for (const item of planned) {
      const updated = await tx.inquiry.updateMany({
        where: { status: item.from as InquiryStatus },
        data: { status: item.to as InquiryStatus },
      });
      updates.push({ ...item, count: updated.count });
    }
    return updates;
  });

  console.log(JSON.stringify({ mode: "apply", writePerformed: true, updates: result }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error("Pipeline stage migration failed.", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
