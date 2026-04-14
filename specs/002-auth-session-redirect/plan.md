# Implementation Plan: Authentication Session Redirect

## Technical Context

- **Frameworks**: React (TypeScript) + Bootstrap 5 (Vanilla JS).
- **Backend**: Supabase Auth + Edge Functions.
- **Current State**: Session stored in \`localStorage\`. No global interceptor for expiration.
- **Constraints**: Must support pt-BR, mitigate XSS via HttpOnly cookies (where possible), and handle singleton redirects.

## Constitution Check

| Principle | Adherence Plan |
|-----------|----------------|
| I. Backend TDD | New Edge Function for session validation will have unit tests. |
| II. Vanilla CSS | UI alerts for redirects will use Bootstrap 5 (assets) or Shadcn (React) + Vanilla CSS. |
| III. Security | Migrating from localStorage to HttpOnly cookies for session storage. |
| V. Localized UI | All redirect messages will be in pt-BR ("Sua sessão expirou..."). |
| VI. UI Consistency | Using Bootstrap 5 for alerts in \`src/assets\` and Shadcn/Sonner for React. |

## Implementation Gates

- [ ] Unit tests for session validation function pass.
- [ ] No \`localStorage\` used for sensitive session data.
- [ ] Redirect message is visible and localized in pt-BR.
- [ ] Singleton redirect prevents multiple alerts/reloads.

## Phase 1: Infrastructure & Data Model

### Data Model updates
- No changes to DB schema.
- Update \`Session\` entity in \`spec.md\` to reflect HttpOnly cookie storage.

### Contracts
- **POST /auth-session**: Edge Function to issue HttpOnly cookie upon login.
  - Request: `{ access_token, refresh_token }`
  - Response: `Set-Cookie` header with HttpOnly flag.
- **GET /validate-session**: Edge Function to verify cookie/token validity.
  - Request: Cookie (automatic)
  - Response: \`{ valid: boolean, user?: object }\`

## Phase 2: Implementation

### 1. Unified Auth Interceptor (Shared Logic)
- Implement a \`redirectIfInvalid\` function that:
  - Checks a \`isRedirecting\` global flag.
  - Redirects to \`index.html?reason=expired\` if invalid.

### 2. Static Assets Update (\`src/assets/js/auth.js\`)
- Update \`fetch\` wrapper to intercept 401 responses.
- Update \`isAuthenticated\` to check against the new cookie/validation endpoint.

### 3. React App Update (\`src/App.tsx\`)
- Wrap Supabase client or use a \`useEffect\` listener for auth state changes (\`onAuthStateChange\`).
- Implement \`reason\` parameter handling in \`LoginScreen.tsx\` to show localized alerts.

## Phase 3: Validation

- Manual test: Manually delete or expire cookie and verify redirect.
- Manual test: Simulate simultaneous 401s from dashboard.
- Localization check: Verify all alert text is in pt-BR.
