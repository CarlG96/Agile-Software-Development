import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { LeaveAllocationPanel } from "./LeaveAllocationPanel";

const staffDirectory = [
  {
    id: 7,
    firstName: "Jane",
    lastName: "Doe",
    leaveBalances: [
      {
        id: 1,
        remaining: 25,
        leaveType: { id: 2, typeName: "Annual Leave" },
      },
    ],
  },
];

describe("LeaveAllocationPanel", () => {
  it("loads named users and saves a non-negative leave allocation", async () => {
    let authorization = "";
    let requestBody = "";
    server.use(
      http.get("/api/admin/staff", () => HttpResponse.json(staffDirectory)),
      http.patch("/api/admin/staff/7/leave-allocation", async ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        requestBody = await request.text();
        return HttpResponse.json({ message: "Allocation updated" });
      }),
    );
    render(<LeaveAllocationPanel token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("User"), "7");
    expect(screen.getByRole("heading", { name: /jane doe.*leave allocations/i })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Annual Leave"));
    await user.type(screen.getByLabelText("Annual Leave"), "30");
    await user.click(screen.getByRole("button", { name: /save allocation/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/allocation updated/i);
    expect(authorization).toBe("Bearer admin-token");
    expect(JSON.parse(requestBody)).toEqual({ leaveTypeId: 2, remaining: 30 });
  });

  it("rejects a negative allocation without sending an update", async () => {
    let updateCount = 0;
    server.use(
      http.get("/api/admin/staff", () => HttpResponse.json(staffDirectory)),
      http.patch("/api/admin/staff/7/leave-allocation", () => {
        updateCount += 1;
        return HttpResponse.json({ message: "Allocation updated" });
      }),
    );
    render(<LeaveAllocationPanel token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("User"), "7");
    await user.clear(screen.getByLabelText("Annual Leave"));
    await user.type(screen.getByLabelText("Annual Leave"), "-1");
    await user.click(screen.getByRole("button", { name: /save allocation/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/non-negative whole number/i);
    expect(updateCount).toBe(0);
  });
});