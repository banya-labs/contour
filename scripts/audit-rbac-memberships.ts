import { db } from "../src/lib/db";
import { isPermission, effectivePermissionsForMember } from "../src/lib/authorization";

const shouldApply = process.argv.includes("--apply");

async function main() {
  const members = await db.member.findMany({
    select: {
      id: true,
      role: true,
      status: true,
      organizationId: true,
      roleAssignments: { select: { id: true, role: { select: { key: true } } } },
      permissionOverrides: { select: { id: true, permission: true, effect: true } },
    },
  });

  const ownerAssignmentIds: string[] = [];
  const invalidOverrideIds: string[] = [];
  const duplicateAssignmentMemberIds = new Set<string>();
  const noAccessMemberIds: string[] = [];

  for (const member of members) {
    if (member.role === "owner") {
      ownerAssignmentIds.push(...member.roleAssignments.map((assignment) => assignment.id));
    }
    if (member.roleAssignments.length > 1) duplicateAssignmentMemberIds.add(member.id);
    invalidOverrideIds.push(...member.permissionOverrides.filter((override) => !isPermission(override.permission)).map((override) => override.id));
    if (member.status === "active" && effectivePermissionsForMember(member.role, member.roleAssignments[0]?.role.key, member.permissionOverrides).length === 0) {
      noAccessMemberIds.push(member.id);
    }
  }

  console.log(JSON.stringify({
    mode: shouldApply ? "apply" : "audit",
    totals: { members: members.length, ownerAssignments: ownerAssignmentIds.length, invalidOverrides: invalidOverrideIds.length, duplicateAssignments: duplicateAssignmentMemberIds.size, activeMembersWithoutAccess: noAccessMemberIds.length },
  }, null, 2));

  if (!shouldApply) {
    console.log("Read-only audit complete. Re-run with --apply only after reviewing the counts.");
    return;
  }

  if (ownerAssignmentIds.length > 0 || invalidOverrideIds.length > 0) {
    await db.$transaction(async (tx) => {
      if (ownerAssignmentIds.length > 0) await tx.memberRoleAssignment.deleteMany({ where: { id: { in: ownerAssignmentIds } } });
      if (invalidOverrideIds.length > 0) await tx.memberPermissionOverride.deleteMany({ where: { id: { in: invalidOverrideIds } } });
    });
  }

  console.log(JSON.stringify({ repaired: { removedOwnerAssignments: ownerAssignmentIds.length, removedInvalidOverrides: invalidOverrideIds.length } }, null, 2));
}

main().catch((error) => {
  console.error("RBAC audit failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});
