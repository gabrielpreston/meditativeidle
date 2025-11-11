# Meditative Idle Defense — POC Specification

Meditative Idle Defense is a web-first, continuously flowing idle defense experience that explores the balance between calm and chaos — the player’s psyche represented as a luminous center of awareness resisting encroaching stressors. The proof of concept is designed to last approximately fifteen to twenty minutes at normal speed, with scaling that guarantees eventual overwhelm by wave fifteen, while remaining theoretically infinite in potential duration.

---

## Core Design Philosophy

The experience should feel serene yet inevitable. The player never wins — they sustain. Serenity is both the resource and the theme, representing the capacity for balance under continuous internal and external strain. As waves intensify, the visual and sonic environment shifts from luminous calm to encroaching entropy. Growth brings comfort, not victory.

The flow is uninterrupted; there are no interludes or pauses between waves. Each transition happens organically through continuous time and evolving light and sound.

---

## Core Loop

Each session unfolds as a seamless sequence of one-minute waves. Stressors appear from random points along the perimeter of the playfield and drift toward the player’s center — the luminous core representing the mind at rest. The player responds using three active abilities, drawing on limited Focus to restore or redirect energy.  

As stressors are resolved, they release Insight — the temporary currency of growth for that session. Insight can be spent to strengthen abilities, but never enough to overcome the exponential intensification of future waves.

When Serenity reaches zero, the session concludes in a reflective fade, and all Insight is released.

---

## Primary Systems

**Serenity** represents emotional equilibrium. It decreases as stressors make contact with the center and slowly stabilizes through player actions.  
**Focus** is the player’s energy reserve, regenerating steadily and spent to activate abilities.  
**Insight** is gained from resolving stressors and can be spent on upgrades within the same session. It resets at the end of each run.  
**Pace** controls overall simulation speed. Players may slow or accelerate time for accessibility without altering balance or rewards.  
**Aura** is a passive calming field around the center, slightly slowing stressors that enter its range.

---

## Abilities

**Breathe** allows the player to create a slowing pulse from the center by holding and releasing rhythmically. Precise timing yields stronger calming effects and expands the Aura temporarily.  

**Recenter** emits a stabilizing wave that pushes stressors outward. Its reach and strength increase with upgrades, providing short bursts of relief in intense moments.  

**Affirm** transforms a limited number of incoming stressors into temporary clarity, converting them into Insight and occasionally restoring a small amount of Serenity.  

Each ability improves incrementally through upgrades. Their combined scaling allows perceptible progress but cannot surpass the accelerating difficulty curve.

---

## Insight and Upgrades

Every stressor resolved grants a small amount of Insight. The amount grows gently with each wave, reflecting gradual understanding gained through persistence.  

Upgrades are available through a radial wheel that appears around the center when sufficient Insight is earned. Each of the three abilities has its own path of progression emphasizing a distinct theme:  
- *Breathe* emphasizes rhythm and calm precision.  
- *Recenter* emphasizes reach and stability.  
- *Affirm* emphasizes compassion and transformation.  

Upgrades are priced to create a steady sense of improvement. Early tiers are accessible, while later ones become increasingly costly, ensuring that growth feels meaningful but never dominant.

---

## Wave and Scaling Design

Each wave lasts sixty seconds in real time. There is no downtime between them; if all stressors are cleared before the timer ends, the next wave begins immediately.  

Stressor count and resilience both increase with each wave. The system’s internal scaling guarantees that by wave fifteen, stressors will outpace the player’s growth and the session will end naturally in defeat. Beyond that, the same scaling model can continue indefinitely for stress testing or endless mode play.  

Difficulty progression is smooth and continuous, with early waves serving as orientation and later waves introducing new stressor archetypes. Unresolved stressors persist across waves, compounding tension and maintaining continuity.

---

## Stressor Types

Stressors are visual and behavioral manifestations of internal and external pressures. They are simple luminous shapes whose movement and color patterns express their emotional character.

- **Intrusive Thought:** Moves directly inward at a steady rate.  
- **Time Pressure:** Appears in short bursts and moves quickly in clusters.  
- **Environmental Noise:** Oscillates in a sine-like wobble pattern, introducing unpredictability.  
- **Expectation:** Orbits before dashing inward in sudden bursts.  
- **Fatigue:** Moves slowly but resists calming effects, ignoring part of the Aura.  
- **Impulse:** Accelerates as Serenity falls, representing spiraling loss of control.

### Stressor Introduction and Composition
Waves begin simply and layer complexity over time:
- Waves 1–3: Intrusive Thoughts only.  
- Waves 4–5: Introduce Time Pressure.  
- Waves 6–8: Add Environmental Noise.  
- Waves 9–10: Add Expectation.  
- Waves 11–13: Add Fatigue.  
- Waves 14–15: Add Impulse, ensuring overwhelm.  
- Beyond 15: All types spawn in balanced proportions for endless scaling.

Spawn points are randomly distributed along the perimeter of the playfield. The number of active stressors and their health both increase each wave according to an exponential growth curve calibrated to exceed player effectiveness by the fifteenth wave.

---

## Flow and Transitions

Wave transitions occur automatically. When all active stressors are resolved, the next begins without delay.  
If resolution and timer completion occur simultaneously, the system treats the wave as cleared and transitions once.  
Serenity, Focus, and Insight persist continuously; nothing resets mid-session.  
Transitions are accompanied by soft visual and auditory crossfades lasting about one second, maintaining immersion without interruption.

---

## Session End and Reflection

When Serenity reaches zero, all motion slows, and stressors dissolve outward.  
The color palette desaturates toward white, and audio resolves into consonant tones.  
A reflection screen fades in, showing duration, wave reached, and total Insight earned.  
The session ends quietly with the message:  
> “You drifted, but you return wiser.”  

Players may restart by pressing **Space** or clicking anywhere on the screen. If idle, the reflection view remains in soft animation indefinitely.

---

## Visual and Audio Aesthetic

The game embodies the calm luminosity of *GRIS* — light, color, and sound expressing emotional balance.  

When Serenity is high, the palette is bright and soft: ivory, pale blue, and gentle golds.  
As Serenity falls, tones shift toward deep indigo, muted blues, and rust. The background darkens and edges pulse faintly.  

Light emanates from the center, its intensity following Serenity’s state. Parallax and bloom effects reinforce calm expansion or tense contraction.  
Motion becomes more erratic as equilibrium degrades.  

Audio mirrors this balance. High Serenity produces spacious ambient harmonics; low Serenity introduces subtle dissonance and filtered lows. Each ability triggers small consonant flourishes that blend with the current harmonic state rather than standing apart from it.

All visuals and sound are generated procedurally. Watercolor-like softness is achieved through layered blur, noise, and additive bloom rather than fixed textures. The experience should remain smooth and consistent across systems.

---

## User Interface and Interaction

The interface follows the principle of *stillness at the center, awareness at the edges.*  
UI elements are minimal and integrated into the world rather than existing as panels.

- **Serenity Ring:** A glowing arc in the upper-right that dims as Serenity falls.  
- **Focus Meter:** A semicircular line in the lower-left that pulses rhythmically as Focus regenerates.  
- **Insight Symbol:** A crystalline shape in the lower-right that flares when Insight is gained.  
- **Wave Indicator:** Simple text in the upper-left fading in and out at the start of each wave.  
- **Ability Wheel:** Appears only when upgrades are available or the player opens it. Fades away automatically after a few seconds of inactivity.

All interface elements respond dynamically to Serenity, desaturating during strain and glowing warmly during balance.  
Reduced-motion and high-contrast options are available for accessibility, and the core indicators are labeled for screen readers.

---

## Performance and Safeguards

The system targets a smooth 60 frames per second, with adaptive fallback: if performance dips below 55 for more than a few seconds, the simulation temporarily reduces active stressors and particle effects.  
Telemetry logs key session data — Serenity, Focus, Insight, wave, and pace — once per second to the browser console and offers a downloadable log after reflection.  
The random seed defaults to the current session timestamp to maintain variety but can be overridden for deterministic testing.

If any parameter or scaling constant is missing or fails to ensure defeat by wave fifteen, the AI halts execution and requests human review before proceeding.

---

## Accessibility and Input

Mouse and keyboard are primary. Touch devices use long-press for Breathe and onscreen tap zones for other abilities.  
When the upgrade wheel is open, ability keys are temporarily disabled to prevent conflict.  
Reduced-motion mode replaces pulsing animations with opacity fades, and all key UI elements carry ARIA labels for screen readers.

---

## Testing and Validation

The AI implementation includes an internal test harness that simulates twenty accelerated waves to confirm that under normal scaling, the player’s Serenity always collapses by wave fifteen within an acceptable margin of variation.  

A run is considered valid if:  
- Total duration at default pace is between fifteen and twenty minutes.  
- Average frame rate is above fifty-eight frames per second.  
- No interludes or pauses occur between waves.  

---

**Meditative Idle Defense** is therefore defined as a continuous meditation on endurance, balance, and inevitable entropy — luminous calm yielding to encroaching noise. The specification above represents the complete and unified blueprint for autonomous AI execution of the proof of concept.