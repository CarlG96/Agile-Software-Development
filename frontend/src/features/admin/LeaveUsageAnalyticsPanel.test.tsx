import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { LeaveUsageAnalyticsPanel } from "./LeaveUsageAnalyticsPanel";

describe("LeaveUsageAnalyticsPanel", () => {
  it("loads and presents leave usage analytics with the bearer token", async () => {
    let authorization = "";
    server.use(
      http.get("/api/admin/analytics/leave-usage", ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        return HttpResponse.json({
          totalEmployees: 24,
          requestsByStatus: [{ status: "Pending", count: 5 }],
          daysByTypeAndStatus: [
            { leaveType: "Annual Leave", status: "Approved", totalDays: 18 },
          ],
          avgRemainingByType: [{ leaveType: "Sick", avgRemaining: 3.5 }],
        });
      }),
    );

    render(<LeaveUsageAnalyticsPanel token="admin-token" onUnauthorised={() => undefined} />);

    expect(screen.getByRole("status")).toHaveTextContent(/loading leave usage analytics/i);
    expect(await screen.findByLabelText("24 total employees")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /leave requests by status/i })).toHaveTextContent("Pending");
    expect(screen.getByRole("table", { name: /requested leave days by type and status/i })).toHaveTextContent("18");
    expect(screen.getByRole("table", { name: /average leave remaining by type/i })).toHaveTextContent("3.5 days");
    expect(authorization).toBe("Bearer admin-token");
  });

  it("shows an accessible error message when analytics cannot be loaded", async () => {
    server.use(
      http.get("/api/admin/analytics/leave-usage", () =>
        HttpResponse.json({ error: "Analytics are unavailable" }, { status: 500 }),
      ),
    );

    render(<LeaveUsageAnalyticsPanel token="admin-token" onUnauthorised={() => undefined} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/analytics are unavailable/i);
  });
});