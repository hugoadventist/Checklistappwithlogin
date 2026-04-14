export const corsHeaders = (origin: string | null = null) => ({
  'Access-Control-Allow-Origin': origin || 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true',
});

export const handleCorsPreflight = (origin: string | null = null) => {
  return new Response('ok', { headers: corsHeaders(origin) });
};
