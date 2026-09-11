# Contour Editorial Design System
## Public Landing Page (`/`) — Swiss Grid × Zambian Identity

> **Surface**: Public Marketing Landing Page only (`src/app/page.tsx`)
> **Aesthetic**: Swiss International Typographic Style × Zambian real estate ambition
> **Visual reference**: heronaiapp.com — editorial, ruled grid, red/black/white
> **Approved**: 2026-09-10 by Seward (Banya Labs)
> **Companion**: `DESIGN.md` covers the Operations Dashboard surface (forest green / warm amber)

---

## 0. Design Philosophy

The landing page speaks to Lusaka real estate agents with the visual confidence of a
financial institution and the warmth of a Zambian sunrise. Every design decision comes
from three principles:

1. **Ruled lines over decoration** — the grid *is* the design. 1px lines, registration
   marks, and column rules carry all structural weight. No shadows, no gradients, no
   border-radius. If it doesn't exist on a printed architectural document, it doesn't
   exist here.

2. **Red as a single, deliberate accent** — `#fa3600` (Contour Red) appears in exactly
   the right places: the rising sun in the hero, feature numbers, active states, the
   Agency plan CTA, and the setting sun in the footer. Every other pixel is black or white.

3. **The page is a narrative** — it opens with a sunrise (hero red circle rises) and
   closes with a sunset (footer red circle settles). The editorial sections between them
   are chapters, not components.

---

## 1. Colour Palette

### Primary Palette

| Name | Hex | CSS Var | Usage |
|---|---|---|---|
| White (Background) | `#ffffff` | `--cl-bg` | Page background |
| Near-Black (Primary) | `#282828` | `--cl-primary` | Text, filled buttons, nav |
| Contour Red | `#fa3600` | `--cl-accent` | Sun, numbers, active states, CTAs |
| Muted | `#6b6b6b` | `--cl-muted` | Descriptions, sub-labels |
| Inactive | `#9b9b9b` | `--cl-inactive` | Inactive tabs, dashes |

### Surface & Structure Palette

| Name | Hex | CSS Var | Usage |
|---|---|---|---|
| Grid Lines | `#e0e0e0` | `--cl-border` | All 1px ruled lines |
| Corner Marks | `#c0c0c0` | `--cl-corner` | + registration marks |
| Hover Tint | `#fff5f3` | `--cl-row-hover` | Active row background |
| Giant Logotype | `#e8e8e8` | `--cl-logo-mark` | Footer CONTOUR watermark |
| Topo Lines | `rgba(40,40,40,0.06)` | `--cl-topo` | Illustration backgrounds |

### Semantic Palette

| Name | Hex | Usage |
|---|---|---|
| Success / Verified | `#10b981` | Title deed verified, commission cleared |
| Warning / Arrears | `#d97706` | Overdue arrears, flagged leases |
| Error / High Risk | `#dc2626` | POPIA violation, expired document |
| Info / Pending | `#3b82f6` | Awaiting signature, in-progress deal |

### CSS Custom Properties (add to globals.css)

```css
:root {
  --cl-bg:         #ffffff;
  --cl-primary:    #282828;
  --cl-accent:     #fa3600;
  --cl-muted:      #6b6b6b;
  --cl-inactive:   #9b9b9b;
  --cl-border:     #e0e0e0;
  --cl-corner:     #c0c0c0;
  --cl-row-hover:  #fff5f3;
  --cl-logo-mark:  #e8e8e8;
  --cl-topo:       rgba(40, 40, 40, 0.06);

  /* Semantic */
  --cl-success:    #10b981;
  --cl-warning:    #d97706;
  --cl-error:      #dc2626;
  --cl-info:       #3b82f6;

  /* Spacing */
  --space-xs: 8px;
  --space-sm: 18px;
  --space-md: 36px;
  --space-lg: 72px;
  --space-xl: 164px;
}
```

### Tailwind Extension (tailwind.config.ts)

```ts
colors: {
  editorial: {
    white:    '#ffffff',
    black:    '#282828',
    red:      '#fa3600',
    muted:    '#6b6b6b',
    inactive: '#9b9b9b',
    border:   '#e0e0e0',
    corner:   '#c0c0c0',
    hover:    '#fff5f3',
    dark:     '#282828',
    logo:     '#e8e8e8',
  },
},
fontFamily: {
  heading: ['"BT Grotesk"', 'Arial', 'sans-serif'],
  geist:   ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
},
```

---

## 2. Typography

### Typefaces

| Face | Role | Source |
|---|---|---|
| **BT Grotesk** | All headings, tabs, step titles, button labels, wordmark | `public/fonts/bt-grotesk-{400,500,600,700}.woff2` |
| **Geist Mono** | Body text, descriptions, labels, numbers, stats, footer | `public/fonts/geist-mono-500.woff2` |

### @font-face Declarations (globals.css)

```css
@font-face { font-family: 'BT Grotesk'; src: url('/fonts/bt-grotesk-400.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'BT Grotesk'; src: url('/fonts/bt-grotesk-500.woff2') format('woff2'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'BT Grotesk'; src: url('/fonts/bt-grotesk-600.woff2') format('woff2'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'BT Grotesk'; src: url('/fonts/bt-grotesk-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'Geist Mono'; src: url('/fonts/geist-mono-500.woff2') format('woff2'); font-weight: 500; font-display: swap; }
```

### Type Scale

| Token | Font | Fluid Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| `display-1` | BT Grotesk | `clamp(48px,7vw,96px)` | 700 | 0.95 | -0.03em | Footer closing headline |
| `display-2` | BT Grotesk | `clamp(40px,5.5vw,80px)` | 700 | 0.95 | -0.025em | Hero H1, Pricing H2 |
| `heading-1` | BT Grotesk | `clamp(32px,4.5vw,62px)` | 700 | 1.0 | -0.02em | Section headlines |
| `heading-2` | BT Grotesk | `clamp(24px,3vw,44px)` | 600 | 1.05 | -0.015em | Sub-section headings |
| `heading-3` | BT Grotesk | `clamp(16px,1.5vw,20px)` | 600 | 1.2 | 0 | Feature names, step titles |
| `tab-label` | BT Grotesk | `clamp(24px,3.5vw,48px)` | 700 | 1.0 | -0.02em | How It Works tabs |
| `price` | BT Grotesk | `clamp(28px,3.5vw,48px)` | 700 | 1.0 | -0.02em | Pricing amounts |
| `body` | Geist Mono | 15.56px | 500 | 1.48 | -0.023em | Descriptions, body copy |
| `label` | Geist Mono | 12px | 500 | 1.4 | 0.25em + uppercase | Section labels, footer headers |
| `small` | Geist Mono | 11px | 400 | 1.4 | 0.1em | Legal copy, copyright |
| `stat-number` | BT Grotesk | `clamp(24px,3vw,40px)` | 700 | 1.0 | -0.02em | Hero stats |
| `stat-label` | Geist Mono | 13px | 500 | 1.4 | 0 | Hero stat labels |
| `step-number` | Geist Mono | `clamp(48px,6vw,80px)` | 700 | 1.0 | 0 | How It Works 01/02/03 |
| `btn-label` | BT Grotesk | 16px | 500 | 1.0 | 0 | All button text |
| `footer-link` | Geist Mono | 13px | 400 | 1.6 | 0 | Footer nav links |
| `logo-mark` | BT Grotesk | `clamp(120px,18vw,280px)` | 700 | 0.85 | -0.02em | Giant CONTOUR watermark |

### Typography Rules
- **Selection**: `background: #fa3600; color: #ffffff` everywhere
- **Anti-aliasing**: `-webkit-font-smoothing: antialiased`
- **Font kerning**: `font-kerning: none`
- **All headings**: `leading-none`, no margin collapse

---

## 3. Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `xs` | 8px | Icon gaps, inline spacing |
| `sm` | 18px | Tight stacks, internal padding |
| `md` | 36px | Between related elements |
| `lg` | 72px | Section padding top/bottom |
| `xl` | 164px | Major section separators |

---

## 4. Border & Shadow System

### The Zero Rule
```
border-radius: 0px  — on everything without exception
box-shadow:    none — on everything without exception
```

### Ruled Lines — Types
```css
.ruled-h       { border-top: 1px solid #e0e0e0; }       /* standard horizontal rule */
.ruled-v       { border-left: 1px solid #e0e0e0; }       /* standard vertical rule */
.ruled-dark-h  { border-top: 1px solid #282828; }        /* strong rule (sparingly) */
.ruled-active  { border-left: 3px solid #fa3600; }       /* active row left accent */
```

### Corner Registration Marks (`+`)
```css
.corner-mark {
  position: absolute; color: #c0c0c0;
  font-size: 14px; font-family: 'BT Grotesk'; font-weight: 400;
  pointer-events: none; user-select: none;
}
.corner-mark.tl { top: -6px; left: -6px; }
.corner-mark.tr { top: -6px; right: -6px; }
.corner-mark.bl { bottom: -6px; left: -6px; }
.corner-mark.br { bottom: -6px; right: -6px; }
```

---

## 5. Button System

### Variant Tokens

| Variant | BG | Text | Border | Hover Fill |
|---|---|---|---|---|
| Primary (dark) | `#282828` | `#ffffff` | none | `#fa3600` wipes up |
| Secondary (outlined) | transparent | `#282828` | `1px #282828` | `#282828` wipes up, text→white |
| Agency (red) | `#fa3600` | `#ffffff` | none | `#ffffff` wipes up, text→red |
| Muted (outlined) | transparent | `#282828` | `1px #b3b3af` | `#282828` wipes up, text→white |

### Padding & Sizing
```
padding:    29px 38px
min-height: 75px
min-width:  182px
font-size:  17.78px (BT Grotesk 500)
border-radius: 0
```

### Fill-Wipe Animation
```css
.btn { position: relative; overflow: hidden; }
.btn::after {
  content: ''; position: absolute; inset: 0; z-index: 0;
  transform: translateY(102%);
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.btn span { position: relative; z-index: 1; }
.btn:hover::after { transform: translateY(0%); }
/* Set ::after background per variant */
```

### Button States
| State | Appearance |
|---|---|
| Hover | Fill-wipe from bottom (0.5s cubic 0.23,1,0.32,1) |
| Focus | `outline: 2px solid #fa3600; outline-offset: 2px` |
| Active | `transform: scale(0.99)` |
| Disabled | `opacity: 0.4; cursor: not-allowed` |

---

## 6. Animation Grammar

### Easing Tokens (src/lib/animation-variants.ts)
```ts
export const ease = {
  out:    [0.16, 1, 0.3, 1]          as const,  // Primary reveals
  wipe:   [0.23, 1, 0.32, 1]         as const,  // Button hover fills
  snap:   [0.4, 0, 0.2, 1]           as const,  // Quick state changes
  gentle: [0.25, 0.46, 0.45, 0.94]   as const,  // Parallax, floats
};
```

### Named Variants
```ts
export const textReveal = {
  hidden:  { y: '100%' },
  visible: { y: '0%', transition: { duration: 0.7, ease: ease.out } },
};
export const textStagger = {
  visible: { transition: { staggerChildren: 0.18 } },
};
export const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.out } },
};
export const clipReveal = {
  hidden:  { clipPath: 'inset(0 0 100% 0)' },
  visible: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.9, ease: ease.out } },
};
export const sunRise = {
  hidden:  { y: 280 },
  visible: { y: 0, transition: { duration: 1.8, ease: ease.out, delay: 0.4 } },
};
```

### CSS Animations
```css
/* Underline hover */
.hover-un::after {
  content: ''; position: absolute; bottom: 0; left: 0;
  width: 100%; height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: right;
  transition: transform 0.6s ease;
}
.hover-un:hover::after { transform: scaleX(1); transform-origin: left; }

/* Marquee */
@keyframes marqueeLeft  { to { transform: translateX(-50%); } }
@keyframes marqueeRight { to { transform: translateX(0); } from { transform: translateX(-50%); } }

/* Arrow pulse */
@keyframes arrowPulse {
  0%,100% { transform: translateX(0); opacity: 0.6; }
  50%     { transform: translateX(4px); opacity: 1; }
}

/* SVG draw-in */
@keyframes drawPath { to { stroke-dashoffset: 0; } }

/* Circle float */
@keyframes circleFloat {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
```

### Timing Reference
| Element | Duration | Easing | Delay |
|---|---|---|---|
| Section label | 300ms | `ease.out` | 0ms |
| Headline line 1 | 700ms | `ease.out` | 150ms |
| Headline line 2 | 700ms | `ease.out` | 330ms |
| Hero sun rise | 1800ms | `ease.out` | 400ms |
| Feature rows | 300ms each | `ease.out` | 60ms apart |
| Button fill-wipe | 500ms | `ease.wipe` | on hover |
| Tab underline | 300ms | `ease.wipe` | on click |
| Illustration out | 180ms | `ease.snap` | — |
| Illustration in | 280ms | `ease.out` | 180ms |
| Clip reveal | 600ms | `ease.out` | varies |

---

## 7. Scroll System

### Lenis Config
```ts
new Lenis({ lerp: 0.1, smoothWheel: true })
```

### Framer Motion Scroll Transforms
```ts
// Hero
const heroSunY    = useTransform(scrollYProgress, [0, 0.2], [0, -20]);
const bgScale     = useTransform(scrollYProgress, [0, 0.4], [1, 1.05]);
const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
// Footer
const logoY       = useTransform(scrollYProgress, [0, 1], [0, -30]);
```

---

## 8. Section Shell Pattern

Every section uses this structural template:

```
┌──── 1px ruled line (full-width) ─────────────────────────────────────┐
│ +  ──── SECTION LABEL (Geist Mono, 11px, 4px tracking) ────────────+ │
├──── 1px ruled line (full-width) ─────────────────────────────────────┤
│                                                                       │
│  [ SECTION CONTENT ]                                                  │
│                                                                       │
└──── 1px ruled line (full-width) ─────────────────────────────────────┘
```

- `+` marks at all four corners of the content area
- Full-bleed ruled lines (no container padding on the lines)
- Section content has `px-8 sm:px-12 lg:px-16 xl:px-24` padding

---

## 9. Illustration Rules

All inline SVGs share:
```
stroke:      #282828
strokeWidth: 1px
fill:        none (transparent interiors)
accent:      one #fa3600 element maximum per illustration
topo bg:     rgba(40,40,40,0.06) topographic contour lines
draw-in:     stroke-dashoffset animation on entry
```

---

## 10. The Visual Narrative (The Red Circle Rule)

The `#fa3600` circle appears **exactly twice** on the full landing page:

```
HERO SECTION   → Circle RISES from y+280px → y:0  (1.8s sunrise animation)
                 Positioned behind the Lusaka estate house — the Zambian sun

FOOTER SECTION → Circle appears at scale(0.6) → scale(1)  (0.9s settle animation)
                 Positioned right column, partially cropped — the Zambian sunset
```

**Rule**: The red circle must never appear in any other section. If you need a red
accent in a section, use it only for text (numbers, labels, active borders).

---

## 11. Surface Boundaries

This file (`DESIGN-EDITORIAL.md`) governs **only**:
- `src/app/page.tsx`
- `src/components/marketing/**`
- `src/components/providers/lenis-provider.tsx`
- `src/components/ui/fill-button.tsx`
- `src/components/ui/ruled-line.tsx`
- `src/lib/animation-variants.ts`

`DESIGN.md` (the dashboard system) governs everything else.

**Never cross-contaminate tokens between surfaces.**

---

## 12. Component Build Checklist

Before merging any landing page component, verify:

- [ ] `border-radius: 0` on all elements
- [ ] `box-shadow: none` on all elements
- [ ] BT Grotesk for all heading/display text
- [ ] Geist Mono for all body/label/mono text
- [ ] `#fa3600` used sparingly (not decoratively)
- [ ] 1px `#e0e0e0` ruled lines for all structure
- [ ] `+` corner marks at grid intersections
- [ ] Fill-wipe hover on all buttons
- [ ] Underline `scaleX` hover on all text links
- [ ] Framer Motion `useInView` for scroll-entry animations
- [ ] Lenis scroll available via `LenisProvider`
- [ ] Responsive: 390px / 768px / 1280px / 1920px
- [ ] `::selection { background: #fa3600; color: #fff; }` active
