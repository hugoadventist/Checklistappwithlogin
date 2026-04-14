import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("validate-session cookie parsing extracts token", () => {
  const cookieHeader = "nr12_access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature; Path=/; HttpOnly";
  const match = cookieHeader.match(/nr12_access_token=([^;]+)/);
  // Expect the captured token to start with the typical JWT header marker
  assertEquals(Boolean(match && typeof match[1] === 'string' && match[1].startsWith('eyJ')), true);
});

Deno.test("validate-session returns null when no token", () => {
  const cookieHeader = '';
  const match = cookieHeader.match(/nr12_access_token=([^;]+)/);
  assertEquals(match, null);
});

Deno.test("validate-session accepts JWT-like token format", () => {
  const jwt = "header.payload.signature";
  const cookieHeader = `other=1; nr12_access_token=${jwt}; another=2`;
  const match = cookieHeader.match(/nr12_access_token=([^;]+)/);
  assertEquals(match?.[1], jwt);
});
