import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { AddStaffMemberForm } from "./AddStaffMemberForm";

describe("AddStaffMemberForm", () => {
  it("loads roles and sends a valid staff member with the bearer token", async () => {
    let authorization = "";
    let requestBody = "";
    server.use(
      http.get("/api/role", () =>
        HttpResponse.json([{ id: 2, name: "staff" }]),
      ),
      http.post("/api/admin/staff", async ({ request }) => {
        authorization = request.headers.get("authorization") ?? "";
        requestBody = await request.text();
        return HttpResponse.json({ id: 10, message: "Created user Jane Doe" }, { status: 201 });
      }),
    );

    render(<AddStaffMemberForm token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("First name"), "Jane");
    await user.type(screen.getByLabelText("Last name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Temporary password"), "SecurePassword1!");
    await user.selectOptions(screen.getByLabelText("Role"), "2");
    await user.type(screen.getByLabelText(/manager id/i), "4");
    await user.click(screen.getByRole("button", { name: /add staff member/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/staff member added/i);
    expect(authorization).toBe("Bearer admin-token");
    expect(JSON.parse(requestBody)).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "SecurePassword1!",
      roleId: 2,
      managerId: 4,
    });
  });

  it("shows the API validation message when staff creation is rejected", async () => {
    server.use(
      http.get("/api/role", () => HttpResponse.json([{ id: 2, name: "staff" }])),
      http.post("/api/admin/staff", () =>
        HttpResponse.text("A user with that email already exists", { status: 409 }),
      ),
    );

    render(<AddStaffMemberForm token="admin-token" onUnauthorised={() => undefined} />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("First name"), "Jane");
    await user.type(screen.getByLabelText("Last name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Temporary password"), "SecurePassword1!");
    await user.selectOptions(screen.getByLabelText("Role"), "2");
    await user.click(screen.getByRole("button", { name: /add staff member/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/email already exists/i);
  });
});