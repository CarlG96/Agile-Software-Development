import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { LeaveRequestList } from "./LeaveRequestList";

describe("LeaveRequestList", () => {
  it("loads requests with the bearer token and opens details in a dialog", async () => {
    let authorization = "";
    server.use(
      http.get("/api/staff/me/leave-requests", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json([
          {
            id: 10,
            startDate: "2099-07-01",
            endDate: "2099-07-03",
            requestedOn: "2099-06-01T09:00:00.000Z",
            leaveType: { id: 2, typeName: "Annual Leave" },
            status: { id: 1, status: "Pending" },
          },
        ]);
      }),
    );

    render(
      <LeaveRequestList
        token="test-token"
        onUnauthorised={() => undefined}
        onRequestCancelled={() => undefined}
        refreshKey={0}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/loading leave requests/i);

    const requestButton = await screen.findByRole("button", {
      name: /annual leave.*pending/i,
    });
    expect(authorization).toBe("Bearer test-token");

    await userEvent.setup().click(requestButton);

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      /leave request details/i,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(/1 July 2099/i);
    expect(
      screen.queryByRole("button", { name: /cancel leave request/i }),
    ).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains when the user has no leave requests", async () => {
    render(
      <LeaveRequestList
        token="test-token"
        onUnauthorised={() => undefined}
        onRequestCancelled={() => undefined}
        refreshKey={0}
      />,
    );

    expect(await screen.findByText("No leave requests yet.")).toBeInTheDocument();
  });

  it("cancels an approved request and requests a data refresh", async () => {
    let authorization = "";
    const onRequestCancelled = vi.fn();
    server.use(
      http.get("/api/staff/me/leave-requests", () =>
        HttpResponse.json([
          {
            id: 10,
            startDate: "2099-07-01",
            endDate: "2099-07-03",
            requestedOn: "2099-06-01T09:00:00.000Z",
            leaveType: { id: 2, typeName: "Annual Leave" },
            status: { id: 2, status: "Approved" },
          },
        ]),
      ),
      http.patch("/api/staff/me/leave-requests/10/cancel", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json({ message: "Leave request cancelled" });
      }),
    );

    render(
      <LeaveRequestList
        token="test-token"
        onUnauthorised={() => undefined}
        onRequestCancelled={onRequestCancelled}
        refreshKey={0}
      />,
    );

    await userEvent.setup().click(
      await screen.findByRole("button", { name: /annual leave.*approved/i }),
    );
    await userEvent.setup().click(
      await screen.findByRole("button", { name: /cancel leave request/i }),
    );
    expect(authorization).toBe("");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /cancel this approved leave request/i,
    );
    await userEvent.setup().click(
      screen.getByRole("button", { name: /confirm cancellation/i }),
    );

    expect(onRequestCancelled).toHaveBeenCalledOnce();
    expect(authorization).toBe("Bearer test-token");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});