import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../test/server";
import { createTestToken } from "../../test/createTestToken";
import { AuthProvider } from "./AuthContext";
import { LoginPage } from "./LoginPage";
import type { Role } from "./types";

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff" element={<div>Staff home</div>} />
          <Route path="/manager" element={<div>Manager home</div>} />
          <Route path="/admin" element={<div>Admin home</div>} />
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

  it.each<[Role, string]>([
    ["staff", "Staff home"],
    ["manager", "Manager home"],
    ["admin", "Admin home"],
  ])("redirects a %s user to their home page", async (role, expectedText) => {
    const token = createTestToken({ userId: 1, role });

    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ token })),
    );

    renderLoginPage();

    await submitCredentials(`${role}@example.com`, "correct-password");

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });
});
