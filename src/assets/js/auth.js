// Authentication utilities

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
  } catch (error) {
    console.error('Signup error:', error);
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
      // Store access token
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      return { success: true, session: data };
    }

    return { success: false, error: 'No access token returned' };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Get stored access token
function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// Get stored user data
function getUserData() {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
}

// Logout function
function logout() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAccessToken();
}