import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanSlate() {
  console.log("🧹 Starting clean slate: Removing all demo properties and linked operational data...");

  try {
    // 1. Delete dependent financial and operational records
    console.log("- Deleting rent arrears reminders...");
    await prisma.rentArrearsReminder.deleteMany({});

    console.log("- Deleting landlord statements...");
    await prisma.landlordStatement.deleteMany({});

    console.log("- Deleting maintenance expenses...");
    await prisma.maintenanceExpense.deleteMany({});

    console.log("- Deleting rent payments...");
    await prisma.rentPayment.deleteMany({});

    console.log("- Deleting leases...");
    await prisma.lease.deleteMany({});

    console.log("- Deleting transactions (commission splits)...");
    await prisma.transaction.deleteMany({});

    console.log("- Deleting property visits...");
    await prisma.propertyVisit.deleteMany({});

    console.log("- Deleting inquiries (clients)...");
    await prisma.inquiry.deleteMany({});

    console.log("- Deleting follow-up tasks...");
    await prisma.followUpTask.deleteMany({});

    console.log("- Deleting boundary evidence events...");
    await prisma.boundaryEvidenceEvent.deleteMany({});

    console.log("- Deleting property boundaries...");
    await prisma.propertyBoundary.deleteMany({});

    console.log("- Deleting survey extraction jobs...");
    await prisma.surveyExtractionJob.deleteMany({});

    console.log("- Deleting vault documents linked to properties...");
    await prisma.vaultDocument.deleteMany({
      where: {
        propertyId: { not: null }
      }
    });

    // 2. Delete all properties
    console.log("- Deleting all properties...");
    const deletedProperties = await prisma.property.deleteMany({});
    console.log(`✅ Deleted ${deletedProperties.count} properties.`);

    console.log("✨ Clean slate complete! Organizations, Users, and Roles remain intact.");
    console.log("Agencies can now create their workspaces and add their own authentic listings and field agents.");
  } catch (err) {
    console.error("❌ Error during clean slate execution:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSlate();
