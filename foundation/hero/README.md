# Contour Landing Page — Design System & Section Index

> **Design Direction**: Approved 2026-09-10 by Seward
> **Visual Reference**: heronaiapp.com (editorial, Swiss grid, red/black/white)
> **Build Target**: `src/app/page.tsx` + `src/components/marketing/`

---

## Design Language Summary

| Token | Value |
|---|---|
| Background | `#ffffff` |
| Text Primary | `#282828` |
| Accent / Brand | `#fa3600` (Contour Red) |
| Text Muted | `#6b6b6b` |
| Grid Lines | `#e0e0e0` (1px) |
| Giant Logotype | `#e8e8e8` |
| Border Radius | `0px` — zero everywhere |
| Box Shadow | `none` — zero everywhere |
| Heading Font | BT Grotesk (700, 600) |
| Body / Mono | Geist Mono (500) |
| Corner Marks | `+` at grid intersections, `#c0c0c0` |

---

## Section Map

| # | Section | Anchor | Nav Item | Reference | Spec |
|---|---|---|---|---|---|
| 1 | Hero | — | — | `hero-reference.jpg` | `HERO-SPEC.md` |
| 2 | Product | `#product` | Product | `product-section-reference.jpg` | `PRODUCT-SECTION-SPEC.md` |
| 3 | How It Works | `#how-it-works` | How It Works | `how-it-works-reference.jpg` | `HOW-IT-WORKS-SPEC.md` |
| 4 | Pricing | `#pricing` | Pricing | `pricing-section-reference.jpg` | `PRICING-SECTION-SPEC.md` |
| 5 | Footer / CTA | `#contact` | Contact | `footer-section-reference.jpg` | `FOOTER-SECTION-SPEC.md` |

---

## The Visual Bookend

The single most important design decision across the full page:

```
HERO   → Red circle RISES from behind the Lusaka estate house  (sunrise)
FOOTER → Red circle SETTLES beside the closing headline         (sunset)
```

The red `#fa3600` circle appears only twice. Both times it is the dominant
graphic element. This creates a complete visual journey from top to bottom.

---

## Navigation (Locked)

```
[CONTOUR]    Product    How It Works    Pricing    Contact    [Book a Demo ▶]
```

---

## Animation Grammar (Global)

All sections share these animation primitives:

| Pattern | Implementation |
|---|---|
| Text reveal | `overflow: hidden` wrapper + `translateY(100%→0%)` inner |
| Section entry | `opacity 0→1` + `y: +20px→0` via IntersectionObserver |
| Button hover | `::after` pseudo fill-wipe, `translateY(102%→0%)`, 500ms cubic |
| Underline hover | `scaleX(0→1)`, `transform-origin: left`, 300ms |
| Scroll parallax | Framer Motion `useScroll` + `useTransform` |
| Smooth scroll | Lenis (`@studio-freight/lenis`) |
| SVG draw-in | `stroke-dashoffset` animation |

---

## New Dependencies Required

```bash
pnpm add framer-motion @studio-freight/lenis
```

---

## New Components Required

```
src/components/marketing/
├── contour-navbar.tsx              # Fixed nav with scroll hide/show
├── hero-stage.tsx                  # Section 1 — with sun-rise animation
├── product-features.tsx            # Section 2 — feature list + illustration panel
├── how-it-works.tsx                # Section 3 — workflow tabs + 3-step flow
├── pricing-grid.tsx                # Section 4 — 3-col with inverted Agency
├── cta-footer.tsx                  # Section 5 — closing CTA + footer nav
│
├── feature-illustrations/          # 6 SVG illustrations for Product section
│   ├── mandate-capture-illustration.tsx
│   ├── deal-pipeline-illustration.tsx
│   ├── commission-tracking-illustration.tsx
│   ├── lease-arrears-illustration.tsx
│   ├── whatsapp-syndication-illustration.tsx
│   └── document-vault-illustration.tsx
│
└── workflow-illustrations/         # 12 SVG illustrations for How It Works
    ├── sell/ (capture, manage, close)
    ├── rent/ (list, screen, lease)
    ├── lease/ (mandate, negotiate, execute)
    └── develop/ (survey, market, transfer)

src/components/ui/
├── fill-button.tsx                 # Reusable fill-wipe button
└── ruled-line.tsx                  # 1px horizontal/vertical ruled line

src/components/providers/
└── lenis-provider.tsx              # Smooth scroll wrapper

src/lib/
└── animation-variants.ts           # Shared Framer Motion variants
```

---

## DESIGN.md Update Required

Add **Surface 5: Public Landing Page** to `DESIGN.md` documenting this editorial
identity as distinct from the operational dashboard palette. Do not remove any
existing dashboard palette values.
