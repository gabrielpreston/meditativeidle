# Analyze game state and performance, present findings

## Overview

Conduct a deep analysis of the game state and performance using npm scripts and browser dev tools

## Steps

-  **Analyze game performance**
  -  Use browser DevTools Performance tab to profile the game
  -  Use `npm run dev` to start development server
  -  Monitor FPS in browser console
  -  Check for performance bottlenecks in game loop
  -  Analyze memory usage and identify memory leaks
-  **Establish context**
  -  Inspect the TypeScript codebase to correlate what the code is doing
  -  Focus on type annotations and error handling patterns
  -  Review game loop implementation in `src/main.ts`
  -  Review game state management in `src/Game.ts`
-  **Game state hygiene**
  -  Report on the hygiene of game state validation
  -  Focus on state validation patterns from `src/Game.ts`
  -  Identify where adding or removing validation would benefit troubleshooting
-  **Evidence-based reporting**
  -  Cite specific console logs with timestamps when reporting issues
  -  Reference actual code locations that correlate with performance patterns
  -  Use "prove your homework" principle: show code excerpts, not just descriptions
  -  Provide file paths and line numbers for recommended code changes
  -  When correlating performance to code, show the actual code that generated the performance issues
-  **Fix issues systematically**
  -  Implement fixes for any recommended changes you have
  -  Use `npm run dev` to validate changes
  -  Use `npm test` to verify game logic still works correctly
