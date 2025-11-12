# 🎨 Technical Art Direction Brief (for AI / Shader Implementation)

## Aesthetic Goal

Simulate the **fluid impermanence of watercolor** — pigment diffusing in water, interacting with paper texture, drying and rehydrating dynamically.

Every ability should appear to *paint* or *wash away* the world rather than overlay graphical effects.

---

## 1. Core Rendering Philosophy

* **Medium Simulation:**
  Render the scene as a living watercolor painting — always slightly wet, colors flowing and merging in real time.

* **Brush-Less Expression:**
  No sharp outlines, particles, or digital glow.
  All motion should arise from **diffusion, absorption, and translucency**.

* **Continuity:**
  Nothing "snaps" on or off — all transitions occur via soft diffusion, wash, or drying.

---

## 2. Shader & Layer Structure

### a. Base Canvas Layer

* Paper texture simulation using subtle fiber noise and surface roughness.
* Controls absorbency (how far pigment diffuses).

### b. Pigment Layer System

* Each ability adds pigment in a specific hue and wetness value.
* Pigments interact via:
  * **Capillary Diffusion:** Soft, radial blending.
  * **Granulation Simulation:** Slight pigment separation at low wetness.
  * **Edge Darkening:** Drier edges retain color (common in real watercolor drying).
* Pigment should *mix additively* when overlapping, not replace previous layers.

### c. Water Simulation Layer

* Simulates active vs dry areas of the paper:
  * High Serenity → "wet" state (smooth, blended visuals).
  * Low Serenity → "dry" state (harder edges, cracks, rough textures).
* Tracks localized wetness per pixel for independent drying.

### d. Evaporation & Rehydration

* Each frame, pixels move toward dryness unless reactivated by new ability layers or rising Serenity.
* Wetness = 0 fades pigment to matte texture; wetness = 1 yields vibrant diffusion.

---

## 3. Global Parameters (Driven by Serenity)

| Serenity % | Visual Behavior                                                       |
| ---------- | --------------------------------------------------------------------- |
| 100–80     | Fully wet: smooth gradients, flowing motion, high translucency        |
| 79–50      | Semi-dry: pigment edges visible, soft blooms, mild granulation        |
| 49–20      | Drying: fragmented textures, muted colors, visible paper grain        |
| ≤19        | Overdry: brittle pigment cracking, dull palette, edge bleed reduction |

Serenity thus acts as the **global moisture controller** — visually encoding calm vs stress through medium behavior.

---

## 4. Temporal Animation Rules

* **Inhale/Exhale Pulse:** Expand/contract pigment radius via sine wave scaling.
* **Cooldown Effects:** Fade pigment saturation during downtime.
* **Ability Activation:** Introduce pigment with higher wetness, then gradually evaporate.
* **Overlap:** Blends pigment colors using watercolor mixing logic (e.g., blue + yellow = green).

---

## 5. Recommended Implementation Approach

* Use **shader graph** or **node-based material** system:
  * One master watercolor shader with parameters:
    * `wetness`
    * `pigment_density`
    * `granulation_intensity`
    * `diffusion_speed`
    * `hue_variance`
  * Each ability modifies these parameters in its active region.

* Render **abilities as localized pigment injections** (masked radial gradients) into a shared "wet canvas buffer."

* Control all drying, diffusion, and blending through time-based simulation.

---

## 6. Color Palette Guidelines

* Use a **limited, semi-transparent watercolor palette**:
  * Serenity High → *Lavender, Pale Blue, Warm Ochre, White Gold*
  * Serenity Medium → *Coral, Slate Blue, Faded Mint*
  * Serenity Low → *Muted Gray, Desaturated Indigo, Deep Violet*

* Avoid pure black or saturated neon — all tones must feel **natural and aqueous**.

See [COLOR_PALETTE.md](./COLOR_PALETTE.md) for detailed color mappings.

---

## 7. Performance Optimization Tips

* Pigment diffusion can be simulated using:
  * Blur-based diffusion maps updated per frame.
  * Cellular wetness buffers updated only in active ability regions.

* Cache paper texture and overlay subtle static noise to maintain tactility.

* Use additive alpha blending with low opacity for natural watercolor layering.

---

## 8. Thematic Summary

> The player does not fire weapons or cast spells — they **paint balance back into being**.
> Every mechanic leaves a mark, and every mark eventually fades.
> The battlefield is not conquered — it is **repainted**, over and over, until calm returns.

---

## Integration with Existing Systems

This project already has a `WatercolorStateController` and `WatercolorPass` system. The art direction should integrate with:

- `src/rendering/watercolor/WatercolorStateController.ts` - Controls global watercolor state
- `src/rendering/watercolor/WatercolorPass.ts` - Post-processing watercolor effects
- `src/rendering/scenes/AbilityEffects.ts` - Individual ability visual effects

The existing system uses parameters like `edgeDarkeningIntensity`, `bleedRadius`, `diffusionRate`, `pigmentSaturation`, and `wetness` which align well with this art direction.

