import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { OutstandingLeaveRequestList } from "./OutstandingLeaveRequestList";

describe("OutstandingLeaveRequestList", () => {
  it("shows only pending team requests loaded with the bearer token", async () => {
    let authorization = "";
    server.use(
      http.get("/api/manager/leave-requests/outstanding", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json([
          {
            id: 1,
            startDate: "2099-07-01",
            endDate: "2099-07-03",
            leaveType: { id: 2, typeName: "Annual Leave" },
            status: { id: 1, status: "Pending" },
            user: { id: 7, firstName: "Jane", lastName: "Doe" },
          },
          {
            id: 2,
            startDate: "2099-08-01",
            endDate: "2099-08-02",
            leaveType: { id: 3, typeName: "Sick" },
            status: { id: 2, status: "Approved" },
            user: { id: 8, firstName: "John", lastName: "Smith" },
          },
        ]);
      }),
      http.get("/api/manager/staff/7/leave-balance", () =>
        HttpResponse.json([
          {
            id: 1,
            remaining: 12,
            leaveType: { id: 2, typeName: "Annual Leave" },
          },
        ]),
      ),
    );

    render(
      <OutstandingLeaveRequestList
        token="manager-token"
        onUnauthorised={() => undefined}
        onRequestResolved={() => undefined}
        refreshKey={0}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/loading pending leave requests/i);
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Annual Leave")).toBeInTheDocument();
    expect(screen.getByText(/1 July 2099 to 3 July 2099/i)).toBeInTheDocument();
    expect(screen.getByText("Annual Leave: 12 days remaining")).toBeInTheDocument();
    expect(screen.queryByText("John Smith")).not.toBeInTheDocument();
    expect(authorization).toBe("Bearer manager-token");
  });

  it("explains when no pending requests are available", async () => {
    render(
      <OutstandingLeaveRequestList
        token="manager-token"
        onUnauthorised={() => undefined}
        onRequestResolved={() => undefined}
        refreshKey={0}
      />,
    );

    expect(await screen.findByText("No pending leave requests.")).toBeInTheDocument();
  });

  it("confirms before approving a pending request and then requests a list refresh", async () => {
    let authorization = "";
    const onRequestResolved = vi.fn();
    server.use(
      http.get("/api/manager/leave-requests/outstanding", () =>
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
      ),
      http.get("/api/manager/staff/7/leave-balance", () => HttpResponse.json([])),
      http.patch("/api/manager/leave-requests/1/approve", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json({ message: "Approved leave request" });
      }),
    );

    render(
      <OutstandingLeaveRequestList
        token="manager-token"
        onUnauthorised={() => undefined}
        onRequestResolved={onRequestResolved}
        refreshKey={0}
      />,
    );

    await userEvent.setup().click(
      await screen.findByRole("button", { name: /approve request/i }),
    );
    expect(authorization).toBe("");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /approve this leave request/i,
    );
    await userEvent.setup().click(
      screen.getByRole("button", { name: /confirm approve/i }),
    );

    expect(onRequestResolved).toHaveBeenCalledOnce();
    expect(authorization).toBe("Bearer manager-token");
  });

  it("confirms before rejecting a pending request", async () => {
    let rejectionCount = 0;
    server.use(
      http.get("/api/manager/leave-requests/outstanding", () =>
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
      ),
      http.get("/api/manager/staff/7/leave-balance", () => HttpResponse.json([])),
      http.patch("/api/manager/leave-requests/1/reject", () => {
        rejectionCount += 1;
        return HttpResponse.json({ message: "Rejected leave request" });
      }),
    );

    render(
      <OutstandingLeaveRequestList
        token="manager-token"
        onUnauthorised={() => undefined}
        onRequestResolved={() => undefined}
        refreshKey={0}
      />,
    );

    await userEvent.setup().click(
      await screen.findByRole("button", { name: /reject request/i }),
    );
    expect(rejectionCount).toBe(0);
    expect(await screen.findByRole("alert")).toHaveTextContent(/reject this leave request/i);
    await userEvent.setup().click(
      screen.getByRole("button", { name: /confirm reject/i }),
    );

    expect(rejectionCount).toBe(1);
  });
});