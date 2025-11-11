export const dev = {
  log: (...args: unknown[]) => {
    // @ts-ignore - Vite provides import.meta.env
    if (import.meta.env?.DEV) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    // @ts-ignore - Vite provides import.meta.env
    if (import.meta.env?.DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args); // Always show errors
  },
};

