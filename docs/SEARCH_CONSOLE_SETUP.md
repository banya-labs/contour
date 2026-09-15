# Google Search Console Verification & Indexing Manual for Contour

This document provides step-by-step operational instructions for connecting Contour to **Google Search Console (GSC)**, verifying domain ownership, submitting the dynamic XML sitemap, and monitoring real-time crawl and index status.

---

## 1. Prerequisites
- Production Domain: `https://contour.banyalabs.com` (or your custom domain `contour.app`)
- Access to Google Search Console ([search.google.com/search-console](https://search.google.com/search-console))
- Access to DNS settings (Hostinger / Cloudflare / Namecheap) or environment variables in Dokploy.

---

## 2. Verification Methods

Contour supports both standard Google verification methods out of the box:

### Method A: HTML Meta Tag Verification (Fastest & Zero Downtime)
Contour's `src/app/layout.tsx` is wired with a dynamic verification tag.
1. Go to Google Search Console and select **URL prefix** property: `https://contour.banyalabs.com`.
2. Select **HTML tag** as the verification method.
3. Google provides a tag like: `<meta name="google-site-verification" content="XYZ12345ABC" />`.
4. Copy the content token (`XYZ12345ABC`).
5. In your Dokploy environment variables for Contour (or `.env.local`), add:
   ```bash
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="XYZ12345ABC"
   ```
6. Rebuild/Restart the container.
7. Click **Verify** in Search Console. Verification will succeed immediately.

### Method B: DNS TXT Record Verification (Recommended for Entire Domain)
1. In Search Console, choose **Domain** property: `contour.banyalabs.com` (or `contour.app`).
2. Google provides a TXT record (e.g. `google-site-verification=XYZ12345ABC`).
3. Add a TXT record to your DNS provider:
   - **Type**: `TXT`
   - **Name / Host**: `@` (or `contour`)
   - **Value**: `google-site-verification=XYZ12345ABC`
   - **TTL**: `300` (5 minutes)
4. Wait 2–5 minutes for DNS propagation, then click **Verify**.

---

## 3. Submitting the XML Sitemap

Contour automatically generates a dynamic XML sitemap at:
`https://contour.banyalabs.com/sitemap.xml`

This sitemap includes:
- The homepage (`/`) with priority `1.0` and daily crawl frequency.
- Public property listings (`/p/[slug]`) with priority `0.8` and weekly crawl frequency.
- Legal & Compliance documents (`/privacy`, `/terms`, `/cookies`) with priority `0.3`.

### Steps to Submit:
1. In Search Console navigation, click **Sitemaps** (under Indexing).
2. Under "Add a new sitemap", enter: `sitemap.xml`.
3. Click **Submit**.
4. Status will change to **Success**, and Google will report the number of discovered URLs.

---

## 4. Requesting Immediate Indexing (URL Inspection)

To force Google to crawl and index your homepage and key property listings immediately rather than waiting days for autonomous discovery:
1. Paste `https://contour.banyalabs.com/` into the top search bar ("Inspect any URL").
2. Click **Test Live URL**.
3. Once the live test passes, click **Request Indexing**.
4. Repeat this for your top 3 public listing URLs (e.g. `https://contour.banyalabs.com/p/executive-4-bed-kabulonga`).

---

## 5. Verifying Robots.txt Compliance

Contour dynamically serves `https://contour.banyalabs.com/robots.txt`:
- **Allowed**: `/`, `/p/*`, `/privacy`, `/terms`, `/cookies`
- **Disallowed**: `/dashboard/*`, `/admin/*`, `/api/*`, `/kiosk/*`, `/agent/*`, `/upload/*`, `/accept-invitation/*`
- **Sitemap**: Direct pointer to `https://contour.banyalabs.com/sitemap.xml`

In Search Console, inspect the **Pages** report after 48 hours to confirm zero indexed admin/dashboard pages and 100% indexed public pages.
