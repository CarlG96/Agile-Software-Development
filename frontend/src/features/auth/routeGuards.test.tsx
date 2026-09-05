import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { createTestToken } from "../../test/createTestToken";
import { AuthProvider } from "./AuthContext";
import { LoginPage } from "./LoginPage";
import { RequireAuth, RequireRole } from "./routeGuards";
import type { Role } from "./types";

function LoginStub() {
  return <div>Login page</div>;
}

function StaffStub() {
  return <div>Staff home</div>;
}

function ManagerStub() {
  return <div>Manager home</div>;
}

function renderWithRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={["staff"]} />}>
              <Route path="/staff" element={<StaffStub />} />
              <Route path="/manager" element={<ManagerStub />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function signInAs(role: Role) {
  const token = createTestToken({
    userId: 1,
    firstName: "Jane",
    lastName: "Doe",
    role,
  });

  server.use(
    http.post("/api/auth/login", () => HttpResponse.json({ token })),
  );

  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), `${role}@example.com`);
  await user.type(screen.getByLabelText(/password/i), "correct-password");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("route guards", () => {
  it("redirects an unauthenticated user from a protected route to /login", () => {
    renderWithRoutes("/staff");

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders protected content for an authenticated user with the required role", async () => {
    renderWithRoutes("/login");

    await signInAs("staff");

    expect(await screen.findByText("Staff home")).toBeInTheDocument();
  });

  it("redirects an authenticated user without the required role to /login", async () => {
    renderWithRoutes("/login");

    await signInAs("manager");

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText("Manager home")).not.toBeInTheDocument();
  });
});
