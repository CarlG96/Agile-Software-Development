const API_BASE_URL = "/api";

export interface LoginResponse {
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as LoginResponse;
}

// The login endpoint currently returns plain text on failure rather than JSON, so both are handled.
async function readErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) {
      return parsed.error;
    }
  } catch {
    // Not JSON; fall through to the raw text below.
  }

  return raw || "Unable to sign in. Please try again.";
}
