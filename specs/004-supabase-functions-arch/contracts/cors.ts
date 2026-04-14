// Contract definition for the shared CORS utility

/**
 * Shared CORS Headers configuration for Supabase Edge Functions.
 * This ensures all "fat functions" respond with consistent cross-origin policies.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific allowed origins
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Standard HTTP Response for OPTIONS requests (Preflight)
 */
export const handleCorsPreflight = () => {
  return new Response('ok', { headers: corsHeaders });
};
