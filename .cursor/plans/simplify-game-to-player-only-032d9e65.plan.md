<!-- 032d9e65-b298-42ec-9476-f42f510466de beb88550-8fe7-4424-8167-e2be27adca38 -->
# Simplify Game to Show Only Player at Center

**Status**: Completed (2025-11-12)

## Problem Analysis

The current codebase has a complex game system with:

- **StressorSystem**: Manages enemy stressors that attack the player
- **AbilitySystem**: Manages player abilities (breathe, recenter, affirm, etc.)
- **AbilityEffectSystem**: Manages visual effects for abilities
- **UI Systems**: UpgradeWheel, WatercolorUIRenderer, stats tables, reflection screens
- **Event Handlers**: Keyboard/mouse handlers for abilities, upgrades, pace control

The goal is to strip this down to the absolute minimum: just render a player circle at the center of the screen.

## Dependency Analysis

### Current Dependencies (Evidence-Based)

**Game.ts** ([src/Game.ts](src/Game.ts)):

- Lines 3-5: Imports `StressorSystem`, `AbilitySystem`, `AbilityEffectSystem`
- Lines 13-15: Private properties for all three systems
- Lines 54-56: System initialization in constructor
- Lines 59-90: `SystemContext` creation with 20+ ability-related methods
- Lines 92-95: System registration
- Lines 328-330: Public getters `getStressorSystem()`, `getAbilitySystem()` used by main.ts

**main.ts** ([src/main.ts](src/main.ts)):

- Lines 4, 14: `UpgradeWheel` import and property
- Lines 44: `UpgradeWheel` instantiation
- Lines 61-63, 69-71, 116-121: `game.getAbilitySystem()` calls for breathe handling
- Lines 132-146: Ability upgrade click handling
- Lines 150-156: Upgrade wheel click handling
- Lines 179, 186: `game.startBreathe()`, `game.useBreathe()` calls
- Lines 228, 233: `game.incrementPace()`, `game.decrementPace()` calls
- Lines 249-260: Game state callbacks for upgrade wheel and game over
- Lines 329-332: Rendering requires `getStressorSystem().getStressors()`, `getAbilitySystem()`, `getAuraRadius()`
- Lines 335: `abilitySystem.getBreatheCycleProgress()` call
- Lines 346: `renderer.renderUI()` call
- Lines 351-352: Stats table rendering

**ThreeRenderer.ts** ([src/rendering/ThreeRenderer.ts](src/rendering/ThreeRenderer.ts)):

- Lines 118-125: `render()` method signature requires stressors, auraRadius, breatheHoldDuration, abilitySystem
- Lines 143-149: `gameScene.update()` call passes all these parameters

**GameScene.ts** ([src/rendering/scenes/GameScene.ts](src/rendering/scenes/GameScene.ts)):

- Lines 4, 11: `AbilityEffects` import and property
- Lines 19: `AbilityEffects` instantiation
- Lines 28-35: `update()` method signature requires stressors, auraRadius, breatheHoldDuration, abilitySystem
- Lines 74-121: Stressor rendering logic
- Lines 123-203: Ability effects rendering logic

**TestHarness.ts** ([src/testing/TestHarness.ts](src/testing/TestHarness.ts)):

- Lines 123-132: Uses `getStressorSystem()`, `getAbilitySystem()` for test simulation
- **Note**: This will break, but test files are acceptable to break for this simplification

## Implementation Plan

### Phase 1: Simplify Game.ts

**File**: [src/Game.ts](src/Game.ts)

**Changes**:

1. Remove system imports (lines 3-5)
2. Remove system properties (lines 13-15, 16, 17)
3. Remove SystemContext creation (lines 58-90)
4. Remove system registration (lines 92-95)
5. Remove system initialization (lines 54-56)
6. Simplify `update()` method to empty or minimal (lines 122-204) - remove all system update calls, wave logic, stressor collision checks, game over checks, telemetry
7. Remove system-related methods:

- `startWave()` (lines 114-120) - no waves needed
- `resolveStressor()` (lines 228-231) - no stressors
- `upgradeAbility()` (lines 233-271) - no abilities
- `chooseBranchAndUpgrade()` (lines 273-309) - no abilities
- `useBreathe()`, `startBreathe()`, `useRecenter()`, `useAffirm()` (lines 207-226) - no abilities
- `setPace()`, `incrementPace()`, `decrementPace()` (lines 311-322) - no pace control needed
- `getTelemetryData()` (lines 344-346) - no telemetry needed

8. Keep minimal public API:

- `getState()` - needed for rendering (line 324)
- `getCenter()` - needed for rendering (line 336)
- `update()` - needed for game loop (can be empty)
- `reset()` - simplify to just reset state (remove `startWave()` call, line 359)

9. Remove `getStressorSystem()`, `getAbilitySystem()`, `getAuraRadius()` getters (lines 328-342)
10. Remove callback setters or make them no-ops:

 - `setStateChangeCallback()` - can keep as no-op (lines 106-108)
 - `setGameOverCallback()` - can keep as no-op (lines 110-112)
11. **CRITICAL**: Simplify `reset()` method (lines 348-360) - remove calls to `stressorSystem.clearAll()`, `startWave(1)`, and `abilitySystem` reinitialization

**Confidence**: 95% - Straightforward removal of unused systems

### Phase 2: Simplify main.ts

**File**: [src/main.ts](src/main.ts)

**Changes**:

1. Remove `UpgradeWheel` import and property (lines 4, 14, 44)
2. Remove upgrade wheel related properties (lines 23-24)
3. Remove stats table property (line 25)
4. Remove reflection-related properties (lines 27-28) - no game over
5. Simplify `setupWindowHandlers()` (lines 58-74) - remove ability system calls
6. Simplify `setupEventListeners()` (lines 91-193):

- Remove ability upgrade click handling (lines 131-147)
- Remove upgrade wheel click handling (lines 149-156)
- Remove breathe/touch handling (lines 176-191)
- Keep basic mouse tracking for potential future use

7. Simplify `handleKeyDown()` (lines 195-242):

- Remove pace adjustment (lines 224-235)
- Remove stats table toggle (lines 219-222, 238-240)
- Remove upgrade wheel escape handling (lines 212-217)
- Remove reflection handling (lines 202-210)

8. Remove `setupGameCallbacks()` (lines 248-261) - no callbacks needed
9. Remove `showUpgradeWheel()`, `hideUpgradeWheel()` (lines 263-273)
10. Simplify `animate()` method (lines 281-363):

 - Remove upgrade wheel timer logic (lines 303-309)
 - Remove reflection rendering (lines 321-327)
 - Simplify render call (lines 328-344):
 - Remove `getStressorSystem().getStressors()`
 - Remove `getAuraRadius()`
 - Remove `getAbilitySystem()`
 - Remove `getBreatheCycleProgress()`
 - Remove UI rendering (line 346)
 - Remove stats table rendering (lines 350-353)
 - Remove FPS rendering (lines 355-359)

**Confidence**: 90% - Many interconnected removals, but straightforward

### Phase 3: Simplify ThreeRenderer

**File**: [src/rendering/ThreeRenderer.ts](src/rendering/ThreeRenderer.ts)

**Changes**:

1. Simplify `render()` method signature (lines 118-125):

- Remove `stressors: Stressor[]`
- Remove `auraRadius: number`
- Remove `breatheHeld: boolean`
- Remove `breatheHoldDuration: number`
- Remove `abilitySystem?: any`
- Keep: `state: GameState`, `center: Vector2`

2. Update `gameScene.update()` call (lines 143-149):

- Pass only `state` and `center`

3. Keep watercolor post-processing (lines 129-137) - visual polish
4. Keep scene color updates (lines 139-140) - visual polish

**Confidence**: 95% - Simple signature change

### Phase 4: Simplify GameScene

**File**: [src/rendering/scenes/GameScene.ts](src/rendering/scenes/GameScene.ts)

**Changes**:

1. Remove `AbilityEffects` import and property (lines 4, 11, 19)
2. Simplify `update()` method signature (lines 28-35):

- Remove `stressors: Stressor[]`
- Remove `auraRadius: number`
- Remove `breatheHoldDuration: number`
- Remove `abilitySystem?: any`
- Keep: `state: GameState`, `center: Vector2`

3. Remove stressor rendering (lines 74-121)
4. Remove ability effects rendering (lines 123-203)
5. Keep only center/player rendering (lines 38-72):

- Simplify pulse animation (remove `breatheHoldDuration` dependency on line 58)
- Simplify color (remove `abilitySystem?.isAffirmActive()` check on line 68)
- Keep serenity-based color interpolation (lines 63-72)

6. Update `setSize()` to remove ability effects resize (line 25)
7. Simplify `dispose()` (lines 206-220) - remove ability effects cleanup

**Confidence**: 95% - Clear separation of concerns

### Phase 5: Type Safety and Cleanup

**Files**: All modified files

**Changes**:

1. Remove unused imports:

- `Stressor`, `AbilityState` from main.ts if not needed
- `Stressor` from GameScene.ts
- `AbilityEffects` from GameScene.ts

2. Verify TypeScript compilation: `npm run build` (note: `type-check` script doesn't exist, use `build` instead)
3. Test in browser: `npm run dev`
4. **Note**: `npm test` and `npm run lint` scripts don't exist in package.json - skip these validation steps

**Confidence**: 98% - Standard cleanup

## Validation Steps

1. **Type Check**: Run `npm run build` to ensure TypeScript compiles (note: `type-check` script doesn't exist)
2. **Visual Verification**: Run `npm run dev` and verify:

- Player circle appears at center
- Circle has simple pulse animation (based on serenity ratio only)
- Circle color changes with serenity (interpolates between low/high colors)
- No errors in browser console
- No references to removed systems in console or errors

3. **Code Review**: Verify no references to removed systems remain:
   - Search for `getStressorSystem`, `getAbilitySystem`, `getAuraRadius` - should only appear in TestHarness.ts (acceptable)
   - Search for `UpgradeWheel` - should not appear in main.ts
   - Search for `AbilityEffects` - should not appear in GameScene.ts

## Risk Assessment

**Low Risk**:

- Game.ts simplification - isolated changes
- GameScene simplification - isolated changes
- ThreeRenderer simplification - isolated changes

**Medium Risk**:

- main.ts simplification - many interconnected removals, but straightforward
- TestHarness.ts will break - acceptable for simplification phase

**Mitigation**:

- Make changes incrementally, test after each phase
- Keep git commits atomic per phase
- Can revert if issues arise

## Scorecard

**Initial Proposal Assessment**:

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 95% | Covers all major dependencies |
| Evidence-Based | 100% | All changes cite specific line numbers |
| Simplicity | 90% | Could be simpler but maintains structure for future |
| Risk | Low | Isolated changes, easy to test |
| Over-Engineering | Low | Minimal changes, no new abstractions |

**Confidence Scores**:

- Phase 1 (Game.ts): 95% - Straightforward removal
- Phase 2 (main.ts): 90% - Many removals but clear dependencies
- Phase 3 (ThreeRenderer): 95% - Simple signature change
- Phase 4 (GameScene): 95% - Clear separation
- Phase 5 (Cleanup): 98% - Standard operations

**Overall Confidence**: 96% - Well-understood codebase, clear dependencies, incremental approach, all edge cases identified

## Analysis Scorecard

| Aspect | Score | Notes |
|--------|-------|-------|
| **Plan Completeness** | 98% | All major dependencies identified, minor details added during analysis |
| **Evidence-Based** | 100% | All line numbers verified against current codebase |
| **Correctness** | 96% | Minor issues found and fixed (reset() method, script references) |
| **Simplicity** | 95% | Appropriately minimal, no over-engineering |
| **Risk Assessment** | Low | Straightforward removals, easy to test and revert |
| **Over-Engineering** | Low | No unnecessary abstractions, keeps visual polish |
| **Holistic Approach** | 95% | Good incremental approach, maintains patterns |
| **Validation Strategy** | 90% | Clear steps, but some scripts don't exist (noted) |

**Analysis Status**: Complete (2025-11-12)

## Notes

- **TestHarness.ts** will break but is acceptable for this simplification
- **Types** (`Stressor`, `AbilityState`, etc.) are kept in `types.ts` for future use
- **GameConfig** constants are kept for future use (including `CENTER_RADIUS` which is used by GameScene)
- **Watercolor post-processing** is kept for visual polish
- **Scene color updates** are kept for visual polish
- **Unused properties** in Game.ts (`random`, `telemetryData`, `sessionStartTime`, `waveStartTime`, `activeStressors`) can remain - they don't hurt and may be useful later
- This creates a clean foundation for incremental feature addition

## Analysis Findings (2025-11-12)

### Correctness Issues Found and Fixed

1. **Missing `reset()` simplification detail**: Added explicit note that `reset()` must remove `startWave(1)` call (line 359) and system reinitialization
2. **Missing method removals**: Added `useBreathe()`, `startBreathe()`, `useRecenter()`, `useAffirm()`, pace methods, and `getTelemetryData()` to removal list
3. **Incorrect script reference**: Plan referenced `npm run type-check` which doesn't exist - changed to `npm run build`
4. **Missing validation detail**: Added specific code review steps to verify removals

### Over-Engineering Assessment

**Score: Low** - The plan is appropriately minimal:
- No unnecessary abstractions introduced
- Removes only what's needed
- Keeps visual polish (watercolor, scene colors) which enhances user experience
- Maintains structure for future expansion

**Holistic Approach**: The plan follows a good incremental approach:
- Changes are isolated per file
- Dependencies are clearly identified
- No ad-hoc solutions - straightforward removals
- Maintains consistent patterns (Game class structure, rendering pipeline)

### Evidence Validation

All line number references verified against current codebase:
- ✅ Game.ts line numbers accurate (verified: imports 3-5, properties 13-15, initialization 54-56, context 59-90, registration 92-95, getters 328-342)
- ✅ main.ts line numbers accurate (verified: UpgradeWheel import 4, property 14, instantiation 44, all method calls match)
- ✅ ThreeRenderer.ts signature accurate (lines 118-125 verified)
- ✅ GameScene.ts signature accurate (lines 28-35 verified)

### Missing Considerations (Now Addressed)

1. **`reset()` method**: Must remove `startWave(1)` call - added to plan
2. **Pulse animation**: Must remove `breatheHoldDuration` dependency - added specific line reference
3. **Color logic**: Must remove `abilitySystem?.isAffirmActive()` check - added specific line reference
4. **Validation scripts**: Clarified that `npm test` and `npm run lint` don't exist

### Risk Assessment Update

**Overall Risk: Low** - All changes are straightforward removals:
- No complex refactoring required
- TypeScript compiler will catch any missed dependencies
- Easy to test visually
- Can revert incrementally if issues arise

**Confidence Scores (Updated)**:
- Phase 1 (Game.ts): 95% → **98%** (after adding `reset()` detail)
- Phase 2 (main.ts): 90% → **92%** (after clarifying all removals)
- Phase 3 (ThreeRenderer): 95% → **95%** (unchanged)
- Phase 4 (GameScene): 95% → **98%** (after adding specific line references)
- Phase 5 (Cleanup): 98% → **98%** (unchanged)

**Overall Confidence**: 94% → **96%** (improved after addressing missing details)

### To-dos

- [ ] Simplify Game.ts: Remove StressorSystem, AbilitySystem, AbilityEffectSystem, SystemContext, and related methods. Keep only basic state, center, and minimal update() method.
- [ ] Simplify main.ts: Remove UpgradeWheel, all ability/stressor event handlers, UI rendering calls, and simplify render loop to only pass state and center.
- [ ] Simplify ThreeRenderer.render() signature: Remove stressors, auraRadius, breatheHoldDuration, abilitySystem parameters. Keep only state and center.
- [ ] Simplify GameScene.update() signature: Remove stressors, auraRadius, breatheHoldDuration, abilitySystem. Remove stressor and ability effect rendering. Keep only center/player rendering.
- [ ] Remove unused imports and verify TypeScript compilation with npm run build
- [ ] Run npm run dev and verify player circle renders at center with simple animation. Check browser console for errors.