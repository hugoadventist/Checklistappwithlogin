# Implementation Tasks: Supabase Folder Architecture

## Dependencies
- Phase 1 (Setup) and Phase 2 (Foundational) must be completed before migrating the endpoints in US2.
- The `_shared` utilities created in US1 are prerequisites for refactoring the Hono router in US2.
- The directory renaming in US3 can happen anytime, but makes sense alongside the US2 migration.

## Execution Plan (Parallel Opportunities)
- `T001`, `T002`, and `T003` (creating the shared utilities) can be executed in parallel.
- `T004` (setting up the test folder) can be executed in parallel with the `_shared` setup.

## Phase 1: Setup & Foundational Infrastructure
**Goal**: Establish the target directories mandated by the official Supabase architecture documentation.

- [ ] T001 Create the `supabase/functions/_shared` directory to hold centralized utilities.
- [ ] T002 Create the `supabase/functions/api-server` directory as the new "fat function" target.
- [ ] T003 Create the `supabase/functions/api-server-test` directory for isolated unit tests.

## Phase 2: User Story 1 (Standardized Directory Structure & Shared Code)
**Goal**: Centralize shared utilities, including the new CORS fix, into the `_shared` folder.
**Independent Test**: Verify that `_shared/cors.ts`, `_shared/kv_store.ts`, and `_shared/nr12-template.ts` exist and contain no endpoint logic.

- [ ] T004 [P] [US1] Create `supabase/functions/_shared/cors.ts` based on the defined contract to export `corsHeaders` and `handleCorsPreflight`.
- [ ] T005 [P] [US1] Move `supabase/functions/make-server-c4e14817/kv_store.ts` to `supabase/functions/_shared/kv_store.ts`.
- [ ] T006 [P] [US1] Move `supabase/functions/make-server-c4e14817/nr12-template.ts` to `supabase/functions/_shared/nr12-template.ts`.
- [ ] T007 [P] [US1] Create unit tests for the CORS utility in `supabase/functions/api-server-test/cors.test.ts` (satisfying TDD principle).

## Phase 3: User Story 2 & 3 (Fat Functions & URL-Friendly Names)
**Goal**: Migrate the existing endpoint logic into the new hyphenated "fat function" (`api-server`) while integrating the shared CORS utility.
**Independent Test**: The local Supabase stack serves `api-server` successfully, resolving CORS preflight requests without errors.

- [ ] T008 [US2] [US3] Copy/Move `supabase/functions/make-server-c4e14817/index.ts` to `supabase/functions/api-server/index.ts`.
- [ ] T009 [US2] Refactor `supabase/functions/api-server/index.ts` to update relative import paths for `kv_store.ts` and `nr12-template.ts` (now pointing to `../_shared/`).
- [ ] T010 [US2] Refactor `supabase/functions/api-server/index.ts` to use the new `corsHeaders` from `../_shared/cors.ts` instead of inline definitions.
- [ ] T011 [US2] Ensure `supabase/functions/api-server/index.ts` handles `OPTIONS` requests gracefully using the Hono CORS middleware or the `handleCorsPreflight` utility.
- [ ] T011b [US2] Create unit tests for the main router in `supabase/functions/api-server-test/index.test.ts` to verify the fat function routes correctly (satisfying TDD principle).

## Phase 4: Polish & Clean Up
**Goal**: Remove legacy artifacts and verify the new architecture.

- [ ] T012 Delete the legacy directory `supabase/functions/make-server-c4e14817/` completely.
- [ ] T013 Perform a global search and replace across the `src/` directory to update all hardcoded instances of the `make-server-c4e14817` path to `api-server` (e.g., in `App.tsx`, `ChecklistDashboard.tsx`, `UserManagement.tsx`, `utils/auth-interceptor.ts`, and `config.js`).
- [ ] T014 Run full Deno test suite: `deno test --allow-net --allow-env supabase/functions/api-server-test/` to ensure everything passes.
