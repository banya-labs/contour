import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Inspecting users in database...");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      members: {
        select: {
          id: true,
          role: true,
          organizationId: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} total users:`);
  for (const u of users) {
    console.log(`- [${u.id}] ${u.name} (${u.email}) - Role: ${u.role}, Orgs: ${u.members.length}`);
  }

  // Find test agents created during automated/manual testing phases
  const testUsers = users.filter((u) => {
    const email = u.email.toLowerCase();
    const name = (u.name || "").toLowerCase();
    return (
      email.startsWith("temp_agent_") ||
      email.startsWith("test_agent_") ||
      email.includes("agent-test") ||
      email.includes("testagent") ||
      name.includes("tembo mwape") ||
      name.includes("test agent")
    );
  });

  if (testUsers.length === 0) {
    console.log("✅ No lingering temporary test agent accounts found.");
    return;
  }

  console.log(`\n🧹 Found ${testUsers.length} temporary testing agent(s) to remove:`);
  for (const tu of testUsers) {
    console.log(`  Deleting test user: ${tu.name} (${tu.email})`);
    // Delete linked records or reassign
    await prisma.transaction.updateMany({
      where: { closingAgentId: tu.id },
      data: { closingAgentId: "usr_super_admin" },
    });
    await prisma.memberRoleAssignment.deleteMany({
      where: { member: { userId: tu.id } },
    });
    await prisma.memberPermissionOverride.deleteMany({
      where: { member: { userId: tu.id } },
    });
    await prisma.member.deleteMany({ where: { userId: tu.id } });
    await prisma.session.deleteMany({ where: { userId: tu.id } });
    await prisma.account.deleteMany({ where: { userId: tu.id } });
    await prisma.inquiry.updateMany({
      where: { assignedAgentId: tu.id },
      data: { assignedAgentId: null },
    });
    await prisma.property.updateMany({
      where: { assignedAgentId: tu.id },
      data: { assignedAgentId: null },
    });
    await prisma.user.delete({ where: { id: tu.id } });
  }

  console.log("✨ All temporary test agent accounts successfully purged from database!");
}

main()
  .catch((err) => {
    console.error("Error inspecting/cleaning test agents:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
