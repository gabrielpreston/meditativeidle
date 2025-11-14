# Create Plan - Design comprehensive plan for problem analysis

## Purpose

Design a plan that addresses the analysis of a problem by conducting a thorough deep dive into the codebase, tracing data flows and dependency trees, and understanding holistic implications including GitHub Workflows, npm scripts, existing documentation, tools, and scripts.

## When to Use

Use this command when:

- You have completed an analysis of a problem and need a structured plan to address it
- You need to understand the full scope of changes required across the codebase
- You want to ensure all dependencies, workflows, and documentation are considered in planning
- You need evidence-based planning with specific code citations

## Prerequisites

Before executing this command, ensure:

- Problem analysis has been completed and is available
- Access to codebase, GitHub workflows, and project documentation
- Ability to read files and execute npm scripts

## AI Execution Steps

### Phase 1: Context Gathering

1. **Gather problem context**
   - Use `read_file` to read the problem analysis or attached context
     - Example: `read_file` with `target_file: "analysis-file.md"` or read attached files
   - Use `codebase_search` to understand the problem domain
     - Example: `codebase_search` with `query: "How does [problem area] work?"` and `target_directories: []`
   - Use `grep` to find related code patterns
     - Example: `grep` with `pattern: "relevant-pattern"` and `path: "src"`

2. **Investigate npm scripts and project structure**
   - Use `run_terminal_cmd` to discover available npm scripts
     - Command: `npm run` with `is_background: false`
   - Use `read_file` to review package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Use `codebase_search` to find GitHub workflows
     - Example: `codebase_search` with `query: "GitHub Actions workflows"` and `target_directories: [".github"]`
   - Use `read_file` to review existing documentation
     - Example: `read_file` with `target_file: ".cursor/rules/default-documentation.mdc"`

3. **Trace data flows and dependencies**
   - Use `codebase_search` to trace data flows
     - Example: `codebase_search` with `query: "How does data flow through [system]?"` and `target_directories: ["src"]`
   - Use `grep` to find dependency imports
     - Example: `grep` with `pattern: "import.*from"` and `path: "src"`

### Phase 2: Plan Creation

1. **Create plan document**
   - Use `run_terminal_cmd` to get current date for plan metadata
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `write` to create plan file in `.cursor/plans/` directory
     - File naming: `{plan-name}-{uuid}.plan.md`
     - Structure: HTML comment UUID, plan title, plan metadata, standard sections

2. **Define plan structure**
   - Problem Analysis section
   - Solution Approach section
   - Implementation Plan with phases
   - Validation Strategy section
   - Success Criteria section
   - Risk Mitigation section
   - Dependencies section
   - Implementation Order section
   - To-dos section

3. **Populate plan with evidence-based content**
   - Use `codebase_search` to find existing patterns
     - Example: `codebase_search` with `query: "How is [pattern] implemented?"` and `target_directories: ["src"]`
   - Cite specific files and line numbers when claiming to follow patterns
   - Use `read_file` to verify integration points
     - Example: `read_file` with `target_file: "specific-file.ts"` and `offset: start_line` and `limit: end_line - start_line`

4. **Review for over-engineering and holistic approach**
   - Check for unnecessary complexity
   - Assess if fixes are too narrow in scope
   - Consider unified patterns vs multiple narrow fixes
   - Evaluate predictability and maintainability

5. **Add scorecards and confidence scores**
   - Provide confidence score for each change with supporting arguments
   - Include scorecard of initial proposal near beginning of document
   - Use `run_terminal_cmd` to get date for plan creation timestamp
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`

### Phase 3: Validation

1. **Verify plan completeness**
   - Use `read_file` to review created plan
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Check that all required sections are present
   - Verify evidence citations include file paths and line numbers

2. **Validate npm script references**
   - Use `read_file` to verify referenced scripts exist in package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Check that scripts are appropriate for validation steps

## Error Handling

- **Missing problem analysis**: If problem analysis is not provided or unclear
  - Detection: No attached files or context provided
  - Resolution: Ask user for problem analysis or clarify the problem to be addressed

- **npm script not found**: If referenced npm script doesn't exist
  - Detection: `run_terminal_cmd` returns error or `read_file` shows script missing from package.json
  - Resolution: Either add script to package.json (if permission exists in cli.json) or use alternative validation method

- **Plan file creation failure**: If plan file cannot be created
  - Detection: `write` operation fails or file not found after creation
  - Resolution: Check `.cursor/plans/` directory exists, verify write permissions, retry with corrected path

- **Missing code references**: If claimed patterns cannot be found
  - Detection: `codebase_search` or `grep` returns no results for claimed pattern
  - Resolution: Verify pattern exists, adjust search query, or remove unsubstantiated claim

## Success Criteria

- [ ] Plan document created in `.cursor/plans/` directory with correct naming format
- [ ] All required sections present (Problem Analysis, Solution Approach, Implementation Plan, etc.)
- [ ] Plan includes evidence-based citations with file paths and line numbers
- [ ] npm scripts referenced in plan exist in package.json or are documented as needed
- [ ] Plan includes scorecard and confidence scores
- [ ] Plan reviewed for over-engineering and holistic approach
- [ ] Plan structure follows template format with HTML comment UUID and status tracking

## Output Format

Plan document saved to `.cursor/plans/{plan-name}-{uuid}.plan.md` with:

- HTML comment with UUID at top
- Plan title and metadata (Created date, Status)
- Standard markdown sections
- Evidence-based content with code citations
- Scorecard and confidence scores
- To-dos section at end

## Notes

- Always use `codebase_search` and `grep` to verify claims before including them in plan
- Cite specific files and line numbers when referencing existing patterns
- Use `read_file` to verify integration points and dependencies
- Check npm script availability before referencing in plan
- Follow plan document format specification from template
