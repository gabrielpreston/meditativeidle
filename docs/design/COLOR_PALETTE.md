# 🎨 Color Palette Reference

## Serenity-Based Color Mappings

The color palette shifts dynamically based on Serenity level, creating visual feedback for the player's emotional state.

### High Serenity (100-80%)

**Primary Colors:**
- **Lavender:** `#E6E6FA` - Soft, calming presence
- **Pale Blue:** `#B0E0E6` - Sky-like tranquility
- **Warm Ochre:** `#CC7722` - Earthy stability
- **White Gold:** `#F5DEB3` - Gentle illumination

**Usage:**
- Breathe aura: Lavender/Pale Blue blend
- Background washes: Warm Ochre with White Gold highlights
- Ability effects: High translucency, soft edges

### Medium Serenity (79-50%)

**Primary Colors:**
- **Coral:** `#FF7F50` - Warmth with slight tension
- **Slate Blue:** `#6A5ACD` - Deeper, more focused
- **Faded Mint:** `#98FB98` - Cool refreshment

**Usage:**
- Breathe aura: Slate Blue with Coral accents
- Background washes: Faded Mint base with Slate Blue gradients
- Ability effects: Moderate translucency, visible edges

### Low Serenity (49-20%)

**Primary Colors:**
- **Muted Gray:** `#808080` - Desaturated, drained
- **Desaturated Indigo:** `#4B0082` - Deep, shadowed
- **Deep Violet:** `#8B008B` - Intense, concentrated

**Usage:**
- Breathe aura: Muted Gray with Deep Violet undertones
- Background washes: Desaturated Indigo base
- Ability effects: Lower translucency, harder edges, visible granulation

### Critical Serenity (≤19%)

**Primary Colors:**
- **Brittle Gray:** `#696969` - Cracked, dry
- **Dull Indigo:** `#2F4F4F` - Overworked, muddy
- **Faded Violet:** `#9370DB` - Washed out, exhausted

**Usage:**
- Breathe aura: Brittle Gray with visible cracks
- Background washes: Dull Indigo with paper grain visible
- Ability effects: Minimal translucency, hard edges, granulation prominent

---

## Ability-Specific Color Mappings

### Breathe
- **High Serenity:** Lavender (`#E6E6FA`) → Pale Blue (`#B0E0E6`)
- **Medium Serenity:** Slate Blue (`#6A5ACD`) → Coral (`#FF7F50`)
- **Low Serenity:** Muted Gray (`#808080`) → Deep Violet (`#8B008B`)

### Recenter
- **Base:** Translucent blue-green (`#7FFFD4`)
- **Under Affirm:** Golden wash (`#FFD700`)

### Affirm
- **Active:** Golden glaze (`#FFD700`) with warm undertones
- **Fading:** Warm Ochre (`#CC7722`) → White Gold (`#F5DEB3`)

### Exhale
- **Rings:** Pale Blue (`#B0E0E6`) → Lavender (`#E6E6FA`) → Faded Mint (`#98FB98`)
- **Fading:** Desaturates to Muted Gray (`#808080`)

### Reflect
- **Barrier:** Clean water effect (near-transparent with slight blue tint `#E0F7FA`)
- **Impact:** Absorbs stressor colors, shifts toward Deep Violet (`#8B008B`)

### Mantra
- **Beam:** Focused indigo (`#4B0082`) → Deep Violet (`#8B008B`)
- **Under Affirm:** Gilded indigo (`#9370DB` with `#FFD700` overlay)

### Ground
- **Field:** Earthy brown-green (`#8B7355`) → Warm Ochre (`#CC7722`)
- **Fading:** Dries to Muted Gray (`#808080`)

### Release
- **Wash:** Full spectrum blend → Muted Gray (`#808080`)
- **Recovery:** Pastel tones reemerge (Lavender, Pale Blue, Warm Ochre)

### Align
- **Offense Phase:** Warm tones (Coral `#FF7F50`, Warm Ochre `#CC7722`)
- **Defense Phase:** Cool tones (Slate Blue `#6A5ACD`, Pale Blue `#B0E0E6`)

---

## Color Mixing Rules

Watercolor mixing follows subtractive color theory:

- **Blue + Yellow = Green** (used in Ground effects)
- **Red + Blue = Purple** (used in Reflect/Mantra)
- **Warm + Cool = Neutral Gray** (used in Release wash)

When abilities overlap, colors should blend additively with transparency, creating new intermediate hues rather than replacing previous layers.

---

## Implementation Notes

Colors are provided as hex values for easy conversion to RGB/HSL. The rendering system should:

1. Interpolate between serenity ranges smoothly
2. Apply transparency based on wetness level
3. Blend overlapping ability colors using watercolor mixing logic
4. Desaturate colors as Serenity decreases
5. Increase contrast and edge definition as Serenity decreases

See [WATERCOLOR_ART_DIRECTION.md](./WATERCOLOR_ART_DIRECTION.md) for technical implementation details.

