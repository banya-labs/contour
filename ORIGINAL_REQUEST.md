# Original User Request

## 2026-08-19T17:32:06Z

<USER_REQUEST>
Research, design, draft regional copywriting, and implement a highly customized, non-repetitive "anti-AI-slop" landing page for Contour (Real Estate OS for Southern Africa) directly at `src/app/page.tsx`. Incorporate key marketing and layout strategies used by winning regional proptech platforms (like Prop Data and Flow SA).

Working directory: `c:\Users\sewar\repos\Contour`
Integrity mode: `development`

## Requirements

### R1. Regional Copywriting & Continuous Storytelling
- Conduct research on Southern African real estate brokerage pain points (e.g., WhatsApp communication leaks, landlord remittance disputes, spotty network connectivity).
- Draft punchy copy for each of the following sequential sections:
  1. **Hero Section**: Focuses on regional brokerage operations and avoiding lost commissions. Emphasize dual-currency (ZMW & USD) and fast local payments.
  2. **The Leak Audit (Competitor-Inspired)**: Highlights the 3 deadly leaks: Gross Value Illusion (commission tracking), WhatsApp Black Hole (listing photos & communication), and Landlord Excel Nightmare (manual calculations).
  3. **Interactive ROI / Commission Leak Calculator**: Allows brokers to see exact revenue recovered by plug-in calculations.
  4. **Field Agent PWA Showcase (Mobile & Offline-First)**: Emphasize PowerSync offline capabilities for load-shedding resilience and zero-install kiosk/mobile utility.
  5. **1-Click WhatsApp flyer & Portal Syndication**: Showcase how listings are shared on local groups, Facebook, and local portals.
  6. **Map Demo Preview**: Highlights visual regional lookup and navigation.
  7. **Paystack Pricing Matrix**: Outlines Starter, Growth, and Enterprise tiers in ZMW/USD with local payment methods.
  8. **POPIA/FICA Compliance & FAQ**: Clarifies South African/Zambian data privacy rules, masked landlord PII, and secure custody of Title Deeds.
- Avoid generic SaaS clichés; make the copy authentic to Lusaka/Southern Africa.

### R2. Custom Frontend Layout & Interactive Widgets
- Implement the continuous, non-repetitive layout using Next.js App Router in `src/app/page.tsx` adhering to the Founder's Ledger styling rules in `DESIGN.md`.
- Implement these interactive client-side components:
  - **ROI / Commission Leak Calculator**: Dynamic input fields for total listing volume and average commission percentage to calculate actual revenue lost vs. recovered.
  - **Field Agent PWA Mockup Frame**: Visual mobile phone layout showcase representing the Kiosk surface.
  - **Map Demo Preview**: Clean component showing regional property pins and linking to the actual Leaflet map demo (`/dashboard/map`).

### R3. Quality Assurance & System Verification
- Ensure the layout is fully responsive across mobile, tablet, and desktop devices.
- Run Next.js build verification (`pnpm build`) to ensure zero errors.
- Write a Playwright E2E verification script `scripts/test-landing-page.ts` that launches a headless check, asserts the existence of all key sections, and verifies that the ROI calculator changes values on input.

## Acceptance Criteria

### Content & Visual Authenticity
- [ ] Visual look matches the Founder's Ledger theme (Warm Cream background, Near Black typography, Amber/Emerald accents).
- [ ] No generic AI filler phrases (e.g., "Revolutionize your workflow", "seamless integration", "leverage dynamic insights").
- [ ] Copy clearly refers to Zambian Kwacha (ZMW) and US Dollars (USD), dual-currency workflows, and Paystack payments.
- [ ] Includes all 8 sequential sections: Hero, Leak Audit, ROI Calculator, PWA Mockup, Portal/WhatsApp Syndication, Map Preview, Paystack Pricing, and POPIA FAQ.

### Interactive Functionality
- [ ] Interactive ROI / Commission Leak Calculator is interactive client-side (users can adjust sliders/inputs and see calculated outcomes).
- [ ] Mobile PWA frame displays the kiosk interface preview realistically.
- [ ] Map Demo Preview links cleanly to `/dashboard/map`.

### Automated Verification
- [ ] The project successfully compiles with `pnpm build` with no build errors.
- [ ] Playwright E2E test suite `scripts/test-landing-page.ts` is created and passes successfully when run.
</USER_REQUEST>
