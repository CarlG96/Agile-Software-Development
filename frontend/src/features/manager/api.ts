export interface OutstandingLeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: {
    id: number;
    typeName: string;
  };
  status: {
    id: number;
    status: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export class ManagerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface StaffLeaveBalance {
  id: number;
  remaining: number;
  leaveType: {
    id: number;
    typeName: string;
  };
}

export async function getOutstandingLeaveRequests(
  token: string,
): Promise<OutstandingLeaveRequest[]> {
  const response = await fetch("/api/manager/leave-requests/outstanding", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ManagerApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as OutstandingLeaveRequest[];
}

export async function getStaffLeaveBalance(
  token: string,
  staffId: number,
): Promise<StaffLeaveBalance[]> {
  const response = await fetch(`/api/manager/staff/${staffId}/leave-balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ManagerApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as StaffLeaveBalance[];
}

export async function approveLeaveRequest(
  token: string,
  requestId: number,
): Promise<void> {
  const response = await fetch(`/api/manager/leave-requests/${requestId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ManagerApiError(await readErrorMessage(response), response.status);
  }
}

export async function rejectLeaveRequest(
  token: string,
  requestId: number,
): Promise<void> {
  const response = await fetch(`/api/manager/leave-requests/${requestId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ManagerApiError(await readErrorMessage(response), response.status);
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

  return raw || "Unable to load outstanding leave requests.";
}