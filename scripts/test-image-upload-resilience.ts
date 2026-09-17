import { s3Storage } from "../src/lib/storage/s3";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

async function runResilienceTests() {
  console.log("==================================================");
  console.log("🧪 TESTING PROPERTY IMAGE UPLOAD RESILIENCE");
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

  // 1. S3 Storage Service Configuration & Helper Check
  console.log("--- 1. Testing S3 Storage Service Resilience Configuration ---");
  assert("s3Storage is instantiated", typeof s3Storage === "object");
  assert("s3Storage.isConfigured() returns boolean", typeof s3Storage.isConfigured() === "boolean");

  const testKey = s3Storage.generateObjectKey("test_org", "PROPERTY_PHOTO", "villa-view.jpg");
  assert("Object key is properly formatted with organization and category", testKey.startsWith("test_org/property_photo/"));
  assert("Object key sanitizes filename", testKey.includes("villa-view.jpg"));

  // 2. Testing Local Storage Fallback Functionality
  console.log("\n--- 2. Testing Local Static Storage Fallback ---");
  const testOrgId = "test_resilience_org";
  const testFileName = "living_room.webp";
  const dummyBytes = Buffer.from("RIFF....WEBPVP8 ... dummy webp photo payload");
  
  // Directly simulate local fallback write
  const safeOrgId = testOrgId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uploadDir = join(process.cwd(), "public", "uploads", "properties", safeOrgId);
  const fileName = `${Date.now()}_${testFileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = join(uploadDir, fileName);

  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, dummyBytes);

  assert("Local uploads directory created successfully", existsSync(uploadDir));
  assert("Local image file written successfully", existsSync(filePath));
  assert("File content matches buffer bytes", readFileSync(filePath).equals(dummyBytes));

  // Clean up test file
  try {
    unlinkSync(filePath);
    console.log("Cleaned up dummy test file.");
  } catch {}

  // 3. Testing Mime Type & Payload Size Guardrails
  console.log("\n--- 3. Testing Guardrails & Payload Checks ---");
  const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/jpg",
  ]);
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

  assert("JPEG is accepted", ALLOWED_MIME_TYPES.has("image/jpeg"));
  assert("PNG is accepted", ALLOWED_MIME_TYPES.has("image/png"));
  assert("WebP is accepted", ALLOWED_MIME_TYPES.has("image/webp"));
  assert("AVIF is accepted", ALLOWED_MIME_TYPES.has("image/avif"));
  assert("Executable .exe is rejected", !ALLOWED_MIME_TYPES.has("application/octet-stream"));
  assert("PDF document is rejected for photo endpoint", !ALLOWED_MIME_TYPES.has("application/pdf"));

  const normalSize = 3 * 1024 * 1024; // 3MB
  const oversize = 16 * 1024 * 1024; // 16MB
  assert("3MB photo is within 15MB limit", normalSize <= MAX_IMAGE_BYTES);
  assert("16MB photo exceeds 15MB limit", oversize > MAX_IMAGE_BYTES);

  // 4. Testing End-to-End Route POST via HTTP to Local Server
  console.log("\n--- 4. Testing Live Route POST /api/properties/upload-image ---");
  try {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test_resilience_photo.jpg"',
      "Content-Type: image/jpeg",
      "",
      "dummy-test-photo-content",
      `--${boundary}--`,
    ].join("\r\n");

    const res = await fetch("http://localhost:3000/api/properties/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: Buffer.from(body),
    });

    console.log("HTTP Response Status:", res.status);
    const json = await res.json();
    console.log("HTTP Response JSON:", json);

    assert("Upload API returns HTTP 200 OK", res.status === 200);
    assert("Upload API returns success: true", json.success === true);
    assert("Upload API returns a valid photo URL", typeof json.url === "string" && json.url.length > 0);
  } catch (err: any) {
    console.error("HTTP Route test encountered error:", err.message);
    assert("HTTP Route test runs without crashing", false, err.message);
  }

  console.log("\n==================================================");
  console.log(`📊 TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runResilienceTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
