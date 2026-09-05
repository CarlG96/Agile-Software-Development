import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ManagerApiError,
  approveLeaveRequest,
  getOutstandingLeaveRequests,
  getStaffLeaveBalance,
  rejectLeaveRequest,
} from "./api";

describe("manager api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads outstanding leave requests with the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      HttpResponse.json([
        {
          id: 1,
          startDate: "2099-07-01",
          endDate: "2099-07-03",
          leaveType: { id: 2, typeName: "Annual Leave" },
          status: { id: 1, status: "Pending" },
          user: { id: 7, firstName: "Jane", lastName: "Doe" },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getOutstandingLeaveRequests("manager-token")).resolves.toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/manager/leave-requests/outstanding",
      { headers: { Authorization: "Bearer manager-token" } },
    );
  });

  it("loads a staff member's leave balance", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      HttpResponse.json([
        {
          id: 3,
          remaining: 9,
          leaveType: { id: 2, typeName: "Annual Leave" },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getStaffLeaveBalance("manager-token", 7)).resolves.toEqual([
      {
        id: 3,
        remaining: 9,
        leaveType: { id: 2, typeName: "Annual Leave" },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith("/api/manager/staff/7/leave-balance", {
      headers: { Authorization: "Bearer manager-token" },
    });
  });

  it("approves and rejects leave requests with patch requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(HttpResponse.text(""));
    vi.stubGlobal("fetch", fetchMock);

    await approveLeaveRequest("manager-token", 12);
    await rejectLeaveRequest("manager-token", 13);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/manager/leave-requests/12/approve",
      { method: "PATCH", headers: { Authorization: "Bearer manager-token" } },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/manager/leave-requests/13/reject",
      { method: "PATCH", headers: { Authorization: "Bearer manager-token" } },
    );
  });

  it("uses JSON API error messages when requests fail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      HttpResponse.json({ error: "Only team requests can be viewed" }, { status: 403 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getOutstandingLeaveRequests("manager-token")).rejects.toMatchObject({
      message: "Only team requests can be viewed",
      status: 403,
    } satisfies Partial<ManagerApiError>);
  });

  it("throws API errors when a staff leave balance request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      HttpResponse.json({ error: "Staff member not found" }, { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getStaffLeaveBalance("manager-token", 7)).rejects.toMatchObject({
      message: "Staff member not found",
      status: 404,
    } satisfies Partial<ManagerApiError>);
  });

  it("uses plain text or fallback API error messages when requests fail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(HttpResponse.text("Request already resolved", { status: 409 }))
      .mockResolvedValueOnce(HttpResponse.text("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(approveLeaveRequest("manager-token", 12)).rejects.toMatchObject({
      message: "Request already resolved",
      status: 409,
    } satisfies Partial<ManagerApiError>);
    await expect(rejectLeaveRequest("manager-token", 13)).rejects.toMatchObject({
      message: "Unable to load outstanding leave requests.",
      status: 500,
    } satisfies Partial<ManagerApiError>);
  });
});

const HttpResponse = {
  json: (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    }),
  text: (body: string, init?: ResponseInit) => new Response(body, init),
};