# Documentation Index

This directory contains design documentation, architecture notes, and technical references for *Meditative Idle Defense*.

## Structure

```
docs/
├── design/              # Game design and art direction
│   ├── ABILITIES.md              # Complete abilities overview
│   ├── WATERCOLOR_ART_DIRECTION.md  # Technical art direction
│   └── COLOR_PALETTE.md         # Color palette reference
├── architecture/       # Technical implementation details
│   └── ABILITY_SYSTEM.md         # Ability system architecture
└── README.md           # This file
```

## Design Documentation

### [Abilities Overview](./design/ABILITIES.md)

Complete specifications for all 9 abilities, including:
- Mechanics and activation patterns
- Base stats and scaling formulas
- Visual expression descriptions
- Watercolor techniques used

**Reference this document** when implementing or modifying abilities.

### [Watercolor Art Direction](./design/WATERCOLOR_ART_DIRECTION.md)

Technical art direction for implementing the watercolor aesthetic:
- Shader and rendering approach
- Layer structure and simulation
- Global parameters (Serenity-driven)
- Performance optimization tips

**Reference this document** when working on visual effects or shaders.

### [Color Palette](./design/COLOR_PALETTE.md)

Color mappings organized by Serenity level and ability:
- Serenity-based color shifts
- Ability-specific color palettes
- Color mixing rules
- Implementation notes

**Reference this document** when setting colors in code or shaders.

## Architecture Documentation

### [Ability System](./architecture/ABILITY_SYSTEM.md)

Technical implementation details for the ability system:
- Component structure
- Integration points
- Data flow
- Implementation status

**Reference this document** when modifying ability mechanics or integrating with other systems.

## Quick Reference

### For Designers
- Start with [ABILITIES.md](./design/ABILITIES.md) for ability specifications
- See [COLOR_PALETTE.md](./design/COLOR_PALETTE.md) for color choices
- Review [WATERCOLOR_ART_DIRECTION.md](./design/WATERCOLOR_ART_DIRECTION.md) for visual style

### For Developers
- See [ABILITY_SYSTEM.md](./architecture/ABILITY_SYSTEM.md) for implementation details
- Check `src/config/AbilityDefinitions.ts` for structured ability data
- Review `src/systems/AbilitySystem.ts` for core mechanics

### For Artists/Shaders
- Start with [WATERCOLOR_ART_DIRECTION.md](./design/WATERCOLOR_ART_DIRECTION.md)
- Reference [COLOR_PALETTE.md](./design/COLOR_PALETTE.md) for colors
- See ability visual expressions in [ABILITIES.md](./design/ABILITIES.md)

## Design Philosophy

> The battlefield is a canvas, and the psyche paints its defense.
> Every mechanic leaves a mark, and every mark eventually fades.
> The battlefield is not conquered — it is **repainted**, over and over, until calm returns.

All abilities and visual effects should embody this philosophy:
- **Fluid impermanence** - Effects flow and fade naturally
- **Watercolor medium** - No sharp edges, digital glows, or particles
- **Unified canvas** - All effects contribute to a single painted surface
- **Serenity-driven** - Visual state reflects emotional equilibrium

## Contributing

When adding new abilities or modifying existing ones:

1. Update [ABILITIES.md](./design/ABILITIES.md) with design specifications
2. Update `src/config/AbilityDefinitions.ts` with structured data
3. Implement mechanics in `src/systems/AbilitySystem.ts`
4. Add visual effects following watercolor art direction
5. Update [ABILITY_SYSTEM.md](./architecture/ABILITY_SYSTEM.md) if architecture changes

## Related Files

- `src/config/AbilityDefinitions.ts` - TypeScript ability definitions
- `src/systems/AbilitySystem.ts` - Ability mechanics implementation
- `src/rendering/scenes/AbilityEffects.ts` - Visual effects rendering
- `src/rendering/watercolor/` - Watercolor rendering system

