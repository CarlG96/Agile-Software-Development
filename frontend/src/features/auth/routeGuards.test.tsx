import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { RequireAuth, RequireRole } from "./routeGuards";

function LoginStub() {
  return <div>Login page</div>;
}

function StaffStub() {
  return <div>Staff home</div>;
}

function renderWithRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={["staff"]} />}>
              <Route path="/staff" element={<StaffStub />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  it("redirects an unauthenticated user from a protected route to /login", () => {
    renderWithRoutes("/staff");

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
