# Integration Testing Guide - Session Redirect Feature

## T013: Manual Integration Testing [SC-001]

### Test Procedure: Session Cookie Expiration

**Objective**: Verify that manually deleting/expiring the session cookie triggers immediate redirect

**Steps**:
1. Start the development server: `npm run dev`
2. Log in to the application with valid credentials
3. Verify you're authenticated and can see the dashboard
4. Open browser DevTools (F12) → Application → Cookies
5. Find `nr12_access_token` cookie and delete it
6. Perform any action that requires authentication (click a button, refresh page)
7. **Expected Result**: Automatic redirect to `/index.html?reason=expired` with alert message

### Test Procedure: Simultaneous 401 Errors

**Objective**: Verify singleton redirect behavior prevents multiple simultaneous redirects

**Steps**:
1. Start the development server: `npm run dev`
2. Log in with valid credentials
3. Open DevTools Console to monitor redirect calls
4. Trigger multiple API calls simultaneously (e.g., rapidly clicking buttons)
5. Manually invalidate the session cookie between requests
6. **Expected Result**: 
   - Multiple 401 errors received
   - BUT only one redirect occurs (singleton prevents duplicates)
   - No alert spam or infinite loops

### Acceptance Criteria:
- ✓ Single redirect occurs when session expires
- ✓ Message is in pt-BR: "Sua sessão expirou, faça login novamente"
- ✓ No redirect loop (login page doesn't redirect again)
- ✓ Multiple simultaneous 401s result in single redirect

---

## T014: Performance Metric Verification [SC-002]

### Test Objective: Alert Rendering Performance

**Requirement**: Alert ("Sua sessão expirou") must render in under 1 second post-redirect

**Measurement Procedure**:

1. **Setup**:
   - Clear browser cache: Ctrl+Shift+Delete
   - Open DevTools Performance tab (F12 → Performance)
   - Start the development server: `npm run dev`

2. **Execution**:
   - Log in with valid credentials
   - Click "Record" in Performance tab
   - Delete `nr12_access_token` cookie
   - Trigger API call (click button, or navigate)
   - Stop recording after redirect completes

3. **Analysis**:
   - Look for "First Paint" (FP) and "First Contentful Paint" (FCP)
   - Measure time from HTTP 401 response to alert visibility
   - Check for layout thrashing or excessive reflows

4. **Acceptance Criteria**:
   - ✓ Time from 401 response to alert visible: < 1000ms
   - ✓ Alert text is immediately readable (not fading in slowly)
   - ✓ No layout shift after alert appears (Cumulative Layout Shift < 0.1)

### Alternative Measurement (Manual):

Add to auth-interceptor.ts temporarily for testing:
```javascript
const startTime = performance.now();
console.log('[PERF] Redirect started at:', startTime);

// In login page, add:
const alertVisible = performance.now();
console.log('[PERF] Alert visible at:', alertVisible - startTime, 'ms');
```

### Expected Performance Baseline:
- Parse query parameter: ~1ms
- DOM query and element creation: ~2ms
- Alert rendering: ~5ms
- Total: < 10ms (well under 1 second requirement)

---

## How to Run These Tests

### Prerequisites:
- Local Supabase running: `supabase start`
- Development server running: `npm run dev`
- Browser with DevTools

### Command Checklist:
```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start dev server
npm run dev

# Open browser: http://localhost:3000
# Open DevTools: F12

# Then follow test procedures above
```

---

## Troubleshooting

**Issue**: Alert doesn't appear after redirect
- Check if `?reason=expired` is in URL
- Check LoginScreen.tsx has query parameter parsing
- Check browser console for errors

**Issue**: Infinite redirect loop
- Verify LoginScreen.tsx doesn't call API on load
- Check redirectIfInvalid has isRedirecting flag
- Verify auth-interceptor has singleton check

**Issue**: Multiple alerts appear
- Verify singleton redirectIfInvalid is working
- Check if multiple 401 interceptors are registered
- Check if useEffect hooks are causing duplicate calls

---

## Status

These are manual testing procedures. They should be executed before marking tasks complete:
- **T013**: Manual integration testing checklist
- **T014**: Performance measurement checklist

Once both pass all acceptance criteria, mark tasks as complete.
