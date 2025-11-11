1.  Refresh yourself on the plan's details to make sure you are up to date.
2.  Use the `date` command to determine today's date in YYYY-MM-DD format
3.  Update the plan status with today's date noting it is In Progress.
4.  Begin implementation of the plan.
5.  Always prioritize using `npm` scripts when testing and validating changes.
    -  **NPM Script Investigation:**
        -  Use `npm run` to discover all available npm scripts and understand project workflows.
        -  Review package.json to identify build, test, and validation scripts.

    -  **Full Validation Suite**:
        -  `npm run type-check` - Run TypeScript type checking
        -  `npm run lint` - Run ESLint
        -  `npm test` - Run test suite
        -  `npm run lint -- --fix` - Auto-fix linting issues

    -  **Testing Targets**:
        -  `npm test` – Run all tests
        -  `npm test -- --watch` – Run tests in watch mode
        -  `npm test -- Game.test.ts` – Run specific test file
        -  `npm test -- -t "should update wave timer"` – Run tests matching pattern
        -  `npm test -- --coverage` – Run tests with coverage

    -  **Type Checking**:
        -  `npm run type-check` – Check TypeScript types
        -  `npx tsc --noEmit` – Direct TypeScript type checking
6.  When done, update the plan status using today's date noting it is Completed.
