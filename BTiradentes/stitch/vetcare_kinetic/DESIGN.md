# Design System Strategy: The Radiant Clinician

## 1. Overview & Creative North Star
**The Creative North Star: "Optimistic Precision"**

This design system moves beyond the sterile, cold aesthetics of traditional medical software. For Dra. Brenda Tiradentes, we are building a "Digital Sanctuary"—an environment that feels as warm as a sunlit rehabilitation room but as precise as a surgical suite. 

We reject the "Bootstrap-grid" look. Instead of rigid columns and boxy borders, we embrace **Organic Editorialism**. This means using high-contrast typography scales (the "Editorial" feel) paired with soft, hyper-rounded geometries (the "Organic" feel). We use intentional asymmetry—such as overlapping a pet's high-quality portrait over a `surface-container` edge—to break the "template" feel and create a signature, premium experience.

---

## 2. Colors & Surface Architecture
The palette is anchored by "Banana Yellow," but used with surgical restraint to ensure it remains a sophisticated accent rather than an overwhelming flood.

*   **Primary (`#6d5e00` / `#ffe135`):** Reserved for high-intent actions and brand moments.
*   **Neutral Foundation:** We use `surface` (`#fbf9f8`) as our canvas—a "Soft White" that reduces eye strain compared to pure hex white.
*   **Typography:** We use `on-surface` (`#1b1c1c`) for maximum legibility, providing the "Charcoal Gray" authority required for clinical notes.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** 
Separation must be achieved through:
1.  **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
2.  **Negative Space:** Utilizing the `spacing-8` or `spacing-12` tokens to let the layout breathe.

### The Glass & Gradient Rule
To elevate the clinical feel into a "High-End" tier, use **Glassmorphism** for floating headers or navigation overlays. Use `surface-container-lowest` with a 70% opacity and a `20px` backdrop blur. This allows the warm Banana Yellow or soft neutrals to "glow" through the interface, creating a sense of layered depth.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface system to balance clinical authority with approachable warmth.

*   **Display & Headlines (Plus Jakarta Sans):** A modern geometric sans with an open aperture. Use `display-lg` for welcome screens and `headline-sm` for patient names. The generous x-height ensures legibility even when Dra. Tiradentes is moving quickly between treatment rooms.
*   **Body & Labels (Manrope):** A high-performance functional face. `body-lg` is the workhorse for rehabilitation notes. Its slightly condensed nature allows for dense clinical data to remain readable without feeling cramped.

**Hierarchy Note:** Always pair a `headline-lg` with a `body-md` in `on-surface-variant` to create a clear "Title/Caption" relationship that mimics high-end medical journals.

---

## 4. Elevation & Depth: Tonal Layering
We do not "drop shadows"; we "layer light."

*   **The Layering Principle:** 
    *   **Level 0 (Base):** `surface`
    *   **Level 1 (Sections):** `surface-container-low`
    *   **Level 2 (Active Cards):** `surface-container-lowest` (pure white)
    *   **Level 3 (Modals/Popovers):** `surface-container-highest` with an **Ambient Shadow**.
*   **Ambient Shadows:** If a floating element is required, use a blur of `40px` with a `4%` opacity of `on-surface`. It should feel like a soft glow, not a hard shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-glare clinical environments), use `outline-variant` at `15%` opacity. Never 100%.

---

## 5. Components & Signature Patterns

### Buttons (The "Pill" Interaction)
*   **Primary:** `primary-container` background with `on-primary-container` text. Shape: `full` (9999px). 
*   **Interaction:** On hover, apply a subtle gradient shift from `primary-container` to `primary-fixed-dim`.
*   **Tertiary:** No background, `primary` text. Use for low-emphasis actions like "Cancel" or "View Archive."

### Input Fields (The "Soft Well")
Forgo the standard bottom-line-only input. Use a `surface-container-high` background with a `sm` (0.5rem) corner radius. When focused, the background shifts to `surface-container-lowest` with a `primary` "Ghost Border" at 20% opacity.

### Cards & Patient Records
*   **Constraint:** Forbid divider lines. 
*   **Design:** Use a `surface-container-low` card. Separate the "Patient History" from "Treatment Plan" by shifting the Treatment Plan into a nested `surface-container-lowest` sub-card. Use `xl` (3rem) rounding for the outer card and `md` (1.5rem) for the inner card to create a "nested hug" visual.

### Signature Component: The "Recovery Tracker"
A custom linear progress component using a `secondary-container` track and a `primary` (Banana Yellow) fill. The indicator should be a `full` rounded pill to mirror the softness of the brand.

---

## 6. Do’s and Don'ts

### Do:
*   **Use Asymmetry:** Place patient photos partially overlapping the edge of a card to create a custom, high-end feel.
*   **Embrace White Space:** If a screen feels "empty," it is likely working. Clinical environments are chaotic; the software should be a calm void.
*   **Use Pet Iconography:** Use thick-stroke (2px) icons with rounded terminals to match the `DEFAULT` (1rem) corner radius of the UI.

### Don't:
*   **Don't use "Pure Black":** Always use `on-surface` (`#1b1c1c`) for text. Pure black is too harsh for the "Optimistic" brand.
*   **Don't use 1px Dividers:** They clutter the clinical view. Use a `1.4rem` (`spacing-4`) vertical gap instead.
*   **Don't use sharp corners:** Even for small tags or chips, the minimum rounding should be `sm` (0.5rem).