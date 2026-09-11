# Contour Hero Section — Animation & Layer Specification

> **Reference image**: `hero-reference.jpg` (locked, approved 2026-09-10)  
> **Headline**: "RUN YOUR AGENCY. CHASE NOTHING."  
> **Subtext**: "The mandate operating system for Lusaka real estate agents."  
> **Nav**: CONTOUR · Product · How It Works · Pricing · Contact · [Book a Demo]

---

## Layer Architecture

The hero is composed of **5 independent layers** stacked in z-order. This separation is what enables the sun-rise animation — the sun sits between the background trees and the house, so it rises *behind* the house but *in front of* the distant tree canopy.

```
z-index: 50  │ UI Layer        — Nav, headline text, subtext, stat strip
z-index: 40  │ Foreground      — Acacia tree silhouettes (front trees, branches)
z-index: 30  │ House Layer     — The Lusaka modernist estate building (PNG with transparency)
z-index: 20  │ Sun Layer       — Red circle SVG (#fa3600), ANIMATED
z-index: 10  │ Background      — B&W full-bleed photographic sky + distant tree canopy
```

### Asset Breakdown

| Layer | Asset Type | File |
|---|---|---|
| Background | Full-bleed B&W JPG (sky, distant trees) | `hero-bg.jpg` |
| Sun | SVG `<circle>` element, `fill="#fa3600"` | inline SVG / CSS |
| House | PNG with transparent background (cutout) | `hero-house.png` |
| Foreground Trees | PNG with transparent background (cutout) | `hero-trees-fg.png` |
| UI | React JSX — text, nav, stats | `hero-stage.tsx` |

> **Implementation note**: For the initial build, the reference `hero-reference.jpg` can be used as a single background image. Layer separation (house PNG + tree PNG cutouts) is a Phase 2 polish upgrade once proper asset photography is sourced. The sun SVG and animation are built from day one regardless.

---

## Animation Specification

### 1. Page Load Sequence (Timeline)

```
0ms     ─── Page begins loading
0ms     ─── Sun: positioned at Y_OFFSET = +280px (below horizon, hidden behind house)
0ms     ─── All text: opacity 0, translateY: +30px
0ms     ─── Stat strip: opacity 0

200ms   ─── Background fade-in: opacity 0 → 1 (duration: 600ms, ease: linear)

400ms   ─── SUN RISE BEGINS ──────────────────────────────────────────────────
            translateY: +280px → 0px
            duration: 1800ms
            easing: cubic-bezier(0.16, 1, 0.3, 1)   ← slow-start, majestic decelerate
            This is the hero's signature moment. The sun feels heavy, deliberate,
            like watching an actual Zambian sunrise in slow motion.

600ms   ─── Headline Line 1 reveal: "RUN YOUR AGENCY."
            overflow: hidden wrapper, inner div: translateY(100%) → 0%
            duration: 700ms, easing: cubic-bezier(0.16, 1, 0.3, 1)

780ms   ─── Headline Line 2 reveal: "CHASE NOTHING."
            Same mask-reveal, 180ms stagger after Line 1

1000ms  ─── Subtext fade up: opacity 0 → 1, translateY +20px → 0
            duration: 500ms, ease: ease-out

1200ms  ─── Stat strip fade up: opacity 0 → 1, translateY +16px → 0
            duration: 500ms, ease: ease-out
            Each stat staggered 80ms apart (left to right)

2200ms  ─── Sun arrives at final position. Animation complete.
```

### 2. Sun Rise — Detail Spec

```tsx
// Framer Motion implementation
const sunVariants = {
  hidden: { y: 280, opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],  // custom cubic-bezier — slow start, soft land
      delay: 0.4,
    },
  },
};
```

**Sun final position**: Centered behind the house, slightly right of center (55% from left). The top of the circle should be visible above the roofline of the house. The bottom of the circle sits behind/within the tree silhouettes.

**Sun size**: `clamp(320px, 35vw, 560px)` — scales fluidly with viewport.

**Sun starting Y**: Enough to be fully hidden behind the house bottom edge. Start at `y: clamp(200px, 22vw, 380px)`.

### 3. Text Reveal — Detail Spec

Each headline line uses the **mask-reveal** technique:
```tsx
// Wrapper: overflow-hidden
// Inner: translateY(100%) → 0%

const lineVariants = {
  hidden: { y: '100%' },
  visible: {
    y: '0%',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

// Stagger via parent:
const headingVariants = {
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.6 } },
};
```

### 4. Scroll Behaviour After Load

Once loaded, the hero responds to scroll:

| Scroll progress | Effect |
|---|---|
| 0% → 20% | Sun very slowly continues drifting up by +20px (parallax feels alive) |
| 0% → 40% | Background image: subtle scale `1.0 → 1.05` (Ken Burns depth) |
| 0% → 60% | Hero text: `opacity: 1 → 0` (fades out as user scrolls into Section 2) |
| 0% → 80% | Hero clip-path: `inset(0 0 0% 0) → inset(0 0 30% 0)` (Heron-style section transition) |

```tsx
// Framer Motion useScroll + useTransform
const { scrollYProgress } = useScroll({ target: heroRef });
const sunY = useTransform(scrollYProgress, [0, 0.2], [0, -20]);
const bgScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.05]);
const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
```

### 5. Nav Behaviour

- **Default state**: White/transparent background, border-bottom `1px solid #e0e0e0`
- **On scroll (> 80px)**: `background: rgba(255,255,255,0.95)`, `backdrop-filter: blur(8px)`, subtle `border-bottom: 1px solid #d0d0d0`
- **On scroll-hide (scrolling down fast)**: `translateY(-101%)` over `300ms`
- **On scroll-show (scrolling up)**: `translateY(0%)` over `300ms`

---

## Navigation — Final Approved Structure

```
[CONTOUR logo]    Product    How It Works    Pricing    Contact    [Book a Demo ▶]
```

| Nav Item | Anchors To | Section |
|---|---|---|
| **Product** | `#product` | MandateFlow + CommissionAI sections |
| **How It Works** | `#how-it-works` | IntentSwitcher section |
| **Pricing** | `#pricing` | PricingGrid section |
| **Contact** | `#contact` | CTAFooter section |

**"Book a Demo"**: Square `0px` border-radius, `bg-[#282828]`, `text-white`, fill-wipe hover effect (bg swipes up from bottom on hover in `#fa3600`), links to `/login` or opens booking modal.

---

## Stat Strip — Final Approved Values

| Stat | Label |
|---|---|
| `180+` | Active Mandates |
| `K 2.4B` | Portfolio Value |
| `5%` | Fixed Commission |
| `< 24hr` | Response Time |

**Typography**: BT Grotesk 700 for the number, Geist Mono 500 for the label.  
**Separators**: `1px solid #282828` vertical ruled lines between each column.

---

## Component File Target

```
src/components/marketing/hero-stage.tsx   ← main component
src/components/marketing/contour-navbar.tsx ← nav component
```

**Dependencies required**:
- `framer-motion` — sun rise, text mask reveal, scroll parallax
- `@studio-freight/lenis` — smooth inertial scroll engine
