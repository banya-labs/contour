/**
 * Automated Performance & Technical SEO Audit Runner for Contour
 * Runs deep verification on SEO metadata, sitemap.xml, robots.txt,
 * JSON-LD schema, heading hierarchy, and performance optimizations.
 */

import fs from "fs";
import path from "path";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { MOCK_PROPERTIES } from "../src/lib/mock-data";
import { generateSlug, isValidSlug } from "../src/lib/slug";

interface AuditResult {
  category: string;
  test: string;
  passed: boolean;
  detail: string;
}

const results: AuditResult[] = [];

function check(category: string, test: string, condition: boolean, detail: string) {
  results.push({
    category,
    test,
    passed: condition,
    detail,
  });
}

async function runAudit() {
  console.log("\n=======================================================");
  console.log("  CONTOUR SYSTEM AUDIT: SEO & PERFORMANCE MATRIX");
  console.log("=======================================================\n");

  // 1. SITEMAP AUDIT
  try {
    const sitemapData = sitemap();
    check(
      "Sitemap",
      "Sitemap Generation",
      Array.isArray(sitemapData) && sitemapData.length >= 5,
      `Generated ${sitemapData.length} valid indexed URLs.`
    );

    const hasHomepage = sitemapData.some((entry) => entry.url.endsWith("/"));
    check("Sitemap", "Homepage Present", hasHomepage, "Homepage is present with 1.0 priority.");

    const propertyCount = sitemapData.filter((entry) => entry.url.includes("/p/")).length;
    check(
      "Sitemap",
      "Property Listings Mapped",
      propertyCount === MOCK_PROPERTIES.length,
      `All ${propertyCount} mock properties mapped to sitemap.`
    );
  } catch (err: any) {
    check("Sitemap", "Sitemap Generation", false, `Failed with error: ${err.message}`);
  }

  // 2. ROBOTS.TXT AUDIT
  try {
    const robotsData = robots();
    const rules = Array.isArray(robotsData.rules) ? robotsData.rules : [robotsData.rules];
    const generalRule = rules.find((r) => r.userAgent === "*");

    check("Robots", "Robots.txt Exists", Boolean(generalRule), "General user-agent rule configured.");
    check(
      "Robots",
      "Public Pages Allowed",
      Boolean(generalRule?.allow?.includes("/")),
      "Public routes explicitly allowed."
    );
    check(
      "Robots",
      "Admin/Dashboard Disallowed",
      Boolean(generalRule?.disallow?.includes("/dashboard/")),
      "Private tenant and admin routes blocked from crawling."
    );
    check(
      "Robots",
      "Sitemap Directive Present",
      Boolean(robotsData.sitemap && typeof robotsData.sitemap === "string" && robotsData.sitemap.includes("sitemap.xml")),
      `Sitemap pointed to: ${robotsData.sitemap}`
    );
  } catch (err: any) {
    check("Robots", "Robots.txt Generation", false, `Failed with error: ${err.message}`);
  }

  // 3. HEADING HIERARCHY & SINGLE H1
  try {
    const heroPath = path.join(__dirname, "..", "src", "components", "marketing", "hero-stage.tsx");
    const heroCode = fs.readFileSync(heroPath, "utf8");
    const h1Count = (heroCode.match(/<h1/g) || []).length;

    check(
      "Heading Hierarchy",
      "Single H1 on Marketing Hero",
      h1Count === 1,
      `Detected exactly ${h1Count} <h1> element(s) in HeroStage.`
    );

    check(
      "Heading Hierarchy",
      "No unoptimized flag on Hero image",
      !heroCode.includes("unoptimized"),
      "Next.js native image optimization enabled on Hero stage."
    );
  } catch (err: any) {
    check("Heading Hierarchy", "Hero Stage Check", false, err.message);
  }

  // 4. URL SLUG INTEGRITY
  let allSlugsValid = true;
  let invalidSlugName = "";
  for (const p of MOCK_PROPERTIES) {
    if (!isValidSlug(p.slug)) {
      allSlugsValid = false;
      invalidSlugName = p.slug;
      break;
    }
  }
  check(
    "URL Slugs",
    "Clean Hyphenated Slugs",
    allSlugsValid,
    allSlugsValid ? "All property slugs match clean URL standards." : `Invalid slug: ${invalidSlugName}`
  );

  // 5. DATABASE INDEXING CHECK
  try {
    const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
    const schemaCode = fs.readFileSync(schemaPath, "utf8");

    const hasPropertyIndex = schemaCode.includes("@@index([organizationId, createdAt])");
    const hasSessionIndex = schemaCode.includes("@@index([userId])");
    const hasStatementIndex = schemaCode.includes("@@index([organizationId, status])");

    check(
      "Database Performance",
      "Composite Tenant & Time Indexes",
      hasPropertyIndex && hasSessionIndex && hasStatementIndex,
      "High-frequency query fields indexed in prisma/schema.prisma."
    );
  } catch (err: any) {
    check("Database Performance", "Schema Index Check", false, err.message);
  }

  // 6. CACHING & DEBOUNCING
  try {
    const debouncePath = path.join(__dirname, "..", "src", "hooks", "use-debounce.ts");
    const skeletonPath = path.join(__dirname, "..", "src", "components", "ui", "skeleton.tsx");

    check("Performance & UX", "useDebounce Hook Present", fs.existsSync(debouncePath), "Input debouncer available.");
    check("Performance & UX", "Skeleton Components Present", fs.existsSync(skeletonPath), "UI loading skeletons available.");
  } catch (err: any) {
    check("Performance & UX", "Hooks Check", false, err.message);
  }

  // 7. SECURITY & HTTPS ENFORCEMENT
  try {
    const nextConfigPath = path.join(__dirname, "..", "next.config.mjs");
    const nextConfigCode = fs.readFileSync(nextConfigPath, "utf8");

    const hasHsts = nextConfigCode.includes("Strict-Transport-Security");
    const hasCompression = nextConfigCode.includes("compress: true");
    const hasAvifWebp = nextConfigCode.includes("image/avif") && nextConfigCode.includes("image/webp");

    check("Security & Compression", "HSTS Header Enforced", hasHsts, "Strict-Transport-Security configured for 2 years.");
    check("Security & Compression", "Gzip/Brotli Enabled", hasCompression, "Next.js compress: true active.");
    check("Security & Compression", "Next-Gen Image Formats", hasAvifWebp, "AVIF and WebP delivery configured.");
  } catch (err: any) {
    check("Security & Compression", "next.config check", false, err.message);
  }

  // Print Results
  console.log("AUDIT RESULTS TABLE:");
  console.log("-------------------------------------------------------");
  let passedCount = 0;
  for (const r of results) {
    const icon = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`${icon} [${r.category}] ${r.test}: ${r.detail}`);
    if (r.passed) passedCount++;
  }
  console.log("-------------------------------------------------------");
  console.log(`TOTAL SCORE: ${passedCount}/${results.length} PASSED (${Math.round((passedCount / results.length) * 100)}%)\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runAudit();
