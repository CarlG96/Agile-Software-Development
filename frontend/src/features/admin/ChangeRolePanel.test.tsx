import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { ChangeRolePanel } from "./ChangeRolePanel";

const staffDirectory = [
  {
    id: 7,
    firstName: "Jane",
    lastName: "Doe",
    role: { id: 1, name: "staff" },
    leaveBalances: [],
  },
  {
    id: 9,
    firstName: "Alice",
    lastName: "Admin",
    role: { id: 3, name: "admin" },
    leaveBalances: [],
  },
];

const roles = [
  { id: 1, name: "staff" },
  { id: 2, name: "manager" },
];

describe("ChangeRolePanel", () => {
  it("shows the current role and updates it with the bearer token", async () => {
    let authorization = "";
    let requestBody = "";
    server.use(
      http.get("/api/admin/staff", () => HttpResponse.json(staffDirectory)),
      http.get("/api/role", () => HttpResponse.json(roles)),
      http.patch("/api/admin/staff/7/profile", async ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        requestBody = await request.text();
        return HttpResponse.json({ message: "Jane Doe role amended to manager" });
      }),
    );

    render(<ChangeRolePanel token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("User"), "7");
    expect(screen.getByText(/current role/i)).toHaveTextContent("staff");

    await user.selectOptions(screen.getByLabelText("New role"), "2");
    await user.click(screen.getByRole("button", { name: /update role/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/role updated/i);
    expect(authorization).toBe("Bearer admin-token");
    expect(JSON.parse(requestBody)).toEqual({ roleId: 2 });
  });

  it("rejects submitting the same role without calling the API", async () => {
    let updateCount = 0;
    server.use(
      http.get("/api/admin/staff", () => HttpResponse.json(staffDirectory)),
      http.get("/api/role", () => HttpResponse.json(roles)),
      http.patch("/api/admin/staff/7/profile", () => {
        updateCount += 1;
        return HttpResponse.json({ message: "Updated" });
      }),
    );

    render(<ChangeRolePanel token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("User"), "7");
    await user.selectOptions(screen.getByLabelText("New role"), "1");
    await user.click(screen.getByRole("button", { name: /update role/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/select a different role/i);
    expect(updateCount).toBe(0);
  });

  it("does not offer admin users as selectable targets", async () => {
    server.use(
      http.get("/api/admin/staff", () => HttpResponse.json(staffDirectory)),
      http.get("/api/role", () => HttpResponse.json(roles)),
    );

    render(<ChangeRolePanel token="admin-token" onUnauthorised={() => undefined} />);

    const userSelect = await screen.findByLabelText("User");
    expect(screen.getByRole("option", { name: /jane doe/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /alice admin/i })).not.toBeInTheDocument();
    expect(userSelect).not.toHaveTextContent("Alice Admin");
  });
});
