# 🎨 Technical Art Direction Brief (for AI / Shader Implementation)

## Aesthetic Goal

Simulate the **fluid dynamics of liquid watercolor** — dye diffusing through liquid medium, interacting through fluid flow, mixing and dispersing dynamically.

Every ability should appear to *flow* or *dissolve* through the liquid medium rather than overlay graphical effects.

---

## 1. Core Rendering Philosophy

* **Medium Simulation:**
  Render the scene as a living liquid medium — always in motion, colors flowing and merging through fluid dynamics in real time.

* **Flow-Based Expression:**
  No sharp outlines, particles, or digital glow.
  All motion should arise from **fluid flow, diffusion, and liquid mixing**.

* **Continuity:**
  Nothing "snaps" on or off — all transitions occur via soft diffusion, current mixing, or gradual dispersion.

---

## 2. Shader & Layer Structure

### a. Base Fluid Medium

* Liquid medium simulation using fluid dynamics and flow patterns.
* Controls viscosity and flow characteristics (how far dye diffuses through the liquid).

### b. Dye Layer System

* Each ability adds dye in a specific hue and concentration value.
* Dyes interact via:
  * **Fluid Diffusion:** Soft, radial dispersion through liquid medium.
  * **Turbulence Patterns:** Complex flow separation creating swirling patterns.
  * **Concentration Gradients:** Higher concentrations at flow boundaries (common in liquid mixing).
* Dye should *mix additively* when overlapping through fluid blending, not replace previous layers.

### c. Flow State Layer

* Simulates active vs stagnant areas of the liquid:
  * High Serenity → "flowing" state (smooth, blended visuals, high diffusion).
  * Low Serenity → "stagnant" state (harder boundaries, reduced mixing, visible separation).
* Tracks localized flow velocity per pixel for independent fluid behavior.

### d. Dispersion & Mixing

* Each frame, dye concentrations disperse through diffusion unless reactivated by new ability layers or rising Serenity.
* Flow velocity = 0 creates stagnant zones with reduced mixing; flow velocity = 1 yields vibrant diffusion and blending.

---

## 3. Global Parameters (Driven by Serenity)

| Serenity % | Visual Behavior                                                       |
| ---------- | --------------------------------------------------------------------- |
| 100–80     | Fully flowing: smooth gradients, active currents, high diffusion     |
| 79–50      | Moderate flow: dye boundaries visible, soft blooms, mild turbulence   |
| 49–20      | Stagnant: fragmented flow patterns, muted colors, visible separation |
| ≤19        | Nearly still: reduced mixing, dull palette, minimal diffusion          |

Serenity thus acts as the **global flow controller** — visually encoding calm vs stress through liquid medium behavior.

---

## 4. Temporal Animation Rules

* **Inhale/Exhale Pulse:** Expand/contract dye radius via sine wave scaling, like breathing currents.
* **Cooldown Effects:** Fade dye concentration during downtime through gradual dispersion.
* **Ability Activation:** Introduce dye with higher concentration, then gradually disperse through fluid mixing.
* **Overlap:** Blends dye colors using liquid mixing logic (e.g., blue + yellow = green through fluid blending).

---

## 5. Recommended Implementation Approach

* Use **shader graph** or **node-based material** system:
  * One master liquid watercolor shader with parameters:
    * `flow_velocity`
    * `dye_concentration`
    * `turbulence_intensity`
    * `diffusion_speed`
    * `hue_variance`
  * Each ability modifies these parameters in its active region.

* Render **abilities as localized dye injections** (masked radial gradients) into a shared "fluid medium buffer."

* Control all dispersion, diffusion, and blending through time-based fluid simulation.

---

## 6. Color Palette Guidelines

* Use a **limited, semi-transparent liquid dye palette**:
  * Serenity High → *Lavender, Pale Blue, Warm Ochre, White Gold*
  * Serenity Medium → *Coral, Slate Blue, Faded Mint*
  * Serenity Low → *Muted Gray, Desaturated Indigo, Deep Violet*

* Avoid pure black or saturated neon — all tones must feel **natural and fluid**, like dyes suspended in liquid.

See [COLOR_PALETTE.md](./COLOR_PALETTE.md) for detailed color mappings.

---

## 7. Performance Optimization Tips

* Dye diffusion can be simulated using:
  * Blur-based diffusion maps updated per frame.
  * Cellular flow velocity buffers updated only in active ability regions.

* Cache fluid flow patterns and overlay subtle dynamic noise to maintain liquid motion.

* Use additive alpha blending with low opacity for natural liquid dye layering.

---

## 8. Thematic Summary

> The player does not fire weapons or cast spells — they **flow balance back into being**.
> Every mechanic creates currents, and every current eventually disperses.
> The battlefield is not conquered — it is **rebalanced through fluid dynamics**, over and over, until calm returns.

---

## Integration with Existing Systems

This project uses a fluid simulation system for liquid watercolor effects. The art direction integrates with:

- `src/rendering/watercolor/WatercolorStateController.ts` - Controls global watercolor state and fluid parameters
- `src/rendering/watercolor/FluidSim.ts` - WebGL fluid simulation (velocity, pressure, dye fields)
- `src/rendering/watercolor/FluidCompositePass.ts` - Post-processing pass that composites fluid dye over scene
- `src/rendering/scenes/AbilityEffects.ts` - Individual ability visual effects (dye injection)

The system uses fluid parameters like `viscosity`, `dyeDissipation`, `velocityDissipation`, `curl`, `pressureIters`, and `refractionScale` which are derived from the `flow_velocity` parameter based on serenity ratio, controlling how dye flows and mixes through the liquid medium.

