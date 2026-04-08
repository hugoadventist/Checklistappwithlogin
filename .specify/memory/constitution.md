<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- Added Sections:
  - Principle V: Localized UI & Content (Brazilian Portuguese - pt-BR)
  - Principle VI: UI Consistency (Bootstrap 5 for assets, Shadcn for React)
  - Principle VII: Codebase Rules Adherence
- Modified Sections:
  - Technology Stack & Constraints: Clarified dual UI framework usage.
- Templates requiring updates:
  - ✅ `.specify/templates/tasks-template.md` (Added localization and style checks)
  - ✅ `.specify/templates/spec-template.md` (Added language requirements)
  - ✅ `.specify/templates/plan-template.md` (Added constitution gates for localization/UI)
-->
# Checklist App with Login Constitution

## Core Principles

### I. Backend Test-Driven Development (TDD)
Every backend feature (Supabase Edge Functions) MUST begin with a unit test. TDD is strictly enforced: Tests written → Tests fail → Implementation added → Tests pass. Follow the Red-Green-Refactor cycle.

### II. Vanilla CSS Preference
Use Vanilla CSS for styling in React components. Avoid TailwindCSS unless explicitly requested. Ensure modern, responsive design using platform-native primitives where possible.

### III. Security & Credentials
Never log, print, or commit secrets, API keys, or sensitive credentials. Protect `.env` files and system configurations.

### IV. Functional Independence
User stories and feature slices MUST be independently testable. Commits and PRs should represent a functional MVP increment without relying on unmerged dependent branches where possible.

### V. Localized UI & Content (pt-BR)
All UI labels, HTML tag values, and content MUST be in Brazilian Portuguese (pt-BR). This is particularly critical for the NR-12 checklist items and related documentation.

### VI. UI Consistency
Maintain strict visual consistency with the existing design. 
- **Static Assets (`src/assets/*.html`)**: Use Bootstrap 5 and vanilla JavaScript.
- **React Components (`src/components/*`)**: Use the established Shadcn UI + Vanilla CSS patterns.
Do not mix patterns within the same layer.

### VII. Codebase Rules Adherence
Always follow the established rules, directory structures, and naming conventions of this codebase. Analyze surrounding files before making changes to ensure idiomatic consistency.

## Technology Stack & Constraints

**Frontend (Modern)**: React (TypeScript) with Vanilla CSS and Shadcn UI (Lucide React icons).
**Frontend (Static/Legacy)**: Bootstrap 5 with Vanilla JavaScript (located in `src/assets`).
**Backend**: Supabase Edge Functions (Deno/Hono).
**Database**: Supabase PostgreSQL (KV Store pattern implemented).
**Build Tool**: Vite.
**Testing**: Deno test (backend) / Vitest (frontend - if added).

## Development Workflow

- Follow a **Research -> Strategy -> Execution** lifecycle.
- Execute sub-tasks through an iterative **Plan -> Act -> Validate** cycle.
- **Validation**: 
    - Backend changes MUST pass unit tests.
    - UI changes MUST be verified for pt-BR localization and visual consistency with existing screens.

## Governance

All Pull Requests and code changes must adhere to this Constitution. The principles here supersede general coding practices where they conflict.
Amendments require documentation, approval, and an increment of the Constitution Version using semantic versioning.

**Version**: 1.1.0 | **Ratified**: 2026-04-07 | **Last Amended**: 2026-04-08
