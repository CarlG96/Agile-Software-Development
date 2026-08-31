export interface LeaveUsageAnalytics {
  totalEmployees: number;
  requestsByStatus: Array<{
    status: string;
    count: number;
  }>;
  daysByTypeAndStatus: Array<{
    leaveType: string;
    status: string;
    totalDays: number;
  }>;
  avgRemainingByType: Array<{
    leaveType: string;
    avgRemaining: number;
  }>;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface Role {
  id: number;
  name: string;
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  managerId?: number;
}

export interface AdminOutstandingLeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: { id: number; typeName: string };
  status: { id: number; status: string };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    manager?: { id: number; firstName: string; lastName: string } | null;
  };
}

export interface StaffWithLeaveAllocations {
  id: number;
  firstName: string;
  lastName: string;
  role: { id: number; name: string };
  leaveBalances: Array<{
    id: number;
    remaining: number;
    leaveType: { id: number; typeName: string };
  }>;
}

export async function getLeaveUsageAnalytics(
  token: string,
): Promise<LeaveUsageAnalytics> {
  const response = await fetch("/api/admin/analytics/leave-usage", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as LeaveUsageAnalytics;
}

export async function getRoles(token: string): Promise<Role[]> {
  const response = await fetch("/api/role", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as Role[];
}

export async function createStaffMember(
  token: string,
  input: CreateStaffInput,
): Promise<void> {
  const response = await fetch("/api/admin/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }
}

export async function getOutstandingLeaveRequests(
  token: string,
  filters: { staffName?: string; managerName?: string },
): Promise<AdminOutstandingLeaveRequest[]> {
  const searchParams = new URLSearchParams();
  if (filters.staffName) searchParams.set("staffName", filters.staffName);
  if (filters.managerName) searchParams.set("managerName", filters.managerName);
  const query = searchParams.size > 0 ? `?${searchParams}` : "";
  const response = await fetch(`/api/admin/leave-requests/outstanding${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as AdminOutstandingLeaveRequest[];
}

export async function approveOutstandingLeaveRequest(
  token: string,
  requestId: number,
): Promise<void> {
  const response = await fetch(`/api/admin/leave-requests/${requestId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }
}

export async function getStaffWithLeaveAllocations(
  token: string,
): Promise<StaffWithLeaveAllocations[]> {
  const response = await fetch("/api/admin/staff", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as StaffWithLeaveAllocations[];
}

export async function amendStaffRole(
  token: string,
  staffId: number,
  roleId: number,
): Promise<void> {
  const response = await fetch(`/api/admin/staff/${staffId}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ roleId }),
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
  }
}

export async function amendLeaveAllocation(
  token: string,
  staffId: number,
  leaveTypeId: number,
  remaining: number,
): Promise<void> {
  const response = await fetch(`/api/admin/staff/${staffId}/leave-allocation`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ leaveTypeId, remaining }),
  });

  if (!response.ok) {
    throw new AdminApiError(await readErrorMessage(response), response.status);
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

  return raw || "Unable to load leave usage analytics.";
}