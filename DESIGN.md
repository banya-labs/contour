# Contour Design System (Warm Modern Villa & Sunlit Estate)

> **Identity**: High-End Architectural Real Estate & Mandate Operating System for Southern Africa  
> **Aesthetic Philosophy**: Warm Modern Villa & Sunlit Estate (*Architectural Digest meets Solidroad*)  
> **Updated**: August 2026 by Antigravity (`/impeccable`)

---

## 1. Visual Theme & Core Atmosphere

Contour's design system pairs the sun-drenched, tactile warmth of Southern African luxury architecture with the crisp, institutional precision of modern real estate operating systems.

### Core Visual Pillars:
1. **Warm Sunlit Canvas**: Warm limestone/alabaster grounds (`#FBF9F5` / `#F8F6F0`) that evoke natural travertine stone, warm sunlit plaster, and quiet luxury.
2. **Authoritative Deep Forest Green**: Rich Zambian evergreen (`#16382B` / `#0F291E`) provides grounded, high-contrast typography, primary buttons, and institutional headers.
3. **Architectural Bronze & Champagne**: Refined metallic accents (`#C89B3C`, `#E8C265`, `#DBF400`) highlighting verified title deeds, cadastral survey contours, and locked 5% commission ledgers.
4. **Cadastral & Topographic Vector Overlays**: Organic contour lines (elevation isolines at 1,280m–1,310m across Lusaka plateau) and survey plot boundary grids subtly woven into backgrounds.
5. **Layered 3D Depth (The Solidroad Standard)**: Centered high-resolution desktop operations dashboard with foreground floating luxury estate cards, creating tangible spatial hierarchy.

---

## 2. Color Palette & Roles

```
Surface (Base Canvas):    #FBF9F5 (Warm Alabaster / Limestone)
Surface (Cards / Panels): #FFFFFF (Crisp White with #ECE7DE borders)
Surface (Deep Dark Mode): #16382B (Deep Zambian Forest Green)
Text Primary:             #1C1C1A (Near Black / Deep Espresso)
Text Secondary:           #666158 (Muted Stone Gray)
Text On Dark:             #FFFFFF / #F3EFE6
Brand Primary:            #16382B (Evergreen)
Brand Accent / Gold:      #C89B3C (Warm Architectural Bronze)
Brand Accent / Champagne: #E8C265 (Light Champagne)
Success / Verified:       #1B5E20 / #10B981 (Emerald Green)
Warning / Arrears:        #D97706 (Amber)
Error / High Risk:        #DC2626 (Crimson)
```

---

## 3. Typography & Hierarchy

- **Headings & Editorial Statements**: `Playfair Display` or `Instrument Serif` / `Georgia` for luxury property titles, key numbers, and editorial callouts.
- **Body & Controls**: `Plus Jakarta Sans`, `Inter`, or system sans-serif for UI scanability, forms, and responsive mobile views.
- **Telemetry & Cadastral Specs**: `JetBrains Mono` or `ui-monospace` for stand numbers (`Stand # 8942-A`), elevations (`▲ 1,280 m`), GPS coordinates (`15°25'S 28°20'E`), and Kwacha pricing (`K 14,500,000`).

---

## 4. Component Rules & Affordances

### 1. The Solidroad-Style Layered Hero
- Back layer: Topographic cadastral lines and sun-drenched estate backdrop.
- Middle layer: High-resolution desktop browser frame running the Contour Property Catalogue and Operations Dashboard.
- Front layer: Floating 3D property card with luxury villa photo, verified title deed badge, and 5% commission yield badge.

### 2. The Living Property Cards
- Aspect ratio: `16:10` or `16:9` high-res photography with subtle hover zoom (`scale-105 duration-500`).
- Top floating pills: Stand Number + Verified Title Deed stamp.
- Bottom overlay: Suburb name, elevation badge, and price in ZMW/USD.
- Action: 1-Click WhatsApp flyer generator modal with masked landlord PII.

### 3. Topographic Backgrounds (`ContourTopoBackground`)
- Use with `0.06` to `0.15` opacity across key landing surfaces to reinforce spatial mapping and land survey identity without distracting from readability.

---

## 5. Multi-Surface Application Standard

1. **Public Marketing Surface (`/`)**: High-converting, image-heavy luxury property showcase with ROI calculator, interactive Lusaka map, and Paystack pricing.
2. **Operations Dashboard (`/dashboard`)**: Full-featured agency workspace with property catalog, pipeline Kanban, sales registry, lease arrears bot, and landlord statements.
3. **Field Agent Mobile PWA (`/kiosk`)**: Zero-latency offline-first field companion powered by PowerSync SQLite WASM for 12-hour ZESCO load-shedding resilience.
4. **Machine Surface (`/api/mcp`)**: User-scoped MCP endpoints with 1-click compromise revocation and sliding-window rate limiting.