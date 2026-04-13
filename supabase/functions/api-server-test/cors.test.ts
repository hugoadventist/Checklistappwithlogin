import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

Deno.test("corsHeaders has expected keys", () => {
  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*');
  assertEquals(corsHeaders['Access-Control-Allow-Methods'], 'POST, GET, OPTIONS, PUT, DELETE');
});

Deno.test("handleCorsPreflight returns 'ok' with cors headers", async () => {
  const response = handleCorsPreflight();
  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
});
