# Pricing Section — Design & Interaction Specification

> **Reference image**: `pricing-section-reference.jpg` (locked, approved 2026-09-10)
> **Section anchor**: `#pricing`
> **Nav link**: "Pricing" in top navbar
> **Aspect ratio**: 16:9 (full viewport width × 100vh)

---

## Design System Tokens (This Section)

```
Background:              #ffffff
Text Primary:            #282828  (BT Grotesk)
Text Muted:              #6b6b6b  (Geist Mono)
Agency Column BG:        #282828  (inverted — near-black)
Agency Column Text:      #ffffff
Agency CTA Button:       #fa3600 bg, #ffffff text
Most Popular Label:      #fa3600  (Geist Mono, uppercase)
Starter/Enterprise BTN:  transparent bg, 1px #282828 border, #282828 text
Toggle Active:           #282828 bg, #ffffff text
Toggle Inactive:         #ffffff bg, 1px #e0e0e0 border, #6b6b6b text
Checkmark ✓:             #282828  (Starter/Enterprise columns)
Checkmark ✓:             #ffffff  (Agency column, on dark bg)
Dash —:                  #9b9b9b
Grid Lines:              #e0e0e0  1px ruled
Corner Marks:            #c0c0c0  + registration marks
```

---

## Layout Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│ + ──────────────── THE PRICING ──────────────────────────────────── + │
├──────────────────────────────────────────────────────────────────────┤
│              PRICED FOR THE AFRICAN MARKET.  (H2, centered)           │
│                   [ ZMW ] [ USD ]  Toggle currency                    │
├──────────────┬──────────────────┬──────────────────┬─────────────────┤
│  Feature col │   STARTER        │  ██ AGENCY ██    │   ENTERPRISE    │
│  (25% width) │   K 599 /mo      │  ██ K 1,499 /mo  │   K 3,999 /mo   │
│              │  [Start Trial →] │  ██[Start Trial]█│  [Contact Sales]│
├──────────────┼──────────────────┼──────────────────┼─────────────────┤
│ Mandate Cap. │       ✓          │  ██    ✓    ██   │       ✓         │
│ Deal Pipeline│       ✓          │  ██    ✓    ██   │       ✓         │
│ Commission   │       ✓          │  ██    ✓    ██   │       ✓         │
│ Lease/Arrears│       —          │  ██    ✓    ██   │       ✓         │
│ WhatsApp Syn.│       —          │  ██    ✓    ██   │       ✓         │
│ Doc Vault    │       —          │  ██    ✓    ██   │       ✓         │
│ Field PWA    │       —          │  ██    —    ██   │       ✓         │
│ API & MCP    │       —          │  ██    —    ██   │       ✓         │
├──────────────────────────────────────────────────────────────────────┤
│             ≡ Powered by Paystack                                     │
│  Prices in ZMW. USD available. 14-day trial. No card required.        │
│ + ─────────────────────────────────────────────────────────────────+ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Pricing Plans — Locked Content

### Starter — K 599 / mo  (~$27 USD)
- **Tagline**: "For solo agents just getting started"
- **Users**: 1 agent
- **Mandates**: Up to 20 active mandates
- **CTA**: "Start Free Trial →" (outlined button, square corners)
- **Included**: Mandate Capture ✓, Deal Pipeline ✓, Commission Tracking ✓
- **Not included**: Lease & Arrears, WhatsApp Syndication, Document Vault, Field PWA, API

### Agency — K 1,499 / mo  (~$69 USD) ⭐ MOST POPULAR
- **Tagline**: "For growing agencies up to 5 agents"
- **Users**: Up to 5 agents
- **Mandates**: Unlimited
- **CTA**: "Start Free Trial →" (solid `#fa3600` button, white text, square corners)
- **Label**: "MOST POPULAR" in `#fa3600`, Geist Mono, above plan name
- **Column**: Full dark `#282828` background, all text white
- **Included**: All Starter features + Lease & Arrears ✓, WhatsApp Syndication ✓, Document Vault ✓
- **Not included**: Field Agent PWA, API & MCP Access

### Enterprise — K 3,999 / mo  (~$185 USD)
- **Tagline**: "For established agencies, unlimited everything"
- **Users**: Unlimited agents
- **Mandates**: Unlimited
- **CTA**: "Contact Sales →" (outlined button, square corners)
- **Included**: All Agency features + Field Agent PWA ✓, API & MCP Access ✓
- **Extras**: Custom branding, dedicated support, POPIA compliance report, SLA

---

## Feature Row Definitions

| Feature | Starter | Agency | Enterprise |
|---|---|---|---|
| Mandate Capture | ✓ | ✓ | ✓ |
| Deal Pipeline | ✓ | ✓ | ✓ |
| Commission Tracking | ✓ | ✓ | ✓ |
| Lease & Arrears Automation | — | ✓ | ✓ |
| WhatsApp Syndication | — | ✓ | ✓ |
| Document Vault | — | ✓ | ✓ |
| Field Agent PWA (Offline) | — | — | ✓ |
| API & MCP Access | — | — | ✓ |

---

## ZMW / USD Toggle Interaction

```
State: ZMW (default)
  - ZMW button: bg #282828, text #ffffff
  - USD button: bg transparent, border 1px #e0e0e0, text #6b6b6b
  - Prices shown: K 599 / K 1,499 / K 3,999

State: USD (toggled)
  - USD button: bg #282828, text #ffffff
  - ZMW button: bg transparent, border 1px #e0e0e0, text #6b6b6b
  - Prices swap with animation:
    - Old price: opacity 1→0, translateY 0→-8px  (150ms ease-in)
    - New price: opacity 0→1, translateY 8px→0  (200ms ease-out, 150ms delay)
  - USD prices: $27 / $69 / $185

Toggle button transition: background color slides 200ms ease.
```

---

## Animation & Interaction Specification

### 1. Section Entry (Scroll into View)
```
Trigger: IntersectionObserver (threshold: 0.1)

Timeline:
  0ms   → "THE PRICING" label: opacity 0→1  (300ms)
  150ms → H2 Line 1 mask-reveal: "PRICED FOR THE"  (700ms)
  300ms → H2 Line 2 mask-reveal: "AFRICAN MARKET."  (700ms)
  500ms → ZMW/USD toggle: opacity 0→1, y +10px→0  (400ms)
  600ms → Column headers stagger in (left to right, 80ms apart):
           opacity 0→1, y +16px→0  (500ms each)
  700ms → Agency column: bg slides down from top
           clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)  (600ms ease)
  900ms → Feature rows: stagger in top-to-bottom
           Each row: opacity 0→1, x -8px→0  (300ms, 40ms apart)
  1100ms → Paystack badge: opacity 0→1  (400ms)
```

### 2. CTA Button Hover (Fill-Wipe)
All three CTA buttons use the standard fill-wipe animation:

**Starter & Enterprise (outlined buttons)**:
```css
/* ::after pseudo-element wipes up from bottom */
.btn-outlined::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #282828;
  transform: translateY(102%);
  transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.btn-outlined:hover::after { transform: translateY(0%); }
/* Text lifts above fill via z-index */
.btn-outlined:hover { color: #ffffff; }
```

**Agency (red solid button)**:
```css
.btn-agency::after {
  background: #ffffff;  /* white wipes up */
}
.btn-agency:hover { color: #fa3600; }  /* text turns red on white fill */
```

### 3. Feature Row Hover
```
Trigger: onMouseEnter on any feature row

  - Row background: transparent → #f5f5f5  (150ms ease)
    (for Starter/Enterprise columns only — Agency column rows → #333333)
  - Feature name: color → #282828, fontWeight 500→600  (instant)
  - Row transition is subtle — just enough to confirm interactivity

Trigger: onMouseLeave → reverts
```

### 4. Column Header Hover (non-Agency columns)
```
Trigger: onMouseEnter on Starter or Enterprise column header

  - Plan name: slight scale 1→1.02  (200ms ease)
  - Price: color #282828→#282828 (no change, already black)
  - Subtle underline appears under plan name: scaleX 0→1  (200ms)
```

---

## Typography

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Section label | Geist Mono | 11px, 4px tracking, uppercase | 500 | `#6b6b6b` |
| H2 Headline | BT Grotesk | `clamp(32px, 5vw, 68px)` | 700 | `#282828` |
| Toggle labels | Geist Mono | 13px | 500 | active: `#fff`, inactive: `#6b6b6b` |
| Plan names | Geist Mono | 12px, uppercase, 3px tracking | 500 | white or `#6b6b6b` |
| "MOST POPULAR" | Geist Mono | 11px, uppercase | 500 | `#fa3600` |
| Price | BT Grotesk | `clamp(28px, 3.5vw, 48px)` | 700 | white or `#282828` |
| Price `/mo` | Geist Mono | 14px | 500 | white or `#6b6b6b` |
| Tagline | Geist Mono | 13px | 500 | white or `#6b6b6b` |
| CTA button text | BT Grotesk | 15px | 500 | varies per plan |
| Feature names | Geist Mono | 13px | 500 | `#282828` |
| Checkmark ✓ | Geist Mono | 14px | 600 | `#282828` or `#ffffff` |
| Dash — | Geist Mono | 14px | 400 | `#9b9b9b` |
| Paystack badge | Geist Mono | 12px | 500 | `#6b6b6b` |
| Legal copy | Geist Mono | 11px | 400 | `#9b9b9b` |

---

## Responsive Behaviour

| Breakpoint | Layout Change |
|---|---|
| `≥ 1280px` | Full 4-column layout (feature label + 3 plans) as designed |
| `768px–1279px` | Feature label column merges into rows. 3 plan columns maintained, narrower. |
| `480px–767px` | Stacked layout — 3 plan cards stacked vertically. Agency plan first (most prominent). Feature comparison table hidden behind "Show all features →" toggle. |
| `< 480px` | Single column. Plan selector tabs at top. One plan shown at a time. |

---

## Component File Target

```
src/components/marketing/pricing-grid.tsx        ← main pricing component
src/components/marketing/currency-toggle.tsx     ← ZMW/USD toggle
```
