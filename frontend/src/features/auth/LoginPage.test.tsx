import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { createTestToken } from "../../test/createTestToken";
import { AuthProvider } from "./AuthContext";
import { LoginPage } from "./LoginPage";
import { StaffHomePage } from "../staff/StaffHomePage";
import { ManagerHomePage } from "../manager/ManagerHomePage";
import { AdminHomePage } from "../admin/AdminHomePage";
import type { Role } from "./types";

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff" element={<StaffHomePage />} />
          <Route path="/manager" element={<ManagerHomePage />} />
          <Route path="/admin" element={<AdminHomePage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function submitCredentials(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("LoginPage", () => {
  it("shows an error message when credentials are invalid", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.text("Invalid credentials", { status: 401 }),
      ),
    );

    renderLoginPage();

    await submitCredentials("wrong@example.com", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid credentials/i,
    );
  });

  it.each<Role>(["staff", "manager", "admin"])(
    "redirects a %s user to their home page and displays their name",
    async (role) => {
    const token = createTestToken({
      userId: 1,
      firstName: "Jane",
      lastName: "Doe",
      role,
    });

    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ token })),
    );

    renderLoginPage();

    await submitCredentials(`${role}@example.com`, "correct-password");

      expect(await screen.findByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    },
  );

  it("clears the session and returns the user to login when they log out", async () => {
    const token = createTestToken({
      userId: 1,
      firstName: "Jane",
      lastName: "Doe",
      role: "staff",
    });
    const user = userEvent.setup();

    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ token })),
    );

    renderLoginPage();
    await submitCredentials("staff@example.com", "correct-password");
    await user.click(await screen.findByRole("button", { name: /log out/i }));

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});
