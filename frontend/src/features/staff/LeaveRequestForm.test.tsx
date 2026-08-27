import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { LeaveRequestForm } from "./LeaveRequestForm";

const balances = [
  {
    id: 1,
    remaining: 3,
    leaveType: { id: 2, typeName: "Annual Leave" },
  },
];

function renderForm() {
  const onRequestCreated = vi.fn();
  const onUnauthorised = vi.fn();

  render(
    <LeaveRequestForm
      balances={balances}
      token="test-token"
      onRequestCreated={onRequestCreated}
      onUnauthorised={onUnauthorised}
    />,
  );

  return { onRequestCreated, onUnauthorised };
}

async function completeForm(startDate: string, endDate: string) {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText(/leave type/i), "2");
  await user.type(screen.getByLabelText(/start date/i), startDate);
  await user.type(screen.getByLabelText(/end date/i), endDate);
  await user.click(screen.getByRole("button", { name: /submit leave request/i }));
}

describe("LeaveRequestForm", () => {
  it("submits a valid leave request with the bearer token", async () => {
    let requestBody = "";
    let authorization = "";
    const { onRequestCreated } = renderForm();

    server.use(
      http.post("/api/staff/me/leave-requests", async ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        requestBody = await request.text();
        return HttpResponse.json({ message: "Leave request created" }, { status: 201 });
      }),
    );

    await completeForm("2099-07-01", "2099-07-03");

    expect(await screen.findByRole("status")).toHaveTextContent(/submitted/i);
    expect(onRequestCreated).toHaveBeenCalledOnce();
    expect(authorization).toBe("Bearer test-token");
    expect(JSON.parse(requestBody)).toEqual({
      leaveTypeId: 2,
      startDate: "2099-07-01",
      endDate: "2099-07-03",
    });
  });

  it("rejects a request starting before today without sending it", async () => {
    renderForm();

    await completeForm("2020-01-01", "2020-01-02");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /cannot start before today/i,
    );
  });

  it("rejects a request that exceeds the available leave balance", async () => {
    renderForm();

    await completeForm("2099-07-01", "2099-07-04");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /needs 4 days, but you have 3 days remaining/i,
    );
  });
});