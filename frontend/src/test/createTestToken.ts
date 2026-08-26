function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Builds an unsigned but structurally valid JWT for exercising the client-side decode logic in tests.
export function createTestToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
      ...payload,
    }),
  );

  return `${header}.${body}.test-signature`;
}
