// Authentication utilities

let isRedirecting = false;
function redirectIfInvalid(reason = 'expired') {
  if (isRedirecting) return;
  isRedirecting = true;
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  if (globalThis.location) globalThis.location.href = `index.html?reason=${encodeURIComponent(reason)}`;
}

// Custom fetch wrapper to handle 401s and cookies
async function fetchWithAuth(url, options = {}) {
  options.credentials = 'include';
  
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    redirectIfInvalid('expired');
  }
  return response;
}

// Sign up function
async function signUp(email, password, name) {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        name,
        isFirstAdmin: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Signup failed' };
    }

    return { success: true, user: data.user };
  } catch (_error) {
    console.error('Signup error:', _error);
    return { success: false, error: 'Network error' };
  }
}

// Sign in function
async function signIn(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Sign in error:', data);
      return { success: false, error: data.error_description || data.error || 'Sign in failed' };
    }

    if (data.access_token) {
      // Call edge function to set HttpOnly cookie
      const sessionResponse = await fetch(`${API_URL}/auth-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: data.access_token })
      });
      
      if (!sessionResponse.ok) {
        return { success: false, error: 'Failed to establish secure session' };
      }

      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      return { success: true, session: data };
    }

    return { success: false, error: 'No access token returned' };
  } catch (_error) {
    console.error('Sign in error:', _error);
    return { success: false, error: 'Network error' };
  }
}

// Get stored access token (Deprecated: using cookies now)
function getAccessToken() {
  return null;
}

// Get stored user data
function getUserData() {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
}

// Logout function
function logout() {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  // Optional: Call endpoint to clear cookie
  if (globalThis.location) globalThis.location.href = 'index.html';
}

// Check if user is authenticated via validation endpoint
async function isAuthenticated() {
  try {
    const response = await fetch(`${API_URL}/validate-session`, {
      credentials: 'include'
    });
    return response.ok;
  } catch (_e) {
    return false;
  }
}