# [Command Name] - [Brief Description]

## Purpose

[One sentence describing what this command does and when it should be used]

## When to Use

Use this command when:

- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

## Prerequisites

Before executing this command, ensure:

- [Required context or state]
- [Required tools or dependencies]
- [Required files or directories exist]

## AI Execution Steps

### Phase 1: Context Gathering

1. **Gather required information**
   - Use `read_file` to read: [specific files]
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}.plan.md"`
   - Use `codebase_search` to find: [specific patterns or implementations]
     - Example: `codebase_search` with `query: "How does X work?"` and `target_directories: ["path/to/search"]`
   - Use `grep` to locate: [specific code patterns]
     - Example: `grep` with `pattern: "pattern-to-find"` and `path: "directory-or-file"`

### Phase 2: Execution

1. **Perform primary action**
   - Use `[tool_name]` to: [specific action]
     - Example: `run_terminal_cmd` with `command: "npm run type-check"` and `is_background: false`
   - Expected outcome: [what should happen]
   - Validation checkpoint: [how to verify success]

2. **Continue with subsequent steps**
   - [Additional execution steps with explicit tool usage]

### Phase 3: Validation

1. **Verify success**
   - Check: [specific criteria]
   - Use `[tool_name]` to validate: [specific check]
   - Example: `read_file` to verify output file was created correctly

## Error Handling

- **Error Type 1**: [How to handle]
  - Detection: [How to identify this error]
  - Resolution: [How to fix or recover]
  - Example: If `run_terminal_cmd` returns non-zero exit code, check error output and retry with corrected command

- **Error Type 2**: [How to handle]
  - Detection: [How to identify this error]
  - Resolution: [How to fix or recover]

## Success Criteria

- [ ] Criterion 1: [Specific measurable outcome]
- [ ] Criterion 2: [Specific measurable outcome]
- [ ] Criterion 3: [Specific measurable outcome]

## Output Format

[Define expected output structure, format, or location]

Example:
- Report findings in structured format
- Save output to specific file location
- Display summary to user

## Tool Usage Reference

### Verified Cursor Tools

The following tools are verified and available for use in commands:

- **`read_file`**: Read file contents from filesystem
  - Parameters: `target_file` (required), `offset` (optional), `limit` (optional)
  - Example: `read_file` with `target_file: "package.json"`

- **`codebase_search`**: Semantic code search across codebase
  - Parameters: `query` (required), `target_directories` (optional array)
  - Example: `codebase_search` with `query: "How does error handling work?"` and `target_directories: ["src"]`

- **`grep`**: Pattern-based file search
  - Parameters: `pattern` (required), `path` (optional), `output_mode` (optional)
  - Example: `grep` with `pattern: "function.*test"` and `path: "src"`

- **`run_terminal_cmd`**: Execute shell commands
  - Parameters: `command` (required), `is_background` (optional, default false)
  - Example: `run_terminal_cmd` with `command: "npm run type-check"` and `is_background: false`

- **`search_replace`**: Edit files with string replacement
  - Parameters: `file_path` (required), `old_string` (required), `new_string` (required), `replace_all` (optional)
  - Example: `search_replace` with `file_path: "file.ts"`, `old_string: "old code"`, `new_string: "new code"`

- **`write`**: Create or overwrite files
  - Parameters: `file_path` (required), `contents` (required)
  - Example: `write` with `file_path: "new-file.md"` and `contents: "file content"`

### NPM Script Validation

Before referencing npm scripts in commands:

1. **Check script existence**: Use `read_file` to read `package.json` and verify script exists
2. **Check permissions**: Verify script is allowed in `.cursor/cli.json` if needed
3. **Handle missing scripts**: Either add script to `package.json` or use alternative approach

Example validation:
```bash
# Check if script exists
read_file with target_file: "package.json"
# If script missing but permission exists in cli.json, add script
# Otherwise, use alternative validation method
```

## Plan Document Format (for commands that read/write plans)

When creating or reading plan documents:

- **File naming**: `{plan-name}-{uuid}.plan.md`
  - Example: `standardize-cursor-commands-for-ai-execution-0b714937.plan.md`
- **Structure**:
  1. HTML comment with UUID: `<!-- {uuid} {uuid} -->`
  2. Plan title: `# {Plan Name}`
  3. Plan metadata: `**Plan Created**:`, `**Plan Status**:`
  4. Standard sections: Problem Analysis, Solution Approach, Implementation Plan, etc.
  5. To-dos section at end: `### To-dos` with checkboxes
- **Status values**: Created, Being Analyzed, Analysis Complete, In Progress, Completed
- **Location**: `.cursor/plans/` directory

## Notes

- All tool usage must be explicit - never assume implicit actions
- Always include validation checkpoints after major operations
- Follow project documentation standards (100 char line length, proper markdown formatting)
- Preserve all existing functionality when refactoring commands

