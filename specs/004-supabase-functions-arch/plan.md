# Implementation Plan: Supabase Folder Architecture

**Branch**: `004-supabase-functions-arch` | **Date**: 2026-04-13 | **Spec**: /specs/004-supabase-functions-arch/spec.md
**Input**: Feature specification from `/specs/004-supabase-functions-arch/spec.md`

## Summary

Restructure the `/supabase/functions` directory to strictly follow official documentation: combining endpoints into "fat functions" to minimize cold starts, enforcing URL-friendly hyphenated naming, centralizing shared code into a `_shared` folder, and isolating unit tests into sibling `*-test` directories. Concurrently, implement a robust, centralized CORS handling solution to resolve existing cross-origin issues.

## Technical Context

**Language/Version**: TypeScript (Deno runtime for Edge Functions)
**Primary Dependencies**: Supabase Edge Functions, Hono (web framework)
**Storage**: Supabase PostgreSQL / KV Store
**Testing**: Deno test framework (`deno test`)
**Target Platform**: Supabase Edge runtime (Linux/V8)
**Project Type**: Backend API (Edge Functions)
**Performance Goals**: Minimize cold starts via consolidated "fat function" routing.
**Constraints**: Must not break existing API client integrations during the folder rename/migration.
**Scale/Scope**: Refactoring existing `make-server-c4e14817` and setting the standard for all future functions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **TDD Enforced**: Backend logic has mandatory tests? (Tests are being moved to dedicated `*-test` folders and preserved/expanded).
- [x] **Localization**: All UI content is in pt-BR? (N/A for backend architectural refactor).
- [x] **UI Consistency**: Design matches existing Bootstrap/Shadcn patterns? (N/A).
- [x] **Security**: No credentials in code? (Maintained, relying on `Deno.env`).
- [x] **Independence**: Feature is independently testable? (Yes, via Deno test and local Supabase serving).

## Project Structure

### Documentation (this feature)

```text
specs/004-supabase-functions-arch/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
supabase/
└── functions/
    ├── _shared/
    │   ├── cors.ts            # Centralized CORS handling
    │   ├── kv_store.ts        # Moved from existing function
    │   └── nr12-template.ts   # Moved from existing function
    ├── api-server/            # Renamed from make-server-c4e14817 (Fat function)
    │   └── index.ts           # Unified Hono router
    └── api-server-test/       # Separated unit tests
        └── index.test.ts
```

**Structure Decision**: Selected the strictly segregated folder structure mandated by the feature spec. Shared code moves to `_shared`, deployment payload remains in `api-server`, and testing dependencies are isolated in `api-server-test`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No constitution violations detected.*
