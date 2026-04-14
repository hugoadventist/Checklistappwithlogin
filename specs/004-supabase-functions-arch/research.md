# Phase 0: Research & Architecture Definitions

## Supabase CORS Handling in Deno/Hono
**Decision**: Create a shared CORS utility module in `supabase/functions/_shared/cors.ts` to be used universally across all edge functions.
**Rationale**: The user explicitly requested fixing the current CORS issue while following the official directory architecture. Supabase Edge Functions require explicit handling of `OPTIONS` requests and specific CORS headers for cross-origin calls (like those coming from `http://localhost:3000` or production frontend URLs). Centralizing this in `_shared` ensures DRY (Don't Repeat Yourself) compliance and prevents subtle misconfigurations across different "fat functions".
**Alternatives considered**: Hardcoding CORS headers inside each Hono instance (rejected because it duplicates code and is error-prone).

## Migration Strategy (Existing Function)
**Decision**: Rename `make-server-c4e14817` to a generic URL-friendly name like `api-server` (or keep it if it fits the hyphenation rule, but clean up its internals). Move `kv_store.ts` and `nr12-template.ts` into `_shared/`. Create an adjacent `api-server-test/` folder for unit tests.
**Rationale**: Adheres to FR-003, FR-004, and FR-006 from the spec. It implements the "fat function" model by keeping related logic in one deployment unit while separating shared constants and tests.
**Alternatives considered**: Leaving the existing function as-is to avoid breaking changes (rejected due to direct conflict with feature spec goals).

## "Fat Function" Hono Routing
**Decision**: Use Hono's routing capabilities within a single entry point `index.ts` inside the Edge Function folder to handle multiple related endpoints (e.g., `/auth-session`, `/checklists`, `/users`).
**Rationale**: Deno and Hono are extremely lightweight. Grouping these routes under one deployed Supabase function (FR-002) significantly reduces cold starts compared to deploying dozens of single-endpoint functions.
