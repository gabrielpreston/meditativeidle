# Implement Plan - Execute plan implementation with validation

## Purpose

Refresh understanding of plan details, update plan status to In Progress, begin implementation following the plan, and update plan status to Completed when done. Always prioritize using npm scripts for testing and validation.

## When to Use

Use this command when:

- A plan has been created and analyzed (via `cp.md` and `ap.md`)
- You are ready to begin implementing the plan's changes
- You need to execute plan steps systematically with validation

## Prerequisites

Before executing this command, ensure:

- Plan document exists in `.cursor/plans/` directory
- Plan has been analyzed and approved (status should be "Analysis Complete" or similar)
- You have access to codebase and can make file changes
- npm scripts are available for validation

## AI Execution Steps

### Phase 1: Context Gathering

1. **Refresh plan understanding**
   - Use `read_file` to read the plan document
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Identify current plan status and implementation phases
   - Review plan's implementation order and dependencies

2. **Get current date and update plan status**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status to "In Progress"
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Analysis Complete"`, `new_string: "**Plan Status**: Analysis Complete\n**Plan Status**: In Progress - {date}"`

3. **Investigate npm scripts**
   - Use `run_terminal_cmd` to discover available npm scripts
     - Command: `npm run` with `is_background: false`
   - Use `read_file` to review package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Verify which validation scripts are available (type-check, test, lint, etc.)

### Phase 2: Implementation

1. **Begin plan implementation**
   - Follow plan's implementation order section
   - For each phase or step in the plan:
     - Use `codebase_search` to understand current implementation
       - Example: `codebase_search` with `query: "How is [feature] currently implemented?"` and `target_directories: ["src"]`
     - Use `read_file` to read relevant files before making changes
       - Example: `read_file` with `target_file: "file-to-modify.ts"`
     - Use `search_replace` or `write` to make changes
       - Example: `search_replace` with `file_path: "file.ts"`, `old_string: "old code"`, `new_string: "new code"`

2. **Validate changes after each major step**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting (if script exists)
     - Command: `npm run lint` with `is_background: false` (check script exists first)
   - Use `run_terminal_cmd` to run tests (if script exists)
     - Command: `npm test` with `is_background: false` (check script exists first)
   - If scripts don't exist, use `read_file` to verify package.json and note missing scripts

3. **Continue implementation following plan**
   - Work through plan phases systematically
   - Update plan to-dos as steps are completed
   - Use `search_replace` to mark completed to-dos
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "- [ ] Task description"`, `new_string: "- [x] Task description"`

### Phase 3: Completion and Validation

1. **Run full validation suite**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting (if available)
     - Command: `npm run lint` with `is_background: false` (verify script exists first)
   - Use `run_terminal_cmd` to run tests (if available)
     - Command: `npm test` with `is_background: false` (verify script exists first)
   - Use `read_lints` to check for linting errors
     - Example: `read_lints` with `paths: ["src"]` or specific file paths

2. **Update plan status to Completed**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: In Progress"`, `new_string: "**Plan Status**: In Progress\n**Plan Status**: Completed - {date}"`

## Error Handling

- **Plan file not found**: If plan document doesn't exist
  - Detection: `read_file` fails or file not found
  - Resolution: Ask user for plan file path or create plan using `cp.md` command first

- **npm script not found**: If referenced npm script doesn't exist
  - Detection: `run_terminal_cmd` returns error or `read_file` shows script missing from package.json
  - Resolution: Use alternative validation method (e.g., `npm run type-check` if available) or skip that validation step with note

- **Type checking errors**: If `npm run type-check` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code
  - Resolution: Review error output, fix type errors, re-run type-check

- **Linting errors**: If `npm run lint` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code or `read_lints` shows errors
  - Resolution: Review linting errors, fix issues, re-run lint or use `npm run lint -- --fix` if available

- **Test failures**: If `npm test` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code
  - Resolution: Review test failures, fix issues, re-run tests

- **File modification failures**: If `search_replace` or `write` fails
  - Detection: Tool returns error or file not updated correctly
  - Resolution: Verify file path, check file permissions, verify old_string matches exactly, retry

## Success Criteria

- [ ] Plan document read and understood
- [ ] Plan status updated to "In Progress" with current date
- [ ] All plan implementation steps executed
- [ ] Changes validated with `npm run type-check` (at minimum)
- [ ] Linting validated (if script exists) or noted as unavailable
- [ ] Tests validated (if script exists) or noted as unavailable
- [ ] Plan status updated to "Completed" with current date
- [ ] All plan to-dos marked as completed

## Output Format

Implementation progress tracked through:

- Plan status updates in plan document
- To-do checkboxes marked as completed
- Validation results from npm scripts
- Final plan status showing "Completed" with date

## Notes

- Always prioritize using npm scripts for validation (`npm run type-check`, `npm run lint`, `npm test`)
- Check script existence in package.json before running (use `read_file` on package.json)
- If scripts don't exist, use available alternatives or note missing scripts
- Update plan status at start (In Progress) and end (Completed) of implementation
- Mark plan to-dos as completed as you work through implementation steps
- Follow plan's implementation order and dependencies
