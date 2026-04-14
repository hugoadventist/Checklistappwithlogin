# Phase 1: Quickstart (Supabase Edge Functions)

## Running the Backend Locally

To test the newly structured Supabase Edge Functions with Hono locally, ensure you have Deno and the Supabase CLI installed.

1. Start the local Supabase stack (if not already running):
   ```bash
   npx supabase start
   ```

2. Serve the edge functions locally:
   ```bash
   npx supabase functions serve --no-verify-jwt
   ```
   *Note: If you renamed `make-server-c4e14817` to `api-server`, access endpoints via `http://localhost:54321/functions/v1/api-server/`*

## Running Unit Tests

Because tests are separated into `*-test` folders, run Deno tests targeting specific test directories:

```bash
deno test --allow-net --allow-env supabase/functions/api-server-test/
```

## Adding Shared Code

When creating new utilities that span multiple Edge Functions:
1. Place the `.ts` file inside `supabase/functions/_shared/`.
2. Import it using relative paths in your function: `import { helper } from '../_shared/helper.ts';`.
