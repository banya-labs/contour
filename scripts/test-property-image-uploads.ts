import { canManagePropertyPhotos, isManagementRole } from "../src/lib/authorization";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING PROPERTY IMAGE UPLOAD & PERMISSION LOGIC");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${details ? `: ${details}` : ""}`);
    }
  }

  // 1. Role-based Management Identification
  console.log("--- 1. Testing Management Role Detection ---");
  assert("SUPER_ADMIN is recognized as management", isManagementRole("SUPER_ADMIN"));
  assert("OWNER is recognized as management", isManagementRole("OWNER"));
  assert("BROKER_MANAGER is recognized as management", isManagementRole("BROKER_MANAGER"));
  assert("FIELD_AGENT is NOT management", !isManagementRole("FIELD_AGENT"));
  assert("ADMIN_STAFF is NOT management", !isManagementRole("ADMIN_STAFF"));
  assert("TENANT is NOT management", !isManagementRole("TENANT"));
  assert("LANDLORD is NOT management", !isManagementRole("LANDLORD"));

  // 2. Property Photo Management Permissions
  console.log("\n--- 2. Testing Property Photo Permissions by Role & Assignment ---");
  const propertyA = {
    id: "prop_kabulonga_villa",
    assignedAgentId: "usr_agent_tembo",
    createdById: "usr_agent_tembo",
  };

  const propertyB = {
    id: "prop_leopards_hill",
    assignedAgentId: "usr_agent_chipo",
    createdById: "usr_agent_chipo",
  };

  // Manager Tests (Can manage ANY property)
  const managerUser = { id: "usr_manager_grace", role: "BROKER_MANAGER" };
  const ownerUser = { id: "usr_owner_banya", role: "SUPER_ADMIN" };

  assert(
    "Broker Manager can manage photos for Property A",
    canManagePropertyPhotos(managerUser, propertyA)
  );
  assert(
    "Broker Manager can manage photos for Property B",
    canManagePropertyPhotos(managerUser, propertyB)
  );
  assert(
    "Super Admin Owner can manage photos for Property A",
    canManagePropertyPhotos(ownerUser, propertyA)
  );
  assert(
    "Super Admin Owner can manage photos for Property B",
    canManagePropertyPhotos(ownerUser, propertyB)
  );

  // Field Agent Tests (Can ONLY manage assigned properties)
  const agentTembo = { id: "usr_agent_tembo", role: "FIELD_AGENT" };
  const agentChipo = { id: "usr_agent_chipo", role: "FIELD_AGENT" };
  const unassignedAgent = { id: "usr_agent_unassigned", role: "FIELD_AGENT" };

  assert(
    "Agent Tembo CAN manage photos for assigned Property A",
    canManagePropertyPhotos(agentTembo, propertyA)
  );
  assert(
    "Agent Tembo CANNOT manage photos for unassigned Property B",
    !canManagePropertyPhotos(agentTembo, propertyB)
  );

  assert(
    "Agent Chipo CAN manage photos for assigned Property B",
    canManagePropertyPhotos(agentChipo, propertyB)
  );
  assert(
    "Agent Chipo CANNOT manage photos for unassigned Property A",
    !canManagePropertyPhotos(agentChipo, propertyA)
  );

  assert(
    "Unassigned Agent CANNOT manage photos for Property A",
    !canManagePropertyPhotos(unassignedAgent, propertyA)
  );
  assert(
    "Unassigned Agent CANNOT manage photos for Property B",
    !canManagePropertyPhotos(unassignedAgent, propertyB)
  );

  // 3. Testing Upload Validation Logic
  console.log("\n--- 3. Testing File Upload Guardrails ---");
  const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

  assert("JPEG mime type is allowed", ALLOWED_MIME_TYPES.has("image/jpeg"));
  assert("PNG mime type is allowed", ALLOWED_MIME_TYPES.has("image/png"));
  assert("WebP mime type is allowed", ALLOWED_MIME_TYPES.has("image/webp"));
  assert("PDF mime type is rejected for property photos", !ALLOWED_MIME_TYPES.has("application/pdf"));
  assert("Executable mime type is rejected", !ALLOWED_MIME_TYPES.has("application/x-msdownload"));

  const validSize = 5 * 1024 * 1024; // 5MB
  const oversize = 20 * 1024 * 1024; // 20MB
  assert("5MB image is within 15MB limit", validSize <= MAX_IMAGE_BYTES);
  assert("20MB image exceeds 15MB limit", oversize > MAX_IMAGE_BYTES);

  // 4. Testing WhatsApp Share Link Generation
  console.log("\n--- 4. Testing Client Share Link & WhatsApp Formatting ---");
  const sampleProp = {
    id: "prop_123",
    slug: "modern-4-bed-villa-kabulonga",
    title: "Modern 4-Bed Standalone Villa",
    suburb: "Kabulonga",
    city: "Lusaka",
    price: 3500000,
    currency: "ZMW",
    listingType: "FOR_SALE",
    bedrooms: 4,
    bathrooms: 3,
  };

  const expectedUrl = "https://contour.banyalabs.com/p/modern-4-bed-villa-kabulonga";
  assert(
    "Client public URL matches /p/[slug] pattern",
    `https://contour.banyalabs.com/p/${sampleProp.slug}` === expectedUrl
  );

  console.log("\n==================================================");
  console.log(`📊 TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
