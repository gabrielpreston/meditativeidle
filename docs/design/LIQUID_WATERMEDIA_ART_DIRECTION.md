# 🎨 Technical Art Direction Brief (for AI / Shader Implementation)

## Aesthetic Goal

Simulate the **fluid dynamics of liquid watermedia** — dye diffusing through liquid medium, interacting through fluid flow, mixing and dispersing dynamically in a continuously liquid, wet-on-wet space.

Every ability should appear to *flow* or *dissolve* through the liquid medium rather than overlay graphical effects. This is not traditional watercolor on paper; it is a continuously liquid, wet-on-wet watermedia space where pigments swirl, bloom, diffuse, and flow like ink suspended in water.

---

## 1. Core Rendering Philosophy

* **Medium Simulation:**
  Render the scene as a living liquid medium — always in motion, colors flowing and merging through fluid dynamics in real time. The medium never dries, never settles — it is perpetually liquid.

* **Flow-Based Expression:**
  No sharp outlines, particles, or digital glow.
  All motion should arise from **fluid flow, diffusion, and liquid mixing** — wet-on-wet flow, blooming, dispersion, suminagashi-style ripples, and marbled pigment currents.

* **Continuity:**
  Nothing "snaps" on or off — all transitions occur via soft diffusion, current mixing, or gradual dispersion. Effects behave like marbling, suminagashi ripples, and turbulent-to-laminar transitions in colored liquid light.

---

## 2. Shader & Layer Structure

### a. Base Fluid Medium

* Liquid medium simulation using fluid dynamics and flow patterns.
* Controls viscosity and flow characteristics (how far dye diffuses through the liquid).
* Simulates laminar flow (smooth, meditative, calm gradients) and turbulent flow (swirling, chaotic, energetic distortions) based on emotional state.

### b. Dye Layer System

* Each ability adds dye in a specific hue and concentration value.
* Dyes interact via:
  * **Wet-on-Wet Flow:** Color applied to an already wet environment spreads, blooms, and blends continuously.
  * **Blooming/Blossoming:** When a drop of wetter pigment pushes outward into existing pigment, creating expanding organic shapes.
  * **Dispersion:** Pigment drifting through water via natural movement.
  * **Fluid Diffusion:** Soft, radial dispersion through liquid medium.
  * **Turbulence Patterns:** Complex flow separation creating swirling patterns (ebru/marbling techniques).
  * **Concentration Gradients:** Higher concentrations at flow boundaries (common in liquid mixing).
* Dye should *mix additively* when overlapping through fluid blending, not replace previous layers.

### c. Flow State Layer

* Simulates active vs stagnant areas of the liquid:
  * High Serenity → "laminar flow" state (smooth, blended visuals, high diffusion, suminagashi-style ripples).
  * Low Serenity → "turbulent/stagnant" state (harder boundaries, reduced mixing, visible separation, chaotic swirls).
* Tracks localized flow velocity per pixel for independent fluid behavior.

### d. Dispersion & Mixing

* Each frame, dye concentrations disperse through diffusion unless reactivated by new ability layers or rising Serenity.
* Flow velocity = 0 creates stagnant zones with reduced mixing; flow velocity = 1 yields vibrant diffusion and blending.
* Uses volumetric liquid light techniques — colored luminosity behaving like fluid.

---

## 3. Global Parameters (Driven by Serenity)

| Serenity % | Visual Behavior                                                       |
| ---------- | --------------------------------------------------------------------- |
| 100–80     | Fully flowing (laminar): smooth gradients, active currents, high diffusion, suminagashi-style ripples |
| 79–50      | Moderate flow: dye boundaries visible, soft blooms, mild turbulence   |
| 49–20      | Turbulent/stagnant: fragmented flow patterns, muted colors, visible separation, chaotic swirls |
| ≤19        | Nearly still: reduced mixing, dull palette, minimal diffusion, stagnant zones |

Serenity thus acts as the **global flow controller** — visually encoding calm vs stress through liquid medium behavior, transitioning between laminar and turbulent flow states.

---

## 4. Temporal Animation Rules

* **Inhale/Exhale Pulse:** Expand/contract dye radius via sine wave scaling, like breathing currents — suminagashi-style concentric ripples.
* **Cooldown Effects:** Fade dye concentration during downtime through gradual dispersion — dynamic pigment clouds dispersing like smoke underwater.
* **Ability Activation:** Introduce dye with higher concentration, then gradually disperse through fluid mixing — blooming dye dispersions.
* **Overlap:** Blends dye colors using liquid mixing logic (e.g., blue + yellow = green through fluid blending) — marbled pigment currents.

---

## 5. Recommended Implementation Approach

* Use **shader graph** or **node-based material** system:
  * One master liquid watermedia shader with parameters:
    * `flow_velocity` (laminar vs turbulent)
    * `dye_concentration`
    * `turbulence_intensity`
    * `diffusion_speed`
    * `hue_variance`
    * `bloom_intensity` (wet-on-wet expansion)
    * `dispersion_rate` (pigment drift)
  * Each ability modifies these parameters in its active region.

* Render **abilities as localized dye injections** (masked radial gradients) into a shared "fluid medium buffer" using fluid sim shaders / flow maps.

* Control all dispersion, diffusion, and blending through time-based fluid simulation — color advection and dispersive flow.

---

## 6. Color Palette Guidelines

* Use a **limited, semi-transparent liquid dye palette**:
  * Serenity High → *Lavender, Pale Blue, Warm Ochre, White Gold* (laminar flow, smooth gradients)
  * Serenity Medium → *Coral, Slate Blue, Faded Mint* (moderate flow, visible blooms)
  * Serenity Low → *Muted Gray, Desaturated Indigo, Deep Violet* (turbulent flow, chaotic patterns)

* Avoid pure black or saturated neon — all tones must feel **natural and fluid**, like dyes suspended in liquid, never dried pigments on paper.

See [COLOR_PALETTE.md](./COLOR_PALETTE.md) for detailed color mappings.

---

## 7. Performance Optimization Tips

* Dye diffusion can be simulated using:
  * Blur-based diffusion maps updated per frame (wet-on-wet flow simulation).
  * Cellular flow velocity buffers updated only in active ability regions.
  * Flow maps for directional movement within surfaces (color advection).

* Cache fluid flow patterns and overlay subtle dynamic noise to maintain liquid motion — volumetric liquid light effects.

* Use additive alpha blending with low opacity for natural liquid dye layering — dynamic pigment clouds.

---

## 8. Thematic Summary

> The player does not fire weapons or cast spells — they **flow balance back into being**.
> Every mechanic creates currents, and every current eventually disperses.
> The battlefield is not conquered — it is **rebalanced through fluid dynamics**, over and over, until calm returns.
> The visual language is not traditional watercolor on paper; instead, it is a continuously liquid, wet-on-wet watermedia space where pigments swirl, bloom, diffuse, and flow like ink suspended in water.

---

## Integration with Existing Systems

This project uses a fluid simulation system for liquid watermedia effects. The art direction integrates with:

- `src/rendering/watercolor/LiquidWatermediaStateController.ts` - Controls global liquid watermedia state and fluid parameters
- `src/rendering/watercolor/FluidSim.ts` - WebGL fluid simulation (velocity, pressure, dye fields)
- `src/rendering/watercolor/FluidCompositePass.ts` - Post-processing pass that composites fluid dye over scene
- `src/rendering/scenes/AbilityEffects.ts` - Individual ability visual effects (dye injection)

The system uses fluid parameters like `viscosity`, `dyeDissipation`, `velocityDissipation`, `curl`, `pressureIters`, and `refractionScale` which are derived from the `flow_velocity` parameter based on serenity ratio, controlling how dye flows and mixes through the liquid medium via wet-on-wet diffusion, blooming, and dispersive flow.
