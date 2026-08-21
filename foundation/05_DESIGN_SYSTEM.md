# 05 — Design System & Visual Specification: Contour

**Design System Theme**: *Elicit / Founder's Ledger* (Field & Estate Operations)  
**Target Viewports**: 100% Fluid Responsive (Desktop Command Center, 10-inch Tablet, Field Agent Mobile PWA 375px)  
**Author**: Foundation Architect (Banya Labs)  

---

## 1. Brand Identity & Visual Philosophy

Real estate in Southern Africa is a business of trust, high-value asset custody, and tactile field execution. The Contour visual identity avoids cold, generic SaaS blues and purple gradients. Instead, it pairs **Deep Forest Teal** (stability, land, prestige) with **Warm Parchment** (paper ledgers, legal title deeds) and **Banya Amber** (action, live deals, urgent arrears).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR PALETTE TOKENS                            │
├────────────────────────────────────────────────────────────────────────┤
│ Deep Forest Teal  : #083D44  (Primary Brand, Sidebar, Dark Canvas)     │
│ Warm Parchment    : #FCFCF8  (App Background, Card Surfaces)           │
│ Banya Amber       : #E57A1A  (Active Calls-to-Action, Deals, Alerts)   │
│ Ink Near-Black    : #1C1C1A  (Typography, High-Contrast Headers)       │
│ Muted Slate       : #64748B  (Subtitles, Secondary Labels)             │
│ Forest Emerald    : #059669  (Confirmed Rent Payments, Sold Deals)     │
│ Crimson Alert     : #DC2626  (Overdue Arrears, For-Sale Map Pins)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Interactive Map Color Coding

The Leaflet GPS Property Map uses standardized visual pins:

| Pin Color | Hex Code | Property Status & Meaning |
| :--- | :--- | :--- |
| 🔴 **Crimson** | `#EF4444` | **Available for Sale** |
| 🟡 **Amber** | `#F59E0B` | **Available for Rent** |
| 🟢 **Emerald** | `#10B981` | **Sold / Closed Deal** |
| 🔵 **Cobalt** | `#3B82F6` | **Rented / Occupied Lease** |
| ⚪ **Slate Outlined**| `#94A3B8` | **Vacant Land Plot / Farm Block** |

---

## 3. Typography Hierarchy

```css
/* Display & Prestige Headings */
font-family: 'Playfair Display', Georgia, serif;
letter-spacing: -0.02em;

/* UI, Navigation, Forms, Body Text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Financials, ZMW/USD Amounts, GPS Coordinates, Commission % */
font-family: 'JetBrains Mono', monospace;
font-feature-settings: "tnum" 1; /* Tabular numbers for clean column alignment */
```

### Type Scale:
- **Display 1 (Landing Hero)**: `text-4xl sm:text-5xl font-bold tracking-tight text-[#1C1C1A]`
- **Section Heading (H2)**: `text-2xl sm:text-3xl font-semibold text-[#083D44]`
- **Card Title (H3)**: `text-lg font-medium text-[#1C1C1A]`
- **Financial Metric / Price**: `text-xl font-bold font-mono text-[#083D44]`
- **Body & Captions**: `text-sm text-[#64748B] leading-relaxed`

---

## 4. Component Standards & Field Usability

### 1. Mobile Field Agent Touch Target (PWA)
- **Minimum Tap Target**: 48px height on all buttons, map filter toggles, and WhatsApp share triggers.
- **Sunlight Readability**: High contrast (`#083D44` on `#FCFCF8`) to ensure visibility under bright African sun during field viewings.

### 2. The Shareable Listing Card (`/p/[slug]`)
- Sticky bottom mobile bar with 2 primary actions:
  - `[Share to WhatsApp]` (Generates branded flyer snippet with price and landmark).
  - `[Direct WhatsApp Call / Chat]` (Connects client straight to the assigned agent).

### 3. Financial Table & Commission Split Card
- Always displays the dual equation:
  ```
  Gross Property Value : K 2,500,000  (or $100,000)
  Agency Fee (5.0%)    : K   125,000  (Actual Company Revenue)
  Agent Split (50.0%)  : K    62,500  (Paid to Closing Agent)
  Net Agency Retained  : K    62,500
  ```

---

## 5. CSS Tokens (`src/app/globals.css`)

```css
:root {
  --background: 60 33% 98%;      /* #FCFCF8 Warm Parchment */
  --foreground: 60 5% 11%;       /* #1C1C1A Near Black */
  --card: 0 0% 100%;             /* Pure White Card */
  --card-foreground: 60 5% 11%;
  --primary: 187 79% 15%;        /* #083D44 Deep Forest Teal */
  --primary-foreground: 60 33% 98%;
  --secondary: 28 83% 50%;       /* #E57A1A Banya Amber */
  --secondary-foreground: 0 0% 100%;
  --muted: 210 20% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 28 83% 50%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --border: 214 32% 91%;
  --radius: 0.5rem;
}
```
