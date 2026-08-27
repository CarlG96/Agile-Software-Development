import type { Role } from "./types";

interface DecodedToken {
  userId: number;
  firstName: string;
  lastName: string;
  role: Role;
  managerId?: number | null;
  exp: number;
}

// Decodes the JWT payload locally for routing/display only; the backend remains the source of truth for authorization.
export function decodeJwt(token: string): DecodedToken {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Malformed token");
  }

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(base64);
  return JSON.parse(json) as DecodedToken;
}
