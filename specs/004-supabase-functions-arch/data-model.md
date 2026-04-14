# Phase 1: Data Model

## Supabase Folder Architecture

This feature is purely architectural and does not modify the underlying PostgreSQL/KV Store database schema. However, it defines a rigid structural "schema" for the filesystem.

### Filesystem Entities

- **Fat Function Directory (`/supabase/functions/<function-name>`)**
  - Must be strictly lowercase with hyphens (e.g., `api-server`).
  - Contains a single `index.ts` entry point using Hono for routing multiple related endpoints.

- **Shared Directory (`/supabase/functions/_shared`)**
  - Contains reusable utilities, constants, and database client initializers.
  - Examples: `cors.ts`, `kv_store.ts`, `nr12-template.ts`, `supabase-client.ts`.

- **Test Directory (`/supabase/functions/<function-name>-test`)**
  - Placed adjacent to the function it tests.
  - Completely isolated from the deployment payload of the main function.
  - Contains Deno test files (e.g., `index.test.ts`).
