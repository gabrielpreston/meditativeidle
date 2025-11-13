/**
 * Keyboard Manager
 * 
 * Centralized, reliable keyboard event handling system.
 * Provides priority-based handler registration, context-aware routing,
 * and debouncing at the event level.
 */

export type KeyIdentifier = string; // e.code (physical) or e.key (character)
export type KeyboardContext = 'global' | 'devPanel';

export interface KeyboardHandler {
  priority: number; // Higher = checked first
  context?: KeyboardContext; // If specified, only active in this context
  key?: KeyIdentifier | KeyIdentifier[]; // Support multiple key identifiers (optional for catch-all handlers)
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  handler: (event: KeyboardEvent) => boolean; // Return true if handled
  preventDefault?: boolean;
  stopPropagation?: boolean;
  debounceMs?: number; // Optional debouncing per handler
}

export class KeyboardManager {
  private handlers: KeyboardHandler[] = [];
  private activeContext: KeyboardContext = 'global';
  private keyStates: Map<string, boolean> = new Map(); // For state-based queries
  private lastKeyPress: Map<string, number> = new Map(); // For debouncing
  private boundKeydown: (e: KeyboardEvent) => void;
  private boundKeyup: (e: KeyboardEvent) => void;

  constructor() {
    // Bind handlers to preserve 'this' context
    this.boundKeydown = this.handleKeyDown.bind(this);
    this.boundKeyup = this.handleKeyUp.bind(this);
    
    // Use capture phase for global shortcuts to ensure they're checked first
    document.addEventListener('keydown', this.boundKeydown, true);
    document.addEventListener('keyup', this.boundKeyup, true);
  }

  /**
   * Register a keyboard handler.
   * Returns an unregister function.
   */
  register(handler: KeyboardHandler): () => void {
    this.handlers.push(handler);
    // Sort by priority (highest first)
    this.handlers.sort((a, b) => b.priority - a.priority);
    
    // Return unregister function
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Set the active context.
   */
  setContext(context: KeyboardContext): void {
    this.activeContext = context;
  }

  /**
   * Get current context.
   */
  getContext(): KeyboardContext {
    return this.activeContext;
  }

  /**
   * Check if a key is currently pressed (for state-based queries).
   */
  isKeyPressed(key: KeyIdentifier): boolean {
    return this.keyStates.get(key) === true;
  }

  /**
   * Handle keydown events.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.normalizeKey(event);
    this.keyStates.set(key, true);

    // Find matching handlers
    const matchingHandlers = this.findMatchingHandlers(event, key);
    
    for (const handler of matchingHandlers) {
      // Check context FIRST (before debounce) - handlers not in context shouldn't be checked for debounce
      if (handler.context && handler.context !== this.activeContext) {
        continue; // Skip handlers not in current context
      }

      // Check debouncing AFTER context check
      if (handler.debounceMs) {
        const lastPress = this.lastKeyPress.get(key) || 0;
        const now = Date.now();
        if (now - lastPress < handler.debounceMs) {
          continue; // Skip this handler due to debounce
        }
        this.lastKeyPress.set(key, now);
      }

      // Check modifiers
      if (handler.modifiers) {
        if (handler.modifiers.ctrl !== undefined && handler.modifiers.ctrl !== event.ctrlKey) continue;
        if (handler.modifiers.shift !== undefined && handler.modifiers.shift !== event.shiftKey) continue;
        if (handler.modifiers.alt !== undefined && handler.modifiers.alt !== event.altKey) continue;
        if (handler.modifiers.meta !== undefined && handler.modifiers.meta !== event.metaKey) continue;
      }

      // Execute handler
      const handled = handler.handler(event);
      
      if (handled) {
        if (handler.preventDefault) {
          event.preventDefault();
        }
        if (handler.stopPropagation) {
          event.stopPropagation();
        }
        return; // Stop processing after first handler handles it
      }
    }
  }

  /**
   * Handle keyup events.
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = this.normalizeKey(event);
    this.keyStates.set(key, false);
  }

  /**
   * Find handlers that match the event.
   */
  private findMatchingHandlers(event: KeyboardEvent, normalizedKey: string): KeyboardHandler[] {
    // First, find all handlers that match the key specifically (not catch-all)
    const specificHandlers = this.handlers.filter(handler => {
      if (!handler.key) {
        return false; // Skip catch-all handlers for now
      }
      const keys = Array.isArray(handler.key) ? handler.key : [handler.key];
      return keys.some(k => {
        // Support both e.code (physical) and e.key (character)
        return k === event.code || k === event.key || k === normalizedKey;
      });
    });
    
    // If there are specific handlers for this key, exclude catch-all handlers
    // This prevents catch-all handlers from interfering with specific key handlers
    if (specificHandlers.length > 0) {
      return specificHandlers;
    }
    
    // If no specific handlers, include catch-all handlers
    return this.handlers.filter(handler => {
      // If no key specified, it's a catch-all handler
      if (!handler.key) {
        return true; // Include catch-all handlers when no specific handlers exist
      }
      const keys = Array.isArray(handler.key) ? handler.key : [handler.key];
      return keys.some(k => {
        // Support both e.code (physical) and e.key (character)
        return k === event.code || k === event.key || k === normalizedKey;
      });
    });
  }

  /**
   * Normalize key identifier for consistent comparison.
   * Prefers e.code for physical keys (layout-independent), falls back to e.key.
   */
  private normalizeKey(event: KeyboardEvent): string {
    return event.code || event.key;
  }

  /**
   * Cleanup - remove event listeners.
   */
  destroy(): void {
    document.removeEventListener('keydown', this.boundKeydown, true);
    document.removeEventListener('keyup', this.boundKeyup, true);
    this.handlers = [];
    this.keyStates.clear();
    this.lastKeyPress.clear();
  }
}

// Singleton instance
let keyboardManagerInstance: KeyboardManager | null = null;

/**
 * Get the global keyboard manager instance.
 */
export function getKeyboardManager(): KeyboardManager {
  if (!keyboardManagerInstance) {
    keyboardManagerInstance = new KeyboardManager();
  }
  return keyboardManagerInstance;
}

