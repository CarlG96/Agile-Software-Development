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

export interface CreateLeaveRequestInput {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
}

export interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  requestedOn: string;
  leaveType: {
    id: number;
    typeName: string;
  };
  status: {
    id: number;
    status: string;
  };
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

export async function createLeaveRequest(
  token: string,
  input: CreateLeaveRequestInput,
): Promise<void> {
  const response = await fetch("/api/staff/me/leave-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
}

export async function getMyLeaveRequests(token: string): Promise<LeaveRequest[]> {
  const response = await fetch("/api/staff/me/leave-requests", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as LeaveRequest[];
}

export async function cancelLeaveRequest(
  token: string,
  requestId: number,
): Promise<void> {
  const response = await fetch(
    `/api/staff/me/leave-requests/${requestId}/cancel`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
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