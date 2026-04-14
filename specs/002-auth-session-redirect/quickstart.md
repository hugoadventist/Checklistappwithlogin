# Quickstart: Authentication Session Redirect

## Steps to Implement

1. **Backend**: Create `supabase/functions/validate-session` with unit tests.
2. **Security**: Update Supabase client config in `auth.js` and `src/App.tsx` to use cookies.
3. **Interceptor**: Implement `redirectIfInvalid` in a shared utility.
4. **UI**: Update `LoginScreen.tsx` and `index.html` to parse `?reason=expired` and show alerts.

## Testing locally
- Clear cookies to simulate invalid session.
- Navigate to `/dashboard.html` or protected React view.
