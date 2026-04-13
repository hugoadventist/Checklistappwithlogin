let isRedirecting = false;

export function redirectIfInvalid(reason: string = 'expired') {
  if (isRedirecting) return;
  isRedirecting = true;
  
  // Clear any local storage auth state to be safe
  localStorage.removeItem('nr12_access_token');
  localStorage.removeItem('nr12_user_data');
  
  window.location.href = `/?reason=${encodeURIComponent(reason)}`;
}

  export function setupFetchInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      // Add credentials: 'include' by default for API calls to our backend
      if (typeof args[0] === 'string' && args[0].includes('api-server')) {
        args[1] = args[1] || {};
        args[1].credentials = 'include';
      }
      
      try {
        // Use window context to avoid Illegal Invocation errors
        const response = await originalFetch.apply(window, args);
        if (response.status === 401 || response.status === 403) {
          redirectIfInvalid('expired');
        }
        return response;
      } catch (error) {
        console.error('Fetch error in interceptor:', error);
        throw error;
      }
    };
  }
