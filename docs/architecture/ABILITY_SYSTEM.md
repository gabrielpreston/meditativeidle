# Ability System Architecture

## Overview

The Ability System manages all player abilities, their activation patterns, cooldowns, and effects. This document describes the technical implementation and how it relates to the design specifications.

## Design Reference

- **Design Document:** [docs/design/ABILITIES.md](../design/ABILITIES.md)
- **Visual Design:** [docs/design/WATERCOLOR_ART_DIRECTION.md](../design/WATERCOLOR_ART_DIRECTION.md)
- **Color Reference:** [docs/design/COLOR_PALETTE.md](../design/COLOR_PALETTE.md)
- **Config Definitions:** `src/config/AbilityDefinitions.ts`

## Core Components

### AbilitySystem (`src/systems/AbilitySystem.ts`)

Main system class implementing `ISystem` interface. Manages:
- Ability state and levels
- Cooldown tracking
- Automatic activation logic
- Branch system integration

**Key Methods:**
- `update(deltaTime, context)` - Main update loop
- `upgradeAbility(name, insight)` - Level up an ability
- `getAbilities()` - Get current ability state
- Query methods for each ability's active state

### Ability Definitions (`src/config/AbilityDefinitions.ts`)

Structured type-safe definitions matching design specifications. Provides:
- Base stats and scaling formulas
- Visual expression metadata
- Activation type information
- Branch point definitions

**Usage:**
```typescript
import { getAbilityDefinition } from './config/AbilityDefinitions';

const breatheDef = getAbilityDefinition('breathe');
const damage = breatheDef.baseStats.damage * (1 + level * breatheDef.scaling.damagePerLevel);
```

### GameConfig (`src/GameConfig.ts`)

Runtime configuration values used by AbilitySystem. Contains:
- Cooldown durations
- Damage values
- Radius values
- Scaling multipliers

**Note:** Some values in GameConfig may be duplicated from AbilityDefinitions. Consider consolidating in the future.

## Ability Types & Activation Patterns

### Always Active
- **Breathe** - Constant aura damage
- **Align** - Continuous phase cycling

### Cooldown-Based Auto
- **Recenter** - Auto-triggers on cooldown, creates expanding pulse
- **Exhale** - Auto-triggers periodically, creates wave bursts
- **Mantra** - Auto-triggers when cooldown ends, locks onto nearest target
- **Ground** - Auto-triggers on cooldown, spawns field at random position

### Timed Amplifier
- **Affirm** - Cycles between active duration and cooldown, amplifies other abilities

### Reactive Defense
- **Reflect** - Auto-triggers when Serenity drops below threshold
- **Release** - Auto-triggers when Serenity drops to critical level

## Integration Points

### Rendering System

**AbilityEffects (`src/rendering/scenes/AbilityEffects.ts`)**
- Renders visual effects for each ability
- Uses Three.js meshes and materials
- Currently uses basic colors (needs watercolor integration)

**Integration TODO:**
- Connect visual effects to watercolor rendering system
- Use color palette from COLOR_PALETTE.md
- Implement watercolor techniques from visual expressions

### Watercolor System

**WatercolorStateController (`src/rendering/watercolor/WatercolorStateController.ts`)**
- Controls global watercolor state based on Serenity
- Provides uniforms for shader effects
- Should integrate with ability visual expressions

**Integration TODO:**
- Map ability visual expressions to watercolor parameters
- Create ability-specific pigment injection system
- Implement watercolor techniques per ability

### Ability Effect System

**AbilityEffectSystem (`src/systems/AbilityEffectSystem.ts`)**
- Applies ability effects to stressors
- Calculates damage, slows, and other effects
- Uses AbilitySystem query methods to check active states

## Current Implementation Status

### ✅ Implemented
- All 9 abilities have basic mechanics
- Cooldown and activation logic
- Level scaling system
- Branch system integration
- Basic visual effects (Three.js)

### 🚧 Needs Enhancement
- Visual effects need watercolor integration
- Color palettes not yet connected to rendering
- Watercolor techniques not implemented
- Ability visual expressions not fully realized

### 📋 Future Work
- Integrate AbilityDefinitions config with AbilitySystem
- Consolidate GameConfig values with AbilityDefinitions
- Implement watercolor visual expressions
- Add ability-specific shader effects
- Create visual effect system matching design specs

## Data Flow

```
Design Docs (ABILITIES.md)
    ↓
AbilityDefinitions.ts (structured config)
    ↓
AbilitySystem.ts (mechanics implementation)
    ↓
AbilityEffectSystem.ts (effect application)
    ↓
AbilityEffects.ts (visual rendering)
    ↓
WatercolorPass.ts (watercolor post-processing)
```

## Code Organization

```
src/
├── config/
│   └── AbilityDefinitions.ts      # Structured ability definitions
├── systems/
│   ├── AbilitySystem.ts            # Core ability mechanics
│   ├── AbilityEffectSystem.ts     # Effect application
│   └── AbilityBranches.ts         # Branch system config
├── rendering/
│   ├── scenes/
│   │   └── AbilityEffects.ts      # Visual effects (Three.js)
│   └── watercolor/
│       ├── WatercolorPass.ts      # Post-processing
│       └── WatercolorStateController.ts  # State management
└── types.ts                        # TypeScript interfaces
```

## Testing Considerations

- Ability activation timing
- Cooldown management
- Scaling calculations
- Branch system choices
- Visual effect rendering
- Watercolor integration

## Related Documentation

- [Game Architecture](../ARCHITECTURE.md) - Overall system architecture
- [Design: Abilities](../design/ABILITIES.md) - Complete ability specifications
- [Design: Watercolor Art Direction](../design/WATERCOLOR_ART_DIRECTION.md) - Visual implementation guide

