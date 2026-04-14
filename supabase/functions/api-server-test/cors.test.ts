import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

Deno.test("corsHeaders function returns expected keys", () => {
  const headers = corsHeaders('http://localhost:3000');
  assertEquals(headers['Access-Control-Allow-Origin'], 'http://localhost:3000');
  assertEquals(headers['Access-Control-Allow-Methods'], 'POST, GET, OPTIONS, PUT, DELETE');
  assertEquals(headers['Access-Control-Allow-Credentials'], 'true');
});

Deno.test("corsHeaders with null origin defaults to localhost", () => {
  const headers = corsHeaders(null);
  assertEquals(headers['Access-Control-Allow-Origin'], 'http://localhost:3000');
});

Deno.test("handleCorsPreflight returns 'ok' with cors headers", async () => {
  const response = handleCorsPreflight('http://localhost:3000');
  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
});
