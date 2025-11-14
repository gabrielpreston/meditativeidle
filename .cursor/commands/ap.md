# Analyze Plan - Validate and update proposed plan for correctness

## Purpose

Conduct a deep analysis of the correctness and validity of a proposed plan, present findings, and integrate fixes into the plan. Validate plan against codebase, documentation, and project standards.

## When to Use

Use this command when:

- A plan has been created (via `cp.md`) and needs validation
- You need to verify plan assumptions against actual codebase state
- You want to ensure plan follows project patterns and standards
- You need to identify gaps or over-engineering in the plan

## Prerequisites

Before executing this command, ensure:

- Plan document exists in `.cursor/plans/` directory
- Plan has been created (status should be "Plan Created" or similar)
- Access to codebase, npm scripts, and project documentation
- Ability to read files and execute validation commands

## AI Execution Steps

### Phase 1: Context Gathering

1. **Mark plan status as Being Analyzed**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `read_file` to read plan document
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Use `search_replace` to update plan status
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Plan Created"`, `new_string: "**Plan Status**: Plan Created\n**Plan Status**: Being Analyzed - {date}"`

2. **Read plan contents (ensure not cached)**
   - Use `read_file` to read entire plan document
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Identify plan structure, phases, and proposed changes

3. **Establish codebase context**
   - Use `codebase_search` to understand current implementation
     - Example: `codebase_search` with `query: "How does [relevant system] work?"` and `target_directories: ["src"]`
   - Use `run_terminal_cmd` to check codebase state
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to discover npm scripts
     - Command: `npm run` with `is_background: false`
   - Use `read_file` to review package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Use `codebase_search` to find GitHub workflows
     - Example: `codebase_search` with `query: "GitHub Actions workflows"` and `target_directories: [".github"]`
   - Use `read_file` to review project documentation standards
     - Example: `read_file` with `target_file: ".cursor/rules/default-documentation.mdc"`

### Phase 2: Analysis

1. **Review for over-engineering and holistic approach**
   - Use `codebase_search` to find similar implementations
     - Example: `codebase_search` with `query: "How is [similar feature] implemented?"` and `target_directories: ["src"]`
   - Assess if plan solutions are unnecessarily complex
   - Check if fixes are too narrow in scope
   - Evaluate if unified patterns could replace multiple narrow fixes
   - Assess predictability and maintainability of proposed changes

2. **Validate assumptions with evidence ("Prove Your Homework")**
   - For each claim in plan (e.g., "follows existing patterns"):
     - Use `grep` to find pattern in codebase
       - Example: `grep` with `pattern: "claimed-pattern"` and `path: "src"`
     - Use `read_file` to verify specific code references
       - Example: `read_file` with `target_file: "file.ts"` and `offset: start_line` and `limit: end_line - start_line`
     - Use `codebase_search` to find integration points
       - Example: `codebase_search` with `query: "How does [component] integrate with [other component]?"` and `target_directories: ["src"]`
   - Verify architectural decisions against existing patterns
   - Validate npm script assumptions
     - Use `read_file` to check package.json for referenced scripts
       - Example: `read_file` with `target_file: "package.json"`
   - Cross-reference multiple sources when possible

3. **Validate plan against codebase state**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting (if script exists)
     - Command: `npm run lint` with `is_background: false` (verify script exists first)
   - Use `run_terminal_cmd` to run tests (if script exists)
     - Command: `npm test` with `is_background: false` (verify script exists first)
   - Compare plan assumptions with actual codebase state

4. **Analyze documentation impact**
   - Use `codebase_search` to find existing documentation
     - Example: `codebase_search` with `query: "documentation files"` and `target_directories: ["docs", ".cursor"]`
   - Use `grep` to find documentation references
     - Example: `grep` with `pattern: "\.md"` and `path: "."`
   - Identify what documentation needs updating for proposed plan

5. **Ensure plan structure adherence**
   - Use `read_file` to verify plan has required sections
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Check for appropriate references and citations
   - Verify validation section exists

### Phase 3: Reporting and Integration

1. **Report findings**
   - Identify which steps will not be implemented (if any)
   - Explicitly call out over-engineering issues and holistic alternatives
   - Provide confidence scores for plan stages, especially when options exist
   - Use `search_replace` to add analysis findings to plan
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "## Implementation Plan"`, `new_string: "## Analysis Findings\n\n[Findings content]\n\n## Implementation Plan"`

2. **Integrate fixes into plan**
   - Use `search_replace` to update plan sections with corrections
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "incorrect content"`, `new_string: "corrected content"`
   - Add evidence citations with file paths and line numbers
   - Update confidence scores based on findings
   - Add scorecard near beginning of plan document

3. **Mark plan status as Analysis Complete**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Being Analyzed"`, `new_string: "**Plan Status**: Being Analyzed\n**Plan Status**: Analysis Complete - {date}"`
   - Add analysis scorecard after plan status
     - Use `search_replace` to insert scorecard section
       - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Analysis Complete"`, `new_string: "**Plan Status**: Analysis Complete\n\n#### Analysis Scorecard\n\n[Scorecard content]"`

## Error Handling

- **Plan file not found**: If plan document doesn't exist
  - Detection: `read_file` fails or file not found
  - Resolution: Ask user for plan file path or verify plan was created

- **npm script not found**: If referenced npm script doesn't exist
  - Detection: `run_terminal_cmd` returns error or `read_file` shows script missing from package.json
  - Resolution: Note missing script in analysis findings, recommend adding script or using alternative

- **Code references not found**: If claimed patterns cannot be found
  - Detection: `codebase_search` or `grep` returns no results
  - Resolution: Mark claim as unsubstantiated in analysis, recommend removing or correcting claim

- **Type checking errors**: If `npm run type-check` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code
  - Resolution: Note existing type errors in analysis, plan should account for fixing these

- **Plan structure issues**: If plan missing required sections
  - Detection: `read_file` shows missing sections
  - Resolution: Add missing sections in analysis findings, integrate into plan

## Success Criteria

- [ ] Plan status updated to "Being Analyzed" with current date
- [ ] Plan contents read and analyzed (not cached)
- [ ] Codebase context established (type-check, npm scripts, documentation reviewed)
- [ ] Plan reviewed for over-engineering and holistic approach
- [ ] All plan claims validated with evidence (file paths, line numbers)
- [ ] Plan validated against actual codebase state
- [ ] Documentation impact analyzed
- [ ] Plan structure verified for adherence
- [ ] Findings reported with confidence scores
- [ ] Fixes integrated into plan document
- [ ] Plan status updated to "Analysis Complete" with date
- [ ] Analysis scorecard added to plan document

## Output Format

Analysis results integrated into plan document:

- Plan status updated with analysis dates
- Analysis findings section added with:
  - Scorecard table
  - Critical findings
  - Over-engineering review
  - Evidence validation results
  - Recommendations
- Plan sections updated with corrections and evidence citations
- Confidence scores updated based on findings

## Notes

- Always read plan document fresh (not cached) to ensure current version
- Use `codebase_search` and `grep` to verify all claims with evidence
- Cite specific file paths and line numbers for all validated claims
- Check npm script existence before referencing in validation
- Provide confidence scores for each plan phase, especially when options exist
- Explicitly call out over-engineering and propose holistic alternatives
- Add analysis scorecard near beginning of plan after status updates
