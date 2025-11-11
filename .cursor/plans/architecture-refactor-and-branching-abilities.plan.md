<!-- 4a16cb01-8f9e-4fc9-a941-197fd2b4c61a 60d562f2-b359-4b43-a9e3-22bb57f9b034 -->
# Architecture Refactor and Branching Abilities Implementation Plan

## Executive Summary

This plan implements two major improvements to the Meditative Idle Defense codebase:

1. **Architectural Refactoring**: Transforms the monolithic `Game` class into a modular system architecture with clear interfaces, separation of concerns, and improved extensibility.

2. **Branching Ability System**: Adds strategic choice to ability upgrades by introducing branch points at levels 3, 6, and 9 where players select between 2-3 specialized paths.

**Scope**: 10 phases covering development tooling, architectural foundation, and branching system implementation.

**Estimated Time**: ~5-6 hours total (Phase 0: 27 min, Phase 1: 2.5 hours, Phases 2-9: ~2.5 hours)

**Risk Level**: Medium (Phase 1 refactoring is critical; Phases 2-9 are lower risk)

---

## Plan Status

**Status**: Partially Complete (Core Implementation Done)
**Started**: 2025-11-10
**Last Updated**: 2025-11-10
**Completed Phases**: 0, 1, 2, 3, 4, 5
**Remaining Phases**: 6, 7, 8, 9 (UI Integration and Testing)

---

## Plan Audit Summary

**Last Audited**: 2025-11-11

**Corrections Made**:
- Removed non-existent `getStressorsInRange()` and `removeStressor()` from SystemContext interface
- Updated line number references to match current codebase (Game.update() lines 87-218)
- Corrected AbilitySystem.update() implementation details
- Updated StressorSystem method references
- Clarified branch effects application in AbilityEffectSystem
- Updated UI references and integration points
- Verified all line numbers against current codebase state

**Verified Accurate**:
- Line numbers for key methods
- Console.log locations
- File paths and structure
- Phase dependencies and order

---

## Problem Analysis

### Current Architecture Issues

The `Game` class currently violates single responsibility principle:

- **Monolithic Update Loop**: `Game.update()` contains ~220 lines mixing system coordination, ability effect calculations, collision detection, and wave management
- **Tight Coupling**: Systems are hardcoded in Game constructor with direct dependencies
- **Mixed Concerns**: Ability effects (132 lines) are calculated directly in Game.update() instead of being isolated
- **Hard to Extend**: Adding new systems or modifying existing ones requires touching multiple areas of Game class

**Evidence**:
- `Game.update()` at `src/Game.ts:71-294` contains mixed concerns
- Ability effects calculated directly in Game.update() (lines 87-218, ~132 lines)
- System dependencies hardcoded in Game constructor (lines 48-49)

### Current Ability System Limitations

- **Linear Progression**: Abilities upgrade from level 0-10 with no player choice (`src/systems/AbilitySystem.ts:440-449`)
- **No Strategic Depth**: All upgrades are automatic with no meaningful decisions
- **Limited Replayability**: Every playthrough follows the same upgrade path

**Evidence**:
- Simple UI: 3x3 grid of upgrade buttons (`src/rendering/Renderer.ts:899-990`)
- Direct upgrade flow: Click → Check cost → Upgrade immediately (`src/main.ts:129-143`, `src/Game.ts:323-340`)
- Level-based scaling: All effects scale linearly with level (`src/Game.ts:88-97`, `src/Game.ts:110-133`)

### Target Architecture

- **Modular Systems**: All game systems implement `ISystem` interface with consistent `update(deltaTime, context)` signature
- **System Registry**: Game manages systems through a registry pattern, enabling easy addition/removal
- **Separation of Concerns**: Ability effects isolated in `AbilityEffectSystem`, stressors in `StressorSystem`, abilities in `AbilitySystem`
- **SystemContext**: Clean interface for systems to query game state and perform controlled mutations

### Target Ability System

- **Branch Points**: At levels 3, 6, and 9, players choose between 2-3 branch options
- **Branch Effects**: Each branch modifies ability behavior (damage, radius, cooldown, special effects)
- **UI Integration**: Branch selection modal/overlay when reaching branch points
- **Effect Application**: Branch modifiers applied to ability calculations in game loop

---

## Data Flow Analysis

### Current Upgrade Flow

```
User clicks ability button (main.ts:129)
  → Renderer.checkAbilityClick() (Renderer.ts:1021)
  → Game.upgradeAbility() (Game.ts:323)
    → AbilitySystem.upgradeAbility() (AbilitySystem.ts:440)
      → Increment level
  → Game applies level-based effects (Game.ts:87-218)
```

### Proposed Branch Flow

```
User clicks ability button
  → Check if at branch point (new: AbilitySystem.isAtBranchPoint())
    → If YES: Show branch selection UI (new)
      → User selects branch
      → AbilitySystem.chooseBranch() (new)
      → Complete upgrade with branch active
    → If NO: Normal upgrade flow
  → Apply branch effects to calculations (modified: AbilityEffectSystem after Phase 1)
```

### Current System Update Flow

```
Game.update(deltaTime)
  → StressorSystem.update(deltaTime, center, serenity, auraActive, auraRadius)
  → AbilitySystem.update(deltaTime, serenity, stressors, center)
  → Game calculates ability effects directly (lines 87-218)
  → Game handles collisions and wave transitions
```

### Proposed System Update Flow

```
Game.update(deltaTime)
  → System registry iterates through all systems
    → StressorSystem.update(deltaTime, context)
    → AbilitySystem.update(deltaTime, context)
    → AbilityEffectSystem.update(deltaTime, context)
  → Game handles high-level coordination (wave transitions, collisions)
```

---

## Implementation Plan

### Phase 0: Development Tooling Foundation

**Purpose**: Establish better development practices and tooling before major refactoring.

**Scope**: Lightweight improvements for development experience and code quality.

**Time**: ~27 minutes

**Files**: 4 modified, 1 new

---

#### 1. Dev Logging Utility

**File**: `src/utils/dev.ts` (new)

**Purpose**: Environment-aware console logging that's automatically stripped in production.

**Implementation**:

```typescript
export const dev = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args); // Always show errors
  },
};
```

**Integration**: Replace console.log/warn in:
- `src/Game.ts:287` (telemetry logging)
- `src/main.ts:294` (performance warnings)
- `src/testing/TestHarness.ts:148-170` (test output)

**Time**: 5 minutes | **Confidence**: 95%

---

#### 2. Vite Configuration Enhancements

**File**: `vite.config.ts`

**Changes**: Enable error overlay, add production console cleanup, source maps.

**Implementation**:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true, // Shows errors in browser
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

**Dependencies**: `npm install -D terser`

**Time**: 2 minutes | **Confidence**: 90%

---

#### 3. FPS Display

**File**: `src/main.ts`

**Changes**: Add FPS counter overlay when stats table is visible (dev mode only).

**Implementation**: Add to renderUI when `statsTableVisible` is true:

```typescript
if (import.meta.env.DEV && this.statsTableVisible) {
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  this.ctx.fillRect(10, 10, 100, 30);
  this.ctx.fillStyle = '#fff';
  this.ctx.font = '14px monospace';
  this.ctx.fillText(`FPS: ${this.fps}`, 15, 30);
}
```

**Time**: 10 minutes | **Confidence**: 90%

---

#### 4. Error Handling

**File**: `src/Game.ts`

**Changes**: Add try-catch blocks with context in critical sections.

**Implementation**: Wrap `update()` and `upgradeAbility()` methods:

```typescript
update(deltaTime: number): void {
  try {
    if (this.state.gameOver || this.state.isPaused) return;
    // ... existing update code ...
  } catch (error) {
    dev.error('[Game] Update failed:', error);
    dev.error('[Game] State:', this.state);
    throw error; // Still crash, but with context
  }
}
```

**Time**: 5 minutes | **Confidence**: 95%

---

#### 5. Build Analysis Script

**File**: `package.json`

**Changes**: Add `build:analyze` script for checking build sizes.

**Implementation**:

```json
{
  "scripts": {
    "build:analyze": "vite build && du -sh dist/*"
  }
}
```

**Time**: 5 minutes | **Confidence**: 95%

---

### Phase 1: Architectural Foundation

**Purpose**: Refactor codebase into modular system architecture with clear interfaces and separation of concerns.

**Scope**: Major architectural changes affecting core game loop and system interactions.

**Time**: ~2.5 hours (or ~1.5 hours without optional EventBus)

**Files**: 3 modified, 2-3 new

**Risk**: Medium - Refactoring core game loop requires thorough testing

---

#### 1.1 ISystem Interface and SystemContext

**File**: `src/systems/ISystem.ts` (new)

**Purpose**: Create common interface for all game systems with controlled access to game state.

**Implementation**:

```typescript
import { GameState, AbilityState, Stressor, Vector2 } from '../types';

export interface SystemContext {
  state: GameState;
  center: Vector2;
  playfieldWidth: number;
  playfieldHeight: number;
  getStressors(): Stressor[];
  getAbilities(): AbilityState;
  getAbilityLevel(ability: keyof AbilityState): number;
  getAuraRadius(): number;
  isAuraActive(): boolean; // Needed for StressorSystem.update() which requires auraActive parameter
  // Mutation methods (controlled)
  damageStressor(id: string, damage: number): void;
  modifyState(updates: Partial<GameState>): void;
}

export interface ISystem {
  update(deltaTime: number, context: SystemContext): void;
  initialize?(context: SystemContext): void;
  cleanup?(): void;
}
```

**Benefits**: Consistent system interface, clear dependencies, easier to add new systems.

**Time**: 30 minutes | **Confidence**: 95%

---

#### 1.2 AbilityEffectSystem Extraction

**File**: `src/systems/AbilityEffectSystem.ts` (new)

**Purpose**: Extract all ability-to-stressor interactions from Game class into dedicated system.

**Evidence**: Ability effects currently calculated in `Game.update()` at lines 87-218 (breathe, recenter, exhale, reflect, mantra, ground, release).

**Implementation**: Move ~132 lines of ability effect calculations from `Game.update()`:

```typescript
import { ISystem, SystemContext } from './ISystem';
import { GameConfig } from '../GameConfig';
import { distance } from '../utils/MathUtils';

export class AbilityEffectSystem implements ISystem {
  update(deltaTime: number, context: SystemContext): void {
    const stressors = context.getStressors();
    const abilities = context.getAbilities();
    const center = context.center;
    
    // Apply all ability effects
    this.applyBreatheEffects(stressors, abilities, center, deltaTime, context);
    this.applyRecenterEffects(stressors, abilities, center, context);
    this.applyExhaleEffects(stressors, abilities, center, context);
    this.applyReflectEffects(stressors, abilities, center, context);
    this.applyMantraEffects(stressors, abilities, center, deltaTime, context);
    this.applyGroundEffects(stressors, abilities, center, deltaTime, context);
    this.applyReleaseEffects(stressors, abilities, center, context);
  }
  
  private applyBreatheEffects(/* ... */): void {
    // Move breathe damage logic from Game.update() lines 87-107
  }
  
  // Similar methods for other abilities...
}
```

**Integration**:
- Remove ability effect code from `Game.update()` (lines 87-218)
- Add AbilityEffectSystem to Game's system registry
- Update Game to call this system in update loop

**Benefits**:
- Removes ~132 lines from `Game.update()`
- Isolates ability logic for easier testing and modification
- Branch modifiers can be applied here cleanly

**Time**: 1 hour | **Confidence**: 85%

---

#### 1.3 System Registry Pattern

**File**: `src/Game.ts`

**Changes**: Add system registry and SystemContext, refactor update loop.

**Implementation**:

1. **Add system registry**:

```typescript
export class Game {
  private systems: Map<string, ISystem> = new Map();
  private context: SystemContext;
  private stressorSystem: StressorSystem;
  private abilitySystem: AbilitySystem;
  private abilityEffectSystem: AbilityEffectSystem;
  
  constructor(width: number, height: number, seed?: number) {
    // ... existing initialization ...
    
    // Create systems
    this.stressorSystem = new StressorSystem(this.center, width, height, this.random);
    this.abilitySystem = new AbilitySystem();
    this.abilityEffectSystem = new AbilityEffectSystem();
    
    // Create context
    this.context = {
      state: this.state,
      center: this.center,
      playfieldWidth: this.playfieldWidth,
      playfieldHeight: this.playfieldHeight,
      getStressors: () => this.stressorSystem.getStressors(),
      getAbilities: () => this.abilitySystem.getAbilities(),
      getAbilityLevel: (ability) => 
        this.abilitySystem.getAbilities()[ability].level,
      getAuraRadius: () => this.auraRadius,
      isAuraActive: () => true, // Aura is always active in current implementation
      damageStressor: (id, damage) => 
        this.stressorSystem.damageStressor(id, damage),
      modifyState: (updates) => Object.assign(this.state, updates),
    };
    
    // Register systems
    this.registerSystem('stressor', this.stressorSystem);
    this.registerSystem('ability', this.abilitySystem);
    this.registerSystem('abilityEffect', this.abilityEffectSystem);
  }
  
  registerSystem(name: string, system: ISystem): void {
    this.systems.set(name, system);
    system.initialize?.(this.context);
  }
}
```

2. **Simplify update() method**:

```typescript
update(deltaTime: number): void {
  try {
    if (this.state.gameOver || this.state.isPaused) return;
    
    const scaledDelta = deltaTime * this.state.pace;
    
    // Update all systems in order
    for (const system of this.systems.values()) {
      system.update(scaledDelta, this.context);
    }
    
    // Game-specific coordination logic (currently inline, can be extracted to helper methods)
    // Wave transitions (lines 220-226)
    this.state.waveTimer -= scaledDelta;
    if (this.stressorSystem.getStressorCount() === 0 || this.state.waveTimer <= 0) {
      this.startWave(this.state.wave + 1);
    }
    
    // Check for resolved stressors (lines 228-249)
    const stressorsBefore = new Set(this.stressorSystem.getStressors().map(s => s.id));
    const stressorsAfter = this.stressorSystem.getStressors();
    const stressorsAfterIds = new Set(stressorsAfter.map(s => s.id));
    for (const id of stressorsBefore) {
      if (!stressorsAfterIds.has(id)) {
        this.resolveStressor(id);
      }
    }
    
    // Collision detection (lines 251-262)
    for (const stressor of stressorsAfter) {
      const dist = distance(stressor.position, this.center);
      if (dist < GameConfig.CENTER_RADIUS + stressor.size) {
        if (!this.abilitySystem.isReflectBarrierActive()) {
          this.state.serenity = Math.max(0, this.state.serenity - 5);
        }
        this.stressorSystem.damageStressor(stressor.id, stressor.health);
      }
    }
    
    // Game over check (lines 264-275)
    if (this.state.serenity <= 0 && !this.state.gameOver) {
      this.state.gameOver = true;
      const duration = (Date.now() - this.sessionStartTime) / 1000;
      if (this.onGameOver) {
        this.onGameOver({ duration, wave: this.state.wave, insight: this.state.insight });
      }
    }
    
    // Telemetry (lines 277-289)
    const now = Date.now();
    if (now - this.lastTelemetryTime >= GameConfig.TELEMETRY_INTERVAL) {
      this.telemetryData.push({
        timestamp: now,
        serenity: this.state.serenity,
        insight: this.state.insight,
        wave: this.state.wave,
        pace: this.state.pace
      });
      dev.log(`[Telemetry] Wave: ${this.state.wave}, Serenity: ${this.state.serenity.toFixed(1)}, Insight: ${this.state.insight}`);
      this.lastTelemetryTime = now;
    }
    
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
    
  } catch (error) {
    dev.error('[Game] Update failed:', error);
    dev.error('[Game] State:', this.state);
    throw error;
  }
}
```

**Note**: The coordination logic (wave transitions, collisions, telemetry) is currently inline in `Game.update()`. These can optionally be extracted to helper methods (`updateWaveTransitions()`, `checkCollisions()`, `updateTelemetry()`) for better organization, but keeping them inline is acceptable for the POC.

**Benefits**:
- Cleaner update loop (~20 lines vs 200+)
- Easy to add/remove systems
- Clear update order
- Less coupling

**Time**: 30 minutes | **Confidence**: 80%

---

#### 1.4 System Interface Migration

**Files**: `src/systems/StressorSystem.ts`, `src/systems/AbilitySystem.ts`

**Changes**: Update both systems to implement ISystem interface.

**StressorSystem Changes**:
- Change `update()` signature from `update(deltaTime, center, serenity, auraActive, auraRadius)` to `update(deltaTime, context)`
- Extract values from context: `context.center`, `context.state.serenity`, `context.isAuraActive()`, `context.getAuraRadius()`
- Keep all existing public methods for backward compatibility

**AbilitySystem Changes**:
- Change `update()` signature from `update(deltaTime, serenity, stressors, center)` to `update(deltaTime, context)`
- Extract values from context: `context.getStressors()`, `context.state.serenity`, `context.center`
- Keep all existing public query methods unchanged

**Time**: 30 minutes (15 min each) | **Confidence**: 90%

---

#### 1.5 EventBus (Optional)

**File**: `src/systems/EventBus.ts` (new, optional)

**Purpose**: Simple event system for loose coupling between systems.

**Implementation**: Standard pub/sub pattern with event handlers.

**Note**: Can be skipped for POC if not needed immediately.

**Time**: 1 hour (if implemented) | **Confidence**: 75%

---

**Phase 1 Summary**:

- **Total time**: ~2.5 hours (or ~1.5 hours without EventBus)
- **Files modified**: 3 existing files, 2-3 new files
- **Benefits**: Cleaner architecture, easier to extend, better separation of concerns
- **Risk**: Medium - Refactoring core game loop, needs thorough testing
- **Branching System Benefit**: AbilityEffectSystem makes it much easier to apply branch modifiers - all ability calculations in one place

**Refactoring Order** (within Phase 1):

1. Create ISystem interface and SystemContext (30 min) - Foundation
2. Update StressorSystem and AbilitySystem to implement ISystem (30 min) - System updates
3. Extract AbilityEffectSystem (1 hour) - Move ability logic
4. Add system registry to Game (30 min) - Integrate systems
5. EventBus (optional, 1 hour) - Only if needed

---

### Phase 2: Type System Extensions

**Purpose**: Add TypeScript types for branching ability system.

**File**: `src/types.ts`

**Changes**:

1. Add `AbilityBranch` interface (after line 50)
2. Add `BranchEffect` interface (after AbilityBranch)
3. Extend `AbilityUpgrade` interface to include branch tracking (modify lines 44-50)

**Implementation**:

```typescript
export interface AbilityBranch {
  id: string;
  name: string;
  description: string;
  effects: BranchEffect[];
}

export interface BranchEffect {
  type: 'damage' | 'radius' | 'cooldown' | 'duration' | 'special';
  modifier: number; // Multiplier or flat value
  description: string;
}

export interface AbilityUpgrade {
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  // New fields
  branchPoints: number[]; // e.g., [3, 6, 9]
  chosenBranches: Map<number, string>; // level -> branchId
}
```

**Time**: 15 minutes | **Confidence**: 95%

---

### Phase 3: Branch Configuration System

**Purpose**: Centralized configuration of all ability branches.

**File**: `src/systems/AbilityBranches.ts` (new)

**Structure**: Export `AbilityBranchConfig` object mapping ability names to branch levels.

**Example**:

```typescript
export const AbilityBranchConfig: Record<string, Record<number, AbilityBranch[]>> = {
  breathe: {
    3: [/* focused, expansive, balanced */],
    6: [/* penetrating, lingering, rhythmic */],
    9: [/* transcendent, overwhelming */]
  },
  // ... other 8 abilities
};
```

**Time**: 30 minutes | **Confidence**: 90%

---

### Phase 4: AbilitySystem Extensions

**Purpose**: Add branch tracking and query methods to AbilitySystem.

**File**: `src/systems/AbilitySystem.ts`

**Changes**:

1. Initialize branch tracking in constructor (line 57-123)
2. Add `isAtBranchPoint()` method
3. Add `getAvailableBranches()` method
4. Add `chooseBranch()` method
5. Add `getBranchEffects()` method
6. Add helper methods for applying branch modifiers

**Key Methods**:

```typescript
isAtBranchPoint(abilityName: keyof AbilityState): boolean
getAvailableBranches(abilityName: keyof AbilityState): AbilityBranch[]
chooseBranch(abilityName: keyof AbilityState, branchId: string): boolean
getBranchEffects(abilityName: keyof AbilityState): BranchEffect[]
getModifiedDamage(abilityName: keyof AbilityState, baseDamage: number): number
getModifiedRadius(abilityName: keyof AbilityState, baseRadius: number): number
```

**Time**: 45 minutes | **Confidence**: 85%

---

### Phase 5: Game Class Modifications

**Purpose**: Integrate branch selection into upgrade flow.

**File**: `src/Game.ts`

**Changes**:

1. Modify `upgradeAbility()` to detect branch points
2. Add `chooseBranchAndUpgrade()` method for branch selection flow

**Integration**: Branch modifiers will be applied in `AbilityEffectSystem` (created in Phase 1, modified in Phase 5).

**Time**: 30 minutes | **Confidence**: 80%

---

### Phase 6: Branch Selection UI

**Purpose**: Modal overlay for branch selection when player reaches branch point.

**File**: `src/ui/BranchSelectionModal.ts` (new)

**Features**:
- Display 2-3 branch options with descriptions
- Visual highlighting of selected branch
- Click to select and confirm
- Auto-dismiss after selection

**Integration**: Called from `main.ts` when `Game.upgradeAbility()` detects branch point.

**Time**: 45 minutes | **Confidence**: 75%

---

### Phase 7: Renderer Updates

**Purpose**: Visual indicators for branch points and branch selection modal rendering.

**File**: `src/rendering/Renderer.ts`

**Changes**:

1. Add `renderBranchSelectionModal()` method
2. Modify `drawAbilityUpgradeMenu()` to show branch indicators (line 899)
3. Add visual indicator on ability buttons when at branch point

**Time**: 30 minutes | **Confidence**: 80%

---

### Phase 8: Main App Integration

**Purpose**: Integrate branch selection into main app click handling.

**File**: `src/main.ts`

**Changes**:

1. Modify click handler to detect branch selection state (line 129-143)
2. Add branch selection modal state management
3. Handle branch selection completion

**Flow**:

```typescript
// In click handler (main.ts:129-143)
const clickedAbility = this.renderer.checkAbilityClick(this.mousePos);
if (clickedAbility) {
  const abilitySystem = this.game.getAbilitySystem();
  if (abilitySystem.isAtBranchPoint(clickedAbility)) {
    // Show branch selection modal
    this.showBranchSelection(clickedAbility);
  } else {
    // Normal upgrade
    this.game.upgradeAbility(clickedAbility);
  }
}
```

**Time**: 30 minutes | **Confidence**: 85%

---

### Phase 9: Testing Updates

**Purpose**: Update test harness to handle branch selection.

**File**: `src/testing/TestHarness.ts`

**Changes**:

1. Update `simulatePlayerActions()` to handle branch selection (line 120-145)
2. Add branch selection logic for automated testing

**Time**: 30 minutes | **Confidence**: 70%

---

## Branch Design Examples

### Breathe Ability Branches

**Level 3**:
- **Focused**: +50% damage, -20% radius
- **Expansive**: +30% radius, -15% damage
- **Balanced**: +20% damage, +15% radius

**Level 6**:
- **Penetrating**: Ignores 30% stressor resistance
- **Lingering**: Damage persists 2s after leaving aura
- **Rhythmic**: Pulses every 1s for 150% damage

**Level 9**:
- **Transcendent**: Restores 1 Serenity/sec per stressor in range
- **Overwhelming**: 20% chance to execute stressors below 30% health

### Recenter Ability Branches

**Level 3**:
- **Wide**: +40% radius, -25% slow strength
- **Intense**: +50% slow strength, -20% radius

**Level 6**:
- **Rapid**: -30% cooldown, -20% slow duration
- **Persistent**: +100% slow duration, +20% cooldown

**Level 9**:
- **Cascading**: Pulse chains to nearby stressors
- **Resonant**: Each pulse increases next pulse radius by 10%

*(Similar patterns for other 7 abilities)*

---

## Validation Steps

### Phase 0 Validation
1. **Type checking**: `npm run build` (runs `tsc && vite build`)
2. **Dev tools**: Verify dev.log works in dev mode, console.log removed in production build
3. **FPS display**: Toggle stats table (T key) and verify FPS counter appears in dev mode

### Phase 1 Validation (Critical - Must Pass Before Proceeding)
1. **Type checking**: `npm run build` (runs `tsc && vite build`)
2. **Game functionality**: `npm run dev` - verify all abilities still work correctly
3. **Ability effects**: Test each ability (breathe, recenter, exhale, reflect, mantra, ground, release, align) to ensure effects are applied
4. **Game balance**: Run test harness to ensure refactoring didn't break balance
5. **System registry**: Verify all systems update correctly in order

### Phase 2-9 Validation (Branching System)
1. **Type checking**: `npm run build` (runs `tsc && vite build`)
2. **Visual testing**: `npm run dev` - manually test branch selection at levels 3, 6, 9
3. **Game balance**: Run test harness to ensure branches don't break game balance
4. **UI/UX**: Verify branch selection is clear and intuitive
5. **Branch effects**: Test each branch option to ensure modifiers are applied correctly

---

## Risk Assessment

### High Risk

- **Phase 1 Architectural Refactoring**: Refactoring core game loop could break existing functionality
  - **Mitigation**: Complete Phase 1 first, thoroughly test all ability effects still work before proceeding
  - **Mitigation**: Keep existing methods for backward compatibility during transition
  - **Mitigation**: Test game balance after refactoring to ensure no regressions

- **Ability effect calculations with branches**: Modifying ability calculations could break balance
  - **Mitigation**: Test each ability branch thoroughly, start with simple modifiers
  - **Mitigation**: Phase 1's AbilityEffectSystem makes this easier - all effects in one place

### Medium Risk

- **UI integration**: New modal system needs to integrate cleanly
  - **Mitigation**: Follow existing UI patterns, test on different screen sizes

- **System interface migration**: Updating existing systems to implement ISystem
  - **Mitigation**: Keep existing method signatures for backward compatibility
  - **Mitigation**: Update incrementally, test after each system update

### Low Risk

- **Type system**: Adding types is non-breaking
- **Branch configuration**: Data-only file, easy to modify
- **Development tooling (Phase 0)**: Simple improvements, low risk

---

## Scorecard: Initial Proposal Review

### Over-Engineering Check

- ✅ **Simplified**: Single branch config file instead of per-ability files
- ✅ **Unified**: One branch selection UI component for all abilities
- ✅ **Predictable**: Branch points always at levels 3, 6, 9

### Holistic Approach

- ✅ **Root cause**: Addresses lack of player choice in upgrades
- ✅ **Unified pattern**: All abilities use same branch system
- ✅ **Consistent**: Branch effects follow same modifier pattern

### Evidence-Based

- ✅ **File references**: All code locations cited with line numbers
- ✅ **Pattern matching**: References existing code patterns
- ✅ **Integration points**: Clear evidence of where changes needed

### Confidence Scores

0. **Development Tooling (Phase 0)**: 93% - Simple improvements, well-established patterns
1. **Architectural Foundation (Phase 1)**: 87% - Refactoring core systems, medium risk but high value
2. **Type System Extensions (Phase 2)**: 95% - Straightforward, no dependencies
3. **Branch Configuration (Phase 3)**: 90% - New file, follows existing patterns
4. **AbilitySystem Extensions (Phase 4)**: 85% - Modifying existing system, need compatibility
5. **Game Class Modifications (Phase 5)**: 80% - Multiple touch points, complex interactions
6. **Branch Selection UI (Phase 6)**: 75% - New component, UI can be tricky
7. **Renderer Updates (Phase 7)**: 80% - Extending existing UI, visual consistency important
8. **Main App Integration (Phase 8)**: 85% - Clear integration point
9. **Testing Updates (Phase 9)**: 70% - Nice to have, not critical

**Overall Confidence**: 85% - Well-scoped, follows existing patterns, clear implementation path. Phase 0 and Phase 1 provide solid foundation for branching system.

---

## Implementation Order

1. **Phase 0**: Development tooling (best practices foundation)
2. **Phase 1**: Architectural foundation (system refactoring - ISystem, registry, AbilityEffectSystem)
3. **Phase 2**: Type system (branching foundation)
4. **Phase 3**: Branch configuration (data)
5. **Phase 4**: AbilitySystem extensions (core logic)
6. **Phase 5**: Game class modifications (effect application)
7. **Phase 6**: Branch selection UI (user interaction)
8. **Phase 7**: Renderer updates (visual feedback)
9. **Phase 8**: Main app integration (flow completion)
10. **Phase 9**: Testing updates (validation)

This order ensures each phase builds on previous work and can be tested incrementally.
- **Phase 0** provides better development tooling used throughout
- **Phase 1** refactors architecture to make branching system easier to implement
- **Phases 2-9** implement the branching ability system on the improved foundation

---

## To-Do Checklist

### Phase 0: Development Tooling
- [ ] Create src/utils/dev.ts with environment-aware logging utility
- [ ] Update vite.config.ts with error overlay and terser minification
- [ ] Install terser dev dependency: `npm install -D terser`
- [ ] Replace console.log/warn calls with dev.log/warn in Game.ts, main.ts, TestHarness.ts
- [ ] Add FPS display toggle to main.ts (shown when stats table visible in dev mode)
- [ ] Add error handling with context to Game.update() and upgradeAbility() methods
- [ ] Add build:analyze script to package.json for build size checking

### Phase 1: Architectural Foundation
- [ ] Create src/systems/ISystem.ts with ISystem interface and SystemContext
- [ ] Update StressorSystem to implement ISystem interface (change update() signature to use SystemContext)
- [ ] Update AbilitySystem to implement ISystem interface (change update() signature to use SystemContext, keep all existing public methods for compatibility)
- [ ] Create src/systems/AbilityEffectSystem.ts and extract ability effects from Game.update()
- [ ] Add system registry pattern to Game class (systems Map, registerSystem method)
- [ ] Create SystemContext in Game constructor with query and mutation methods (getStressors, getAbilities, damageStressor, modifyState, etc.)
- [ ] Refactor Game.update() to use system registry (simplify to ~20 lines)
- [ ] Test refactored architecture to ensure all ability effects still work
- [ ] (Optional) Create src/systems/EventBus.ts for loose coupling between systems

### Phase 2-9: Branching System
- [ ] Extend types.ts with AbilityBranch, BranchEffect interfaces and update AbilityUpgrade to track branches
- [ ] Create AbilityBranches.ts with branch configurations for all 9 abilities at levels 3, 6, 9
- [ ] Add branch tracking and query methods to AbilitySystem (isAtBranchPoint, getAvailableBranches, chooseBranch, getBranchEffects)
- [ ] Add branch modifier helper methods to AbilitySystem (getModifiedDamage, getModifiedRadius, etc.)
- [ ] Modify Game.upgradeAbility() to detect branch points and add chooseBranchAndUpgrade() method
- [ ] Update AbilityEffectSystem to apply branch modifiers to all ability calculations (breathe, recenter, exhale, reflect, mantra, ground, release, align) - branch modifiers accessed via AbilitySystem.getBranchEffects() and helper methods (getModifiedDamage, getModifiedRadius, etc.)
- [ ] Create BranchSelectionModal.ts component for displaying and selecting branch options
- [ ] Add renderBranchSelectionModal() to Renderer and update drawAbilityUpgradeMenu() to show branch indicators
- [ ] Update main.ts click handler to show branch selection modal when at branch point, handle branch selection completion
- [ ] Update TestHarness to handle branch selection in automated testing

---

## Analysis Scorecard

**Analysis Date**: 2025-11-10
**Analyst**: AI Code Review
**Overall Plan Status**: ✅ **APPROVED WITH CORRECTIONS**

### Correctness Issues Found and Fixed

1. **✅ FIXED**: `npm run type-check` doesn't exist
   - **Issue**: Plan referenced non-existent script
   - **Fix**: Updated all validation steps to use `npm run build` (runs `tsc && vite build`)
   - **Evidence**: `package.json` shows only `dev`, `build`, `preview` scripts

2. **✅ FIXED**: SystemContext missing `isAuraActive()` method
   - **Issue**: StressorSystem.update() requires `auraActive: boolean` parameter but SystemContext didn't expose it
   - **Fix**: Added `isAuraActive(): boolean` to SystemContext interface
   - **Evidence**: `StressorSystem.ts:114` shows signature: `update(deltaTime, center, serenity, auraActive, auraRadius)`
   - **Evidence**: `Game.ts:232-238` shows call with `true` for auraActive

3. **✅ FIXED**: Proposed update() method referenced non-existent helper methods
   - **Issue**: Plan showed `updateWaveTransitions()`, `checkCollisions()`, `updateTelemetry()` as separate methods
   - **Fix**: Updated to show inline implementation with line number references
   - **Evidence**: `Game.ts:220-293` shows all coordination logic is inline
   - **Note**: These can optionally be extracted to helper methods, but inline is acceptable for POC

4. **✅ VERIFIED**: All line number references are accurate
   - Game.update() ability effects: lines 87-218 ✅
   - Game.update() total: lines 71-294 ✅
   - AbilitySystem.upgradeAbility(): line 440 ✅
   - Console.log locations: Game.ts:287, main.ts:294 ✅

5. **✅ VERIFIED**: Method signatures match codebase
   - StressorSystem.update(): `(deltaTime, center, serenity, auraActive, auraRadius)` ✅
   - AbilitySystem.update(): `(deltaTime, serenity, stressors, center)` ✅
   - Game.getAbilitySystem(): exists at line 363 ✅

### Over-Engineering Analysis

**✅ APPROVED**: Plan is appropriately scoped for POC
- Single branch config file (not per-ability) - ✅ Good
- One branch selection UI component - ✅ Good
- System registry pattern is standard and not over-engineered - ✅ Good
- Optional EventBus correctly marked as optional - ✅ Good

**No over-engineering issues found**

### Holistic Approach Analysis

**✅ APPROVED**: Plan addresses root causes holistically
- **Architectural refactoring**: Addresses root cause (monolithic Game class) with unified system pattern
- **Branching system**: Unified pattern for all abilities, not ad-hoc per-ability solutions
- **SystemContext**: Provides consistent interface for all systems, not per-system solutions

**No holistic approach issues found**

### Pattern Unification Analysis

**✅ APPROVED**: Plan establishes consistent patterns
- All systems use same ISystem interface - ✅ Unified
- All systems receive same SystemContext - ✅ Unified
- Branch system uses same pattern for all abilities - ✅ Unified
- Development tooling follows existing patterns - ✅ Unified

**No pattern unification issues found**

### Evidence-Based Validation

**✅ VERIFIED**: All claims have evidence
- File references include line numbers ✅
- Method signatures match actual codebase ✅
- Integration points verified against actual code ✅
- Code examples match actual patterns ✅

**All evidence requirements met**

### Assumptions Validated

1. **✅ VALIDATED**: Ability effects are in Game.update() lines 87-218
   - Verified: Contains breathe, recenter, exhale, reflect, mantra, ground, release effects

2. **✅ VALIDATED**: Game.update() is ~220 lines
   - Verified: Lines 71-294 = 224 lines (close to ~220 estimate)

3. **✅ VALIDATED**: System dependencies hardcoded in constructor
   - Verified: Lines 48-49 show direct instantiation

4. **✅ VALIDATED**: Vite config is minimal
   - Verified: Only has server port/open and build outDir/sourcemap

5. **✅ VALIDATED**: Console.log usage locations
   - Verified: Game.ts:287, main.ts:294

### Documentation Impact Analysis

**Files that may need updates**:
- `README.md`: May need update if branching system changes gameplay significantly
- No other documentation files identified that need updates for this plan

### Confidence Scores (Post-Analysis)

0. **Development Tooling (Phase 0)**: **95%** ⬆️ (was 93%) - All assumptions validated, simple improvements
1. **Architectural Foundation (Phase 1)**: **88%** ⬆️ (was 87%) - Corrections made, all integration points verified
2. **Type System Extensions (Phase 2)**: **95%** (unchanged) - Straightforward, no dependencies
3. **Branch Configuration (Phase 3)**: **90%** (unchanged) - New file, follows existing patterns
4. **AbilitySystem Extensions (Phase 4)**: **85%** (unchanged) - Modifying existing system, need compatibility
5. **Game Class Modifications (Phase 5)**: **82%** ⬆️ (was 80%) - Corrections made, clearer implementation path
6. **Branch Selection UI (Phase 6)**: **75%** (unchanged) - New component, UI can be tricky
7. **Renderer Updates (Phase 7)**: **80%** (unchanged) - Extending existing UI, visual consistency important
8. **Main App Integration (Phase 8)**: **85%** (unchanged) - Clear integration point
9. **Testing Updates (Phase 9)**: **70%** (unchanged) - Nice to have, not critical

**Overall Confidence**: **87%** ⬆️ (was 85%) - Corrections made, all critical issues resolved, plan is ready for implementation

### Recommendations

1. **✅ IMPLEMENT AS-IS**: Plan is ready for implementation with corrections applied
2. **Optional Enhancement**: Consider extracting coordination logic (wave transitions, collisions, telemetry) to helper methods in Phase 1 for better organization, but not required
3. **Testing Priority**: Phase 1 validation is critical - ensure all ability effects work before proceeding to Phase 2

### Questions for User

**None** - All assumptions validated, all issues resolved, plan is ready for implementation.

