# KTMY v3.0 — Premium UI Overhaul & Micro-interactions

**Release date:** 2026-06-29

---

## What's New in v3.0

### 1. Brand Splash Loader
- Added a full-screen, premium splash loader with an outline-drawn SVG vector key representing the platform logo.
- The path draws progressively and fades out smoothly using standard cubic-bezier timing once the core modules and translation resources are fully prepared.

### 2. Active Tab Sliding Indicators
- **Desktop Sidebar**: Designed a custom background pill that slides behind active links. Hovering or switching tabs translates the indicator offset vertically using fluid spring easing.
- **Mobile Bottom Nav**: Designed an active indicator line that slides horizontally between buttons to guide navigation.

### 3. Glass Card Glare Reflection
- Equipped cards with a dynamic reflection layer (`.card-glare`).
- On desktop, cursor movement projects a realistic, shifting radial spotlight reflection.
- On mobile touch screens, cursor glare is bypassed to prevent scrolling conflicts, replacing it with a subtle spring-scale touch feedback.

### 4. Desktop Magnetic Interactions
- Enabled magnetic attractions on core interactive elements (refresh button, language switches, primary buttons) drawing them slightly toward the cursor.

### 5. Staggered Entrance & Counter Animations
- Implemented card slide-and-fade entrance cascades.
- Designed a custom numeric Mutation Observer that automatically counts all integers and decimals up from zero to their target values when cards enter the viewport or data refreshes.

### 6. Premium Chart.js Glow-up
- Wrote a custom global plugin (`lineShadowPlugin`) that projects a glowing colored drop shadow beneath line datasets.
- Configured vertical linear gradients fading from solid to transparent for area fills.
- Configured blended color-shifting gradients (primary to blue accent) for individual bars in bar charts.

---

## Bug Fixes & Interactivity Enhancements

### 1. Fixed Chart Hover Interactions & Tooltips
- **Root Cause 1**: The `afterDatasetDraw` hook destructured `ctx` from `args` (where it was undefined) instead of `chart.ctx`, throwing a TypeError and halting Chart.js event loops.
- **Root Cause 2**: Asymmetrical state saving (calling `ctx.save()` conditionally, but `ctx.restore()` unconditionally) caused canvas state stack unbalancing, resetting the transform matrix.
- **Root Cause 3 (3D Tilt Conflict)**: Applying a 3D perspective rotation and translation on hover to cards warped the screen boundaries of the canvas. Chart.js's coordinate mapping returned skewed coordinates, disabling hovered data point circles and tooltips.
- **Fixes**:
  - Corrected parameter destructuring in the shadow plugin hooks.
  - Replaced canvas state saving with direct canvas property resets (e.g., setting `shadowColor = 'transparent'`), eliminating stack mismatch risks.
  - Added `try/catch` safety blocks to ensure zero runtime crashes under edge conditions (like hidden tabs with zero-length gradients).
  - Bypassed 3D transform rotation on cards containing charts, while retaining flat glare reflection and highlight glows.

### 2. Resolved Duplicate Refresh Icons
- **Root Cause**: The English/Malay translation strings for `'topbar.refresh'` contained pre-pended `⟳` characters, which collided with our HTML-added `.refresh-icon` span.
- **Fix**: Removed the `⟳` prefix from the i18n dictionary entries (leaving only the text), leaving our standalone, animated span as the single, rotating icon.

---

## Developer Guide for v3.0

### Glare Reflection Setup
To add a glare reflection to any new card, ensure it has the `.glass-card` class. The script in `js/animations.js` will automatically append `<div class="card-glare">` and track cursor movement. 

### Chart Cards Guard
If you are adding a new card containing a chart, the system automatically checks for a `canvas` or `.chart-container` element. It will keep the card flat (to keep tooltips working) but still animate the glare and highlights on hover.
