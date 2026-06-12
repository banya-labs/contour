# Perplexity Design System Analysis

> Source: https://www.perplexity.ai/  
> Measured: May 15, 2026  
> Analysis by DesignMD

---

## 1. Visual Theme & Atmosphere
Perplexity's design system is a masterclass in focused utility and quiet confidence. It employs a warm, paper-like off-white (`#fdfbfa`) and a soft, near-black (`#27251e`) palette to create a calm, academic atmosphere that directs all attention to the central search interface. The aesthetic is defined by its restraint; there are no superfluous colors, gradients, or illustrations. Instead, the brand's identity is carried by its custom typeface, `pplxSans`, which is used for all text, from the logotype to the smallest caption. The interface feels light and responsive, an impression reinforced by generous whitespace and subtle, function-driven CSS animations for state changes.

The system's structure is built on a foundation of soft curves and subtle depth. Large containers and inputs use generous `12px` and `16px` corner radii, creating a friendly and approachable feel. Depth is used sparingly, with a faint `box-shadow` (`rgba(0, 0, 0, 0.08) 0px 1px 2px 0px`) reserved for floating elements like the cookie consent card, lifting them gently off the page. The overall impression is that of a powerful tool that is uncluttered, respectful of the user's focus, and built for intellectual work rather than casual browsing.

### Key Characteristics
*   **Monochromatic & Warm Palette:** The design relies almost exclusively on a warm off-white (`#fdfbfa`) and a dark, desaturated brown-black (`#27251e`), avoiding vibrant brand colors to maintain a serene, focused environment.
*   **Singular Typeface:** The entire interface is set in the custom `pplxSans` font, creating a strong, cohesive typographic identity. Text hierarchy is managed through size (`12px`, `14px`, `16px`) and weight (`400`, `500`) alone.
*   **Line-Based Iconography:** Icons are simple, geometric, and rendered with a consistent thin stroke. They are purely functional and do not draw attention to themselves.
*   **Generous Radii:** Key interactive elements like the main input field and cards feature soft, rounded corners with radii of `12px` and `16px`, contributing to a modern and gentle user experience.
*   **Subtle Animation:** The interface uses functional CSS animations (e.g., `fadeIn`, `fadeOut`) for state transitions, providing smooth feedback without being distracting. No complex motion libraries are detected.
*   **Focus on the Input:** The layout is centered and spacious, deliberately drawing the user's eye to the primary search input, which acts as the application's functional and visual core.
*   **Minimalist Depth:** Elevation is used sparingly. A single, subtle shadow style is applied to overlays and pop-ups, creating a clear but gentle stacking order.

## 2. Color Palette & Roles
The palette is minimal and high-contrast, designed for clarity and focus. It uses a system of CSS variables for defining states and surfaces.

### Primary
*   **Text - Primary (`#27251e`)**: A very dark, warm gray used for all primary body text, labels, and headings. It provides excellent contrast on the light background.
*   **Text - Emphasized (`#000000`)**: Pure black used for text on interactive elements like buttons, providing slightly stronger emphasis than the primary text color.
*   **Accent - Dark (`#271a00`)**: A deep, dark brown used as the background for primary buttons and potentially for subtle borders.

### Neutral Scale
*   **Background (`#fdfbfa`)**: The primary background color for the entire application. A warm, creamy off-white that is easy on the eyes.
*   **Surface - Subtle (Inferred)**: A light gray is used for the active state in the sidebar and for the secondary "Accept All Cookies" button. This is likely derived from a variable like `--bg-soft` or `rgba(0,0,0,0.05)`.
*   **Text - Inverse (`#fdfbfa`)**: The light background color is used as the text color on dark surfaces, such as the primary button.

### Surface & Borders
*   **Border - Default (Inferred)**: A subtle, low-opacity border is used on inputs and some containers. Its color is likely derived from `#271a00` with low alpha.

## 3. Typography Rules

### Font Family
The entire UI uses a single custom sans-serif font family.

*   **Primary:** `pplxSans`, "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"
*   **Monospace:** `ui-monospace`, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Display | `pplxSans` | 48px | 500 | 1.2 | -0.5px | *Estimated.* Used for the "perplexity" logotype. |
| H1 / Prompt | `pplxSans` | 16px | 400 | 24px | normal | Used for the main input placeholder text. |
| H2 / Card Title | `pplxSans` | 16px | 500 | 24px | normal | Used for titles like "Cookie Policy". |
| Body | `pplxSans` | 16px | 400 | 24px | normal | The default text size for all descriptive content. |
| Body Small | `pplxSans` | 14px | 400 | 20px | normal | Used for navigation links and sidebar items. |
| Caption | `pplxSans` | 12px | 400 | 16px | normal | Used for secondary, less important text. |

### Principles
*   **Unified Identity:** Using `pplxSans` exclusively creates a strong, consistent brand voice and avoids visual clutter.
*   **Readability First:** The system prioritizes legibility with a comfortable base size of `16px` for body copy and excellent contrast.
*   **Minimalist Hierarchy:** Typographic scale is restrained. Hierarchy is established primarily through small shifts in size and weight (`400` vs. `500`), not dramatic changes.

## 4. Component Stylings

### Buttons

#### Primary Button
Used for the main affirmative action in a workflow, like "Necessary Cookies".

```css
.btn-primary {
  background-color: #27251e; /* Using a slightly lighter shade than the accent for better contrast */
  color: #fdfbfa;
  font-family: pplxSans, sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```


<details>
<summary>Secondary Button</summary>

Used for secondary actions, like "Accept All Cookies".

```css
.btn-secondary {
  background-color: rgba(0, 0, 0, 0.05); /* Inferred from screenshot */
  color: #27251e;
  font-family: pplxSans, sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 150ms ease-in-out;
}

.btn-secondary:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.btn-secondary:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.btn-secondary:disabled {
  opacity: 0.6;
  background-color: rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
}
```

</details>

<details>
<summary>Icon Button</summary>

Circular buttons for actions like voice input.

```css
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #27251e;
  color: #fdfbfa;
  border: none;
  border-radius: 9999px; /* Pill shape */
  cursor: pointer;
  transition: transform 150ms cubic-bezier(.76, 0, .24, 1);
}

.btn-icon:active {
  transform: scale(0.95);
}
```

</details>
### Cards & Containers

#### Standard Card (Cookie Policy)
Used for floating panels and modals that contain information or actions.

```css
.card {
  background-color: #fdfbfa;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 2px 0px;
}
```

### Inputs & Forms

#### Text Input (Main Prompt)
The primary input for user queries.

```css
.form-input {
  width: 100%;
  background-color: #fdfbfa;
  color: #27251e;
  font-family: pplxSans, sans-serif;
  font-size: 16px;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
  transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;
}

.form-input::placeholder {
  color: #6a6860; /* Inferred */
}

.form-input:focus,
.form-input:focus-visible {
  outline: none;
  border-color: #27251e;
  box-shadow: 0 0 0 2px #fdfbfa, 0 0 0 4px #27251e;
}
```

### Navigation

#### Sidebar Navigation Link
Links used in the primary left-hand sidebar.

```css
.nav-link-sidebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  color: #27251e;
  text-decoration: none;
  transition: background-color 150ms ease-in-out;
}

.nav-link-sidebar:hover {
  background-color: var(--bg-soft); /* e.g., rgba(0,0,0,0.03) */
}

.nav-link-sidebar[aria-current="page"] {
  background-color: var(--bg-subtle); /* e.g., rgba(0,0,0,0.05) */
  font-weight: 500;
}
```

### Links

#### Standard Link
Inline text links.

```css
a.link {
  color: #27251e;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  transition: opacity 150ms ease-in-out;
}

a.link:hover {
  opacity: 0.75;
}
```

## 5. Layout Principles

### Spacing System
The system uses a base unit that appears to be 4px. All spacing is a multiple of this base.

*   **Scale:** `4px`, `8px`, `12px`, `16px`, `32px`
*   **Usage Context:**
    *   `4px`: Fine-tuning alignment, small gaps.
    *   `8px`: Gaps between icons and text, small component padding (`btn-primary`).
    *   `12px`: Padding within sidebar links, gaps between related UI elements.
    *   `16px`: Standard padding for larger components like inputs.
    *   `32px`: Gaps between major layout sections.

### Grid & Container
_Note: container widths and column counts are not extracted from the source. The values below are reasonable defaults inferred from the visible layout density._

*   **Max Width:** The main content area is centered with a max-width of approximately `768px` to maintain focus.
*   **Columns:** A standard 12-column grid can be used for internal layouts, but the primary view is a single, centered column.
*   **Layout:** The primary layout is a two-column structure: a fixed-width sidebar (`~240px`) and a main content area that takes the remaining space.

### Whitespace Philosophy
Whitespace is a core element of the design, used to create a calm, uncluttered, and focused experience. Generous spacing around the central input element establishes it as the primary point of interaction. The lack of visual noise allows users to concentrate on the task of asking questions and receiving information.

### Border Radius Scale
*   `4px`, `6px`, `8px`: Used for smaller components like buttons and badges.
*   `12px`, `16px`: Used for larger components like cards and the main text input, creating a soft, modern feel.
*   `9999px`: Used for creating fully rounded/pill-shaped elements like icon buttons.

## 6. Depth & Elevation
Depth is applied minimally and consistently. The system uses a real stacking context with defined `z-index` values.

| Level | Treatment | Use |
| :--- | :--- | :--- |
| z-0 (Flat) | `box-shadow: none;` | Default page content, background. |
| z-1 | `box-shadow: none;` | Primary sidebar. |
| z-10 / z-20 | `box-shadow: none;` | Top navigation bar and other persistent UI. |
| z-30 | `box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 2px 0px;` | Floating elements like Toasts. |
| z-2000 | `box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 2px 0px;` | Modals and overlays like the Cookie Consent dialog. |

### Shadow Philosophy
Shadows are not for decoration. They serve a single functional purpose: to indicate that an element is part of a separate layer in the stacking context, floating above the main content. The shadow style is uniform, subtle, and soft, providing just enough separation to be clear without being visually heavy.

## 7. Do's and Don'ts

### Do
*   Use `pplxSans` for all text to maintain a unified brand feel.
*   Use `#27251e` for primary text on the `#fdfbfa` background for optimal readability.
*   Apply the `16px` border-radius to the main search input.
*   Use the `4px` base spacing scale: `4, 8, 12, 16, 32px`.
*   Use the `z-2000` elevation level for critical modals like cookie consent.
*   Keep icons as simple, monochrome line drawings.
*   Use `font-weight: 500` for emphasis, such as on card titles or primary buttons.
*   Ensure all interactive elements have a clear `:focus` state, like a `4px` composite ring.
*   Use the dark `#271a00` color primarily for primary button backgrounds.
*   Reserve the `rgba(0, 0, 0, 0.08) 0px 1px 2px 0px` shadow for elevated surfaces.

### Don't
*   Don't use colors outside the core palette of `#fdfbfa`, `#27251e`, and `#000000`.
*   Never use text color `#27251e` on background `#271a00`; its 1.11 contrast ratio fails WCAG.
*   Avoid introducing new font families; rely on `pplxSans`.
*   Don't use spacing values like `10px` or `20px`; stick to the `4px` scale.
*   Never apply shadows to elements that are not elevated in the z-index stack.
*   Don't use filled or multi-colored icons.
*   Avoid using font weights other than `400` and `500`.
*   Don't use border-radii other than `4, 6, 8, 12, 16, 9999px`.
*   Do not create visual complexity with gradients or illustrative elements.
*   Never ship an interactive element without a `:hover` and `:active` state.

## 8. Responsive Behavior
*Note: The breakpoints below are measured directly from the site's CSS and should be considered accurate.*

### Breakpoints

| Breakpoint Name | Width | Key Changes |
| :--- | :--- | :--- |
| Mobile | < 768px | Sidebar is hidden behind a hamburger menu icon. Main content area takes up full screen width. Padding is reduced. |
| Tablet | ≥ 768px | Sidebar becomes visible as a permanent fixture on the left. Main content area has increased horizontal padding. |
| Desktop | ≥ 1024px | Layout is stable. Max-width on the central content column becomes more apparent. |
| Desktop Large | ≥ 1280px | Increased whitespace around the main content container. No major layout shifts. |
| Desktop XL | ≥ 1536px | Further increase in whitespace and margins. Font sizes remain consistent. |

### Touch Targets
*   All interactive elements, including buttons and links, should have a minimum touch target size of `44px` by `44px`.
*   Ensure at least `8px` of space between adjacent touch targets to prevent accidental taps.

### Collapsing Strategy
*   **Navigation:** The left sidebar collapses into a hamburger menu on mobile. The top navigation links may also collapse or be removed.
*   **Cards:** Cards will span the full width of the screen (minus padding) on mobile devices.
*   **Typography:** Base font sizes (`16px`, `14px`) remain consistent across breakpoints to ensure readability. Display text may scale down slightly on the smallest screens.
*   **Padding:** Global padding is reduced on mobile. For example, `32px` section padding might become `16px`.
*   **Forms:** The main input field maintains its large size and prominence on all devices.

## 9. Agent Prompt Guide

### Quick Color Reference
*   **Background:** `#fdfbfa`
*   **Primary Text:** `#27251e`
*   **Emphasized Text / Button BG:** `#000000` or `#271a00`
*   **Inverse Text (on dark BG):** `#fdfbfa`
*   **Subtle Surface (hover/active):** `rgba(0, 0, 0, 0.05)`

### Iteration Guide
1.  **Always use `pplxSans`** for all text elements.
2.  **Body text is `16px` at `400` weight.** Small text is `14px`.
3.  **Stick to the spacing scale:** `4, 8, 12, 16, 32px`. Default padding is `16px`.
4.  **Use these border radii:** `8px` for buttons, `16px` for cards/inputs, `9999px` for icon buttons.
5.  **Default card style:** `background: #fdfbfa`, `padding: 24px`, `border-radius: 16px`, `box-shadow: rgba(0, 0, 0, 0.08) 0px 1px 2px 0px`.
6.  **Primary button style:** Dark background (`#271a00`), light text (`#fdfbfa`), `8px` radius.
7.  **Input focus state:** Use a composite box-shadow ring, not a default outline.
8.  **Layout:** On desktop, use a fixed left sidebar (`~240px`) and a centered main content area (`max-width: 768px`).
9.  **Shadows:** Only use `rgba(0, 0, 0, 0.08) 0px 1px 2px 0px` on elevated components like modals (`z-index > 30`).
10. **Contrast:** Never put `#27251e` text on a `#271a00` background. Always use light text on dark button backgrounds.
11. **Mobile layout:** Collapse the sidebar and use full-width content containers.