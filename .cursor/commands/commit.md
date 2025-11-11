# Run All Validations, Fix Failures, Generate Commit

## Overview
Execute the full validation suite using npm scripts and systematically fix any failures, ensuring code quality and functionality, and commit changes with fixes

## Steps
- **Run validation suite**
  - Run `npm run type-check` to check TypeScript types
  - Run `npm run lint` to check code quality
  - Run `npm test` to run test suite
  - Capture output and identify failures
- **Analyze failures**
  - Categorize by type: type errors, linting issues, test failures
  - Check if failures are related to recent changes
  - Focus on type checking errors first (TypeScript strict mode)
  - Analyze failures against codebase to determine root cause
- **Fix issues systematically**
  - Prioritize type checking errors (TypeScript failures)
  - Fix linting issues using `npm run lint -- --fix` when possible
  - Fix test failures one at a time
  - Re-run validations after each fix using `npm test` and `npm run lint`
- **Generate commit for changes**
  - Analyze the totality of changes made
  - Generate an appropriate commit title and description
  - Share commit title and description for review and confirmation before applying
