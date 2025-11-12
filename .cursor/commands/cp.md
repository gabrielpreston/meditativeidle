Design a plan that will address the above analysis of the problem we are trying to solve.
Make sure you do a thorough deep dive into the codebase and trace out all data flows and dependency trees in order to understand the holistic implications of the problem and potential changes.
This investigation should extend beyond the codebase to include GitHub Workflows, npm scripts, existing documentation, tools, and scripts.

**NPM Script Investigation**:
- Use `npm run` to discover all available npm scripts and understand project workflows
- Review package.json to understand available build, test, and validation scripts
- Consider how npm scripts relate to the problem and whether they should be part of the solution
- Use `npm run type-check` and `npm test` to check current codebase state before planning changes
- Reference relevant npm scripts in the plan for validation and testing steps

## Review for Over-Engineering and Holistic Approach

Before finalizing the plan, review it for:

-  **Over-engineering**: Are any solutions unnecessarily complex? Can simpler approaches achieve the same goals?
-  **Narrow scope**: Are fixes too localized when a more unified, predictable pattern could solve the problem more holistically?
-  **Unified patterns**: Could multiple narrow fixes be replaced with a single, more predictable solution that addresses the root cause?
-  **Predictability**: Does the plan establish consistent patterns that will make future changes easier, or does it create ad-hoc solutions?
-  **Evidence-Based Planning**:
  -  When claiming to follow existing patterns, cite specific files and line numbers
  -  When describing integration points, show actual code references
  -  When proposing architectural changes, reference existing architectural decisions
  -  Use "prove your homework" principle: provide evidence for all assertions

## Scorecards and Confidence Scores

-  Provide your confidence score for each change with supporting arguments, and explicitly note where you've simplified or unified approaches based on this review.
-  After finishing with updates to the document, include a scorecard of the initial proposal near the beginning of the document.
-  Use the `date` command to determine today's date and time in YYYY-MM-DD HH:mm format.
-  Add the Plan Created date to the top of the document.
