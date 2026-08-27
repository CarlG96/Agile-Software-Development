import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { LeaveBalancePanel } from "./LeaveBalancePanel";

describe("LeaveBalancePanel", () => {
  it("shows an accessible loading status before rendering leave balances", async () => {
    let authorization = "";
    server.use(
      http.get("/api/staff/me/leave-balance", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json([
          {
            id: 1,
            remaining: 12,
            leaveType: { id: 1, typeName: "Annual Leave" },
          },
        ]);
      }),
    );

    render(
      <LeaveBalancePanel token="test-token" onUnauthorised={() => undefined} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/loading leave balance/i);
    expect(await screen.findByText("Annual Leave")).toBeInTheDocument();
    expect(screen.getByText("12 days remaining")).toBeInTheDocument();
    expect(authorization).toBe("Bearer test-token");
  });

  it("shows a text error when the leave balance cannot be loaded", async () => {
    server.use(
      http.get("/api/staff/me/leave-balance", () =>
        HttpResponse.json({ error: "Leave balance is unavailable" }, { status: 500 }),
      ),
    );

    render(
      <LeaveBalancePanel token="test-token" onUnauthorised={() => undefined} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /leave balance is unavailable/i,
    );
  });
});