/**
 * Developer Panel Presets Manager
 * 
 * Handles saving, loading, and managing presets for developer panel settings.
 * Uses localStorage for persistence.
 */

export interface PresetData {
  settings: Record<string, unknown>;
  timestamp: number;
}

export class DevPanelPresets {
  private static STORAGE_KEY = 'dev_panel_presets';

  /**
   * Save current settings as a preset.
   */
  static save(name: string, settings: Record<string, unknown>): void {
    const presets = this.loadAll();
    presets[name] = {
      settings,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }

  /**
   * Load a preset by name.
   */
  static load(name: string): Record<string, unknown> | null {
    const presets = this.loadAll();
    return presets[name]?.settings || null;
  }

  /**
   * Delete a preset.
   */
  static delete(name: string): void {
    const presets = this.loadAll();
    delete presets[name];
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  }

  /**
   * List all preset names.
   */
  static list(): string[] {
    return Object.keys(this.loadAll());
  }

  /**
   * Get preset metadata (name and timestamp).
   */
  static getPresetInfo(name: string): { name: string; timestamp: number } | null {
    const presets = this.loadAll();
    const preset = presets[name];
    if (!preset) return null;
    return {
      name,
      timestamp: preset.timestamp
    };
  }

  /**
   * Load all presets from storage.
   */
  private static loadAll(): Record<string, PresetData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load presets:', error);
      return {};
    }
  }

  /**
   * Clear all presets.
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear presets:', error);
    }
  }
}

