# Directives

This folder contains Standard Operating Procedures (SOPs) for the AI orchestration layer to follow when working on the ContableBot Portal.

## What are Directives?

Directives are natural language instructions that tell Claude:
- **What** to accomplish (the goal)
- **Why** it matters (context)
- **How** to do it (which tools/scripts to use)
- **When** things can go wrong (edge cases)

## Available Directives

- `add_api_route.md` - Adding new Next.js API routes
- `add_page.md` - Creating new pages in the portal
- `modify_types.md` - Updating TypeScript type definitions
- `add_component.md` - Creating new React components
- `debug_api.md` - Debugging API route issues
- `test_feature.md` - Testing new features end-to-end

## How to Use

When you ask Claude to perform a task, it will:
1. Check if a directive exists for that task
2. Read the directive to understand the approach
3. Call the appropriate execution scripts
4. Update the directive if it learns something new
