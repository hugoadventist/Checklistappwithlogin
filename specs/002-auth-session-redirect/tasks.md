# Implementation Tasks: Authentication Session Redirect

## Dependencies
- Phase 1 (Setup) must be completed before Phase 2.
- Phase 2 (Core Redirect Logic) covers both US1 (Expired) and US2 (Invalid).
- Phase 3 (Feedback) depends on Phase 2, as it handles the result of the redirect.

## Phase 1: Setup & Foundational Infrastructure
**Goal**: Set up the secure cookie validation endpoint and shared singleton redirect utility.

- [x] T001 Implement `redirectIfInvalid` singleton utility function in a new shared file `src/utils/auth-interceptor.ts`.
- [x] T002 Update Supabase setup in `src/utils/supabase/info.tsx` and static config in `src/assets/js/config.js` to prepare for cookie-based auth.
- [x] T002b Create `auth-session` Edge Function to receive Supabase token and issue HttpOnly cookie.
- [x] T003 Create `validate-session` Edge Function in `supabase/functions/validate-session/index.ts`.
- [x] T004 Write unit tests for `validate-session` Edge Function (Testing Cookie parsing and JWT validation).
- [x] T004a Write unit tests for `auth-session` Edge Function (Testing JWT validation and HttpOnly cookie issuance).

## Phase 2: User Story 1 & 2 (Redirect on Expired/Invalid Session)
**Goal**: Intercept expired or invalid sessions and trigger the singleton redirect.
**Independent Test**: Navigate to protected route without token or with expired token -> redirect to login page occurs.

- [x] T004b [P] [US1] Update login flow in `src/assets/js/auth.js` and `src/App.tsx` to call the new `/auth-session` Edge Function to set the cookie.
- [x] T005 [P] [US1] Update `src/assets/js/auth.js` to replace `localStorage` with cookie-based session logic for static assets.
- [x] T006 [P] [US1] Update `src/assets/js/auth.js` `fetch` wrappers to intercept 401s and call `redirectIfInvalid`.
- [x] T007 [P] [US2] Update `src/App.tsx` (React) to replace `localStorage` with cookie-based session logic for React components.
- [x] T008 [P] [US2] Update `src/App.tsx` (React) to use `onAuthStateChange` AND intercept API errors with `redirectIfInvalid`.
- [x] T008b [FR-007] Audit frontend codebase and remove any legacy client-side interval checks (e.g., `setTimeout`/`setInterval`) used for session expiration.

## Phase 3: User Story 3 (Feedback Upon Redirect)
**Goal**: Show a localized message when a user is redirected due to session issues.
**Independent Test**: Navigate to `/index.html?reason=expired` -> see localized alert message.

- [x] T009 [US3] Update `src/assets/index.html` (Static Login) to parse `?reason=expired` query parameter and display Bootstrap alert ("Sua sessão expirou...").
- [x] T010 [US3] Update `src/components/LoginScreen.tsx` (React Login) to parse `?reason=expired` query parameter and display Shadcn/Sonner alert ("Sua sessão expirou...").

## Phase 4: Polish & Validation
**Goal**: Ensure all requirements are met, particularly localization and no redirect loops.

- [x] T011 Verify no redirect loops occur on `src/assets/signup.html` and `src/assets/index.html`.
- [x] T012 Run full local build and verify visual consistency of alerts between React and static assets.
- [x] T013 [SC-001] Perform manual integration testing: manually delete/expire the session cookie and verify immediate redirect. Simulate simultaneous 401 API errors from the dashboard to verify the singleton redirect behavior.
- [x] T014 [SC-002] Verify performance metric: measure and ensure the feedback alert ("Sua sessão expirou") on the login page renders in under 1 second post-redirect.
