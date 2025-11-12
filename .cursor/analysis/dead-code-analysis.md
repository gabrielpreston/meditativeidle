# Dead Code Analysis - Liquid Watercolor Migration

**Analysis Date:** 2025-11-12  
**Migration Status:** Phase 1 & 3 Complete  
**Cleanup Status:** ✅ COMPLETED - 2025-11-12

## Summary

After migrating from paper watercolor to liquid watercolor aesthetic, several pieces of code are now dead or deprecated:

1. **`edgeDarkeningIntensity`** - Completely unused (set to 0.0 everywhere)
2. **`getUniforms()` method** - Deprecated but still called by `WatercolorUIRenderer`
3. **Unused parameters** - `bleedRadius`, `pigmentSaturation`, `toonThreshold` may be unused
4. **Documentation references** - Outdated references to deleted `WatercolorPass.ts`

## Dead Code Details

### 1. `edgeDarkeningIntensity` (DEAD)

**Location:** `src/rendering/watercolor/WatercolorStateController.ts`

**Status:** Completely unused - set to 0.0 in all presets, deprecated, never read

**References:**
- Line 4: Interface definition
- Lines 21, 29, 37, 45: Preset values (all 0.0)
- Lines 96-98: Lerp calculation (unnecessary)
- Line 137: Returned in deprecated `getUniforms()` method

**Action:** Remove from `StatePreset` interface and all preset definitions

### 2. `getUniforms()` Method (DEPRECATED BUT USED)

**Location:** `src/rendering/watercolor/WatercolorStateController.ts:135`

**Status:** Deprecated but still called by `WatercolorUIRenderer.ts:63`

**Usage:**
- `WatercolorUIRenderer.ts` calls `getUniforms()` to get `diffusionRate`
- Only `diffusionRate` is actually used from the returned object

**Action:** 
- Option A: Keep method but add direct `getDiffusionRate()` getter
- Option B: Refactor `WatercolorUIRenderer` to use direct getter

### 3. Potentially Unused Parameters

**Location:** `src/rendering/watercolor/WatercolorStateController.ts`

**Parameters:**
- `bleedRadius` - Not found in any usage outside of `getUniforms()` return
- `pigmentSaturation` - Not found in any usage outside of `getUniforms()` return  
- `toonThreshold` - Not found in any usage outside of `getUniforms()` return

**Status:** These are returned by `getUniforms()` but may not be used anywhere

**Action:** Verify if these are used, if not, remove from interface and presets

### 4. `diffusionRate` (USED)

**Location:** `src/rendering/watercolor/WatercolorStateController.ts`

**Status:** Still actively used by `WatercolorUIRenderer.ts:64`

**Usage:** Controls fluid field intensity in UI rendering

**Action:** Keep, but consider adding direct getter instead of using deprecated `getUniforms()`

### 5. `wetness` (ACTIVE)

**Location:** `src/rendering/watercolor/WatercolorStateController.ts`

**Status:** Actively used by all fluid parameter getters:
- `getViscosity()` - Line 149
- `getDyeDissipation()` - Line 154
- `getVelocityDissipation()` - Line 159
- `getCurl()` - Line 164
- `getPressureIters()` - Line 169
- `getRefractionScale()` - Line 174

**Action:** Keep - this is the primary parameter driving fluid simulation

## Documentation Issues

### Outdated References

**File:** `docs/design/WATERCOLOR_ART_DIRECTION.md:132`

**Issue:** References `WatercolorPass.ts` which was deleted in Phase 3

**Action:** Update documentation to reference `FluidSim.ts` and `FluidCompositePass.ts` instead

## Cleanup Actions (COMPLETED)

### ✅ Completed Actions

1. **Removed `edgeDarkeningIntensity`**
   - ✅ Removed from `StatePreset` interface
   - ✅ Removed from all preset definitions
   - ✅ Removed from lerp calculation

2. **Removed unused parameters**
   - ✅ Removed `bleedRadius` from interface and presets
   - ✅ Removed `pigmentSaturation` from interface and presets
   - ✅ Removed `toonThreshold` from interface and presets

3. **Refactored `WatercolorUIRenderer`**
   - ✅ Added `getDiffusionRate()` method to `WatercolorStateController`
   - ✅ Updated `WatercolorUIRenderer.ts:63` to use direct getter
   - ✅ Removed deprecated `getUniforms()` method

4. **Updated documentation**
   - ✅ Updated `WATERCOLOR_ART_DIRECTION.md` to reference new fluid system
   - ✅ Removed references to deleted `WatercolorPass.ts`

### Low Priority

5. **Clean up comments**
   - Remove "Deprecated - paper effects removed" comments after cleanup
   - Update JSDoc comments to reflect current state

## Code That Should Stay

- `wetness` - Core parameter for fluid simulation
- `diffusionRate` - Used by UI renderer (but should use direct getter)
- All fluid parameter getters (`getViscosity()`, `getDyeDissipation()`, etc.)
- `WatercolorUIRenderer` - Still actively used for UI rendering
- All "wobble" references - These are for UI animation, not paper texture

## Files to Modify

1. `src/rendering/watercolor/WatercolorStateController.ts`
   - Remove `edgeDarkeningIntensity`
   - Add `getDiffusionRate()` method
   - Optionally remove unused parameters
   - Optionally remove deprecated `getUniforms()` method

2. `src/rendering/ui/WatercolorUIRenderer.ts`
   - Update to use `getDiffusionRate()` instead of `getUniforms().diffusionRate`

3. `docs/design/WATERCOLOR_ART_DIRECTION.md`
   - Update references to new fluid system

