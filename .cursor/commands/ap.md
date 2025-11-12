# Analyze and update proposed plan for correctness/accuracy

## Overview

Conduct a deep analysis of the correctness/validity of the proposed plan, present your findings, and integrate the fixes into the plan.

## Steps

-  **Mark Plan Status Being Analyzed**
   -  Use the `date` command to determine today's date and time in YYYY-MM-DD HH:mm format
   -  Update the plan status with today's date and noting it is Being Analyzed
-  **Analyze proposed plan**
   -  Read in the contents of the attached proposed plan (ensure not operating on a cached version).
-  **Establish context**
  -  Inspect the codebase to correlate what the code is currently doing.
  -  Use `npm run type-check` to check current codebase state and identify any existing issues
  -  Use `npm run` to discover all available npm scripts and understand project structure
  -  Validate plan against official online documentation, available MCP tools, and the holistic picture of the project.
  -  Audit the entire plan for correctness and gaps.
-  **Review for over-engineering and holistic approach**
  -  **Over-engineering check**: Are any solutions unnecessarily complex? Can simpler approaches achieve the same goals?
  -  **Scope assessment**: Are fixes too narrow in scope? Could they be applied more holistically in a more unified and predictable way?
  -  **Pattern unification**: Could multiple narrow fixes be replaced with a single, more predictable solution that addresses root causes rather than symptoms?
  -  **Predictability analysis**: Does the plan establish consistent patterns that will make future changes easier, or does it create ad-hoc solutions that will complicate maintenance?
  -  **Holistic alternatives**: Identify opportunities to apply changes more holistically and propose unified approaches where applicable.
  -  **Validation**: Use `npm test` and `npm run lint` to validate any code examples or assumptions in the plan against current codebase state
-  **Validate assumptions with evidence ("Prove Your Homework")**
  -  For each claim in the plan (e.g., "follows existing patterns", "integrates with X"), require specific code citations
  -  Use the "prove your homework" principle: cite file paths, line numbers, and actual code examples
  -  Verify integration points by showing actual code, not just describing them
  -  Validate architectural decisions against existing codebase patterns
  -  When claiming performance improvements, provide concrete examples or benchmarks
  -  When proposing new patterns, show how they align with or extend existing patterns
-  **Always think about keeping project documentation fresh**
   -  Analyze existing project documentation across the codebase and what changes will need to be made for the proposed plan.
-  **Ensure adherence to plan structure**
   -  Make sure the plan has the appropriate references.
   -  Make sure the plan has a validation section after making changes.
-  **Report findings**
   -  You do not need to worry about backwards compatibility. This project is in active heavy development. Cut over directly without feature flags or rollbacks.
   -  Be explicit about which steps will not be implemented, if any.
   -  Explicitly call out any over-engineering issues found and holistic alternatives considered.
   -  Ask questions if you have any, or present findings and a proposal for me to approve. Provide a confidence score on stages of your plan, especially when there are options.
-  **Mark Plan Status Analysis Complete**
   -  Update the plan status with today's date and noting analysis has been completed
   -  After finishing with updates to the document, include a scorecard of the analysis following right after the plan status
