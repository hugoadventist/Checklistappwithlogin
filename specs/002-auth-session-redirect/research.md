# Research: Authentication Session Redirect

## Decisions & Findings

### Decision 1: Session Storage Mechanism
- **Finding**: Supabase Auth primarily uses `localStorage` in its client-side SDK. To use HttpOnly cookies, we need a server-side handler (Edge Function or Middleware) that intercepts the auth response and sets the cookie.
- **Decision**: Since this is a hybrid app (React + Static Assets), we will implement a centralized `AuthInterceptor` that checks for session validity via a lightweight Edge Function call if the local cache is missing or expired.
- **Rationale**: Mitigates XSS as per security guidelines.

### Decision 2: Singleton Redirect Pattern
- **Finding**: Multiple failing requests can trigger multiple state changes in React or multiple `window.location.href` calls.
- **Decision**: Use a global flag or a debounced redirect function.
- **Rationale**: Prevents UI flickering and redundant network load.

### Decision 3: Hybrid Protection (React + Static)
- **Finding**: React uses internal state (`accessToken`), while static assets (`src/assets`) use `localStorage` directly (currently).
- **Decision**:
  - React: Update `App.tsx` effect to handle 401s via a shared Supabase client interceptor.
  - Static: Update `auth.js` to include a global interceptor for `fetch`.
- **Rationale**: Ensures consistency across both layers of the application.

## Alternatives Considered
- **Pure Middleware**: Rejected due to complexity in the current hybrid architecture without a dedicated Node.js backend.
- **Short-lived Tokens**: Evaluated but doesn't solve the "redirect on expiry" requirement as effectively as interceptors.
