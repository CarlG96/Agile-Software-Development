export interface LeaveBalance {
  id: number;
  remaining: number;
  leaveType: {
    id: number;
    typeName: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function getMyLeaveBalance(token: string): Promise<LeaveBalance[]> {
  const response = await fetch("/api/staff/me/leave-balance", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as LeaveBalance[];
}

async function readErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed.error) {
      return parsed.error;
    }
  } catch {
    // The API may return a plain-text error response.
  }

  return raw || "Unable to load your leave balance.";
}