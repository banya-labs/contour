# Footer / CTA Section — Design & Interaction Specification

> **Reference image**: `footer-section-reference.jpg` (locked, approved 2026-09-10)
> **Section anchor**: `#contact`
> **Nav link**: "Contact" in top navbar
> **Aspect ratio**: 16:9 (full viewport width)
> **Design note**: This section is the visual bookend to the hero. The large red circle
> directly mirrors the hero's rising Zambian sun — the page opens and closes with the same
> geometric motif.

---

## Design System Tokens (This Section)

```
Background:              #ffffff
Text Primary:            #282828  (BT Grotesk)
Text Muted:              #6b6b6b  (Geist Mono footer links)
Red Circle:              #fa3600  (solid, flat, no gradient)
Book a Demo Button:      #282828 bg, #ffffff text
Start Free Trial Button: transparent bg, 1px #282828 border, #282828 text
Footer Headers:          #282828  (Geist Mono, bold, uppercase)
Footer Links:            #6b6b6b  (Geist Mono, hover → #282828)
Giant Logotype:          #e8e8e8  (very light grey, full-bleed)
Grid Lines:              #e0e0e0  1px ruled
Corner Marks:            #c0c0c0  + registration marks
Legal text:              #9b9b9b  (Geist Mono, 11px)
```

---

## Layout Grid

```
┌────────────────────────────────────────────────────────────────────┐
│ + ─────────────────── GET STARTED ──────────────────────────────── + │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  BETTER REAL ESTATE                    ●●●●●●●●●  ← RED CIRCLE    │
│  STARTS WITH CONTOUR.         ●●●●●●●●●●●●●●●●●                   │
│                               ●●●●●●●●●●●●●●●●●                   │
│  "Join 180+ Lusaka agents..." ●●●●●●●●●●●●●●●●●                   │
│                               ●●●●●●●●●●●●●●●●●                   │
│  [Book a Demo →] [Start Free Trial →]                              │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  PRODUCT        │  PLATFORM       │  COMPANY        │  CONTACT     │
│  ─────────────  │  ─────────────  │  ─────────────  │  ──────────  │
│  Mandate Cap.   │  Field Agent    │  About          │  Book a Demo │
│  Deal Pipeline  │  Lusaka Map     │  Pricing        │  Email       │
│  Commission     │  API & MCP      │  Careers        │  WhatsApp    │
│  Lease/Arrears  │  Integrations   │  Blog           │  Support     │
│  WhatsApp Syn.  │  Security/POPIA │  Press          │  Privacy     │
│  Document Vault │                 │                 │              │
├────────────────────────────────────────────────────────────────────┤
│  C  O  N  T  O  U  R  (giant watermark logotype, #e8e8e8)          │
│              © 2026 Contour · POPIA Compliant · Built for Zambia  │
│ + ─────────────────────────────────────────────────────────────── + │
└────────────────────────────────────────────────────────────────────┘
```

---

## Content — Locked

### CTA Area
- **Section label**: "GET STARTED"
- **Headline line 1**: "BETTER REAL ESTATE"
- **Headline line 2**: "STARTS WITH CONTOUR."
- **Subtext**: "Join 180+ Lusaka agents already running their agency on Contour."
- **Button 1**: "Book a Demo →" — filled `#282828`, white text
- **Button 2**: "Start Free Trial →" — outlined, `#282828` border + text

### Red Circle
- Solid `#fa3600`, no gradient, no shadow
- Size: `clamp(240px, 28vw, 420px)` diameter
- Position: Right column (40% of width), vertically centered in the CTA area
- Partially cropped by right viewport edge (intentional — about 15% cropped)
- **Design intent**: Mirrors the hero's rising Zambian sun. Full visual bookend.

### Footer Navigation — Locked Structure

| PRODUCT | PLATFORM | COMPANY | CONTACT |
|---|---|---|---|
| Mandate Capture | Field Agent PWA | About Contour | Book a Demo |
| Deal Pipeline | Lusaka Map | Pricing | hello@contour.zm |
| Commission Tracking | API & MCP | Careers | WhatsApp Us |
| Lease & Arrears | Integrations | Blog | Support |
| WhatsApp Syndication | Security & POPIA | Press | Privacy Policy |
| Document Vault | | | |

### Giant Logotype
- Text: `CONTOUR`
- Font: BT Grotesk 700
- Color: `#e8e8e8` (very light grey — visible but non-competing)
- Size: Full viewport width — letters scale to touch both edges
- Position: Bottom of section, partially cropped by viewport bottom
- **Implementation**: `font-size: clamp(120px, 18vw, 280px)`, `letter-spacing: -0.02em`, `overflow: hidden` on parent

### Bottom Legal Strip
- `© 2026 Contour · POPIA Compliant · Built for Zambia`
- Font: Geist Mono, 11px, `#9b9b9b`
- Positioned above the giant logotype (overlapping top of it) OR below it at the very bottom edge

---

## Animation & Interaction Specification

### 1. Section Entry (Scroll into View)
```
Trigger: IntersectionObserver (threshold: 0.08) — fires early, section is tall

Timeline:
  0ms   → "GET STARTED" label: opacity 0→1  (300ms)

  150ms → H2 Line 1 mask-reveal: "BETTER REAL ESTATE"  (800ms)
          (slightly slower reveal than other sections — this is the closing climax)

  380ms → H2 Line 2 mask-reveal: "STARTS WITH CONTOUR."  (800ms)

  500ms → RED CIRCLE ENTRANCE — the hero moment of this section:
          - Starts: scale(0.6), opacity 0, translateX(60px)
          - Arrives: scale(1), opacity 1, translateX(0)
          - Duration: 900ms
          - Easing: cubic-bezier(0.16, 1, 0.3, 1)  ← slow, heavy, like a planet settling
          This should feel like the sun setting — the reverse of the hero's sunrise.

  700ms → Subtext: opacity 0→1, y +16px→0  (400ms)

  850ms → Button pair: opacity 0→1, y +12px→0  (400ms, stagger 80ms between buttons)

  1000ms → Footer nav columns: stagger left to right
           Each column: opacity 0→1, y +12px→0  (350ms, 60ms apart)

  1200ms → Footer links within each column: stagger top to bottom
           Each link: opacity 0→1  (200ms, 30ms apart)

  1500ms → Giant CONTOUR logotype: opacity 0→1  (600ms, ease-out)
           Simultaneously: translateY(20px)→0  (subtle upward drift)
```

### 2. Button Hover — Fill-Wipe (same as other sections)

**"Book a Demo →"** (filled dark button):
```css
.btn-book-demo { position: relative; overflow: hidden; background: #282828; }
.btn-book-demo::after {
  content: '';
  position: absolute; inset: 0;
  background: #fa3600;  /* ← red fill wipes up on this primary CTA */
  transform: translateY(102%);
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.btn-book-demo:hover::after { transform: translateY(0%); }
/* Text stays white throughout — contrast maintained against both dark and red */
```

**"Start Free Trial →"** (outlined button):
```css
.btn-trial::after {
  background: #282828;  /* dark fill wipes up */
}
.btn-trial:hover { color: #ffffff; }
```

### 3. Footer Link Hover
```
Trigger: onMouseEnter on any footer link

  - Link color: #6b6b6b → #282828  (150ms ease)
  - Underline: scaleX 0→1 from left origin  (250ms ease)
    .footer-link::after {
      content: '';
      position: absolute; bottom: -1px; left: 0;
      width: 100%; height: 1px;
      background: #282828;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.25s ease;
    }
    .footer-link:hover::after { transform: scaleX(1); }

  - Arrow: If link has "→", it nudges translateX 3px  (150ms)
```

### 4. Red Circle — Subtle Float
After the entrance animation completes, the red circle has a very subtle continuous float:
```css
@keyframes circleFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.footer-red-circle {
  animation: circleFloat 6s ease-in-out infinite;
  animation-delay: 1.5s;  /* begins after entrance completes */
}
```
This is barely perceptible — just enough to keep the section feeling alive without competing with the text.

### 5. Giant Logotype Scroll Parallax
```tsx
// As user scrolls within this section, the logotype moves slightly
const { scrollYProgress } = useScroll({ target: footerRef });
const logoY = useTransform(scrollYProgress, [0, 1], [0, -30]);

<motion.div style={{ y: logoY }}>
  CONTOUR
</motion.div>
```

---

## Typography

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Section label | Geist Mono | 11px, 4px tracking, uppercase | 500 | `#6b6b6b` |
| H2 Line 1 | BT Grotesk | `clamp(36px, 5.5vw, 80px)` | 700 | `#282828` |
| H2 Line 2 | BT Grotesk | `clamp(36px, 5.5vw, 80px)` | 700 | `#282828` |
| Subtext | Geist Mono | 15px | 500 | `#6b6b6b` |
| Button text | BT Grotesk | 16px | 500 | varies |
| Footer col headers | Geist Mono | 12px, uppercase, 2px tracking | 700 | `#282828` |
| Footer links | Geist Mono | 13px | 400 | `#6b6b6b` → hover `#282828` |
| Giant logotype | BT Grotesk | `clamp(120px, 18vw, 280px)` | 700 | `#e8e8e8` |
| Legal/copyright | Geist Mono | 11px | 400 | `#9b9b9b` |

---

## Responsive Behaviour

| Breakpoint | Layout Change |
|---|---|
| `≥ 1280px` | Full layout as designed — red circle right column, 4-col footer nav |
| `768px–1279px` | Red circle scales down, remains right column. Footer nav 2×2 grid. |
| `480px–767px` | Red circle moves above the headline (full-width decorative element). Footer nav stacks 2 columns. Giant logotype scales to viewport width. |
| `< 480px` | Red circle becomes smaller accent (120px) beside the headline. Footer nav: single column accordion (expand/collapse). |

---

## Component File Target

```
src/components/marketing/cta-footer.tsx    ← entire footer section component
```

---

## Visual Design Summary — The Full Page Journey

The landing page opens and closes with the same red circle motif:

```
HERO (top of page):
  Red circle RISES from behind a Lusaka estate house at dawn.
  → Sunrise. Beginning. Promise.

FOOTER (bottom of page):
  Red circle SETTLES into position beside the closing headline.
  → Sunset. Completion. Invitation.

Between them: 4 sections of editorial precision.
The red circle is the only element that bookends the entire page.
```
