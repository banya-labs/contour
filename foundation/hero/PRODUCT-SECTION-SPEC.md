# Product Section — Design & Interaction Specification

> **Reference image**: `product-section-reference.jpg` (locked, approved 2026-09-10)  
> **Section anchor**: `#product`  
> **Nav link**: "Product" in top navbar  
> **Aspect ratio**: 16:9 (full viewport width × 100vh)

---

## Design System Tokens (This Section)

```
Background:       #ffffff
Text Primary:     #282828  (BT Grotesk)
Text Secondary:   #6b6b6b  (Geist Mono)
Accent:           #fa3600  (feature numbers, active border, red dot)
Active Row Tint:  #fff5f3  (warm barely-there red tint on hovered row)
Grid Lines:       #e0e0e0  (1px ruled lines — horizontal + vertical)
Active Border:    #fa3600  (3px solid left border on active feature)
Corner Marks:     #c0c0c0  (+ registration cross marks at grid corners)
Topo Lines:       #282828  at 6% opacity (illustration background)
```

---

## Layout Grid

```
┌─────────────────────────────────────────────────────────────────────────┐
│ + ─────────────── THE SYSTEM ─────────────────────────────────────────+ │  ← 1px ruled header
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│         ONE SCREEN. EVERY MANDATE, EVERY DEAL.   (H2, centered)        │
│     Contour is the operating system for Lusaka...  (Geist Mono, center) │
│                                                                         │
├────────────────────────────┬────────────────────────────────────────────┤  ← 1px vertical rule
│   LEFT: Feature List (40%) │        RIGHT: Illustration (60%)           │
│                            │                                            │
│  01  Mandate Capture    →  │   ┌─ DEAL PIPELINE — ACTIVE VIEW ──────┐  │
│ ─────────────────────────  │   │                                     │  │
│  02  Deal Pipeline      →  │   │  New  Viewing  Offer  Signed  Closed│  │
│ [ACTIVE — red border+tint] │   │  [□]   [□]     [□]    [□●]   [□]   │  │
│ ─────────────────────────  │   │  [□]   [□]     [□]    [□]           │  │
│  03  Commission Track   →  │   │  [□]           [□]                  │  │
│ ─────────────────────────  │   │                                     │  │
│  04  Lease & Arrears    →  │   │  ∿∿∿ topo lines at 6% opacity ∿∿∿  │  │
│ ─────────────────────────  │   └─────────────────────────────────────┘  │
│  05  WhatsApp Syndicate →  │                                            │
│ ─────────────────────────  │                                            │
│  06  Document Vault     →  │                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  [01 Mandate] [02 Pipeline] [03 Commission] [04 Arrears] [05 WA] [06 Doc] │  ← thumbnail strip
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Section label "THE SYSTEM" | Geist Mono | 12px, uppercase, tracked 3px | 500 | `#6b6b6b` |
| H2 Headline | BT Grotesk | `clamp(36px, 5vw, 64px)` | 700 | `#282828` |
| Subtext | Geist Mono | 15.5px | 500 | `#6b6b6b` |
| Feature number (01…06) | Geist Mono | 18px | 500 | `#fa3600` |
| Feature name | BT Grotesk | 18px | 600 | `#282828` |
| Feature description | Geist Mono | 13px | 500 | `#6b6b6b` |
| Illustration label | Geist Mono | 11px, uppercase | 500 | `#282828` |
| Arrow `→` | BT Grotesk | 16px | 400 | `#282828` |

---

## Interaction & Animation Specification

### 1. Section Entry (Scroll into View)
```
Trigger: IntersectionObserver (threshold: 0.15)

Timeline:
  0ms   → Section visible, begin entry sequence
  0ms   → Section label "THE SYSTEM": opacity 0 → 1, y: +10px → 0  (400ms ease)
  150ms → H2 headline: line 1 mask-reveal (translateY 100% → 0, 700ms)
  330ms → H2 headline: line 2 mask-reveal (staggered 180ms)
  500ms → Subtext: opacity 0 → 1, y: +16px → 0  (500ms)
  600ms → Feature list: stagger each row opacity 0 → 1, x: -12px → 0
          Each row 60ms apart
  600ms → Illustration panel: opacity 0 → 1, scale 0.98 → 1  (600ms ease)
  800ms → Bottom thumbnail strip: opacity 0 → 1  (400ms ease)
```

### 2. Feature Row Hover State
```
Trigger: onMouseEnter on any feature row

Effects:
  - Left border: 0px → 3px solid #fa3600  (instant, no transition)
  - Row background: transparent → #fff5f3  (200ms ease)
  - Feature number: #fa3600 → #fa3600 (no change, already red)
  - Arrow →: translateX 0 → 4px  (200ms ease)
  - Feature name: fontWeight 600 → 700  (instant)

Illustration panel:
  - Current illustration: opacity 1 → 0, scale 1 → 0.97  (180ms ease-in)
  - New illustration: scale 0.97 → 1, opacity 0 → 1  (280ms ease-out, 180ms delay)
  - Illustration label top-right: updates to match new feature name
  
Trigger: onMouseLeave
  - All hover styles revert to default
  - Last hovered illustration remains visible (no snap-back to default)
```

### 3. Feature Row Click / Active State
```
Trigger: onClick on any feature row (also via keyboard: Enter/Space)

Effects:
  - Clicked row becomes "active" — persists the hover state
  - Active row: left border 3px #fa3600, background #fff5f3
  - Active row: cannot be dismissed until another row is clicked
  - Default active on page load: Feature 02 — Deal Pipeline

Mobile behaviour:
  - On click, the illustration panel scrolls into view (smooth scroll)
  - Illustration appears above the feature list on mobile (stacked layout)
```

### 4. Bottom Thumbnail Strip Interaction
```
Six mini thumbnail boxes at the bottom — one per feature.
- Default: thin 1px border #e0e0e0, feature number in grey
- Active: border color #fa3600, feature number in #fa3600, bold
- Hover: border color #282828
- Clicking any thumbnail activates that feature (same as clicking the row)
- Thumbnails scroll horizontally on mobile
```

### 5. Illustration Panel — Per-Feature Content

Each feature has its own illustration rendered as an SVG in the right panel:

| Feature | Illustration |
|---|---|
| **01 Mandate Capture** | A minimal form/intake sheet — ruled lines, field labels ("Property Address", "Landlord Name", "Stand #", "Asking Price K"), a submit arrow at the bottom. Small red dot at the "Stand #" field. |
| **02 Deal Pipeline** | Kanban board — 5 columns (New / Viewing / Offer / Signed / Closed), property cards as rectangles with house icons, flow arrows between columns, red dot on "Signed" card. |
| **03 Commission Tracking** | A ledger/table — rows of property entries with commission amounts, a running total column, one row highlighted with a red accent checkmark. Feels like a financial statement. |
| **04 Lease & Arrears** | A WhatsApp message thread mockup (minimal, editorial) — message bubbles as simple rectangles, the automated nudge message visible, tenant reply, "Paid ✓" at the bottom in red. |
| **05 WhatsApp Syndication** | A property listing flyer wireframe — house photo placeholder, property details, Contour branding, WhatsApp share button. Shows the flyer being sent to a group. |
| **06 Document Vault** | A file cabinet diagram — folders labeled "Title Deeds", "NRC Scans", "Mandates", "Lease Agreements" arranged in a grid, a lock icon in red on one folder, subtle topo lines in background. |

All illustrations use:
- Black lines on white (`stroke: #282828`, `strokeWidth: 1`)
- Zero fill colors (transparent interiors)
- One `#fa3600` accent element per illustration
- Topographic contour lines at `6% opacity` as background texture

---

## Graphic Design Details

### Registration Cross Marks (`+`)
Four `+` marks at the corners where the section frame meets the grid:
```css
/* Positioned absolute at each grid corner intersection */
.corner-mark {
  color: #c0c0c0;
  font-size: 14px;
  position: absolute;
  /* top-left, top-right, bottom-left, bottom-right of the lower section */
}
```

### Section Header Row
```
|——————————————————— THE SYSTEM ———————————————————|
```
Full-width `1px solid #e0e0e0` lines on both sides of the label.  
Label: Geist Mono, 11px, uppercase, letter-spacing: 4px, color: `#6b6b6b`.

### Vertical Divider
`1px solid #e0e0e0` running full height of the feature list / illustration area.  
Positioned at exactly 40% from the left edge.

### Feature Row Separators
`1px solid #e0e0e0` horizontal lines between each of the 6 features.  
First row has a top border too. Last row has a bottom border.  
Each row padding: `20px 24px`.

---

## Component File Target

```
src/components/marketing/product-features.tsx   ← main section component
src/components/marketing/feature-illustrations/ ← SVG illustration components
  ├── mandate-capture-illustration.tsx
  ├── deal-pipeline-illustration.tsx
  ├── commission-tracking-illustration.tsx
  ├── lease-arrears-illustration.tsx
  ├── whatsapp-syndication-illustration.tsx
  └── document-vault-illustration.tsx
```

---

## Responsive Behaviour

| Breakpoint | Layout Change |
|---|---|
| `≥ 1280px` | Full two-column layout as designed |
| `768px–1279px` | Illustration panel shrinks to 50%, feature list to 50% |
| `< 768px` | Stacked: Illustration first (full width), feature list below (full width). Thumbnail strip becomes horizontally scrollable. |
