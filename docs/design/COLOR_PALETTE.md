# 🎨 Color Palette Reference

## Serenity-Based Color Mappings

The color palette shifts dynamically based on Serenity level, creating visual feedback for the player's emotional state. Colors behave as dyes suspended in liquid, mixing and flowing through the fluid medium through wet-on-wet diffusion and continuous pigment drift.

### High Serenity (100-80%)

**Primary Colors:**
- **Lavender:** `#E6E6FA` - Soft, calming presence
- **Pale Blue:** `#B0E0E6` - Sky-like tranquility
- **Warm Ochre:** `#CC7722` - Earthy stability
- **White Gold:** `#F5DEB3` - Gentle illumination

**Usage:**
- Breathe flow: Lavender/Pale Blue blend flowing through liquid
- Background currents: Warm Ochre with White Gold highlights diffusing through medium
- Ability effects: High translucency, soft flow boundaries

### Medium Serenity (79-50%)

**Primary Colors:**
- **Coral:** `#FF7F50` - Warmth with slight tension
- **Slate Blue:** `#6A5ACD` - Deeper, more focused
- **Faded Mint:** `#98FB98` - Cool refreshment

**Usage:**
- Breathe flow: Slate Blue with Coral accents mixing through liquid
- Background currents: Faded Mint base with Slate Blue gradients flowing
- Ability effects: Moderate translucency, visible flow boundaries

### Low Serenity (49-20%)

**Primary Colors:**
- **Muted Gray:** `#808080` - Desaturated, drained
- **Desaturated Indigo:** `#4B0082` - Deep, shadowed
- **Deep Violet:** `#8B008B` - Intense, concentrated

**Usage:**
- Breathe flow: Muted Gray with Deep Violet undertones in stagnant liquid
- Background currents: Desaturated Indigo base with reduced mixing
- Ability effects: Lower translucency, harder flow boundaries, visible separation

### Critical Serenity (≤19%)

**Primary Colors:**
- **Brittle Gray:** `#696969` - Cracked, dry
- **Dull Indigo:** `#2F4F4F` - Overworked, muddy
- **Faded Violet:** `#9370DB` - Washed out, exhausted

**Usage:**
- Breathe flow: Brittle Gray with visible separation in nearly still liquid
- Background currents: Dull Indigo with minimal flow, stagnant zones visible
- Ability effects: Minimal translucency, hard boundaries, prominent separation

---

## Ability-Specific Color Mappings

### Breathe
- **High Serenity:** Lavender (`#E6E6FA`) → Pale Blue (`#B0E0E6`)
- **Medium Serenity:** Slate Blue (`#6A5ACD`) → Coral (`#FF7F50`)
- **Low Serenity:** Muted Gray (`#808080`) → Deep Violet (`#8B008B`)

### Recenter
- **Base:** Translucent blue-green (`#7FFFD4`) flowing through liquid
- **Under Affirm:** Golden current (`#FFD700`) mixing with surrounding dye

### Affirm
- **Active:** Golden current (`#FFD700`) with warm undertones flowing through medium
- **Fading:** Warm Ochre (`#CC7722`) → White Gold (`#F5DEB3`) dispersing through liquid

### Exhale
- **Rings:** Pale Blue (`#B0E0E6`) → Lavender (`#E6E6FA`) → Faded Mint (`#98FB98`) propagating as waves
- **Fading:** Desaturates to Muted Gray (`#808080`) as dye disperses through liquid

### Reflect
- **Barrier:** Clear liquid layer (near-transparent with slight blue tint `#E0F7FA`)
- **Impact:** Absorbs stressor dye colors through fluid exchange, shifts toward Deep Violet (`#8B008B`)

### Mantra
- **Stream:** Focused indigo (`#4B0082`) → Deep Violet (`#8B008B`) flowing as concentrated current
- **Under Affirm:** Gilded indigo (`#9370DB` with `#FFD700` mixing) carrying luminous particles

### Ground
- **Cloud:** Earthy brown-green (`#8B7355`) → Warm Ochre (`#CC7722`) expanding as dye cloud
- **Fading:** Disperses to Muted Gray (`#808080`) through gradual diffusion

### Release
- **Turbulent Mixing:** Full spectrum blend → Muted Gray (`#808080`) through turbulent flow
- **Recovery:** Pastel tones reemerge (Lavender, Pale Blue, Warm Ochre) diffusing through calm liquid

### Align
- **Offense Phase:** Warm tones (Coral `#FF7F50`, Warm Ochre `#CC7722`)
- **Defense Phase:** Cool tones (Slate Blue `#6A5ACD`, Pale Blue `#B0E0E6`)

---

## Color Mixing Rules

Liquid dye mixing follows fluid blending principles through wet-on-wet flow:

- **Blue + Yellow = Green** (used in Ground effects through liquid mixing)
- **Red + Blue = Purple** (used in Reflect/Mantra through current blending)
- **Warm + Cool = Neutral Gray** (used in Release turbulent mixing)

When abilities overlap, colors should blend through fluid mixing with transparency, creating new intermediate hues as currents carry dyes together through marbling and dispersion rather than replacing previous layers.

---

## Implementation Notes

Colors are provided as hex values for easy conversion to RGB/HSL. The rendering system should:

1. Interpolate between serenity ranges smoothly
2. Apply transparency based on flow velocity and dye concentration
3. Blend overlapping ability colors using liquid mixing logic (fluid blending)
4. Desaturate colors as Serenity decreases (stagnant liquid)
5. Increase contrast and boundary definition as Serenity decreases (reduced mixing)

See [LIQUID_WATERMEDIA_ART_DIRECTION.md](./LIQUID_WATERMEDIA_ART_DIRECTION.md) for technical implementation details.

