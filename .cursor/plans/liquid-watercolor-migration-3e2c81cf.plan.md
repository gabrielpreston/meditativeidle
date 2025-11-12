<!-- 3e2c81cf-0ec3-4d8f-bd2a-250c5bef1931 b1e1dc4c-d8da-4f91-a848-4b1cd60e15fe -->
# Liquid Watercolor Migration Plan

## Plan Status

**Status:** Phase 1 & 3 Complete  
**Analysis Date:** 2025-11-12  
**Implementation Started:** 2025-11-12  
**Phase 1 Completed:** 2025-11-12  
**Phase 3 Completed:** 2025-11-12  
**Last Updated:** 2025-11-12

### Analysis Summary

**Analysis Completed:** 2025-11-12

**Key Findings:**
1. ✅ Fixed screen coordinate conversion error (use center.x/y directly)
2. ✅ Clarified AbilityEffects integration path (add abilityState parameter)
3. ✅ Fixed performance mode access (add to render signature)
4. ✅ Noted existing TypeScript errors (unrelated, fix separately)

**Plan Quality:** 85% - Strong plan with critical fixes applied

**Recommendation:** APPROVE - Plan is ready for implementation with fixes applied

## Executive Summary

This plan migrates the rendering system from a "paper watercolor" aesthetic (edge darkening, granulation, paper texture) to a "liquid watercolor" aesthetic (fluid advection, dye injection, vorticity). The migration replaces `WatercolorPass` with a fluid simulation system (`FluidSim`) and composite pass (`FluidCompositePass`), integrates ability-driven dye injection, and maintains the existing serenity-driven parameter mapping.

## Initial Proposal Scorecard

**Complexity Assessment:**

- **High Complexity**: Requires implementing full WebGL fluid simulation (velocity, pressure, dye fields)
- **Medium Risk**: AbilityEffects class exists but is not currently integrated (no instantiation found)
- **Medium Risk**: deltaTime not currently passed to ThreeRenderer.render() (needs refactoring)

**Simplifications Applied:**

- Unified approach: Single FluidSim class instead of multiple fluid utilities
- Reuse existing patterns: Follows ThreeRenderer's EffectComposer pattern
- Minimal API surface: FluidSim exposes only necessary methods for integration
- Performance-first: Start with half-resolution FBOs, dynamic quality adjustment

**Confidence Scores:**

- FluidSim implementation: **85%** - Shader code available, needs Three.js adaptation
- AbilityEffects integration: **DEFERRED** - Ability system not yet integrated, will be addressed later
- Parameter mapping: **90%** - Clear serenity → fluid parameter relationships defined
- Performance optimization: **85%** - Standard techniques (half-res, dynamic quality), existing FPS monitoring

## Current State Analysis

### Rendering Pipeline

**Data Flow:**

```
main.ts (animate loop)
  → ThreeRenderer.render(state, center)
    → WatercolorStateController.update(serenityRatio)
    → GameScene.update(state, center)
    → WatercolorPass.setUniforms() + setPulseData()
    → EffectComposer.render()
      → RenderPass (scene → texture)
      → WatercolorPass (paper effects)
```

**Key Files:**

- `src/main.ts:108-111` - Calls `renderer.render(state, center)` without deltaTime
- `src/rendering/ThreeRenderer.ts:138-179` - Main render loop, updates WatercolorPass
- `src/rendering/watercolor/WatercolorPass.ts:75-82` - Added to EffectComposer pipeline
- `src/rendering/watercolor/WatercolorStateController.ts:66-123` - Maps serenity to visual params

**Evidence:**

- `ThreeRenderer.ts:75-82` shows WatercolorPass instantiation and addition to composer
- `ThreeRenderer.ts:166-172` shows WatercolorPass uniform updates per frame
- `main.ts:82` calculates deltaTime but doesn't pass it to renderer

### Ability Effects System

**Current State:**

- `AbilityEffects` class exists at `src/rendering/scenes/AbilityEffects.ts`
- **NOT currently instantiated** (grep found no `new AbilityEffects` calls)
- Class has methods for all 9 abilities: `updateAura`, `updateRecenterPulse`, `updateExhaleWaves`, etc.
- Screen coordinate conversion already implemented: `x = center.x - width/2`, `y = -(center.y - height/2)`

**Evidence:**

- `AbilityEffects.ts:45-49` - Constructor takes scene, width, height
- `AbilityEffects.ts:78-80` - Screen coordinate conversion pattern (used in updateAura)
- No grep matches for `new AbilityEffects` or `AbilityEffects(` - class is unused

### Performance Infrastructure

**Existing Performance System:**

- `main.ts:22` - `performanceMode` boolean flag
- `main.ts:93-98` - Auto-activates when FPS < 55 (PERFORMANCE_THRESHOLD)
- `GameConfig.ts:151-152` - `TARGET_FPS: 60`, `PERFORMANCE_THRESHOLD: 55`

**Evidence:**

- `main.ts:93-98` shows performance mode activation logic
- `GameConfig.ts:151-152` defines thresholds

## Implementation Plan

### Phase 1: Infrastructure Setup

**Goal:** Create FluidSim wrapper and FluidCompositePass, wire into ThreeRenderer without removing WatercolorPass (A/B testing).

#### 1.1: Create FluidSim.ts

**File:** `src/rendering/watercolor/FluidSim.ts` (new)

**Responsibilities:**

- Manage offscreen FBOs (velocity, pressure, divergence, dye)
- Implement fluid simulation steps (advection, curl, pressure solve, dye advection)
- Expose dye injection API (`injectDye`, `injectVelocity`)
- Provide dye texture for compositing

**Key Methods:**

```typescript
constructor(width: number, height: number, renderer: THREE.WebGLRenderer)
setParams(params: FluidParams): void
step(deltaTime: number): void
injectDye(x: number, y: number, radius: number, color: RGB, strength: number): void
injectVelocity(x: number, y: number, radius: number, velocity: Vector2, strength: number): void
getDyeTexture(): THREE.Texture
resize(width: number, height: number): void
```

**Implementation Notes:**

- Use `THREE.HalfFloatType` for FBOs (performance), fallback to `THREE.FloatType` if not supported
- Start with half-resolution FBOs (`width/2, height/2`) for performance
- Implement full WebGL-Fluid algorithm: advection → curl → divergence → pressure solve → dye advection
- **Shader Source**: Available in `docs/gitingest/michaelbrusegard-webgl-fluid-enhanced-8a5edab282632443.txt`
  - Advection shader: lines 4680-4721
  - Curl shader: lines 4755-4778
  - Divergence shader: lines 4723-4753
  - Pressure shader: lines 4817-4843
  - Gradient subtract shader: lines 4845-4870
  - Splat shader: lines 4656-4678
- **FBO Ping-Pong Pattern**: Use `DoubleFBO` pattern with `read`/`write`/`swap()` (lines 6250-6258)
- **Step Sequence**: curl → vorticity → divergence → pressure (iterative) → gradient subtract → advect velocity → advect dye (lines 5756-5899)
- Adapt WebGL2 FBO creation to Three.js `WebGLRenderTarget` API

**Confidence: 85%** - Shader code available, needs Three.js adaptation

#### 1.2: Create FluidCompositePass.ts

**File:** `src/rendering/watercolor/FluidCompositePass.ts` (new)

**Responsibilities:**

- Composite fluid dye texture over scene texture
- Support overlay/additive blend modes
- Optional subtle refraction (water lensing effect)

**Key Uniforms:**

- `tDiffuse` - Scene texture (from RenderPass)
- `tDye` - Dye texture (from FluidSim)
- `dyeIntensity` - Blend strength (0-1)
- `blendMode` - 'overlay' | 'add'
- `refractionScale` - Refraction strength

**Implementation Pattern:**

- Follows `WatercolorPass.ts:24-129` pattern (extends Pass, fullscreen quad)
- Shader blends dye over scene using overlay or additive blending
- Optional gradient-based refraction for "water lensing" effect

**Confidence: 85%** - Standard post-processing pattern, well-established

#### 1.3: Update WatercolorStateController.ts

**File:** `src/rendering/watercolor/WatercolorStateController.ts`

**Changes:**

- Add fluid parameter getters: `getViscosity()`, `getDyeDissipation()`, `getVelocityDissipation()`, `getCurl()`, `getPressureIters()`, `getRefractionScale()`
- Map existing `wetness` parameter to fluid properties
- Keep existing `getUniforms()` for backward compatibility during transition

**Parameter Mapping (Serenity → Fluid):**

```typescript
// High serenity (calm) → Low viscosity, slow dissipation, less curl
getViscosity(): 0.0008 + (1 - wetness) * 0.001  // 0.0008 to 0.0018
getDyeDissipation(): 0.9 + wetness * 0.07        // 0.9 to 0.97
getVelocityDissipation(): 0.93 + wetness * 0.05  // 0.93 to 0.98
getCurl(): 15 + (1 - wetness) * 20                // 15 to 35
getPressureIters(): Math.round(12 + (1 - wetness) * 10)  // 12 to 22
getRefractionScale(): 0.003 + (1 - wetness) * 0.003  // 0.003 to 0.006
```

**Evidence:**

- `WatercolorStateController.ts:114-117` shows wetness lerping logic
- `WatercolorStateController.ts:21-54` shows serenity-based presets

**Confidence: 90%** - Clear mapping relationships, straightforward implementation

#### 1.4: Update ThreeRenderer.ts (Infrastructure)

**File:** `src/rendering/ThreeRenderer.ts`

**Changes:**

1. Add FluidSim and FluidCompositePass imports
2. Create FluidSim instance in constructor (after composer setup)
3. Add FluidCompositePass to composer (after RenderPass, before WatercolorPass for A/B)
4. Add `deltaTime` parameter to `render()` method signature
5. Update `render()` to step fluid simulation and update composite uniforms
6. Update `resize()` to resize FluidSim

**Key Code Locations:**

- `ThreeRenderer.ts:34-136` - Constructor (add FluidSim/FluidCompositePass setup)
- `ThreeRenderer.ts:138-179` - Render method (add fluid step, update uniforms)
- `ThreeRenderer.ts:296-336` - Resize method (add FluidSim.resize call)

**Integration Pattern:**

```typescript
// In constructor (after line 82):
this.fluid = new FluidSim(this.width, this.height, this.renderer);
this.fluidPass = new FluidCompositePass(this.fluid.getDyeTexture());
this.composer.addPass(this.fluidPass); // Add before WatercolorPass for A/B

// In render() (before composer.render(), after line 172):
const fluidParams = {
  viscosity: this.watercolorController.getViscosity(),
  dyeDissipation: this.watercolorController.getDyeDissipation(),
  velocityDissipation: this.watercolorController.getVelocityDissipation(),
  curl: this.watercolorController.getCurl(),
  pressureIters: this.watercolorController.getPressureIters(),
};
this.fluid.setParams(fluidParams);
this.fluid.step(deltaTime); // NEW: requires deltaTime parameter

this.fluidPass.setUniforms({
  dyeIntensity: 0.75 + (1 - serenityRatio) * 0.25,
  refractionScale: this.watercolorController.getRefractionScale(),
  blendMode: 'overlay',
});
```

**Breaking Change:** `render()` signature changes from `render(state, center)` to `render(state, center, deltaTime, performanceMode?: boolean)`

**Rationale:**

- `deltaTime` required for fluid simulation step
- `performanceMode` optional for dynamic quality adjustment (can default to false if not provided)

**Confidence: 85%** - Clear integration points, follows existing patterns

#### 1.5: Update main.ts (Pass deltaTime)

**File:** `src/main.ts`

**Changes:**

- Update `renderer.render()` call to pass `deltaTime`

**Code Location:**

- `main.ts:108-111` - Change `this.renderer.render(state, center)` to `this.renderer.render(state, center, deltaTime, this.performanceMode)`

**Evidence:**

- `main.ts:82` calculates deltaTime: `const deltaTime = (currentTime - this.lastFrameTime) / 1000`
- `main.ts:108` calls renderer without deltaTime
- `main.ts:22` has `private performanceMode: boolean` available

**Confidence: 95%** - Trivial change, low risk

### Phase 2: Ability-Driven Dye Injection (DEFERRED)

**Status:** DEFERRED - Ability system not yet integrated into game

**Goal:** Integrate AbilityEffects with FluidSim, add dye injection to each ability method.

**Note:** The ability system exists but is not currently integrated into the game rendering pipeline. This phase will be implemented after ability system integration is complete. For now, Phase 1 (fluid infrastructure) can proceed independently.

**Future Work Required:**
1. Integrate ability system into Game class (expose ability state)
2. Pass ability state through ThreeRenderer.render() signature
3. Instantiate AbilityEffects in GameScene or ThreeRenderer
4. Add dye injection calls to AbilityEffects methods

**When Ability System is Ready:**

**2.1: Integrate AbilityEffects into GameScene**
- Add `AbilityEffects` property and instantiation
- Pass FluidSim reference to AbilityEffects constructor
- Add `abilityState?: AbilityState` parameter to `ThreeRenderer.render()`
- Update `main.ts` to pass ability state: `this.renderer.render(state, center, deltaTime, this.performanceMode, abilityState)`

**2.2: Update AbilityEffects Constructor**
- Add optional `fluid?: FluidSim` parameter to constructor
- Store fluid reference for injection calls

**2.3: Add Dye Injection to Ability Methods**

**Breathe (`updateAura`):**
- Inject low-strength continuous dye pulse at center
- Use `getAbilityColor('breathe', ...)` for color
- Radius: 8px, strength: 0.3 * (0.5 + breatheIntensity * 0.5)
- Convert screen coords to normalized: `u = center.x / width, v = 1.0 - center.y / height`

**Recenter (`updateRecenterPulse`):**
- Inject ring dye + outward velocity
- Dye along pulse ring edge, velocity outward from center
- Radius: 12px dye, 14px velocity, strength: 0.6

**Exhale (`updateExhaleWaves`):**
- Inject concentric ring bursts with velocity
- For each wave, inject dye + outward velocity shell
- Radius: 12px dye, 14px velocity, strength: 0.6 * (1 - progress)

**Mantra (`updateMantraBeam`):**
- Inject line of dye along beam (sample 5-10 points along segment)
- Radius: 6px, strength: 0.4 * pulse

**Ground (`updateGroundField`):**
- Inject steady puddle at field position
- Continuous low-strength dye
- Radius: fieldRadius * 0.8, strength: 0.3

**Reflect (`updateReflectBarrier`):**
- Inject circular shell dye
- Radius: 10px, strength: 0.5

**Affirm (`updateAffirmGlow`):**
- Inject golden center dye + increase global dyeIntensity in FluidCompositePass
- Center dye: radius 15px, strength 0.4

**Release (`updateReleaseShockwave`):**
- Inject full-canvas blast with velocity
- Radius: RELEASE_RADIUS, strength: 0.9

**Screen Coordinate Conversion:**
- Use `center.x` and `center.y` directly (already in screen space 0-width, 0-height)
- Convert to normalized (0-1) for fluid injection: `u = center.x / width, v = 1.0 - center.y / height`
- Evidence: `AbilityEffects.ts:78-80` shows Three.js coord conversion, but `center` parameter is already screen space

**Confidence: N/A** - Deferred until ability system integration complete

### Phase 3: Remove Paper Effects

**Goal:** Remove WatercolorPass, soften PlayerCircleShader edge pooling, clean up WatercolorStateController.

#### 3.1: Remove WatercolorPass from ThreeRenderer

**File:** `src/rendering/ThreeRenderer.ts`

**Changes:**

- Remove WatercolorPass import
- Remove WatercolorPass instantiation (lines 75-79)
- Remove WatercolorPass from composer (line 82)
- Remove WatercolorPass uniform updates (lines 166-172)
- Remove pulse data updates (lines 162-163, 169)

**Code Locations:**

- `ThreeRenderer.ts:6` - Remove import
- `ThreeRenderer.ts:75-82` - Remove instantiation and composer.addPass
- `ThreeRenderer.ts:162-172` - Remove WatercolorPass updates

**Confidence: 95%** - Straightforward removal

#### 3.2: Soften PlayerCircleShader

**File:** `src/rendering/scenes/PlayerCircleShader.ts`

**Changes:**

- Reduce edge pooling intensity (line 56: change 0.3 to 0.1)
- Reduce granulation amount (line 64: change 0.1 to 0.03)
- Let fluid layer handle visual effects

**Code Locations:**

- `PlayerCircleShader.ts:51-57` - Edge pooling logic
- `PlayerCircleShader.ts:64` - Granulation amount

**Confidence: 90%** - Simple parameter adjustments

#### 3.3: Clean Up WatercolorStateController

**File:** `src/rendering/watercolor/WatercolorStateController.ts`

**Changes:**

- Deprecate `edgeDarkeningIntensity` (set to 0 or remove from presets)
- Keep `getUniforms()` for backward compatibility but mark as deprecated
- Document that fluid parameters are now primary

**Confidence: 85%** - Backward compatibility maintained

## Performance Considerations

### Half-Resolution FBOs

**Implementation:**

- Start FluidSim with `width/2, height/2` FBOs
- Upscale dye texture using bilinear filtering (automatic with THREE.LinearFilter)
- Monitor FPS, switch to full-res if FPS ≥ 60

**Code Location:**

- `FluidSim.ts` constructor - Use `Math.floor(width/2), Math.floor(height/2)` for FBOs
- Add `performanceMode` parameter to FluidSim, adjust resolution dynamically

**Evidence:**

- `main.ts:22` shows performanceMode flag exists
- `main.ts:93-98` shows performance mode activation logic

**Confidence: 80%** - Standard optimization technique

### Dynamic Quality Adjustment

**Implementation:**

- Reduce `pressureIters` when performanceMode is active
- Reduce `curl` strength when performanceMode is active
- Increase `dyeDissipation` (faster fade) when performanceMode is active

**Code Location:**

- `ThreeRenderer.ts:render()` - Adjust fluid params based on `performanceMode`
- **CRITICAL FIX**: `main.ts:22` has `performanceMode` as private field, not accessible
- **Solution**: Add `performanceMode: boolean` parameter to `ThreeRenderer.render()` signature
- Update `main.ts:108` to pass `this.performanceMode` to renderer

**Evidence:**
- `main.ts:22` shows `private performanceMode: boolean = false`
- `main.ts:93-98` shows performance mode activation logic
- `main.ts:108` calls `renderer.render(state, center)` without performanceMode

**Confidence: 85%** - Clear solution, requires signature change (already breaking change for deltaTime)

## Validation

**Note:** This project is in heavy active development. Validation will be done through manual gameplay and visual inspection. No formal testing infrastructure exists or is planned.

**Basic Checks:**
- Run `npm run dev` - Verify game renders without errors
- Run `npm run build` - Verify production build succeeds
- Visual inspection: Verify fluid simulation appears and behaves correctly
- Performance monitoring: Monitor FPS via existing FPS display in main.ts

**Existing TypeScript Errors:** Build currently has 12 TypeScript errors in `AbilityConfig.ts`, `AbilityDefinitions.ts`, and `TestHarness.ts` unrelated to this plan. These should be fixed separately.

## Risk Mitigation

### Risk 1: WebGL-Fluid Implementation Complexity

**Mitigation:**

- Start with simplified fluid simulation (basic advection + dye)
- Add complexity incrementally (curl, pressure solve)
- Reference WebGL-Fluid-Enhanced source code for shader implementation

**Confidence: 70%** - Well-documented algorithm, but requires careful implementation

### Risk 2: AbilityEffects Integration Dependencies

**Mitigation:**

- Phase 2 deferred until ability system integration is complete
- Phase 1 and Phase 3 can proceed independently
- Ability dye injection will be added when ability system is ready

**Confidence: N/A** - Deferred until ability system integration complete

### Risk 3: Performance Degradation

**Mitigation:**

- Start with half-resolution FBOs
- Implement dynamic quality adjustment
- Monitor FPS, fallback to simpler effects if needed

**Confidence: 80%** - Standard optimization techniques

## Dependencies

### New Dependencies

**None required** - WebGL-Fluid will be implemented from scratch using Three.js WebGL capabilities.

**Alternative:** Could use existing library (e.g., `webgl-fluid` npm package), but plan assumes custom implementation for better integration.

### Existing Dependencies

- `three` (^0.181.1) - WebGL rendering, FBOs, shaders
- `postprocessing` (^6.38.0) - EffectComposer, Pass base class

**Evidence:**

- `package.json:19-20` shows dependencies

## Rollout Strategy

### Commit 1: Infrastructure (Phase 1)

- Add FluidSim.ts and FluidCompositePass.ts
- Update WatercolorStateController with fluid getters
- Wire FluidSim into ThreeRenderer (keep WatercolorPass for A/B)
- Update main.ts to pass deltaTime and performanceMode

### Commit 2: Remove Paper Effects (Phase 3)

- Remove WatercolorPass
- Soften PlayerCircleShader
- Clean up WatercolorStateController

### Commit 3: Ability Dye Injection (Phase 2 - when ability system ready)

- Integrate AbilityEffects with FluidSim
- Add dye injection to all ability methods
- Tune injection parameters

## Success Criteria

1. **Visual:** Liquid ink flows and advects, no paper grain/edge darkening
2. **Performance:** FPS remains ≥ 55 on target hardware (monitored via existing FPS display)
3. **Serenity Mapping:** Fluid parameters respond to serenity changes
4. **No Regressions:** Game still plays correctly, no visual artifacts
5. **Ability Integration:** (Deferred) All 9 abilities inject dye correctly when ability system is integrated

## Analysis Findings

### Critical Issues Found

1. **Screen Coordinate Conversion Error (FIXED)**
   - **Issue**: Plan incorrectly stated to convert Three.js coords back to screen space
   - **Reality**: `center` parameter is already in screen space (0-width, 0-height)
   - **Fix**: Use `center.x` and `center.y` directly for fluid injection
   - **Evidence**: `AbilityEffects.ts:78-80` shows conversion to Three.js space, but `center` parameter is already screen space

2. **AbilityEffects Integration Gap (DEFERRED)**
   - **Issue**: Plan assumed ability system integration exists
   - **Reality**: Ability system exists but is not integrated into game rendering pipeline
   - **Decision**: Defer Phase 2 until ability system integration is complete
   - **Evidence**: No grep matches for `new AbilityEffects`, `ThreeRenderer.render()` doesn't receive ability state, `Game.ts` is simplified and doesn't expose ability system

3. **Performance Mode Access (FIXED)**
   - **Issue**: Plan didn't address how to access `performanceMode` from main.ts
   - **Reality**: `performanceMode` is private field in GameApp class
   - **Fix**: Add `performanceMode` parameter to `ThreeRenderer.render()` signature
   - **Evidence**: `main.ts:22` shows `private performanceMode: boolean`

4. **TypeScript Build Errors (NOTED)**
   - **Issue**: Build has existing errors unrelated to this plan
   - **Reality**: 12 TypeScript errors in AbilityConfig, AbilityDefinitions, TestHarness
   - **Action**: Note in plan, fix separately
   - **Evidence**: `npm run build` output shows errors

### Over-Engineering Review

**Simplifications Applied:**

1. **Unified FluidSim Class**: Single class instead of separate velocity/dye managers - **GOOD**
2. **Reuse Pass Pattern**: FluidCompositePass follows WatercolorPass pattern - **GOOD**
3. **Half-Resolution Start**: Performance-first approach - **GOOD**
4. **Optional Ability State**: Phase 2 can be deferred if ability system not ready - **GOOD**

**Potential Over-Engineering:**

1. **Refraction Effect**: Optional "water lensing" refraction may be unnecessary complexity
   - **Assessment**: Keep as optional uniform, can disable if performance issue
   - **Decision**: Keep, but mark as optional

2. **Multiple Blend Modes**: Overlay vs Additive blend modes
   - **Assessment**: Start with overlay only, add additive if needed
   - **Decision**: Keep both, but start with overlay

### Holistic Approach Review

**Pattern Consistency:**

- ✅ Follows existing EffectComposer pattern (WatercolorPass)
- ✅ Follows existing parameter mapping pattern (WatercolorStateController)
- ✅ Follows existing coordinate conversion pattern (GameScene)
- ✅ Maintains existing serenity-driven parameter system

**Unified Solutions:**

- ✅ Single FluidSim class instead of multiple utilities
- ✅ Reuses existing Pass base class from postprocessing
- ✅ Reuses existing color palette system (ColorPalette.ts)
- ✅ Maintains existing state controller pattern

**Predictability:**

- ✅ Clear API surface (FluidSim methods well-defined)
- ✅ Consistent with existing rendering pipeline
- ✅ Follows existing file organization (watercolor/ directory)

## Open Questions

1. **WebGL-Fluid Shader Source:** Should we port from WebGL-Fluid-Enhanced or implement from scratch?
   - **Answer**: Port from WebGL-Fluid-Enhanced (source code available in `docs/gitingest/michaelbrusegard-webgl-fluid-enhanced-8a5edab282632443.txt`)
   - **Status**: Shader code available, needs Three.js adaptation

2. **Ability System Integration:** Does ability state data flow through GameScene, or separate integration needed?
   - **Answer**: DEFERRED - Ability system not yet integrated. Will be addressed when ability system integration is complete.

3. **Performance Baseline:** What's current FPS on target hardware?
   - **Status**: Unknown. Plan includes performance monitoring via existing FPS tracking in main.ts. Will be measured during development.

## Analysis Scorecard

**Overall Plan Quality: 88%**

**Strengths:**
- Clear phase breakdown
- Well-documented evidence and code references
- Performance considerations included
- Risk mitigation addressed
- Shader source code available (major gap filled)

**Issues Fixed:**
- Screen coordinate conversion corrected
- Performance mode access clarified
- Ability system integration deferred (acknowledged as future work)
- TypeScript errors noted
- Testing removed (project in heavy development)

**Remaining Risks:**
- WebGL-Fluid shader implementation complexity (85% confidence - shader code available, needs Three.js adaptation)
- Ability system integration dependency (DEFERRED - will be addressed when ability system ready)
- Performance impact unknown without baseline (mitigated by half-res start and existing FPS monitoring)

**Recommendation: APPROVE - Plan is ready for Phase 1 and Phase 3 implementation. Phase 2 deferred until ability system integration complete.**