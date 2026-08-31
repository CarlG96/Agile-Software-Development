import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { OutstandingLeaveRequestList } from "./OutstandingLeaveRequestList";

const pendingRequest = {
  id: 5,
  startDate: "2099-07-01",
  endDate: "2099-07-03",
  leaveType: { id: 2, typeName: "Annual Leave" },
  status: { id: 1, status: "Pending" },
  user: { id: 7, firstName: "Jane", lastName: "Doe" },
};

describe("OutstandingLeaveRequestList", () => {
  it("loads pending requests with the bearer token and selected name filters", async () => {
    let requestUrl = "";
    server.use(
      http.get("/api/admin/leave-requests/outstanding", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json([pendingRequest]);
      }),
    );
    render(<OutstandingLeaveRequestList token="admin-token" onUnauthorised={() => undefined} />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Staff name"), "Jane");
    await user.type(screen.getByLabelText("Manager name"), "Smith");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await screen.findByText("Jane Doe");
    expect(requestUrl).toContain("staffName=Jane");
    expect(requestUrl).toContain("managerName=Smith");
  });

  it("only offers approval for pending requests and requires confirmation", async () => {
    let approvalCount = 0;
    server.use(
      http.get("/api/admin/leave-requests/outstanding", () =>
        HttpResponse.json([
          pendingRequest,
          { ...pendingRequest, id: 6, status: { id: 2, status: "Approved" } },
        ]),
      ),
      http.patch("/api/admin/leave-requests/5/approve", () => {
        approvalCount += 1;
        return HttpResponse.json({ message: "Approved leave request" });
      }),
    );
    render(<OutstandingLeaveRequestList token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    const approveButton = await screen.findByRole("button", { name: /approve request/i });
    expect(screen.getAllByRole("button", { name: /approve request/i })).toHaveLength(1);
    await user.click(approveButton);
    expect(approvalCount).toBe(0);
    expect(await screen.findByRole("alert")).toHaveTextContent(/approve this leave request/i);
    await user.click(screen.getByRole("button", { name: /confirm approval/i }));

    expect(approvalCount).toBe(1);
    expect(screen.queryByRole("button", { name: /approve request/i })).not.toBeInTheDocument();
  });
});