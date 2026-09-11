# How It Works Section — Design & Interaction Specification

> **Reference image**: `how-it-works-reference.jpg` (locked, approved 2026-09-10)  
> **Section anchor**: `#how-it-works`  
> **Nav link**: "How It Works" in top navbar  
> **Aspect ratio**: 16:9 (full viewport width × 100vh)

---

## Design System Tokens (This Section)

```
Background:           #ffffff
Text Primary:         #282828  (BT Grotesk)
Text Muted:           #6b6b6b  (Geist Mono descriptions)
Tab Inactive:         #9b9b9b  (RENT / LEASE / DEVELOP when not selected)
Tab Active:           #282828  (SELL when selected)
Tab Active Underline: #fa3600  3px solid
Tab Active Dot:       #fa3600  8px solid circle
Step Numbers:         #fa3600  (01, 02, 03 — Geist Mono)
Grid Lines:           #e0e0e0  1px
Corner Marks:         #c0c0c0  + registration marks
Topo Lines:           #282828  at 6% opacity
```

---

## Layout Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│ + ──────────────── HOW IT WORKS ─────────────────────────────────── + │
├──────────────────────────────────────────────────────────────────────┤
│        YOUR AGENTS DO WHAT YOU TELL THEM. NOTHING MORE.              │
│                       (H2, centered, 2 lines)                        │
├──────────────────────────────────────────────────────────────────────┤
│   SELL● (active/red underline)  │  RENT  │  LEASE  │  DEVELOP        │
│                                 │        │         │  (all greyed)   │
├──────────────────────────────────────────────────────────────────────┤
│  01 / CAPTURE        │  02 / MANAGE         │  03 / CLOSE            │
│  [illustration]  →   │  [illustration]  →   │  [illustration]        │
├──────────────────────────────────────────────────────────────────────┤
│ + ── Switch between SELL, RENT, LEASE and DEVELOP above ─────────── + │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Typography

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Section label | Geist Mono | 11px, uppercase, 4px tracking | 500 | `#6b6b6b` |
| H2 Headline | BT Grotesk | `clamp(32px, 4.5vw, 60px)` | 700 | `#282828` |
| Tab labels | BT Grotesk | `clamp(28px, 3.5vw, 48px)` | 700 | active: `#282828`, inactive: `#9b9b9b` |
| Step numbers `01` `02` `03` | Geist Mono | `clamp(48px, 6vw, 80px)` | 700 | `#fa3600` |
| Step title `CAPTURE` | BT Grotesk | `clamp(18px, 2vw, 26px)` | 700 | `#282828` |
| Step description | Geist Mono | 14px | 500 | `#6b6b6b` |
| Bottom hint | Geist Mono | 12px | 500 | `#9b9b9b` |
| Forward arrow `→` | BT Grotesk | 20px | 400 | `#282828` |

---

## Workflow Tabs — Content per Tab

### Tab 1: SELL (default active on load)
| Step | Title | Description | Illustration |
|---|---|---|---|
| 01 | CAPTURE | "Sign the mandate. Upload the title deed. Set the asking price. Done in under 2 minutes." | Mandate/contract form — field rectangles, signature line, red checkmark |
| 02 | MANAGE | "Track every viewing. Monitor every offer. WhatsApp follows up automatically — you don't chase, Contour does." | Property card + calendar grid with viewing dots + pipeline flow (New→Viewing→Offer) |
| 03 | CLOSE | "Offer accepted. Commission locked at 5%. Deed of sale generated. Registry updated. Agent paid." | Commission ledger — property rows with 5% amounts, total line, red checkmark seal |

### Tab 2: RENT
| Step | Title | Description | Illustration |
|---|---|---|---|
| 01 | LIST | "Upload the rental listing. Set the monthly rate, deposit, and pet policy. Live in 90 seconds." | Listing card with rental price badge, availability calendar |
| 02 | SCREEN | "Applicants tracked. References requested. NRC verified. Contour keeps score." | Applicant comparison table — names, scores, status dots, one red highlight |
| 03 | LEASE | "Lease agreement generated. Deposit recorded. Tenant moved in. Arrears monitoring starts automatically." | Lease document with signature lines + automated arrears monitoring schedule |

### Tab 3: LEASE (Commercial)
| Step | Title | Description | Illustration |
|---|---|---|---|
| 01 | MANDATE | "Capture the commercial property details. Floor plan area (m²), zoning, and anchor tenant." | Commercial floor plan grid with area measurements, zoning label |
| 02 | NEGOTIATE | "Track every offer, counter, and clause. Every version saved. Nothing lost." | Negotiation timeline — offer amounts in ascending bars, clause checkboxes |
| 03 | EXECUTE | "Lease executed. Escalation schedule set. Renewal alerts on. Landlord statement auto-generated." | Rental escalation chart with straight ruled lines, renewal date marker in red |

### Tab 4: DEVELOP
| Step | Title | Description | Illustration |
|---|---|---|---|
| 01 | SURVEY | "Register the land parcel. Attach the cadastral survey. Plot the stand numbers." | Survey grid — numbered plot rectangles, boundary lines, GPS coordinates |
| 02 | MARKET | "Generate individual stand listings. Syndicate to WhatsApp buyers. Track all enquiries." | Grid of numbered stands with status: Available (white), Reserved (striped), Sold (red dot) |
| 03 | TRANSFER | "Transfer processed. Title deed issued per stand. Commission per unit tracked." | Title deed certificates arranged in a grid, each with a unit number, red seal on completed ones |

---

## Interaction & Animation Specification

### 1. Section Entry (Scroll into View)
```
Trigger: IntersectionObserver (threshold: 0.1)

Timeline:
  0ms   → "HOW IT WORKS" label: opacity 0 → 1  (300ms)
  150ms → H2 Line 1 mask-reveal: "YOUR AGENTS DO WHAT YOU"  (700ms)
  330ms → H2 Line 2 mask-reveal: "TELL THEM. NOTHING MORE."  (700ms)
  500ms → Tab row: opacity 0 → 1, y: +20px → 0  (500ms)
           Tabs stagger left to right: 60ms each
  700ms → Step columns: stagger in from left
           Col 1: x: -20px → 0, opacity 0→1  (500ms)
           Col 2: x: -20px → 0, opacity 0→1  (500ms, 80ms delay)
           Col 3: x: -20px → 0, opacity 0→1  (500ms, 160ms delay)
  900ms → Illustrations draw in: SVG stroke-dashoffset 100→0  (800ms per illustration)
           Staggered 200ms per column
```

### 2. Tab Click Interaction
```
Trigger: onClick (or onKeyDown Enter/Space) on any tab label

Outgoing tab content:
  - Steps: opacity 1 → 0, y: 0 → -10px  (200ms ease-in)
  - Illustrations: opacity 1 → 0, scale 1 → 0.97  (180ms ease-in)

Incoming tab content:
  - Steps: y: 10px → 0, opacity 0 → 1  (280ms ease-out, 200ms delay)
  - Illustrations: SVG stroke-dashoffset re-draws  (600ms, 200ms delay)

Tab label transitions:
  - Deactivating tab: color #282828 → #9b9b9b  (200ms)
  - Activating tab: color #9b9b9b → #282828  (200ms)
  - Active underline: scaleX 0 → 1 from left origin  (300ms cubic-bezier(0.16, 1, 0.3, 1))
  - Active dot: scale 0 → 1  (200ms, 150ms delay)
```

### 3. Tab Hover State (non-active tabs)
```
Trigger: onMouseEnter on an inactive tab

  - Tab label: color #9b9b9b → #282828  (150ms ease)
  - Thin underline preview: scaleX 0 → 0.4 from left  (200ms)
    (partial underline — teases that it's clickable without looking active)

Trigger: onMouseLeave
  - Reverts to #9b9b9b, underline disappears
```

### 4. Illustration Draw Animation (SVG)
All illustrations are inline SVG with `stroke-dasharray` and `stroke-dashoffset` animations:
```css
.illustration-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawPath 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes drawPath {
  to { stroke-dashoffset: 0; }
}
```
The red accent element (checkmark, dot, seal) fades in last with a `0.3s` delay after the black lines finish drawing.

### 5. Step Hover State (individual columns)
```
Trigger: onMouseEnter on any step column

  - Step number: scale 1 → 1.05  (200ms)
  - Column background: transparent → #fafafa  (200ms)
  - Arrow: translateX 0 → 6px  (200ms ease)
  - Illustration: subtle scale 1 → 1.02  (300ms ease)
```

### 6. Arrow Between Steps
The `→` arrows between step columns are not static — they pulse:
```css
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 0.6; }
  50% { transform: translateX(4px); opacity: 1; }
}
.step-arrow { animation: arrowPulse 2s ease-in-out infinite; }
```
This subtly communicates the flow direction without being distracting.

---

## Component File Target

```
src/components/marketing/how-it-works.tsx           ← main section component
src/components/marketing/workflow-illustrations/
  ├── sell/
  │   ├── capture-illustration.tsx   (mandate form SVG)
  │   ├── manage-illustration.tsx    (calendar + pipeline SVG)
  │   └── close-illustration.tsx     (commission ledger SVG)
  ├── rent/
  │   ├── list-illustration.tsx
  │   ├── screen-illustration.tsx
  │   └── lease-illustration.tsx
  ├── lease/
  │   ├── mandate-illustration.tsx
  │   ├── negotiate-illustration.tsx
  │   └── execute-illustration.tsx
  └── develop/
      ├── survey-illustration.tsx
      ├── market-illustration.tsx
      └── transfer-illustration.tsx
```

---

## Responsive Behaviour

| Breakpoint | Layout Change |
|---|---|
| `≥ 1280px` | Full 3-column step layout + 4-tab row as designed |
| `768px–1279px` | 3-column steps maintained, tab labels slightly smaller |
| `480px–767px` | Tabs become horizontally scrollable. Steps stack vertically: 01 → 02 → 03. Each step full width. |
| `< 480px` | Tabs: icon + short label only. Illustrations hide, text steps only. |

---

## Locked Content Summary

- **Section label**: "HOW IT WORKS"
- **Headline**: "YOUR AGENTS DO WHAT YOU / TELL THEM. NOTHING MORE."
- **Default active tab**: SELL
- **Step structure per tab**: 01 → 02 → 03 (always 3 steps)
- **Total illustration count**: 12 (3 steps × 4 tabs)
- **Bottom hint**: "Switch between SELL, RENT, LEASE and DEVELOP above to see each workflow"
