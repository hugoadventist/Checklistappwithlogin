let isRedirecting = false;

export function redirectIfInvalid(reason: string = 'expired') {
  if (isRedirecting) return;
  isRedirecting = true;

  // Clear any local storage auth state to be safe
  try {
    localStorage.removeItem('nr12_access_token');
    localStorage.removeItem('nr12_user_data');
  } catch (_e) {
    // ignore (e.g., running in non-window environment)
  }

  const g = globalThis as unknown as { location?: { href: string } };
  if (g.location) g.location.href = `/?reason=${encodeURIComponent(reason)}`;
}

export function setupFetchInterceptor() {
  const g = globalThis as unknown as { fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response> };
  const originalFetch = (g.fetch ?? fetch).bind(globalThis) as (input: RequestInfo, init?: RequestInit) => Promise<Response>;

  // Assign a replacement fetch implementation
  (g as unknown as Record<string, unknown>).fetch = (async function (input: RequestInfo, init?: RequestInit) {
    // Add credentials: 'include' by default for API calls to our backend
    let url = input;
    let options = init || {};

    if (typeof input === 'string' && input.includes('api-server')) {
      options = { ...(options as RequestInit), credentials: 'include' };
    }

    try {
      const response = await originalFetch(url, options);
      if (response.status === 401 || response.status === 403) {
        redirectIfInvalid('expired');
      }
      return response;
    } catch (error) {
      console.error('Fetch error in interceptor:', error);
      throw error;
    }
  }) as unknown as (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}
