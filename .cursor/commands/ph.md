# Prove Your Homework - Validate AI Claims

## Overview
Force validation of AI assertions by requiring evidence-based citations for all claims.

## When to Use
Use this command when:
- AI claims to follow existing patterns but doesn't cite examples
- AI describes integration points without showing actual code
- AI makes architectural decisions without referencing existing patterns
- AI proposes optimizations without demonstrating improvements
- You need to verify assumptions before accepting AI-generated code
- AI makes assertions about codebase state without evidence

## Steps

- **Identify unsubstantiated claims**
  - Review the AI's response for assertions without evidence
  - Look for phrases like "follows existing patterns", "integrates with X", "improves performance"
  - Note any architectural or design decisions made without code references
  - Identify claims about codebase state, dependencies, or configurations

- **Request evidence for each claim**
  - **Pattern Claims**: "Show me the specific file and line numbers where this pattern exists"
  - **Integration Claims**: "Cite the actual code that demonstrates this integration point"
  - **Performance Claims**: "Provide concrete examples showing the improvement"
  - **Architecture Claims**: "Reference the existing architectural decision this follows"
  - **Codebase State Claims**: "Show me where in the codebase this configuration/state exists"
  - **Dependency Claims**: "Cite the actual import statements or dependency declarations"

- **Validate evidence**
  - Verify cited code actually exists and matches the claim
  - Check that integration points are correctly identified
  - Confirm patterns match the proposed implementation
  - Ensure architectural decisions align with existing codebase
  - Validate that code references are accurate and current
  - Cross-reference multiple sources when possible

- **Report findings**
  - List validated claims with their evidence (file paths, line numbers, code snippets)
  - Identify any claims that cannot be substantiated
  - Recommend corrections for unsubstantiated claims
  - Provide confidence scores based on evidence quality
  - Note any discrepancies between claims and actual codebase state

## Example Usage

When AI says: "This follows the existing game loop pattern used throughout the codebase"

Request: "Prove your homework - show me specific examples of this game loop pattern with file paths and line numbers"

Expected response should include:
- Actual file paths (e.g., `src/main.ts`)
- Line number ranges showing the pattern
- Code snippets demonstrating the pattern
- Multiple examples if pattern is "used throughout"
